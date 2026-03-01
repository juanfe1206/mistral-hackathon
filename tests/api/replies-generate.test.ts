import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "@/app/api/replies/generate/route";

const LEAD_ID = "11111111-1111-1111-8111-111111111111";
const TENANT_ID = "22222222-2222-2222-8222-222222222222";

const mockGenerateRecoveryDraft = vi.fn();
const mockGetOrCreateDefaultTenant = vi.fn();

vi.mock("@/server/services/reply-service", () => ({
  generateRecoveryDraft: (...args: unknown[]) => mockGenerateRecoveryDraft(...args),
}));

vi.mock("@/server/services/lead-service", () => ({
  getOrCreateDefaultTenant: () => mockGetOrCreateDefaultTenant(),
}));

describe("POST /api/replies/generate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetOrCreateDefaultTenant.mockResolvedValue(TENANT_ID);
    mockGenerateRecoveryDraft.mockResolvedValue(
      "Hi! We miss you. Let us know when you'd like to book."
    );
  });

  it("returns draft on success", async () => {
    const request = new NextRequest("http://localhost/api/replies/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lead_id: LEAD_ID }),
    });
    const response = await POST(request);
    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.data.draft).toBe("Hi! We miss you. Let us know when you'd like to book.");
    expect(mockGenerateRecoveryDraft).toHaveBeenCalledWith(
      LEAD_ID,
      TENANT_ID,
      expect.objectContaining({ correlationId: expect.any(String), tone: "warm" })
    );
  });

  it("passes tone when provided", async () => {
    const request = new NextRequest("http://localhost/api/replies/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lead_id: LEAD_ID, tone: "direct" }),
    });
    await POST(request);
    expect(mockGenerateRecoveryDraft).toHaveBeenCalledWith(
      LEAD_ID,
      TENANT_ID,
      expect.objectContaining({ tone: "direct" })
    );
  });

  it("returns 404 when lead not found", async () => {
    mockGenerateRecoveryDraft.mockRejectedValueOnce(
      new Error("Lead 11111111-1111-1111-8111-111111111111 not found")
    );
    const request = new NextRequest("http://localhost/api/replies/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lead_id: LEAD_ID }),
    });
    const response = await POST(request);
    expect(response.status).toBe(404);
    const json = await response.json();
    expect(json.error.code).toBe("NOT_FOUND");
    expect(json.error.details?.some((d: string) => d.includes("retry"))).toBe(true);
  });

  it("returns 400 when lead is not at-risk", async () => {
    mockGenerateRecoveryDraft.mockRejectedValueOnce(
      new Error("Lead 11111111-1111-1111-8111-111111111111 is not at-risk. Recovery drafts are only for at-risk leads.")
    );
    const request = new NextRequest("http://localhost/api/replies/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lead_id: LEAD_ID }),
    });
    const response = await POST(request);
    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json.error.code).toBe("INVALID_STATE");
    expect(json.error.details?.some((d: string) => d.includes("retry"))).toBe(true);
  });

  it("returns 500 with retry hint on generation failure", async () => {
    mockGenerateRecoveryDraft.mockRejectedValueOnce(new Error("Mistral API timeout"));
    const request = new NextRequest("http://localhost/api/replies/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lead_id: LEAD_ID }),
    });
    const response = await POST(request);
    expect(response.status).toBe(500);
    const json = await response.json();
    expect(json.error.code).toBe("GENERATION_FAILED");
    expect(json.error.details).toContain("You can retry the operation.");
  });

  it("returns 400 on invalid JSON body", async () => {
    const request = new NextRequest("http://localhost/api/replies/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "not json",
    });
    const response = await POST(request);
    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json.error.code).toBe("INVALID_INPUT");
  });

  it("returns 400 when lead_id is missing", async () => {
    const request = new NextRequest("http://localhost/api/replies/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    const response = await POST(request);
    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json.error.code).toBe("INVALID_INPUT");
  });

  it("uses tenant_id from query when provided", async () => {
    const request = new NextRequest(
      "http://localhost/api/replies/generate?tenant_id=" + TENANT_ID,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lead_id: LEAD_ID }),
      }
    );
    await POST(request);
    expect(mockGenerateRecoveryDraft).toHaveBeenCalledWith(
      LEAD_ID,
      TENANT_ID,
      expect.any(Object)
    );
  });
});
