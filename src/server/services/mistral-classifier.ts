/**
 * Mistral-based lead classification service.
 * Classifies leads as VIP, high, or low priority with explainable reason tags.
 */

import { Mistral } from "@mistralai/mistralai";
import type { ClassifyLeadResult, LeadClassificationContext } from "@/lib/classification";

const MODEL = "mistral-small-latest";

const CLASSIFY_SYSTEM = `You classify salon leads for prioritization. Output ONLY valid JSON, no markdown.

Schema:
{
  "priority": "vip" | "high" | "low",
  "reasonTags": ["tag1", "tag2", ...]
}

Rules:
- vip: repeat customer, high-value intent, urgent time-sensitive
- high: potential conversion, needs timely response
- low: general inquiry, can wait`;

function parseMistralResponse(raw: string): ClassifyLeadResult {
  const parsed = JSON.parse(raw) as { priority?: string; reasonTags?: string[] };
  const priority = ["vip", "high", "low"].includes(parsed.priority ?? "")
    ? (parsed.priority as ClassifyLeadResult["priority"])
    : "low";
  const reasonTags = Array.isArray(parsed.reasonTags)
    ? parsed.reasonTags.filter((t): t is string => typeof t === "string")
    : [];
  return { priority, reasonTags };
}

/**
 * Classify a lead using Mistral API.
 * @throws Error on API failure (caller should handle for NFR10 retry)
 */
export async function classifyLead(context: LeadClassificationContext): Promise<ClassifyLeadResult> {
  const apiKey = process.env.MISTRAL_API_KEY;
  if (!apiKey) {
    throw new Error("MISTRAL_API_KEY is not configured");
  }

  const client = new Mistral({ apiKey });

  const userContent = `Classify this lead:

Channel: ${context.sourceChannel}
Metadata: ${JSON.stringify(context.sourceMetadata, null, 2)}
Summary: ${context.interactionsSummary ?? "No interaction summary"}

Return JSON with priority and reasonTags.`;

  const result = await client.chat.complete({
    model: MODEL,
    messages: [
      { role: "system", content: CLASSIFY_SYSTEM },
      { role: "user", content: userContent },
    ],
    maxTokens: 256,
    responseFormat: { type: "json_object" as const },
    temperature: 0.2,
  });

  const raw = result.choices?.[0]?.message?.content;
  if (!raw) {
    throw new Error("Mistral returned empty classification response");
  }

  return parseMistralResponse(raw);
}
