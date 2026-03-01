import { prisma } from "@/lib/db";
import type { ReplyDraftStatus } from "@prisma/client";

/** Client type for transaction support */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type TxClient = any;

export interface CreateReplyDraftInput {
  leadId: string;
  tenantId: string;
  draftText: string;
  status?: ReplyDraftStatus;
  approvedAt?: Date | null;
  sentAt?: Date | null;
  actorId?: string | null;
}

export async function createReplyDraft(input: CreateReplyDraftInput, client?: TxClient) {
  const c = client ?? prisma;
  return c.replyDraft.create({
    data: {
      leadId: input.leadId,
      tenantId: input.tenantId,
      draftText: input.draftText,
      status: input.status ?? "draft",
      approvedAt: input.approvedAt ?? null,
      sentAt: input.sentAt ?? null,
      actorId: input.actorId ?? null,
    },
  });
}

export async function findLatestApprovedDraftForLead(
  leadId: string,
  tenantId: string,
  client?: TxClient
) {
  const c = client ?? prisma;
  return c.replyDraft.findFirst({
    where: { leadId, tenantId, status: "approved" },
    orderBy: { approvedAt: "desc" },
  });
}

/** Get earliest sentAt for a lead (first response timestamp). Returns null if no sent reply. */
export async function getEarliestSentAtForLead(leadId: string, tenantId: string, client?: TxClient) {
  const c = client ?? prisma;
  const draft = await c.replyDraft.findFirst({
    where: { leadId, tenantId, status: "sent" },
    orderBy: { sentAt: "asc" },
    select: { sentAt: true },
  });
  return draft?.sentAt ?? null;
}

/** Batch: get earliest sentAt per lead for many leads. Returns Map<leadId, Date>. */
export async function getEarliestSentAtByLeadIds(leadIds: string[], tenantId: string, client?: TxClient) {
  const c = client ?? prisma;
  const drafts = await c.replyDraft.findMany({
    where: { leadId: { in: leadIds }, tenantId, status: "sent" },
    select: { leadId: true, sentAt: true },
    orderBy: { sentAt: "asc" },
  });
  const map = new Map<string, Date>();
  for (const d of drafts) {
    if (!map.has(d.leadId)) map.set(d.leadId, d.sentAt);
  }
  return map;
}

export async function updateDraftStatus(
  id: string,
  tenantId: string,
  status: ReplyDraftStatus,
  updates: { sentAt?: Date; approvedAt?: Date },
  client?: TxClient
) {
  const c = client ?? prisma;
  return c.replyDraft.update({
    where: { id, tenantId },
    data: {
      status,
      ...(updates.sentAt && { sentAt: updates.sentAt }),
      ...(updates.approvedAt && { approvedAt: updates.approvedAt }),
    },
  });
}
