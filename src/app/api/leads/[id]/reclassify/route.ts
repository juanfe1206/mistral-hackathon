import { NextRequest, NextResponse } from "next/server";
import { createErrorResponse, createSuccessResponse } from "@/server/api/error-envelope";
import { isValidUuid } from "@/lib/uuid";
import * as leadService from "@/server/services/lead-service";

/**
 * POST /api/leads/[id]/reclassify
 * Triggers re-classification for a lead. Used for retry when classification fails (NFR10).
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

    const lead = await leadService.findLeadById(id, tenantId);
    if (!lead) {
      return NextResponse.json(
        createErrorResponse("NOT_FOUND", `Lead ${id} not found`, [], requestId),
        { status: 404 }
      );
    }

    const result = await leadService.classifyAndPersistForLead(id, tenantId);

    return NextResponse.json(
      createSuccessResponse(
        {
          priority: result.priority,
          reason_tags: result.reasonTags,
        },
        requestId
      )
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      createErrorResponse(
        "CLASSIFICATION_FAILED",
        "Classification failed. Use retry to try again.",
        [message],
        requestId
      ),
      { status: 503 }
    );
  }
}
