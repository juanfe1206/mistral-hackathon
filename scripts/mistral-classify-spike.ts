/**
 * Mistral API Spike — Epic 2 Preparation
 *
 * Proves: auth, models, classification prompt, response structure, and limits.
 * Run: pnpm exec tsx scripts/mistral-classify-spike.ts
 * Requires: MISTRAL_API_KEY in .env or .env.local
 */
import "dotenv/config";
import { Mistral } from "@mistralai/mistralai";

const SAMPLE_LEAD = {
  sourceChannel: "whatsapp",
  sourceMetadata: {
    contact_name: "Maria García",
    message_id: "wamid.demo123",
    timestamp: "1709308800",
    text_body: "Hola! Quiero reservar cita para mañana a las 3pm. Soy clienta habitual.",
  },
  interactionsSummary: "First message: inquiry about appointment. Mentioned regular customer.",
};

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

async function main() {
  const apiKey = process.env.MISTRAL_API_KEY;
  if (!apiKey) {
    console.error("ERROR: MISTRAL_API_KEY not set. Add to .env or .env.local");
    process.exit(1);
  }

  const client = new Mistral({ apiKey });
  const model = "mistral-small-latest"; // Cost-effective for classification (mistral-large-latest for more nuance)

  const userContent = `Classify this lead:

Channel: ${SAMPLE_LEAD.sourceChannel}
Metadata: ${JSON.stringify(SAMPLE_LEAD.sourceMetadata, null, 2)}
Summary: ${SAMPLE_LEAD.interactionsSummary}

Return JSON with priority and reasonTags.`;

  console.log("=== Mistral API Spike ===\n");
  console.log("Model:", model);
  console.log("Auth: MISTRAL_API_KEY present\n");

  try {
    const start = Date.now();
    const result = await client.chat.complete({
      model,
      messages: [
        { role: "system", content: CLASSIFY_SYSTEM },
        { role: "user", content: userContent },
      ],
      maxTokens: 256,
      responseFormat: { type: "json_object" as const },
      temperature: 0.2,
    });
    const elapsed = Date.now() - start;

    const raw = result.choices?.[0]?.message?.content;
    if (!raw) {
      console.error("No content in response:", JSON.stringify(result, null, 2));
      process.exit(1);
    }

    const parsed = JSON.parse(raw) as { priority?: string; reasonTags?: string[] };
    if (!["vip", "high", "low"].includes(parsed.priority ?? "")) {
      console.warn("WARN: priority not in allowed set:", parsed.priority);
    }

    console.log("Response (elapsed ms):", elapsed);
    console.log("Parsed:", JSON.stringify(parsed, null, 2));
    console.log("\nUsage:", JSON.stringify(result.usage, null, 2));

    // NFR2: AI classification within 5s for 95% — this spike validates latency
    if (elapsed > 5000) {
      console.warn("\nWARN: Response > 5s. Consider model downgrade or prompt simplification for NFR2.");
    } else {
      console.log("\nNFR2 check: Response within 5s target.");
    }

    console.log("\n=== Spike complete: auth OK, model OK, JSON mode OK ===");
  } catch (err) {
    console.error("Mistral API error:", err);
    if (err && typeof err === "object" && "status" in err) {
      console.error("Status:", (err as { status?: number }).status);
    }
    process.exit(1);
  }
}

main();
