import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "@/app/api/leads/[id]/mark-lifecycle/route";

const LEAD_ID = "11111111-1111-1111-8111-111111111111";
const TENANT_ID = "22222222-2222-2222-8222-222222222222";

const mockMarkLifecycle = vi.fn();
const mockFindLeadById = vi.fn();
const mockGetOrCreateDefaultTenant = vi.fn();

vi.mock("@/server/services/risk-service", () => ({
  markLifecycle: (...args: unknown[]) => mockMarkLifecycle(...args),
}));

vi.mock("@/server/services/lead-service", () => ({
  findLeadById: (...args: unknown[]) => mockFindLeadById(...args),
  getOrCreateDefaultTenant: () => mockGetOrCreateDefaultTenant(),
}));

describe("POST /api/leads/[id]/mark-lifecycle", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetOrCreateDefaultTenant.mockResolvedValue(TENANT_ID);
    mockMarkLifecycle.mockResolvedValue({ leadId: LEAD_ID, lifecycleState: "recovered" });
    mockFindLeadById.mockResolvedValue({
      id: LEAD_ID,
      tenantId: TENANT_ID,
      sourceChannel: "whatsapp",
      sourceExternalId: "1",
      sourceMetadata: {},
      priority: "vip",
      lifecycleState: "recovered",
      createdAt: new Date("2024-01-01T00:00:00Z"),
      classifications: [{ reasonTags: [] }],
      priorityOverrides: [],
      riskPulses: [],
    });
  });

  it("returns updated lead with lifecycle_state recovered on success", async () => {
    const request = new NextRequest(
      `http://localhost/api/leads/${LEAD_ID}/mark-lifecycle`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lifecycle_state: "recovered" }),
      }
    );
    const response = await POST(request, {
      params: Promise.resolve({ id: LEAD_ID }),
    });
    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.data.lifecycle_state).toBe("recovered");
    expect(json.data.risk_pulses).toBeDefined();
    expect(mockMarkLifecycle).toHaveBeenCalledWith(
      LEAD_ID,
      TENANT_ID,
      "recovered",
      expect.objectContaining({ correlationId: expect.any(String) })
    );
  });

  it("accepts lifecycle_state lost", async () => {
    mockFindLeadById.mockResolvedValue({
      id: LEAD_ID,
      tenantId: TENANT_ID,
      sourceChannel: "whatsapp",
      sourceExternalId: "1",
      sourceMetadata: {},
      priority: "vip",
      lifecycleState: "lost",
      createdAt: new Date("2024-01-01T00:00:00Z"),
      classifications: [],
      priorityOverrides: [],
      riskPulses: [],
    });
    const request = new NextRequest(
      `http://localhost/api/leads/${LEAD_ID}/mark-lifecycle`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lifecycle_state: "lost" }),
      }
    );
    const response = await POST(request, {
      params: Promise.resolve({ id: LEAD_ID }),
    });
    expect(response.status).toBe(200);
    expect(mockMarkLifecycle).toHaveBeenCalledWith(
      LEAD_ID,
      TENANT_ID,
      "lost",
      expect.any(Object)
    );
  });

  it("returns 404 when lead not found", async () => {
    mockMarkLifecycle.mockRejectedValueOnce(new Error(`Lead ${LEAD_ID} not found`));
    const request = new NextRequest(
      `http://localhost/api/leads/${LEAD_ID}/mark-lifecycle`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lifecycle_state: "recovered" }),
      }
    );
    const response = await POST(request, {
      params: Promise.resolve({ id: LEAD_ID }),
    });
    expect(response.status).toBe(404);
    const json = await response.json();
    expect(json.error.code).toBe("NOT_FOUND");
  });

  it("returns 400 when lead is not at-risk", async () => {
    mockMarkLifecycle.mockRejectedValueOnce(
      new Error(
        `Lead ${LEAD_ID} is not at-risk (current: default). Cannot mark as recovered.`
      )
    );
    const request = new NextRequest(
      `http://localhost/api/leads/${LEAD_ID}/mark-lifecycle`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lifecycle_state: "recovered" }),
      }
    );
    const response = await POST(request, {
      params: Promise.resolve({ id: LEAD_ID }),
    });
    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json.error.code).toBe("INVALID_STATE");
  });

  it("returns 400 for invalid lifecycle_state", async () => {
    const request = new NextRequest(
      `http://localhost/api/leads/${LEAD_ID}/mark-lifecycle`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lifecycle_state: "invalid" }),
      }
    );
    const response = await POST(request, {
      params: Promise.resolve({ id: LEAD_ID }),
    });
    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json.error.code).toBe("INVALID_INPUT");
    expect(mockMarkLifecycle).not.toHaveBeenCalled();
  });

  it("returns 400 for invalid UUID", async () => {
    const request = new NextRequest(
      "http://localhost/api/leads/not-a-uuid/mark-lifecycle",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lifecycle_state: "recovered" }),
      }
    );
    const response = await POST(request, {
      params: Promise.resolve({ id: "not-a-uuid" }),
    });
    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json.error.code).toBe("INVALID_INPUT");
    expect(mockMarkLifecycle).not.toHaveBeenCalled();
  });

  it("returns 400 for invalid JSON body", async () => {
    const request = new NextRequest(
      `http://localhost/api/leads/${LEAD_ID}/mark-lifecycle`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "not valid json {{{",
      }
    );
    const response = await POST(request, {
      params: Promise.resolve({ id: LEAD_ID }),
    });
    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json.error.code).toBe("INVALID_INPUT");
    expect(json.error.message).toContain("JSON");
    expect(mockMarkLifecycle).not.toHaveBeenCalled();
  });

  it("returns 400 when body is missing lifecycle_state", async () => {
    const request = new NextRequest(
      `http://localhost/api/leads/${LEAD_ID}/mark-lifecycle`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      }
    );
    const response = await POST(request, {
      params: Promise.resolve({ id: LEAD_ID }),
    });
    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json.error.code).toBe("INVALID_INPUT");
    expect(mockMarkLifecycle).not.toHaveBeenCalled();
  });
});
