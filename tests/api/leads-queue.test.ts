import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "@/app/api/leads/route";

const TENANT_ID = "22222222-2222-2222-8222-222222222222";

const mockFindLeadsByTenant = vi.fn();
const mockGetOrCreateDefaultTenant = vi.fn();

vi.mock("@/server/services/lead-service", () => ({
  findLeadsByTenant: (...args: unknown[]) => mockFindLeadsByTenant(...args),
  getOrCreateDefaultTenant: () => mockGetOrCreateDefaultTenant(),
}));

describe("GET /api/leads (ranked queue)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetOrCreateDefaultTenant.mockResolvedValue(TENANT_ID);
  });

  it("returns leads with priority in response (vip before high before low)", async () => {
    mockFindLeadsByTenant.mockResolvedValue([
      {
        id: "11111111-1111-1111-8111-111111111111",
        tenantId: TENANT_ID,
        sourceChannel: "whatsapp",
        sourceExternalId: "1",
        sourceMetadata: {},
        priority: "vip",
        createdAt: new Date("2024-01-02T00:00:00Z"),
      },
      {
        id: "33333333-3333-3333-8333-333333333333",
        tenantId: TENANT_ID,
        sourceChannel: "whatsapp",
        sourceExternalId: "2",
        sourceMetadata: {},
        priority: "high",
        createdAt: new Date("2024-01-01T00:00:00Z"),
      },
      {
        id: "55555555-5555-5555-8555-555555555555",
        tenantId: TENANT_ID,
        sourceChannel: "whatsapp",
        sourceExternalId: "3",
        sourceMetadata: {},
        priority: "low",
        createdAt: new Date("2024-01-03T00:00:00Z"),
      },
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
  });
});
