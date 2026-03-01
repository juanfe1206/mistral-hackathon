import { createHmac } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createErrorResponse } from "@/server/api/error-envelope";
import * as leadService from "@/server/services/lead-service";
import * as ingestionFailureRepo from "@/server/repositories/ingestion-failure-repository";


/**
 * WhatsApp webhook payload schema (Zod)
 */
const WhatsAppWebhookSchema = z.object({
  object: z.literal("whatsapp_business_account"),
  entry: z.array(
    z.object({
      id: z.string(),
      changes: z.array(
        z.object({
          field: z.string(),
          value: z.object({
            messaging_product: z.string().optional(),
            metadata: z
              .object({
                display_phone_number: z.string().optional(),
                phone_number_id: z.string().optional(),
              })
              .optional(),
            contacts: z
              .array(
                z.object({
                  profile: z.object({ name: z.string().optional() }).optional(),
                  wa_id: z.string(),
                })
              )
              .optional(),
            messages: z
              .array(
                z.object({
                  from: z.string(),
                  id: z.string(),
                  timestamp: z.string(),
                  type: z.string().optional(),
                  text: z.object({ body: z.string() }).optional(),
                })
              )
              .optional(),
          }),
        })
      ),
    })
  ),
});

type WhatsAppWebhook = z.infer<typeof WhatsAppWebhookSchema>;

function verifySignature(rawBody: string, signature: string | null): boolean {
  const appSecret = process.env.WHATSAPP_APP_SECRET;
  if (!appSecret || !signature) return false;
  const expected = `sha256=${createHmac("sha256", appSecret).update(rawBody).digest("hex")}`;
  return signature === expected;
}

function extractAllSourceMetadata(payload: WhatsAppWebhook): {
  sourceChannel: string;
  sourceExternalId: string;
  sourceMetadata: Record<string, unknown>;
}[] {
  const results: {
    sourceChannel: string;
    sourceExternalId: string;
    sourceMetadata: Record<string, unknown>;
  }[] = [];
  for (const entry of payload.entry) {
    for (const change of entry.changes) {
      const value = change.value;
      const messages = value.messages ?? [];
      const contacts = value.contacts ?? [];
      for (const msg of messages) {
        const contact = contacts.find((c) => c.wa_id === msg.from) ?? contacts[0];
        results.push({
          sourceChannel: "whatsapp",
          sourceExternalId: msg.from,
          sourceMetadata: {
            message_id: msg.id,
            timestamp: msg.timestamp,
            contact_name: contact?.profile?.name ?? null,
            phone_number_id: value.metadata?.phone_number_id ?? null,
            display_phone_number: value.metadata?.display_phone_number ?? null,
          },
        });
      }
    }
  }
  return results;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN;
  if (mode === "subscribe" && token === verifyToken && challenge) {
    return new NextResponse(challenge, {
      headers: { "Content-Type": "text/plain" },
    });
  }

  const err = createErrorResponse(
    "VERIFICATION_FAILED",
    "Webhook verification failed",
    [],
    request.headers.get("x-request-id") ?? undefined
  );
  return NextResponse.json(err, { status: 403 });
}

export async function POST(request: NextRequest) {
  const requestId = request.headers.get("x-request-id") ?? crypto.randomUUID();
  const signature = request.headers.get("x-hub-signature-256");

  const rawBody = await request.text();
  if (!verifySignature(rawBody, signature)) {
    console.error(`[${requestId}] WhatsApp webhook: signature verification failed`);
    return NextResponse.json(
      createErrorResponse("INVALID_SIGNATURE", "Signature verification failed", [], requestId),
      { status: 401 }
    );
  }

  let payload: unknown;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    console.error(`[${requestId}] WhatsApp webhook: invalid JSON`);
    return NextResponse.json(
      createErrorResponse("INVALID_PAYLOAD", "Invalid JSON payload", [], requestId),
      { status: 400 }
    );
  }

  const parsed = WhatsAppWebhookSchema.safeParse(payload);
  if (!parsed.success) {
    console.error(`[${requestId}] WhatsApp webhook: validation failed`, parsed.error.flatten());
    return NextResponse.json(
      createErrorResponse(
        "VALIDATION_FAILED",
        "Payload validation failed",
        parsed.error.flatten().fieldErrors as unknown[],
        requestId
      ),
      { status: 400 }
    );
  }

  const metas = extractAllSourceMetadata(parsed.data);
  if (metas.length === 0) {
    // Not a message we process (e.g. status update)
    return new NextResponse(null, { status: 200 });
  }

  try {
    const tenantId = await leadService.getOrCreateDefaultTenant();
    for (const meta of metas) {
      const ts = meta.sourceMetadata?.timestamp;
      const initialInteractionOccurredAt = ts
        ? new Date(parseInt(String(ts), 10) * 1000)
        : undefined;
      const lead = await leadService.createLead({
        tenantId,
        sourceChannel: meta.sourceChannel,
        sourceExternalId: meta.sourceExternalId,
        sourceMetadata: meta.sourceMetadata,
        initialInteractionOccurredAt,
      });

      // Emit lead.ingested (log for now if event infra deferred)
      console.info(`[${requestId}] lead.ingested: leadId=${lead.id} tenantId=${tenantId}`, {
        event_name: "lead.ingested",
        event_version: 1,
        occurred_at: new Date().toISOString(),
        tenant_id: tenantId,
        correlation_id: requestId,
        payload: { lead_id: lead.id },
      });
    }
    return new NextResponse(null, { status: 200 });
  } catch (err) {
    console.error(`[${requestId}] WhatsApp webhook: ingestion failed`, err);
    const errMsg = err instanceof Error ? err.message : String(err);
    try {
      await ingestionFailureRepo.recordIngestionFailure({
        errorCode: "INGESTION_FAILED",
        message: "Failed to create lead",
        details: [errMsg],
      });
    } catch (recordErr) {
      console.error(`[${requestId}] Failed to record ingestion failure`, recordErr);
    }
    return NextResponse.json(
      createErrorResponse("INGESTION_FAILED", "Failed to create lead", [errMsg], requestId),
      { status: 500 }
    );
  }
}
