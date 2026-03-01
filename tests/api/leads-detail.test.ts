import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "@/app/api/leads/[id]/route";

const LEAD_ID = "11111111-1111-1111-8111-111111111111";
const TENANT_ID = "22222222-2222-2222-8222-222222222222";

const mockFindLeadById = vi.fn();
const mockGetOrCreateDefaultTenant = vi.fn();
const mockDetectAndFlagAtRisk = vi.fn();
const mockClassifyAndPersistForLead = vi.fn();

vi.mock("@/server/services/lead-service", () => ({
  findLeadById: (...args: unknown[]) => mockFindLeadById(...args),
  getOrCreateDefaultTenant: () => mockGetOrCreateDefaultTenant(),
  classifyAndPersistForLead: (...args: unknown[]) => mockClassifyAndPersistForLead(...args),
}));

vi.mock("@/server/services/risk-service", () => ({
  detectAndFlagAtRisk: (...args: unknown[]) => mockDetectAndFlagAtRisk(...args),
}));

const mockGetLeadSlaStatus = vi.fn();
vi.mock("@/server/services/sla-service", () => ({
  getLeadSlaStatus: (...args: unknown[]) => mockGetLeadSlaStatus(...args),
}));

describe("GET /api/leads/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetOrCreateDefaultTenant.mockResolvedValue(TENANT_ID);
    mockDetectAndFlagAtRisk.mockResolvedValue({ flagged: false });
    mockClassifyAndPersistForLead.mockResolvedValue(undefined);
    mockGetLeadSlaStatus.mockResolvedValue({ status: "safe", minutes_to_breach: null, minutes_over: null, first_response_at: null, response_minutes: null });
  });

  it("returns lead with override_history when overrides exist", async () => {
    mockFindLeadById.mockResolvedValue({
      id: LEAD_ID,
      tenantId: TENANT_ID,
      sourceChannel: "whatsapp",
      sourceExternalId: "1",
      sourceMetadata: {},
      priority: "vip",
      lifecycleState: "default",
      createdAt: new Date("2024-01-01T00:00:00Z"),
      classifications: [{ reasonTags: ["repeat customer"] }],
      priorityOverrides: [
        {
          previousPriority: "low",
          newPriority: "vip",
          reason: "Known VIP",
          createdAt: new Date("2024-01-02T12:00:00Z"),
        },
      ],
      riskPulses: [],
    });
    const request = new NextRequest(`http://localhost/api/leads/${LEAD_ID}`);
    const response = await GET(request, {
      params: Promise.resolve({ id: LEAD_ID }),
    });
    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.data.priority).toBe("vip");
    expect(json.data.override_history).toBeDefined();
    expect(json.data.override_history).toHaveLength(1);
    expect(json.data.override_history[0].previous_priority).toBe("low");
    expect(json.data.override_history[0].new_priority).toBe("vip");
    expect(json.data.override_history[0].reason).toBe("Known VIP");
    expect(json.data.override_history[0].created_at).toBe(
      "2024-01-02T12:00:00.000Z"
    );
    expect(json.data.sla_status).toEqual({ status: "safe", minutes_to_breach: null, minutes_over: null, first_response_at: null, response_minutes: null });
  });

  it("returns empty override_history when no overrides", async () => {
    mockFindLeadById.mockResolvedValue({
      id: LEAD_ID,
      tenantId: TENANT_ID,
      sourceChannel: "whatsapp",
      sourceExternalId: "1",
      sourceMetadata: {},
      priority: "low",
      lifecycleState: "default",
      createdAt: new Date("2024-01-01T00:00:00Z"),
      classifications: [],
      priorityOverrides: [],
      riskPulses: [],
    });
    const request = new NextRequest(`http://localhost/api/leads/${LEAD_ID}`);
    const response = await GET(request, {
      params: Promise.resolve({ id: LEAD_ID }),
    });
    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.data.override_history).toEqual([]);
  });

  it("returns lead with sla_status when SLA succeeds", async () => {
    mockFindLeadById.mockResolvedValue({
      id: LEAD_ID,
      tenantId: TENANT_ID,
      sourceChannel: "whatsapp",
      sourceExternalId: "1",
      sourceMetadata: {},
      priority: "vip",
      lifecycleState: "default",
      createdAt: new Date("2024-01-01T00:00:00Z"),
      classifications: [],
      priorityOverrides: [],
      riskPulses: [],
    });
    mockGetLeadSlaStatus.mockResolvedValue({ status: "breached", minutes_to_breach: null, minutes_over: 2, first_response_at: null, response_minutes: null });
    const request = new NextRequest(`http://localhost/api/leads/${LEAD_ID}`);
    const response = await GET(request, {
      params: Promise.resolve({ id: LEAD_ID }),
    });
    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.data.sla_status).toEqual({ status: "breached", minutes_to_breach: null, minutes_over: 2, first_response_at: null, response_minutes: null });
  });

  it("returns 404 when lead not found", async () => {
    mockFindLeadById.mockResolvedValue(null);
    const request = new NextRequest(`http://localhost/api/leads/${LEAD_ID}`);
    const response = await GET(request, {
      params: Promise.resolve({ id: LEAD_ID }),
    });
    expect(response.status).toBe(404);
    const json = await response.json();
    expect(json.error.code).toBe("NOT_FOUND");
  });

  it("returns lead with sla_status null when SLA service throws (AC2 fallback)", async () => {
    mockFindLeadById.mockResolvedValue({
      id: LEAD_ID,
      tenantId: TENANT_ID,
      sourceChannel: "whatsapp",
      sourceExternalId: "1",
      sourceMetadata: {},
      priority: "vip",
      lifecycleState: "default",
      createdAt: new Date("2024-01-01T00:00:00Z"),
      classifications: [],
      priorityOverrides: [],
      riskPulses: [],
    });
    mockGetLeadSlaStatus.mockRejectedValue(new Error("DB connection refused"));
    const request = new NextRequest(`http://localhost/api/leads/${LEAD_ID}`);
    const response = await GET(request, {
      params: Promise.resolve({ id: LEAD_ID }),
    });
    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.data.sla_status).toBeNull();
    expect(json.data.id).toBe(LEAD_ID);
    expect(json.data.priority).toBe("vip");
  });
});
