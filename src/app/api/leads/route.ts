import { NextRequest, NextResponse } from "next/server";
import { createErrorResponse, createSuccessResponse } from "@/server/api/error-envelope";
import { isValidUuid } from "@/lib/uuid";
import * as leadService from "@/server/services/lead-service";
import * as slaService from "@/server/services/sla-service";

export async function GET(request: NextRequest) {
  const requestId = request.headers.get("x-request-id") ?? crypto.randomUUID();

  try {
    const tenantIdParam = request.nextUrl.searchParams.get("tenant_id");
    const tenantId =
      tenantIdParam ?? (await leadService.getOrCreateDefaultTenant());

    if (tenantIdParam && !isValidUuid(tenantIdParam)) {
      return NextResponse.json(
        createErrorResponse("INVALID_INPUT", "tenant_id must be a valid UUID", [], requestId),
        { status: 400 }
      );
    }

    let leadsWithSla = await slaService.getLeadsWithSlaStatus(tenantId, { limit: 100 });

    // Auto-classify unclassified leads (e.g. demo seed) so queue shows priority and reason tags
    const unclassified = leadsWithSla.filter(({ lead }) => (lead.classifications?.length ?? 0) === 0);
    if (unclassified.length > 0) {
      await Promise.all(
        unclassified.map(({ lead }) =>
          leadService.classifyAndPersistForLead(lead.id, tenantId).catch((err) => {
            console.error(`[leads] Auto-classify failed for ${lead.id}:`, err instanceof Error ? err.message : String(err));
          })
        )
      );
      leadsWithSla = await slaService.getLeadsWithSlaStatus(tenantId, { limit: 100 });
    }

    return NextResponse.json(
      createSuccessResponse(
        leadsWithSla.map(({ lead: l, sla_status }) => {
          const latest = l.classifications?.[0];
          return {
            id: l.id,
            tenant_id: l.tenantId,
            source_channel: l.sourceChannel,
            source_external_id: l.sourceExternalId,
            source_metadata: l.sourceMetadata,
            priority: l.priority,
            lifecycle_state: l.lifecycleState,
            reason_tags: (latest?.reasonTags as string[]) ?? [],
            created_at: l.createdAt.toISOString(),
            sla_status,
          };
        }),
        requestId
      )
    );
  } catch (err) {
    return NextResponse.json(
      createErrorResponse(
        "FETCH_FAILED",
        "Failed to fetch leads",
        [err instanceof Error ? err.message : String(err)],
        requestId
      ),
      { status: 500 }
    );
  }
}
