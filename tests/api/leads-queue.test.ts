import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "@/app/api/leads/route";

const TENANT_ID = "22222222-2222-2222-8222-222222222222";

const mockGetLeadsWithSlaStatus = vi.fn();
const mockGetOrCreateDefaultTenant = vi.fn();
const mockClassifyAndPersistForLead = vi.fn();

vi.mock("@/server/services/lead-service", () => ({
  getOrCreateDefaultTenant: () => mockGetOrCreateDefaultTenant(),
  classifyAndPersistForLead: (...args: unknown[]) => mockClassifyAndPersistForLead(...args),
}));

vi.mock("@/server/services/sla-service", () => ({
  getLeadsWithSlaStatus: (...args: unknown[]) => mockGetLeadsWithSlaStatus(...args),
}));

describe("GET /api/leads (ranked queue)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetOrCreateDefaultTenant.mockResolvedValue(TENANT_ID);
    mockClassifyAndPersistForLead.mockResolvedValue(undefined);
  });

  it("returns leads with priority and sla_status in response (vip before high before low)", async () => {
    const lead1 = {
      id: "11111111-1111-1111-8111-111111111111",
      tenantId: TENANT_ID,
      sourceChannel: "whatsapp",
      sourceExternalId: "1",
      sourceMetadata: {},
      priority: "vip" as const,
      lifecycleState: "default" as const,
      createdAt: new Date("2024-01-02T00:00:00Z"),
      classifications: [{ reasonTags: ["repeat customer"] }],
    };
    const lead2 = {
      id: "33333333-3333-3333-8333-333333333333",
      tenantId: TENANT_ID,
      sourceChannel: "whatsapp",
      sourceExternalId: "2",
      sourceMetadata: {},
      priority: "high" as const,
      lifecycleState: "default" as const,
      createdAt: new Date("2024-01-01T00:00:00Z"),
      classifications: [{ reasonTags: ["urgent inquiry"] }],
    };
    const lead3 = {
      id: "55555555-5555-5555-8555-555555555555",
      tenantId: TENANT_ID,
      sourceChannel: "whatsapp",
      sourceExternalId: "3",
      sourceMetadata: {},
      priority: "low" as const,
      lifecycleState: "default" as const,
      createdAt: new Date("2024-01-03T00:00:00Z"),
      classifications: [{ reasonTags: [] }],
    };
    mockGetLeadsWithSlaStatus.mockResolvedValue([
      { lead: lead1, sla_status: { status: "safe" as const, minutes_to_breach: null, minutes_over: null, first_response_at: null, response_minutes: null } },
      { lead: lead2, sla_status: { status: "warning" as const, minutes_to_breach: 1, minutes_over: null, first_response_at: null, response_minutes: null } },
      { lead: lead3, sla_status: { status: "n_a" as const, minutes_to_breach: null, minutes_over: null, first_response_at: null, response_minutes: null } },
    ]);
    const request = new NextRequest("http://localhost/api/leads");
    const response = await GET(request);
    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.data).toHaveLength(3);
    expect(json.data[0].priority).toBe("vip");
    expect(json.data[1].priority).toBe("high");
    expect(json.data[2].priority).toBe("low");
    expect(json.data[0].id).toBe("11111111-1111-1111-8111-111111111111");
    expect(json.data[1].id).toBe("33333333-3333-3333-8333-333333333333");
    expect(json.data[2].id).toBe("55555555-5555-5555-8555-555555555555");
    expect(json.data[0].reason_tags).toEqual(["repeat customer"]);
    expect(json.data[1].reason_tags).toEqual(["urgent inquiry"]);
    expect(json.data[2].reason_tags).toEqual([]);
    expect(json.data[0].sla_status).toEqual({ status: "safe", minutes_to_breach: null, minutes_over: null, first_response_at: null, response_minutes: null });
    expect(json.data[1].sla_status).toEqual({ status: "warning", minutes_to_breach: 1, minutes_over: null, first_response_at: null, response_minutes: null });
    expect(json.data[2].sla_status).toEqual({ status: "n_a", minutes_to_breach: null, minutes_over: null, first_response_at: null, response_minutes: null });
  });
});
