/**
 * Approval-gated send for VIP/high-risk leads.
 * Policy: low priority → send allowed; vip/high → explicit approval required before send.
 */

import * as leadRepository from "@/server/repositories/lead-repository";
import * as replyDraftRepository from "@/server/repositories/reply-draft-repository";
import * as auditRepository from "@/server/repositories/audit-repository";
import type { LeadPriority } from "@prisma/client";

function requiresApproval(priority: LeadPriority): boolean {
  return priority === "vip" || priority === "high";
}

export type ApproveReplyAction = "approve" | "send";

export interface ApproveReplyInput {
  leadId: string;
  tenantId: string;
  draftText: string;
  action: ApproveReplyAction;
  actorId?: string | null;
  correlationId?: string | null;
}

export interface ApproveReplyResult {
  status: "approved" | "sent";
  draftId: string;
}

/**
 * Approve a draft (VIP/high only) or send the reply.
 * For vip/high + send: requires prior approve. For low: send allowed directly.
 * @throws Error when lead not found, policy violated, or no approved draft for vip/high send
 */
export async function approveOrSendReply(input: ApproveReplyInput): Promise<ApproveReplyResult> {
  const { leadId, tenantId, draftText, action, actorId, correlationId } = input;

  const lead = await leadRepository.findLeadById(leadId, tenantId);
  if (!lead) throw new Error(`Lead ${leadId} not found`);

  const occurredAt = new Date();

  if (action === "approve") {
    if (!requiresApproval(lead.priority)) {
      throw new Error(
        `Lead ${leadId} is low priority. Approval is only required for VIP/high-risk leads.`
      );
    }
    const draft = await replyDraftRepository.createReplyDraft({
      leadId,
      tenantId,
      draftText,
      status: "approved",
      approvedAt: occurredAt,
      actorId,
    });
    await auditRepository.createAuditEvent({
      tenantId,
      eventType: "action.approved",
      actorId,
      payload: {
        event_version: 1,
        lead_id: leadId,
        draft_id: draft.id,
        draft_length: draftText.length,
      },
      occurredAt,
      correlationId,
    });
    return { status: "approved", draftId: draft.id };
  }

  // action === "send"
  if (requiresApproval(lead.priority)) {
    const approvedDraft = await replyDraftRepository.findLatestApprovedDraftForLead(
      leadId,
      tenantId
    );
    if (!approvedDraft) {
      throw new Error(
        `Lead ${leadId} is VIP/high-risk. Approve the draft before sending.`
      );
    }
    await replyDraftRepository.updateDraftStatus(
      approvedDraft.id,
      tenantId,
      "sent",
      { sentAt: occurredAt },
      undefined
    );
    await auditRepository.createAuditEvent({
      tenantId,
      eventType: "action.sent",
      actorId,
      payload: {
        event_version: 1,
        lead_id: leadId,
        draft_id: approvedDraft.id,
        approval_required: true,
      },
      occurredAt,
      correlationId,
    });
    return { status: "sent", draftId: approvedDraft.id };
  }

  // low priority: send directly
  const draft = await replyDraftRepository.createReplyDraft({
    leadId,
    tenantId,
    draftText,
    status: "sent",
    sentAt: occurredAt,
    actorId,
  });
  await auditRepository.createAuditEvent({
    tenantId,
    eventType: "action.sent",
    actorId,
    payload: {
      event_version: 1,
      lead_id: leadId,
      draft_id: draft.id,
      approval_required: false,
    },
    occurredAt,
    correlationId,
  });
  return { status: "sent", draftId: draft.id };
}
