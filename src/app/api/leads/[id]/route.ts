import { NextRequest, NextResponse } from "next/server";
import { createErrorResponse, createSuccessResponse } from "@/server/api/error-envelope";
import { isValidUuid } from "@/lib/uuid";
import * as leadService from "@/server/services/lead-service";
import * as riskService from "@/server/services/risk-service";
import * as slaService from "@/server/services/sla-service";

export async function GET(
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

    let lead = await leadService.findLeadById(id, tenantId);
    if (!lead) {
      return NextResponse.json(
        createErrorResponse("NOT_FOUND", `Lead ${id} not found`, [], requestId),
        { status: 404 }
      );
    }

    // Run at-risk detection on lead detail load (Task 4)
    try {
      const detectResult = await riskService.detectAndFlagAtRisk(id, tenantId, {
        correlationId: requestId,
      });
      if (detectResult.flagged) {
        lead = await leadService.findLeadById(id, tenantId) ?? lead;
      }
    } catch (detectErr) {
      console.error(
        `[leads/${id}] At-risk detection failed:`,
        detectErr instanceof Error ? detectErr.message : String(detectErr)
      );
    }

    const latest = lead.classifications?.[0];
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

    let sla_status = null;
    try {
      sla_status = await slaService.getLeadSlaStatus(id, tenantId);
    } catch (slaErr) {
      console.error(
        `[leads/${id}] SLA status failed:`,
        slaErr instanceof Error ? slaErr.message : String(slaErr)
      );
    }

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
          reason_tags: (latest?.reasonTags as string[]) ?? [],
          override_history: overrideHistory,
          risk_pulses,
          created_at: lead.createdAt.toISOString(),
          sla_status,
        },
        requestId
      )
    );
  } catch (err) {
    return NextResponse.json(
      createErrorResponse(
        "FETCH_FAILED",
        "Failed to fetch lead",
        [err instanceof Error ? err.message : String(err)],
        requestId
      ),
      { status: 500 }
    );
  }
}
