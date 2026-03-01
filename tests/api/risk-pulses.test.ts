import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "@/app/api/risk-pulses/route";

const TENANT_ID = "22222222-2222-2222-8222-222222222222";

const mockGetPulsesByTenant = vi.fn();
const mockGetOrCreateDefaultTenant = vi.fn();

vi.mock("@/server/repositories/risk-repository", () => ({
  getPulsesByTenant: (...args: unknown[]) => mockGetPulsesByTenant(...args),
}));

vi.mock("@/server/services/lead-service", () => ({
  getOrCreateDefaultTenant: () => mockGetOrCreateDefaultTenant(),
}));

describe("GET /api/risk-pulses", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetOrCreateDefaultTenant.mockResolvedValue(TENANT_ID);
    mockGetPulsesByTenant.mockResolvedValue([]);
  });

  it("returns list of active at-risk pulses for tenant", async () => {
    const pulse = {
      id: "33333333-3333-3333-8333-333333333333",
      leadId: "11111111-1111-1111-8111-111111111111",
      tenantId: TENANT_ID,
      reason: "No contact for 48h",
      detectedAt: new Date("2024-01-02T00:00:00Z"),
      status: "active" as const,
      createdAt: new Date("2024-01-02T00:00:00Z"),
      lead: {
        id: "11111111-1111-1111-8111-111111111111",
        sourceChannel: "whatsapp",
        sourceExternalId: "1",
        priority: "vip",
        lifecycleState: "at_risk",
      },
    };
    mockGetPulsesByTenant.mockResolvedValue([pulse]);

    const request = new NextRequest("http://localhost/api/risk-pulses");
    const response = await GET(request);

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.data).toHaveLength(1);
    expect(json.data[0].id).toBe(pulse.id);
    expect(json.data[0].reason).toBe("No contact for 48h");
    expect(json.data[0].status).toBe("active");
    expect(json.data[0].lead).toBeDefined();
    expect(json.data[0].lead.lifecycle_state).toBe("at_risk");
    expect(mockGetPulsesByTenant).toHaveBeenCalledWith(TENANT_ID, {
      status: "active",
      limit: 100,
    });
  });

  it("uses tenant_id from query when provided", async () => {
    const customTenant = "44444444-4444-4444-8444-444444444444";
    const request = new NextRequest(
      `http://localhost/api/risk-pulses?tenant_id=${customTenant}`
    );
    await GET(request);
    expect(mockGetPulsesByTenant).toHaveBeenCalledWith(customTenant, {
      status: "active",
      limit: 100,
    });
  });

  it("returns 400 for invalid tenant_id", async () => {
    const request = new NextRequest(
      "http://localhost/api/risk-pulses?tenant_id=not-a-uuid"
    );
    const response = await GET(request);
    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json.error.code).toBe("INVALID_INPUT");
    expect(mockGetPulsesByTenant).not.toHaveBeenCalled();
  });

  it("returns empty array when no pulses", async () => {
    mockGetPulsesByTenant.mockResolvedValue([]);
    const request = new NextRequest("http://localhost/api/risk-pulses");
    const response = await GET(request);
    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.data).toEqual([]);
  });
});
