import { NextRequest, NextResponse } from "next/server";
import { createErrorResponse, createSuccessResponse } from "@/server/api/error-envelope";
import { isValidUuid } from "@/lib/uuid";
import * as leadService from "@/server/services/lead-service";

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

    const tenant = tenantIdParam ?? (await leadService.getOrCreateDefaultTenant());

    const lead = await leadService.findLeadById(id, tenant);
    if (!lead) {
      return NextResponse.json(
        createErrorResponse("NOT_FOUND", `Lead ${id} not found`, [], requestId),
        { status: 404 }
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
          created_at: lead.createdAt.toISOString(),
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
