import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "@/app/api/leads/[id]/approve-reply/route";

const LEAD_ID = "11111111-1111-1111-8111-111111111111";
const TENANT_ID = "22222222-2222-2222-8222-222222222222";

const mockApproveOrSendReply = vi.fn();
const mockGetOrCreateDefaultTenant = vi.fn();

vi.mock("@/server/services/approval-service", () => ({
  approveOrSendReply: (...args: unknown[]) => mockApproveOrSendReply(...args),
}));

vi.mock("@/server/services/lead-service", () => ({
  getOrCreateDefaultTenant: () => mockGetOrCreateDefaultTenant(),
}));

describe("POST /api/leads/[id]/approve-reply", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetOrCreateDefaultTenant.mockResolvedValue(TENANT_ID);
    mockApproveOrSendReply.mockResolvedValue({ status: "sent", draftId: "draft-1" });
  });

  it("returns success for low-risk send", async () => {
    mockApproveOrSendReply.mockResolvedValueOnce({ status: "sent", draftId: "draft-1" });
    const request = new NextRequest(
      `http://localhost/api/leads/${LEAD_ID}/approve-reply`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ draft_text: "Hello!", action: "send" }),
      }
    );
    const response = await POST(request, {
      params: Promise.resolve({ id: LEAD_ID }),
    });
    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.data.status).toBe("sent");
    expect(json.data.draft_id).toBe("draft-1");
    expect(mockApproveOrSendReply).toHaveBeenCalledWith(
      expect.objectContaining({
        leadId: LEAD_ID,
        tenantId: TENANT_ID,
        draftText: "Hello!",
        action: "send",
      })
    );
  });

  it("returns success for vip/high approve", async () => {
    mockApproveOrSendReply.mockResolvedValueOnce({ status: "approved", draftId: "draft-2" });
    const request = new NextRequest(
      `http://localhost/api/leads/${LEAD_ID}/approve-reply`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ draft_text: "Hello VIP!", action: "approve" }),
      }
    );
    const response = await POST(request, {
      params: Promise.resolve({ id: LEAD_ID }),
    });
    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.data.status).toBe("approved");
    expect(json.data.draft_id).toBe("draft-2");
    expect(mockApproveOrSendReply).toHaveBeenCalledWith(
      expect.objectContaining({
        draftText: "Hello VIP!",
        action: "approve",
      })
    );
  });

  it("returns 400 when vip/high send without prior approval", async () => {
    mockApproveOrSendReply.mockRejectedValueOnce(
      new Error("Lead 11111111-1111-1111-8111-111111111111 is VIP/high-risk. Approve the draft before sending.")
    );
    const request = new NextRequest(
      `http://localhost/api/leads/${LEAD_ID}/approve-reply`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ draft_text: "Hello!", action: "send" }),
      }
    );
    const response = await POST(request, {
      params: Promise.resolve({ id: LEAD_ID }),
    });
    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json.error.code).toBe("POLICY_VIOLATION");
  });

  it("returns 404 when lead not found", async () => {
    mockApproveOrSendReply.mockRejectedValueOnce(
      new Error("Lead 11111111-1111-1111-8111-111111111111 not found")
    );
    const request = new NextRequest(
      `http://localhost/api/leads/${LEAD_ID}/approve-reply`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ draft_text: "Hi", action: "send" }),
      }
    );
    const response = await POST(request, {
      params: Promise.resolve({ id: LEAD_ID }),
    });
    expect(response.status).toBe(404);
    const json = await response.json();
    expect(json.error.code).toBe("NOT_FOUND");
  });

  it("returns 400 on invalid JSON body", async () => {
    const request = new NextRequest(
      `http://localhost/api/leads/${LEAD_ID}/approve-reply`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "not json",
      }
    );
    const response = await POST(request, {
      params: Promise.resolve({ id: LEAD_ID }),
    });
    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json.error.code).toBe("INVALID_INPUT");
  });

  it("returns 400 when draft_text is empty", async () => {
    const request = new NextRequest(
      `http://localhost/api/leads/${LEAD_ID}/approve-reply`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ draft_text: "", action: "send" }),
      }
    );
    const response = await POST(request, {
      params: Promise.resolve({ id: LEAD_ID }),
    });
    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json.error.code).toBe("INVALID_INPUT");
  });

  it("returns 400 when draft_text is whitespace-only", async () => {
    const request = new NextRequest(
      `http://localhost/api/leads/${LEAD_ID}/approve-reply`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ draft_text: "   \t\n  ", action: "send" }),
      }
    );
    const response = await POST(request, {
      params: Promise.resolve({ id: LEAD_ID }),
    });
    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json.error.code).toBe("INVALID_INPUT");
  });

  it("returns 400 when draft_text exceeds max length", async () => {
    const request = new NextRequest(
      `http://localhost/api/leads/${LEAD_ID}/approve-reply`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          draft_text: "x".repeat(4097),
          action: "send",
        }),
      }
    );
    const response = await POST(request, {
      params: Promise.resolve({ id: LEAD_ID }),
    });
    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json.error.code).toBe("INVALID_INPUT");
  });

  it("returns 400 when action is invalid", async () => {
    const request = new NextRequest(
      `http://localhost/api/leads/${LEAD_ID}/approve-reply`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ draft_text: "Hi", action: "invalid" }),
      }
    );
    const response = await POST(request, {
      params: Promise.resolve({ id: LEAD_ID }),
    });
    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json.error.code).toBe("INVALID_INPUT");
  });

  it("returns 400 when lead id is invalid UUID", async () => {
    const request = new NextRequest(
      "http://localhost/api/leads/not-a-uuid/approve-reply",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ draft_text: "Hi", action: "send" }),
      }
    );
    const response = await POST(request, {
      params: Promise.resolve({ id: "not-a-uuid" }),
    });
    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json.error.code).toBe("INVALID_INPUT");
  });
});
