import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createErrorResponse, createSuccessResponse } from "@/server/api/error-envelope";
import { isValidUuid } from "@/lib/uuid";
import * as leadService from "@/server/services/lead-service";
import * as replyService from "@/server/services/reply-service";

const generateBodySchema = z.object({
  lead_id: z.string().uuid(),
  tone: z.enum(["warm", "neutral", "direct"]).optional().default("warm"),
});

/**
 * POST /api/replies/generate
 * Generate a recovery draft for an at-risk lead.
 * NFR10: On failure returns error with retry hint.
 */
export async function POST(request: NextRequest) {
  const requestId = request.headers.get("x-request-id") ?? crypto.randomUUID();

  try {
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

    const parsed = generateBodySchema.safeParse(body);
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

    const { lead_id, tone } = parsed.data;

    const draft = await replyService.generateRecoveryDraft(lead_id, tenantId, {
      correlationId: requestId,
      tone,
    });

    return NextResponse.json(
      createSuccessResponse({ draft }, requestId),
      { status: 200 }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes("not found")) {
      return NextResponse.json(
        createErrorResponse(
          "NOT_FOUND",
          message,
          ["Lead not found or not accessible. You can retry."],
          requestId
        ),
        { status: 404 }
      );
    }
    if (message.includes("not at-risk")) {
      return NextResponse.json(
        createErrorResponse(
          "INVALID_STATE",
          message,
          ["Recovery drafts are only for at-risk leads. You can retry after the lead is flagged at-risk."],
          requestId
        ),
        { status: 400 }
      );
    }
    return NextResponse.json(
      createErrorResponse(
        "GENERATION_FAILED",
        "Recovery draft generation failed",
        [message, "You can retry the operation."],
        requestId
      ),
      { status: 500 }
    );
  }
}
