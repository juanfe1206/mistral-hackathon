import { NextResponse } from "next/server";
import { createSuccessResponse } from "@/server/api/error-envelope";

/**
 * GET /api/settings
 * Returns non-sensitive config status for the settings page.
 */
export async function GET() {
  const requestId = crypto.randomUUID();
  const mistralConfigured = !!process.env.MISTRAL_API_KEY && process.env.MISTRAL_API_KEY.length > 0;
  const riskHours = process.env.RISK_INACTIVITY_HOURS ?? "24";
  const whatsappVerifySet = !!process.env.WHATSAPP_VERIFY_TOKEN;
  const whatsappSecretSet = !!process.env.WHATSAPP_APP_SECRET;

  return NextResponse.json(
    createSuccessResponse(
      {
        mistral_configured: mistralConfigured,
        risk_inactivity_hours: riskHours,
        whatsapp_webhook_verify_token_set: whatsappVerifySet,
        whatsapp_webhook_secret_set: whatsappSecretSet,
        database_configured: !!process.env.DATABASE_URL,
      },
      requestId
    )
  );
}
