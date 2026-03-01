import { NextRequest, NextResponse } from "next/server";
import { createErrorResponse, createSuccessResponse } from "@/server/api/error-envelope";
import { isValidUuid } from "@/lib/uuid";
import * as leadService from "@/server/services/lead-service";
import * as slaService from "@/server/services/sla-service";

export async function GET(request: NextRequest) {
  const requestId = request.headers.get("x-request-id") ?? crypto.randomUUID();

  try {
    const tenantIdHeader = request.headers.get("x-tenant-id");
    const tenantIdParam = request.nextUrl.searchParams.get("tenant_id");
    const tenantIdCandidate = tenantIdHeader ?? tenantIdParam;
    const tenantId =
      tenantIdCandidate ?? (await leadService.getOrCreateDefaultTenant());

    if (tenantIdCandidate && !isValidUuid(tenantIdCandidate)) {
      return NextResponse.json(
        createErrorResponse("INVALID_INPUT", "tenant_id must be a valid UUID", [], requestId),
        { status: 400 }
      );
    }

    const leadIdParam = request.nextUrl.searchParams.get("lead_id");
    if (leadIdParam) {
      if (!isValidUuid(leadIdParam)) {
        return NextResponse.json(
          createErrorResponse("INVALID_INPUT", "lead_id must be a valid UUID", [], requestId),
          { status: 400 }
        );
      }
      const slaStatus = await slaService.getLeadSlaStatus(leadIdParam, tenantId);
      if (!slaStatus) {
        return NextResponse.json(
          createErrorResponse("NOT_FOUND", `Lead ${leadIdParam} not found`, [], requestId),
          { status: 404 }
        );
      }
      return NextResponse.json(
        createSuccessResponse(
          {
            lead_id: leadIdParam,
            sla_status: slaStatus,
          },
          requestId
        )
      );
    }

    const summary = await slaService.getQueueSlaSummary(tenantId);
    return NextResponse.json(
      createSuccessResponse(
        {
          queue_summary: summary,
        },
        requestId
      )
    );
  } catch (err) {
    return NextResponse.json(
      createErrorResponse(
        "FETCH_FAILED",
        "SLA data temporarily unavailable. Please try again.",
        [err instanceof Error ? err.message : String(err)],
        requestId
      ),
      { status: 500 }
    );
  }
}
