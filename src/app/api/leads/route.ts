import { NextRequest, NextResponse } from "next/server";
import { createErrorResponse, createSuccessResponse } from "@/server/api/error-envelope";
import { isValidUuid } from "@/lib/uuid";
import * as leadService from "@/server/services/lead-service";

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

    const leads = await leadService.findLeadsByTenant(tenantId, { limit: 100 });
    return NextResponse.json(
      createSuccessResponse(
        leads.map((l) => ({
          id: l.id,
          tenant_id: l.tenantId,
          source_channel: l.sourceChannel,
          source_external_id: l.sourceExternalId,
          source_metadata: l.sourceMetadata,
          priority: l.priority,
          created_at: l.createdAt.toISOString(),
        })),
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
