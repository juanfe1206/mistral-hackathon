import { NextRequest, NextResponse } from "next/server";
import { createErrorResponse, createSuccessResponse } from "@/server/api/error-envelope";
import { isValidUuid } from "@/lib/uuid";
import * as leadService from "@/server/services/lead-service";
import * as kpiService from "@/server/services/kpi-service";

export async function GET(request: NextRequest) {
  const requestId = request.headers.get("x-request-id") ?? crypto.randomUUID();

  try {
    const tenantIdParam = request.nextUrl.searchParams.get("tenant_id");
    const tenantId = tenantIdParam ?? (await leadService.getOrCreateDefaultTenant());

    if (tenantIdParam && !isValidUuid(tenantIdParam)) {
      return NextResponse.json(
        createErrorResponse("INVALID_INPUT", "tenant_id must be a valid UUID", [], requestId),
        { status: 400 }
      );
    }

    const summary = await kpiService.getKpiSummary(tenantId);
    return NextResponse.json(
      createSuccessResponse(
        {
          recovery_count: summary.recovery_count,
          sla_compliance_percent: summary.sla_compliance_percent,
          queue_aging_minutes: summary.queue_aging_minutes,
          queue_aging_count: summary.queue_aging_count,
        },
        requestId
      )
    );
  } catch (err) {
    // Log full error server-side; avoid exposing internal details to client (architecture)
    if (err instanceof Error) {
      console.error("[KPI] fetch failed:", err.message, err);
    }
    return NextResponse.json(
      createErrorResponse(
        "FETCH_FAILED",
        "KPIs temporarily unavailable. Please try again.",
        [],
        requestId
      ),
      { status: 500 }
    );
  }
}
