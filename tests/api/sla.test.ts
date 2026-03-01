import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "@/app/api/sla/route";

const TENANT_ID = "22222222-2222-2222-8222-222222222222";
const LEAD_ID = "11111111-1111-1111-8111-111111111111";

const mockGetOrCreateDefaultTenant = vi.fn();
const mockGetLeadSlaStatus = vi.fn();
const mockGetQueueSlaSummary = vi.fn();

vi.mock("@/server/services/lead-service", () => ({
  getOrCreateDefaultTenant: () => mockGetOrCreateDefaultTenant(),
}));

vi.mock("@/server/services/sla-service", () => ({
  getLeadSlaStatus: (...args: unknown[]) => mockGetLeadSlaStatus(...args),
  getQueueSlaSummary: (...args: unknown[]) => mockGetQueueSlaSummary(...args),
}));

describe("GET /api/sla", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetOrCreateDefaultTenant.mockResolvedValue(TENANT_ID);
  });

  it("returns queue summary when no lead_id", async () => {
    mockGetQueueSlaSummary.mockResolvedValue({
      count_safe: 5,
      count_warning: 1,
      count_breach_risk: 0,
      count_breached: 2,
      count_recovering: 1,
      count_n_a: 10,
      total_tracked: 9,
      sla_safe_percent: 67,
    });
    const request = new NextRequest("http://localhost/api/sla");
    const response = await GET(request);
    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.data.queue_summary).toEqual({
      count_safe: 5,
      count_warning: 1,
      count_breach_risk: 0,
      count_breached: 2,
      count_recovering: 1,
      count_n_a: 10,
      total_tracked: 9,
      sla_safe_percent: 67,
    });
    expect(mockGetQueueSlaSummary).toHaveBeenCalledWith(TENANT_ID);
  });

  it("returns lead SLA when lead_id provided", async () => {
    mockGetLeadSlaStatus.mockResolvedValue({
      status: "breached",
      minutes_to_breach: null,
      minutes_over: 3,
      first_response_at: null,
      response_minutes: null,
    });
    const request = new NextRequest(`http://localhost/api/sla?lead_id=${LEAD_ID}`);
    const response = await GET(request);
    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.data.lead_id).toBe(LEAD_ID);
    expect(json.data.sla_status).toEqual({
      status: "breached",
      minutes_to_breach: null,
      minutes_over: 3,
      first_response_at: null,
      response_minutes: null,
    });
    expect(mockGetLeadSlaStatus).toHaveBeenCalledWith(LEAD_ID, TENANT_ID);
  });

  it("returns 404 when lead_id provided but lead not found", async () => {
    mockGetLeadSlaStatus.mockResolvedValue(null);
    const request = new NextRequest(`http://localhost/api/sla?lead_id=${LEAD_ID}`);
    const response = await GET(request);
    expect(response.status).toBe(404);
    const json = await response.json();
    expect(json.error.code).toBe("NOT_FOUND");
  });

  it("returns 400 for invalid lead_id", async () => {
    const request = new NextRequest("http://localhost/api/sla?lead_id=not-a-uuid");
    const response = await GET(request);
    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json.error.code).toBe("INVALID_INPUT");
  });

  it("returns 500 with retry message on failure (AC2)", async () => {
    mockGetQueueSlaSummary.mockRejectedValue(new Error("DB connection refused"));
    const request = new NextRequest("http://localhost/api/sla");
    const response = await GET(request);
    expect(response.status).toBe(500);
    const json = await response.json();
    expect(json.error.code).toBe("FETCH_FAILED");
    expect(json.error.message).toContain("temporarily unavailable");
  });

  it("prefers x-tenant-id header over tenant_id query param", async () => {
    const headerTenant = "33333333-3333-3333-8333-333333333333";
    mockGetQueueSlaSummary.mockResolvedValue({
      count_safe: 1,
      count_warning: 0,
      count_breach_risk: 0,
      count_breached: 0,
      count_recovering: 0,
      count_n_a: 0,
      total_tracked: 1,
      sla_safe_percent: 100,
    });
    const request = new NextRequest(`http://localhost/api/sla?tenant_id=${TENANT_ID}`, {
      headers: { "x-tenant-id": headerTenant },
    });
    const response = await GET(request);
    expect(response.status).toBe(200);
    expect(mockGetQueueSlaSummary).toHaveBeenCalledWith(headerTenant);
  });
});
