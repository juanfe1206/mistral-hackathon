import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createErrorResponse, createSuccessResponse } from "@/server/api/error-envelope";
import { isValidUuid } from "@/lib/uuid";
import * as leadService from "@/server/services/lead-service";

const QuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(500).optional().default(100),
  offset: z.coerce.number().int().min(0).optional().default(0),
});

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function toOptionalText(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

function toEventLabel(eventType: string): string {
  return eventType
    .replace(/[._]/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function getTransition(eventType: string, payload: Record<string, unknown>): string | null {
  if (eventType === "priority.overridden") {
    const from = toOptionalText(payload.previous_priority);
    const to = toOptionalText(payload.new_priority);
    if (from && to) return `Priority: ${from} -> ${to}`;
  }

  if (eventType === "lifecycle.marked") {
    const to = toOptionalText(payload.lifecycle_state);
    if (to) return `Lifecycle: at_risk -> ${to}`;
  }

  if (eventType === "action.approved") return "Draft: generated -> approved";
  if (eventType === "action.sent") return "Draft: approved -> sent";

  return toOptionalText(payload.transition);
}

function getActor(payload: Record<string, unknown>): string | null {
  return (
    toOptionalText(payload.actor) ??
    toOptionalText(payload.actor_id) ??
    toOptionalText(payload.user_id)
  );
}

function getRationale(payload: Record<string, unknown>): string | null {
  return (
    toOptionalText(payload.reason) ??
    toOptionalText(payload.rationale) ??
    toOptionalText(payload.note)
  );
}

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

    const lead = await leadService.findLeadById(id, tenantId);
    if (!lead) {
      return NextResponse.json(
        createErrorResponse("NOT_FOUND", `Lead ${id} not found`, [], requestId),
        { status: 404 }
      );
    }

    const queryResult = QuerySchema.safeParse(
      Object.fromEntries(request.nextUrl.searchParams.entries())
    );
    if (!queryResult.success) {
      return NextResponse.json(
        createErrorResponse(
          "VALIDATION_FAILED",
          "Invalid query parameters",
          queryResult.error.flatten().fieldErrors as unknown[],
          requestId
        ),
        { status: 400 }
      );
    }
    const query = queryResult.data;

    const interactions = await leadService.getTimelineForLead(id, tenantId, {
      limit: query.limit,
      offset: query.offset,
    });

    return NextResponse.json(
      createSuccessResponse(
        interactions.map((i) => ({
          id: i.id,
          lead_id: i.leadId,
          tenant_id: i.tenantId,
          event_type: i.eventType,
          event_label: toEventLabel(i.eventType),
          occurred_at: i.occurredAt.toISOString(),
          actor: getActor(asRecord(i.payload)),
          rationale: getRationale(asRecord(i.payload)),
          transition: getTransition(i.eventType, asRecord(i.payload)),
          source: i.eventType.includes(".") ? "audit" : "interaction",
          flagged: i.eventType === "priority.overridden" || i.eventType === "lifecycle.marked",
          payload: i.payload,
          created_at: i.createdAt.toISOString(),
        })),
        requestId
      )
    );
  } catch (err) {
    return NextResponse.json(
      createErrorResponse(
        "FETCH_FAILED",
        "Failed to fetch timeline",
        [err instanceof Error ? err.message : String(err)],
        requestId
      ),
      { status: 500 }
    );
  }
}
