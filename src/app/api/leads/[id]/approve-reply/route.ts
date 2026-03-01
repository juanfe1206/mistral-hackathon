import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createErrorResponse, createSuccessResponse } from "@/server/api/error-envelope";
import { isValidUuid } from "@/lib/uuid";
import * as leadService from "@/server/services/lead-service";
import * as approvalService from "@/server/services/approval-service";

const MAX_DRAFT_LENGTH = 4096;
const approveReplyBodySchema = z.object({
  draft_text: z
    .string()
    .trim()
    .min(1, "draft_text is required")
    .max(MAX_DRAFT_LENGTH, `draft_text must be at most ${MAX_DRAFT_LENGTH} characters`),
  action: z.enum(["approve", "send"]),
});

/**
 * POST /api/leads/[id]/approve-reply
 * Approve (VIP/high) or send reply. Approval gate: vip/high require approve before send.
 * NFR8: Approve/send actions audit logged.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = request.headers.get("x-request-id") ?? crypto.randomUUID();

  try {
    const { id } = await params;
    if (!isValidUuid(id)) {
      return NextResponse.json(
        createErrorResponse("INVALID_INPUT", "Lead id must be a valid UUID", [], requestId),
        { status: 400 }
      );
    }

    const tenantIdParam = request.nextUrl.searchParams.get("tenant_id");
    if (tenantIdParam && !isValidUuid(tenantIdParam)) {
      return NextResponse.json(
        createErrorResponse("INVALID_INPUT", "tenant_id must be a valid UUID", [], requestId),
        { status: 400 }
      );
    }

    const tenantId = tenantIdParam ?? (await leadService.getOrCreateDefaultTenant());

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        createErrorResponse("INVALID_INPUT", "Invalid JSON body", [], requestId),
        { status: 400 }
      );
    }

    const parsed = approveReplyBodySchema.safeParse(body);
    if (!parsed.success) {
      const flat = parsed.error.flatten();
      const details = [
        ...(flat.formErrors ?? []),
        ...Object.entries(flat.fieldErrors ?? {}).flatMap(([k, v]) =>
          (Array.isArray(v) ? v : [v]).filter(Boolean).map((msg) => `${k}: ${msg}`)
        ),
      ];
      return NextResponse.json(
        createErrorResponse("INVALID_INPUT", "Invalid request body", details, requestId),
        { status: 400 }
      );
    }

    const { draft_text, action } = parsed.data;

    const result = await approvalService.approveOrSendReply({
      leadId: id,
      tenantId,
      draftText: draft_text,
      action: action as approvalService.ApproveReplyAction,
      correlationId: requestId,
    });

    return NextResponse.json(
      createSuccessResponse({ status: result.status, draft_id: result.draftId }, requestId),
      { status: 200 }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes("not found")) {
      return NextResponse.json(
        createErrorResponse("NOT_FOUND", message, [], requestId),
        { status: 404 }
      );
    }
    if (message.includes("Approve the draft before sending") || message.includes("low priority")) {
      return NextResponse.json(
        createErrorResponse("POLICY_VIOLATION", message, [], requestId),
        { status: 400 }
      );
    }
    return NextResponse.json(
      createErrorResponse("APPROVAL_FAILED", "Approval or send failed", [message], requestId),
      { status: 500 }
    );
  }
}
