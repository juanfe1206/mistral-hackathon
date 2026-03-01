import { NextRequest, NextResponse } from "next/server";
import { createErrorResponse, createSuccessResponse } from "@/server/api/error-envelope";
import * as ingestionFailureRepo from "@/server/repositories/ingestion-failure-repository";

export async function GET(request: NextRequest) {
  const requestId = request.headers.get("x-request-id") ?? crypto.randomUUID();
  const limitParam = request.nextUrl.searchParams.get("limit");
  const limit = limitParam ? Math.min(parseInt(limitParam, 10) || 20, 100) : 20;

  try {
    const failures = await ingestionFailureRepo.findRecentIngestionFailures(limit);
    return NextResponse.json(
      createSuccessResponse(
        failures.map((f) => ({
          id: f.id,
          error_code: f.errorCode,
          message: f.message,
          details: f.details,
          created_at: f.createdAt.toISOString(),
        })),
        requestId
      )
    );
  } catch (err) {
    return NextResponse.json(
      createErrorResponse(
        "FETCH_FAILED",
        "Failed to fetch ingestion failures",
        [err instanceof Error ? err.message : String(err)],
        requestId
      ),
      { status: 500 }
    );
  }
}
