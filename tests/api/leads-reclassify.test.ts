import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "@/app/api/leads/[id]/reclassify/route";

const LEAD_ID = "11111111-1111-1111-8111-111111111111";
const TENANT_ID = "22222222-2222-2222-8222-222222222222";

const mockFindLeadById = vi.fn();
const mockClassifyAndPersistForLead = vi.fn();
const mockGetOrCreateDefaultTenant = vi.fn();

vi.mock("@/server/services/lead-service", () => ({
  findLeadById: (...args: unknown[]) => mockFindLeadById(...args),
  classifyAndPersistForLead: (...args: unknown[]) => mockClassifyAndPersistForLead(...args),
  getOrCreateDefaultTenant: () => mockGetOrCreateDefaultTenant(),
}));

describe("POST /api/leads/[id]/reclassify", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetOrCreateDefaultTenant.mockResolvedValue(TENANT_ID);
    mockFindLeadById.mockResolvedValue({ id: LEAD_ID, tenantId: TENANT_ID });
    mockClassifyAndPersistForLead.mockResolvedValue({
      priority: "vip",
      reasonTags: ["repeat customer", "high intent"],
    });
  });

  it("returns priority and reason_tags on success", async () => {
    const request = new NextRequest(`http://localhost/api/leads/${LEAD_ID}/reclassify`, {
      method: "POST",
    });
    const response = await POST(request, {
      params: Promise.resolve({ id: LEAD_ID }),
    });
    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.data.priority).toBe("vip");
    expect(json.data.reason_tags).toEqual(["repeat customer", "high intent"]);
    expect(mockClassifyAndPersistForLead).toHaveBeenCalledWith(LEAD_ID, TENANT_ID);
  });

  it("returns 404 when lead not found", async () => {
    mockFindLeadById.mockResolvedValue(null);
    const request = new NextRequest(`http://localhost/api/leads/${LEAD_ID}/reclassify`, {
      method: "POST",
    });
    const response = await POST(request, {
      params: Promise.resolve({ id: LEAD_ID }),
    });
    expect(response.status).toBe(404);
    const json = await response.json();
    expect(json.error.code).toBe("NOT_FOUND");
    expect(mockClassifyAndPersistForLead).not.toHaveBeenCalled();
  });

  it("returns 503 with retry message when classification fails (NFR10)", async () => {
    mockClassifyAndPersistForLead.mockRejectedValueOnce(new Error("Mistral API timeout"));
    const request = new NextRequest(`http://localhost/api/leads/${LEAD_ID}/reclassify`, {
      method: "POST",
    });
    const response = await POST(request, {
      params: Promise.resolve({ id: LEAD_ID }),
    });
    expect(response.status).toBe(503);
    const json = await response.json();
    expect(json.error.code).toBe("CLASSIFICATION_FAILED");
    expect(json.error.message).toContain("retry");
    expect(json.error.details).toContain("Mistral API timeout");
  });

  it("returns 400 for invalid UUID", async () => {
    const request = new NextRequest("http://localhost/api/leads/not-a-uuid/reclassify", {
      method: "POST",
    });
    const response = await POST(request, {
      params: Promise.resolve({ id: "not-a-uuid" }),
    });
    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json.error.code).toBe("INVALID_INPUT");
  });
});
