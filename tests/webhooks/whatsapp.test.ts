import { createHmac } from "crypto";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET, POST } from "@/app/api/webhooks/whatsapp/route";

const mockCreateLead = vi.fn();
const mockGetOrCreateDefaultTenant = vi.fn();
const mockRecordIngestionFailure = vi.fn();

vi.mock("@/server/services/lead-service", () => ({
  createLead: (...args: unknown[]) => mockCreateLead(...args),
  getOrCreateDefaultTenant: () => mockGetOrCreateDefaultTenant(),
}));

vi.mock("@/server/repositories/ingestion-failure-repository", () => ({
  recordIngestionFailure: (...args: unknown[]) => mockRecordIngestionFailure(...args),
}));

describe("WhatsApp webhook", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetOrCreateDefaultTenant.mockResolvedValue("tenant-uuid-1111-2222-3333-444455556666");
    mockCreateLead.mockResolvedValue({
      id: "lead-uuid-1111-2222-3333-444455556666",
      tenantId: "tenant-uuid-1111-2222-3333-444455556666",
      sourceChannel: "whatsapp",
      sourceExternalId: "15551234567",
      sourceMetadata: { message_id: "wamid.1", timestamp: "123", contact_name: "John" },
      createdAt: new Date(),
    });
    process.env = { ...originalEnv };
  });

  describe("GET verification", () => {
    it("returns hub.challenge when verify_token matches", async () => {
      process.env.WHATSAPP_VERIFY_TOKEN = "secret_token";
      const request = new Request(
        "http://localhost/api/webhooks/whatsapp?hub.mode=subscribe&hub.verify_token=secret_token&hub.challenge=challenge123"
      );
      const response = await GET(request);
      expect(response.status).toBe(200);
      expect(await response.text()).toBe("challenge123");
    });

    it("returns 403 when verify_token does not match", async () => {
      process.env.WHATSAPP_VERIFY_TOKEN = "secret_token";
      const request = new Request(
        "http://localhost/api/webhooks/whatsapp?hub.mode=subscribe&hub.verify_token=wrong&hub.challenge=challenge123"
      );
      const response = await GET(request);
      expect(response.status).toBe(403);
      const json = await response.json();
      expect(json.error.code).toBe("VERIFICATION_FAILED");
    });
  });

  describe("POST signature verification", () => {
    it("returns 401 when X-Hub-Signature-256 is missing", async () => {
      process.env.WHATSAPP_APP_SECRET = "my_secret";
      const request = new Request("http://localhost/api/webhooks/whatsapp", {
        method: "POST",
        body: JSON.stringify({ object: "whatsapp_business_account", entry: [] }),
      });
      const response = await POST(request);
      expect(response.status).toBe(401);
      const json = await response.json();
      expect(json.error.code).toBe("INVALID_SIGNATURE");
    });

    it("returns 401 when signature is invalid", async () => {
      process.env.WHATSAPP_APP_SECRET = "my_secret";
      const body = JSON.stringify({
        object: "whatsapp_business_account",
        entry: [
          {
            id: "123",
            changes: [
              {
                field: "messages",
                value: {
                  messages: [{ from: "15551234567", id: "wamid.1", timestamp: "123" }],
                },
              },
            ],
          },
        ],
      });
      const request = new Request("http://localhost/api/webhooks/whatsapp", {
        method: "POST",
        body,
        headers: { "X-Hub-Signature-256": "sha256=invalid" },
      });
      const response = await POST(request);
      expect(response.status).toBe(401);
    });
  });

  describe("POST payload validation", () => {
    it("returns 400 for invalid JSON", async () => {
      process.env.WHATSAPP_APP_SECRET = "my_secret";
      const body = "not json";
      const sig = `sha256=${createHmac("sha256", "my_secret").update(body).digest("hex")}`;
      const request = new Request("http://localhost/api/webhooks/whatsapp", {
        method: "POST",
        body,
        headers: { "X-Hub-Signature-256": sig },
      });
      const response = await POST(request);
      expect(response.status).toBe(400);
      const json = await response.json();
      expect(json.error.code).toBe("INVALID_PAYLOAD");
    });

    it("returns 400 with VALIDATION_FAILED for invalid payload structure", async () => {
      process.env.WHATSAPP_APP_SECRET = "my_secret";
      const body = JSON.stringify({
        object: "wrong_object",
        entry: [],
      });
      const sig = `sha256=${createHmac("sha256", "my_secret").update(body).digest("hex")}`;
      const request = new Request("http://localhost/api/webhooks/whatsapp", {
        method: "POST",
        body,
        headers: { "X-Hub-Signature-256": sig },
      });
      const response = await POST(request);
      expect(response.status).toBe(400);
      const json = await response.json();
      expect(json.error.code).toBe("VALIDATION_FAILED");
      expect(mockCreateLead).not.toHaveBeenCalled();
    });
  });

  describe("POST successful ingestion", () => {
    it("creates lead with correct source_metadata when valid payload arrives", async () => {
      process.env.WHATSAPP_APP_SECRET = "my_secret";
      const body = JSON.stringify({
        object: "whatsapp_business_account",
        entry: [
          {
            id: "WABA-123",
            changes: [
              {
                field: "messages",
                value: {
                  metadata: { phone_number_id: "pn123", display_phone_number: "15559876543" },
                  contacts: [{ wa_id: "15551234567", profile: { name: "Jane" } }],
                  messages: [
                    { from: "15551234567", id: "wamid.abc", timestamp: "1709308800", type: "text", text: { body: "Hello" } },
                  ],
                },
              },
            ],
          },
        ],
      });
      const sig = `sha256=${createHmac("sha256", "my_secret").update(body).digest("hex")}`;
      const request = new Request("http://localhost/api/webhooks/whatsapp", {
        method: "POST",
        body,
        headers: { "X-Hub-Signature-256": sig },
      });
      const response = await POST(request);
      expect(response.status).toBe(200);
      expect(mockCreateLead).toHaveBeenCalledTimes(1);
      expect(mockCreateLead).toHaveBeenCalledWith(
        expect.objectContaining({
          sourceChannel: "whatsapp",
          sourceExternalId: "15551234567",
          sourceMetadata: expect.objectContaining({
            message_id: "wamid.abc",
            timestamp: "1709308800",
            contact_name: "Jane",
            phone_number_id: "pn123",
            display_phone_number: "15559876543",
          }),
          initialInteractionOccurredAt: new Date(1709308800 * 1000),
        })
      );
    });
  });

  describe("POST ingestion failure", () => {
    it("returns 500 and records failure when createLead throws (NFR11)", async () => {
      mockCreateLead.mockRejectedValueOnce(new Error("Database connection refused"));
      process.env.WHATSAPP_APP_SECRET = "my_secret";
      const body = JSON.stringify({
        object: "whatsapp_business_account",
        entry: [
          {
            id: "123",
            changes: [
              {
                field: "messages",
                value: {
                  messages: [{ from: "15551234567", id: "wamid.1", timestamp: "123" }],
                },
              },
            ],
          },
        ],
      });
      const sig = `sha256=${createHmac("sha256", "my_secret").update(body).digest("hex")}`;
      const request = new Request("http://localhost/api/webhooks/whatsapp", {
        method: "POST",
        body,
        headers: { "X-Hub-Signature-256": sig },
      });
      const response = await POST(request);
      expect(response.status).toBe(500);
      const json = await response.json();
      expect(json.error.code).toBe("INGESTION_FAILED");
      expect(json.error.message).toBe("Failed to create lead");
      expect(json.error.details).toContain("Database connection refused");
      expect(mockRecordIngestionFailure).toHaveBeenCalledWith(
        expect.objectContaining({
          errorCode: "INGESTION_FAILED",
          message: "Failed to create lead",
          details: ["Database connection refused"],
        })
      );
    });
  });
});
