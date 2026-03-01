import { describe, it, expect, vi, beforeEach } from "vitest";
import * as approvalService from "@/server/services/approval-service";

const LEAD_ID = "11111111-1111-1111-8111-111111111111";
const TENANT_ID = "22222222-2222-2222-8222-222222222222";

const mockFindLeadById = vi.fn();
const mockCreateReplyDraft = vi.fn();
const mockFindLatestApprovedDraftForLead = vi.fn();
const mockUpdateDraftStatus = vi.fn();
const mockCreateAuditEvent = vi.fn();

vi.mock("@/server/repositories/lead-repository", () => ({
  findLeadById: (...args: unknown[]) => mockFindLeadById(...args),
}));

vi.mock("@/server/repositories/reply-draft-repository", () => ({
  createReplyDraft: (...args: unknown[]) => mockCreateReplyDraft(...args),
  findLatestApprovedDraftForLead: (...args: unknown[]) =>
    mockFindLatestApprovedDraftForLead(...args),
  updateDraftStatus: (...args: unknown[]) => mockUpdateDraftStatus(...args),
}));

vi.mock("@/server/repositories/audit-repository", () => ({
  createAuditEvent: (...args: unknown[]) => mockCreateAuditEvent(...args),
}));

describe("approval-service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreateReplyDraft.mockResolvedValue({ id: "draft-1" });
    mockCreateAuditEvent.mockResolvedValue(undefined);
  });

  describe("approveOrSendReply", () => {
    it("creates approved draft and audit for vip approve", async () => {
      mockFindLeadById.mockResolvedValue({
        id: LEAD_ID,
        tenantId: TENANT_ID,
        priority: "vip",
      });
      mockCreateReplyDraft.mockResolvedValue({ id: "draft-1" });

      const result = await approvalService.approveOrSendReply({
        leadId: LEAD_ID,
        tenantId: TENANT_ID,
        draftText: "Hi! We miss you.",
        action: "approve",
      });

      expect(result).toEqual({ status: "approved", draftId: "draft-1" });
      expect(mockCreateReplyDraft).toHaveBeenCalledWith(
        expect.objectContaining({
          leadId: LEAD_ID,
          tenantId: TENANT_ID,
          draftText: "Hi! We miss you.",
          status: "approved",
        })
      );
      expect(mockCreateAuditEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: "action.approved",
          payload: expect.objectContaining({ lead_id: LEAD_ID, draft_id: "draft-1" }),
        })
      );
    });

    it("creates sent draft and audit for low-priority send", async () => {
      mockFindLeadById.mockResolvedValue({
        id: LEAD_ID,
        tenantId: TENANT_ID,
        priority: "low",
      });
      mockCreateReplyDraft.mockResolvedValue({ id: "draft-sent" });

      const result = await approvalService.approveOrSendReply({
        leadId: LEAD_ID,
        tenantId: TENANT_ID,
        draftText: "See you soon!",
        action: "send",
      });

      expect(result).toEqual({ status: "sent", draftId: "draft-sent" });
      expect(mockCreateReplyDraft).toHaveBeenCalledWith(
        expect.objectContaining({
          draftText: "See you soon!",
          status: "sent",
        })
      );
      expect(mockCreateAuditEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: "action.sent",
        })
      );
    });

    it("throws when lead not found", async () => {
      mockFindLeadById.mockResolvedValue(null);
      await expect(
        approvalService.approveOrSendReply({
          leadId: LEAD_ID,
          tenantId: TENANT_ID,
          draftText: "Hi",
          action: "send",
        })
      ).rejects.toThrow("Lead 11111111-1111-1111-8111-111111111111 not found");
    });

    it("throws when approve on low-priority lead", async () => {
      mockFindLeadById.mockResolvedValue({
        id: LEAD_ID,
        tenantId: TENANT_ID,
        priority: "low",
      });
      await expect(
        approvalService.approveOrSendReply({
          leadId: LEAD_ID,
          tenantId: TENANT_ID,
          draftText: "Hi",
          action: "approve",
        })
      ).rejects.toThrow("low priority");
    });

    it("throws when vip/high send without prior approval", async () => {
      mockFindLeadById.mockResolvedValue({
        id: LEAD_ID,
        tenantId: TENANT_ID,
        priority: "vip",
      });
      mockFindLatestApprovedDraftForLead.mockResolvedValue(null);

      await expect(
        approvalService.approveOrSendReply({
          leadId: LEAD_ID,
          tenantId: TENANT_ID,
          draftText: "Hi",
          action: "send",
        })
      ).rejects.toThrow("Approve the draft before sending");
    });

    it("sends for vip/high when approved draft exists", async () => {
      mockFindLeadById.mockResolvedValue({
        id: LEAD_ID,
        tenantId: TENANT_ID,
        priority: "vip",
      });
      mockFindLatestApprovedDraftForLead.mockResolvedValue({
        id: "draft-approved",
        leadId: LEAD_ID,
        tenantId: TENANT_ID,
        status: "approved",
      });
      mockUpdateDraftStatus.mockResolvedValue({ id: "draft-approved" });

      const result = await approvalService.approveOrSendReply({
        leadId: LEAD_ID,
        tenantId: TENANT_ID,
        draftText: "Hi",
        action: "send",
      });

      expect(result).toEqual({ status: "sent", draftId: "draft-approved" });
      expect(mockUpdateDraftStatus).toHaveBeenCalledWith(
        "draft-approved",
        TENANT_ID,
        "sent",
        expect.objectContaining({ sentAt: expect.any(Date) }),
        undefined
      );
      expect(mockCreateAuditEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: "action.sent",
        })
      );
    });
  });
});
