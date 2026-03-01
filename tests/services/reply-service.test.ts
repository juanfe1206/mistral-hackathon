import { describe, it, expect, vi, beforeEach } from "vitest";
import * as replyService from "@/server/services/reply-service";

const LEAD_ID = "11111111-1111-1111-8111-111111111111";
const TENANT_ID = "22222222-2222-2222-8222-222222222222";

const mockChatComplete = vi.fn();
vi.mock("@mistralai/mistralai", () => ({
  Mistral: class MockMistral {
    chat = {
      complete: (...args: unknown[]) => mockChatComplete(...args),
    };
  },
}));

const mockFindLeadById = vi.fn();
const mockFindInteractionsByLeadId = vi.fn();
const mockGetActivePulsesForLead = vi.fn();
const mockCreateAuditEvent = vi.fn();

vi.mock("@/server/repositories/lead-repository", () => ({
  findLeadById: (...args: unknown[]) => mockFindLeadById(...args),
}));

vi.mock("@/server/repositories/interaction-repository", () => ({
  findInteractionsByLeadId: (...args: unknown[]) =>
    mockFindInteractionsByLeadId(...args),
}));

vi.mock("@/server/repositories/risk-repository", () => ({
  getActivePulsesForLead: (...args: unknown[]) =>
    mockGetActivePulsesForLead(...args),
}));

vi.mock("@/server/repositories/audit-repository", () => ({
  createAuditEvent: (...args: unknown[]) => mockCreateAuditEvent(...args),
}));

describe("reply-service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.MISTRAL_API_KEY = "test-key";
    mockFindLeadById.mockResolvedValue({
      id: LEAD_ID,
      tenantId: TENANT_ID,
      sourceChannel: "whatsapp",
      sourceMetadata: {},
      lifecycleState: "at_risk",
      riskPulses: [{ id: "p1", reason: "No contact for 48h" }],
    });
    mockFindInteractionsByLeadId.mockResolvedValue([
      {
        id: "i1",
        eventType: "ingested",
        payload: { text_body: "Hi, I wanted to book" },
      },
    ]);
    mockGetActivePulsesForLead.mockResolvedValue([
      { id: "p1", reason: "No contact for 48h" },
    ]);
    mockChatComplete.mockResolvedValue({
      choices: [{ message: { content: "Hi! We miss you. Let us know when you'd like to book." } }],
    });
    mockCreateAuditEvent.mockResolvedValue(undefined);
  });

  describe("generateRecoveryDraft", () => {
    it("returns draft text on success", async () => {
      const draft = await replyService.generateRecoveryDraft(LEAD_ID, TENANT_ID);
      expect(draft).toBe("Hi! We miss you. Let us know when you'd like to book.");
      expect(mockChatComplete).toHaveBeenCalledWith(
        expect.objectContaining({
          model: "mistral-small-latest",
          maxTokens: 256,
          messages: expect.arrayContaining([
            expect.objectContaining({
              role: "system",
              content: expect.stringContaining("concierge"),
            }),
            expect.objectContaining({
              role: "user",
              content: expect.stringContaining("No contact for 48h"),
            }),
          ]),
        })
      );
      expect(mockCreateAuditEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          tenantId: TENANT_ID,
          eventType: "reply.generated",
          payload: expect.objectContaining({ lead_id: LEAD_ID }),
        })
      );
    });

    it("throws when lead not found", async () => {
      mockFindLeadById.mockResolvedValue(null);
      await expect(replyService.generateRecoveryDraft(LEAD_ID, TENANT_ID)).rejects.toThrow(
        "Lead 11111111-1111-1111-8111-111111111111 not found"
      );
      expect(mockChatComplete).not.toHaveBeenCalled();
    });

    it("throws when lead is not at-risk", async () => {
      mockFindLeadById.mockResolvedValue({
        id: LEAD_ID,
        tenantId: TENANT_ID,
        lifecycleState: "default",
        riskPulses: [],
      });
      mockGetActivePulsesForLead.mockResolvedValue([]);
      await expect(replyService.generateRecoveryDraft(LEAD_ID, TENANT_ID)).rejects.toThrow(
        "not at-risk"
      );
      expect(mockChatComplete).not.toHaveBeenCalled();
    });

    it("throws when Mistral returns empty content", async () => {
      mockChatComplete.mockResolvedValue({ choices: [{ message: { content: "" } }] });
      await expect(replyService.generateRecoveryDraft(LEAD_ID, TENANT_ID)).rejects.toThrow(
        "Mistral returned empty recovery draft"
      );
    });

    it("throws when Mistral API fails", async () => {
      mockChatComplete.mockRejectedValueOnce(new Error("Mistral API timeout"));
      await expect(replyService.generateRecoveryDraft(LEAD_ID, TENANT_ID)).rejects.toThrow(
        "Mistral API timeout"
      );
    });

    it("passes correlationId to audit", async () => {
      const correlationId = "33333333-3333-3333-8333-333333333333";
      await replyService.generateRecoveryDraft(LEAD_ID, TENANT_ID, {
        correlationId,
      });
      expect(mockCreateAuditEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          correlationId,
        })
      );
    });
  });
});
