import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "@/app/api/leads/[id]/timeline/route";

const LEAD_ID = "11111111-1111-1111-8111-111111111111";
const TENANT_ID = "22222222-2222-2222-8222-222222222222";

const mockFindLeadById = vi.fn();
const mockGetTimelineForLead = vi.fn();
const mockGetOrCreateDefaultTenant = vi.fn();

vi.mock("@/server/services/lead-service", () => ({
  findLeadById: (...args: unknown[]) => mockFindLeadById(...args),
  getTimelineForLead: (...args: unknown[]) => mockGetTimelineForLead(...args),
  getOrCreateDefaultTenant: () => mockGetOrCreateDefaultTenant(),
}));

describe("GET /api/leads/[id]/timeline", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetOrCreateDefaultTenant.mockResolvedValue(TENANT_ID);
    mockFindLeadById.mockResolvedValue({
      id: LEAD_ID,
      tenantId: TENANT_ID,
      sourceChannel: "whatsapp",
      sourceExternalId: "15551234567",
    });
    mockGetTimelineForLead.mockResolvedValue([
      {
        id: "i1",
        leadId: "lead-uuid",
        tenantId: "tenant-uuid",
        eventType: "ingested",
        occurredAt: new Date("2024-01-01T10:00:00Z"),
        payload: { timestamp: "1704067200" },
        createdAt: new Date("2024-01-01T10:00:01Z"),
      },
      {
        id: "i2",
        leadId: "lead-uuid",
        tenantId: "tenant-uuid",
        eventType: "contacted",
        occurredAt: new Date("2024-01-02T12:00:00Z"),
        payload: {},
        createdAt: new Date("2024-01-02T12:00:01Z"),
      },
    ]);
  });

  it("returns timeline ordered by occurred_at when lead exists", async () => {
    const request = new NextRequest(`http://localhost/api/leads/${LEAD_ID}/timeline`);
    const response = await GET(request, {
      params: Promise.resolve({ id: LEAD_ID }),
    });
    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.data).toHaveLength(2);
    expect(json.data[0].event_type).toBe("ingested");
    expect(json.data[0].occurred_at).toBe("2024-01-01T10:00:00.000Z");
    expect(json.data[0].event_label).toBe("Ingested");
    expect(json.data[0].source).toBe("interaction");
    expect(json.data[1].event_type).toBe("contacted");
    expect(mockGetTimelineForLead).toHaveBeenCalledWith(
      LEAD_ID,
      TENANT_ID,
      { limit: 100, offset: 0 }
    );
  });

  it("maps governance event fields for auditable timeline entries", async () => {
    mockGetTimelineForLead.mockResolvedValue([
      {
        id: "a1",
        leadId: LEAD_ID,
        tenantId: TENANT_ID,
        eventType: "priority.overridden",
        actorId: "agent-7",
        occurredAt: new Date("2024-01-03T12:00:00Z"),
        payload: {
          lead_id: LEAD_ID,
          reason: "VIP escalation",
          previous_priority: "high",
          new_priority: "vip",
        },
        createdAt: new Date("2024-01-03T12:00:01Z"),
      },
    ]);

    const request = new NextRequest(`http://localhost/api/leads/${LEAD_ID}/timeline`);
    const response = await GET(request, {
      params: Promise.resolve({ id: LEAD_ID }),
    });
    expect(response.status).toBe(200);
    const json = await response.json();

    expect(json.data[0].event_label).toBe("Priority Overridden");
    expect(json.data[0].actor).toBe("agent-7");
    expect(json.data[0].rationale).toBe("VIP escalation");
    expect(json.data[0].transition).toBe("Priority: high -> vip");
    expect(json.data[0].source).toBe("audit");
    expect(json.data[0].flagged).toBe(true);
  });

  it("maps action.sent transition based on approval requirement", async () => {
    mockGetTimelineForLead.mockResolvedValue([
      {
        id: "a2",
        leadId: LEAD_ID,
        tenantId: TENANT_ID,
        eventType: "action.sent",
        occurredAt: new Date("2024-01-03T12:10:00Z"),
        payload: { lead_id: LEAD_ID, approval_required: false },
        createdAt: new Date("2024-01-03T12:10:01Z"),
      },
      {
        id: "a3",
        leadId: LEAD_ID,
        tenantId: TENANT_ID,
        eventType: "action.sent",
        occurredAt: new Date("2024-01-03T12:11:00Z"),
        payload: { lead_id: LEAD_ID, approval_required: true },
        createdAt: new Date("2024-01-03T12:11:01Z"),
      },
    ]);

    const request = new NextRequest(`http://localhost/api/leads/${LEAD_ID}/timeline`);
    const response = await GET(request, {
      params: Promise.resolve({ id: LEAD_ID }),
    });
    expect(response.status).toBe(200);
    const json = await response.json();

    expect(json.data[0].transition).toBe("Draft: generated -> sent");
    expect(json.data[1].transition).toBe("Draft: approved -> sent");
  });

  it("returns 404 when lead not found", async () => {
    mockFindLeadById.mockResolvedValue(null);
    const request = new NextRequest(`http://localhost/api/leads/${LEAD_ID}/timeline`);
    const response = await GET(request, {
      params: Promise.resolve({ id: LEAD_ID }),
    });
    expect(response.status).toBe(404);
    const json = await response.json();
    expect(json.error.code).toBe("NOT_FOUND");
  });

  it("returns 400 with VALIDATION_FAILED for invalid query params", async () => {
    const request = new NextRequest(
      `http://localhost/api/leads/${LEAD_ID}/timeline?limit=-1&offset=abc`
    );
    const response = await GET(request, {
      params: Promise.resolve({ id: LEAD_ID }),
    });
    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json.error.code).toBe("VALIDATION_FAILED");
    expect(json.error.message).toBe("Invalid query parameters");
    expect(mockGetTimelineForLead).not.toHaveBeenCalled();
  });
});
