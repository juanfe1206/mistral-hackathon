import { NextRequest, NextResponse } from "next/server";
import { createErrorResponse, createSuccessResponse } from "@/server/api/error-envelope";
import * as leadService from "@/server/services/lead-service";
import * as riskRepository from "@/server/repositories/risk-repository";
import { isValidUuid } from "@/lib/uuid";

/**
 * GET /api/risk-pulses
 * List active at-risk leads for tenant.
 */
export async function GET(request: NextRequest) {
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

    const pulses = await riskRepository.getPulsesByTenant(tenantId, {
      status: "active",
      limit: 100,
    });

    const data = pulses.map((p) => ({
      id: p.id,
      lead_id: p.leadId,
      tenant_id: p.tenantId,
      reason: p.reason,
      detected_at: p.detectedAt.toISOString(),
      status: p.status,
      created_at: p.createdAt.toISOString(),
      lead: p.lead
        ? {
            id: p.lead.id,
            source_channel: p.lead.sourceChannel,
            source_external_id: p.lead.sourceExternalId,
            priority: p.lead.priority,
            lifecycle_state: p.lead.lifecycleState,
          }
        : undefined,
    }));

    return NextResponse.json(createSuccessResponse(data, requestId));
  } catch (err) {
    return NextResponse.json(
      createErrorResponse(
        "FETCH_FAILED",
        "Failed to fetch risk pulses",
        [err instanceof Error ? err.message : String(err)],
        requestId
      ),
      { status: 500 }
    );
  }
}
