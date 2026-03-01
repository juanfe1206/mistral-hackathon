import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createErrorResponse, createSuccessResponse } from "@/server/api/error-envelope";
import { isValidUuid } from "@/lib/uuid";
import * as leadService from "@/server/services/lead-service";
import * as riskService from "@/server/services/risk-service";

const markLifecycleBodySchema = z.object({
  lifecycle_state: z.enum(["recovered", "lost"]),
});

/**
 * POST /api/leads/[id]/mark-lifecycle
 * Mark at-risk lead as Recovered or Lost.
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

    const parsed = markLifecycleBodySchema.safeParse(body);
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

    const { lifecycle_state } = parsed.data;

    await riskService.markLifecycle(id, tenantId, lifecycle_state, {
      correlationId: requestId,
    });

    const lead = await leadService.findLeadById(id, tenantId);
    if (!lead) {
      return NextResponse.json(
        createErrorResponse("FETCH_FAILED", "Lead not found after lifecycle update", [], requestId),
        { status: 500 }
      );
    }

    const latestClassification = lead.classifications?.[0];
    const overrideHistory = (lead.priorityOverrides ?? []).map((o) => ({
      previous_priority: o.previousPriority,
      new_priority: o.newPriority,
      reason: o.reason,
      created_at: o.createdAt.toISOString(),
    }));
    const risk_pulses = (lead.riskPulses ?? []).map((p) => ({
      id: p.id,
      reason: p.reason,
      detected_at: p.detectedAt.toISOString(),
      status: p.status,
    }));

    return NextResponse.json(
      createSuccessResponse(
        {
          id: lead.id,
          tenant_id: lead.tenantId,
          source_channel: lead.sourceChannel,
          source_external_id: lead.sourceExternalId,
          source_metadata: lead.sourceMetadata,
          priority: lead.priority,
          lifecycle_state: lead.lifecycleState,
          reason_tags: (latestClassification?.reasonTags as string[]) ?? [],
          override_history: overrideHistory,
          risk_pulses,
          created_at: lead.createdAt.toISOString(),
        },
        requestId
      )
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes("not found")) {
      return NextResponse.json(
        createErrorResponse("NOT_FOUND", message, [], requestId),
        { status: 404 }
      );
    }
    if (message.includes("not at-risk")) {
      return NextResponse.json(
        createErrorResponse("INVALID_STATE", message, [], requestId),
        { status: 400 }
      );
    }
    return NextResponse.json(
      createErrorResponse("LIFECYCLE_UPDATE_FAILED", "Lifecycle update failed", [message], requestId),
      { status: 500 }
    );
  }
}
