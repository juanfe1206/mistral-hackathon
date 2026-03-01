import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "@/app/api/kpi/route";

const TENANT_ID = "22222222-2222-2222-8222-222222222222";

const mockGetOrCreateDefaultTenant = vi.fn();
const mockGetKpiSummary = vi.fn();

vi.mock("@/server/services/lead-service", () => ({
  getOrCreateDefaultTenant: () => mockGetOrCreateDefaultTenant(),
}));

vi.mock("@/server/services/kpi-service", () => ({
  getKpiSummary: (...args: unknown[]) => mockGetKpiSummary(...args),
}));

describe("GET /api/kpi", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetOrCreateDefaultTenant.mockResolvedValue(TENANT_ID);
  });

  it("returns KPI summary on success", async () => {
    mockGetKpiSummary.mockResolvedValue({
      recovery_count: 5,
      sla_compliance_percent: 80,
      queue_aging_minutes: 12,
      queue_aging_count: 2,
    });
    const request = new NextRequest("http://localhost/api/kpi");
    const response = await GET(request);
    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.data).toEqual({
      recovery_count: 5,
      sla_compliance_percent: 80,
      queue_aging_minutes: 12,
      queue_aging_count: 2,
    });
    expect(mockGetKpiSummary).toHaveBeenCalledWith(TENANT_ID);
  });

  it("is tenant-scoped via query param", async () => {
    const customTenant = "33333333-3333-3333-8333-333333333333";
    mockGetKpiSummary.mockResolvedValue({
      recovery_count: 0,
      sla_compliance_percent: null,
      queue_aging_minutes: null,
      queue_aging_count: 0,
    });
    const request = new NextRequest(
      `http://localhost/api/kpi?tenant_id=${customTenant}`
    );
    const response = await GET(request);
    expect(response.status).toBe(200);
    expect(mockGetKpiSummary).toHaveBeenCalledWith(customTenant);
  });

  it("returns 400 for invalid tenant_id", async () => {
    const request = new NextRequest(
      "http://localhost/api/kpi?tenant_id=not-a-uuid"
    );
    const response = await GET(request);
    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json.error.code).toBe("INVALID_INPUT");
    expect(json.error.message).toContain("tenant_id");
  });

  it("returns error envelope with retry guidance on failure (NFR10/AC2)", async () => {
    mockGetKpiSummary.mockRejectedValue(new Error("DB connection refused"));
    const request = new NextRequest("http://localhost/api/kpi");
    const response = await GET(request);
    expect(response.status).toBe(500);
    const json = await response.json();
    expect(json.error.code).toBe("FETCH_FAILED");
    expect(json.error.message).toContain("temporarily unavailable");
  });

  it("returns no-data semantics when empty tenant", async () => {
    mockGetKpiSummary.mockResolvedValue({
      recovery_count: 0,
      sla_compliance_percent: null,
      queue_aging_minutes: null,
      queue_aging_count: 0,
    });
    const request = new NextRequest("http://localhost/api/kpi");
    const response = await GET(request);
    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.data.recovery_count).toBe(0);
    expect(json.data.sla_compliance_percent).toBeNull();
    expect(json.data.queue_aging_minutes).toBeNull();
  });
});
