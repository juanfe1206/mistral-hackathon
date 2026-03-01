import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "@/app/api/leads/[id]/override-priority/route";

const LEAD_ID = "11111111-1111-1111-8111-111111111111";
const TENANT_ID = "22222222-2222-2222-8222-222222222222";

const mockOverridePriority = vi.fn();
const mockFindLeadById = vi.fn();
const mockGetOrCreateDefaultTenant = vi.fn();

vi.mock("@/server/services/override-service", () => ({
  overridePriority: (...args: unknown[]) => mockOverridePriority(...args),
}));

vi.mock("@/server/services/lead-service", () => ({
  findLeadById: (...args: unknown[]) => mockFindLeadById(...args),
  getOrCreateDefaultTenant: () => mockGetOrCreateDefaultTenant(),
}));

describe("POST /api/leads/[id]/override-priority", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetOrCreateDefaultTenant.mockResolvedValue(TENANT_ID);
    mockOverridePriority.mockResolvedValue({
      leadId: LEAD_ID,
      previousPriority: "low",
      newPriority: "vip",
    });
    mockFindLeadById.mockResolvedValue({
      id: LEAD_ID,
      tenantId: TENANT_ID,
      sourceChannel: "whatsapp",
      sourceExternalId: "1",
      sourceMetadata: {},
      priority: "vip",
      createdAt: new Date("2024-01-01T00:00:00Z"),
      classifications: [{ reasonTags: ["override applied"] }],
      priorityOverrides: [
        {
          previousPriority: "low",
          newPriority: "vip",
          reason: "Known VIP",
          createdAt: new Date("2024-01-02T00:00:00Z"),
        },
      ],
    });
  });

  it("returns updated lead with override_history on success", async () => {
    const request = new NextRequest(
      `http://localhost/api/leads/${LEAD_ID}/override-priority`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priority: "vip", reason: "Known VIP" }),
      }
    );
    const response = await POST(request, {
      params: Promise.resolve({ id: LEAD_ID }),
    });
    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.data.priority).toBe("vip");
    expect(json.data.override_history).toHaveLength(1);
    expect(json.data.override_history[0].previous_priority).toBe("low");
    expect(json.data.override_history[0].new_priority).toBe("vip");
    expect(json.data.override_history[0].reason).toBe("Known VIP");
    expect(mockOverridePriority).toHaveBeenCalledWith(
      expect.objectContaining({
        leadId: LEAD_ID,
        tenantId: TENANT_ID,
        newPriority: "vip",
        reason: "Known VIP",
      })
    );
  });

  it("returns 404 when lead not found", async () => {
    mockOverridePriority.mockRejectedValueOnce(new Error(`Lead ${LEAD_ID} not found`));
    const request = new NextRequest(
      `http://localhost/api/leads/${LEAD_ID}/override-priority`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priority: "vip" }),
      }
    );
    const response = await POST(request, {
      params: Promise.resolve({ id: LEAD_ID }),
    });
    expect(response.status).toBe(404);
    const json = await response.json();
    expect(json.error.code).toBe("NOT_FOUND");
  });

  it("returns 400 for invalid priority", async () => {
    const request = new NextRequest(
      `http://localhost/api/leads/${LEAD_ID}/override-priority`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priority: "invalid" }),
      }
    );
    const response = await POST(request, {
      params: Promise.resolve({ id: LEAD_ID }),
    });
    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json.error.code).toBe("INVALID_INPUT");
    expect(mockOverridePriority).not.toHaveBeenCalled();
  });

  it("returns 400 for invalid UUID", async () => {
    const request = new NextRequest(
      "http://localhost/api/leads/not-a-uuid/override-priority",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priority: "vip" }),
      }
    );
    const response = await POST(request, {
      params: Promise.resolve({ id: "not-a-uuid" }),
    });
    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json.error.code).toBe("INVALID_INPUT");
    expect(mockOverridePriority).not.toHaveBeenCalled();
  });

  it("returns 400 for invalid JSON body", async () => {
    const request = new NextRequest(
      `http://localhost/api/leads/${LEAD_ID}/override-priority`,
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
    expect(mockOverridePriority).not.toHaveBeenCalled();
  });

  it("returns 400 when body is missing priority", async () => {
    const request = new NextRequest(
      `http://localhost/api/leads/${LEAD_ID}/override-priority`,
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
    expect(mockOverridePriority).not.toHaveBeenCalled();
  });
});
