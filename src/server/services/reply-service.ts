/**
 * Recovery draft generation for at-risk leads.
 * Uses Mistral for personalized, premium-tone drafts.
 */

import { Mistral } from "@mistralai/mistralai";
import * as leadRepository from "@/server/repositories/lead-repository";
import * as interactionRepository from "@/server/repositories/interaction-repository";
import * as riskRepository from "@/server/repositories/risk-repository";
import * as auditRepository from "@/server/repositories/audit-repository";

const MODEL = "mistral-small-latest";
const MAX_TOKENS = 256;

export type RecoveryTone = "warm" | "neutral" | "direct";

function buildRecoverySystemPrompt(tone: RecoveryTone): string {
  const toneInstruction =
    tone === "warm"
      ? "Tone: warm, premium concierge, empathetic and friendly."
      : tone === "neutral"
        ? "Tone: neutral, premium concierge, clear and balanced."
        : "Tone: direct, premium concierge, concise and action-oriented without sounding harsh.";
  return `You write concise recovery messages for a salon. ${toneInstruction}
Output ONLY the message body—no greetings, no meta-commentary. Keep it under 100 words.`;
}

/**
 * Generate a recovery draft for an at-risk lead using Mistral.
 * @throws Error when lead not found, not at-risk, or Mistral API fails (caller should expose retry per NFR10)
 */
export async function generateRecoveryDraft(
  leadId: string,
  tenantId: string,
  options?: { correlationId?: string; tone?: RecoveryTone }
): Promise<string> {
  const lead = await leadRepository.findLeadById(leadId, tenantId);
  if (!lead) throw new Error(`Lead ${leadId} not found`);

  const isAtRisk =
    lead.lifecycleState === "at_risk" ||
    (Array.isArray(lead.riskPulses) && lead.riskPulses.length > 0);
  if (!isAtRisk) {
    throw new Error(`Lead ${leadId} is not at-risk. Recovery drafts are only for at-risk leads.`);
  }

  const pulses = await riskRepository.getActivePulsesForLead(leadId, tenantId);
  const riskReason = pulses[0]?.reason ?? "No recent contact";

  const interactions = await interactionRepository.findInteractionsByLeadId(leadId, tenantId, {
    limit: 5,
  });
  const parts = interactions.map((i) => {
    const p = (i.payload ?? {}) as Record<string, unknown>;
    const text = p?.text_body ?? p?.body ?? (typeof p === "object" ? i.eventType : "");
    return `${i.eventType}: ${String(text).slice(0, 150)}`;
  });
  const interactionsSummary = parts.length > 0 ? parts.join("; ") : "No interactions yet";

  const apiKey = process.env.MISTRAL_API_KEY;
  if (!apiKey) throw new Error("MISTRAL_API_KEY is not configured");

  const client = new Mistral({ apiKey });
  const tone = options?.tone ?? "warm";
  const userContent = `Write a recovery message for this at-risk lead:

Channel: ${lead.sourceChannel}
Metadata: ${JSON.stringify(lead.sourceMetadata ?? {}, null, 2)}
Risk reason: ${riskReason}
Recent interactions: ${interactionsSummary}

Return only the message text.`;

  const result = await client.chat.complete({
    model: MODEL,
    messages: [
      { role: "system", content: buildRecoverySystemPrompt(tone) },
      { role: "user", content: userContent },
    ],
    maxTokens: MAX_TOKENS,
    temperature: 0.4,
  });

  const draft = result.choices?.[0]?.message?.content?.trim();
  if (!draft) {
    throw new Error("Mistral returned empty recovery draft");
  }

  const occurredAt = new Date();
  await auditRepository.createAuditEvent({
    tenantId,
    eventType: "reply.generated",
    payload: {
      event_version: 1,
      lead_id: leadId,
      draft_length: draft.length,
    },
    occurredAt,
    correlationId: options?.correlationId ?? null,
  });

  return draft;
}
