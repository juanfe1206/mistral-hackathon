"use client";

import { useEffect, useState } from "react";

interface SettingsStatus {
  mistral_configured: boolean;
  risk_inactivity_hours: string;
  whatsapp_webhook_verify_token_set: boolean;
  whatsapp_webhook_secret_set: boolean;
  database_configured: boolean;
}

function StatusBadge({ ok }: { ok: boolean }) {
  return (
    <span
      role="status"
      aria-label={ok ? "Configured" : "Not configured"}
      style={{
        fontSize: "0.75rem",
        fontWeight: 600,
        padding: "0.15rem 0.5rem",
        borderRadius: 4,
        backgroundColor: ok ? "rgba(0, 128, 0, 0.15)" : "rgba(128, 128, 128, 0.2)",
        color: ok ? "inherit" : "rgba(128, 128, 128, 0.9)",
      }}
    >
      {ok ? "✓ Configured" : "Not set"}
    </span>
  );
}

export default function SettingsPage() {
  const [status, setStatus] = useState<SettingsStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((json) => {
        if (json.data) setStatus(json.data);
        else setError(json.error?.message ?? "Failed to load");
      })
      .catch((err) => setError(String(err)))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div style={{ padding: "1.5rem", maxWidth: 640, margin: "0 auto" }}>
        <p>Loading settings…</p>
      </div>
    );
  }

  if (error || !status) {
    return (
      <div style={{ padding: "1.5rem", maxWidth: 640, margin: "0 auto" }}>
        <p style={{ color: "crimson" }}>Error: {error ?? "Could not load settings"}</p>
      </div>
    );
  }

  return (
    <div style={{ padding: "1.5rem", maxWidth: 640, margin: "0 auto" }}>
      <h1 style={{ fontSize: "1.5rem", fontWeight: 600, margin: 0, marginBottom: "1rem" }}>
        Settings
      </h1>
      <p style={{ color: "var(--foreground)", opacity: 0.8, marginBottom: "1.5rem" }}>
        Configuration status for Mistral Lead Ops
      </p>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "1rem",
        }}
      >
        <div
          style={{
            padding: "1rem",
            border: "1px solid rgba(128,128,128,0.3)",
            borderRadius: 8,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.5rem" }}>
            <div>
              <strong>Mistral API</strong>
              <p style={{ margin: "0.25rem 0 0", fontSize: "0.875rem", opacity: 0.8 }}>
                Used for lead classification and recovery draft generation
              </p>
            </div>
            <StatusBadge ok={status.mistral_configured} />
          </div>
        </div>

        <div
          style={{
            padding: "1rem",
            border: "1px solid rgba(128,128,128,0.3)",
            borderRadius: 8,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.5rem" }}>
            <div>
              <strong>Database</strong>
              <p style={{ margin: "0.25rem 0 0", fontSize: "0.875rem", opacity: 0.8 }}>
                PostgreSQL connection for leads, interactions, and classifications
              </p>
            </div>
            <StatusBadge ok={status.database_configured} />
          </div>
        </div>

        <div
          style={{
            padding: "1rem",
            border: "1px solid rgba(128,128,128,0.3)",
            borderRadius: 8,
          }}
        >
          <div>
            <strong>At-risk inactivity threshold</strong>
            <p style={{ margin: "0.25rem 0 0", fontSize: "0.875rem", opacity: 0.8 }}>
              Leads without contact for this many hours are flagged at-risk
            </p>
            <p style={{ margin: "0.5rem 0 0", fontSize: "1rem", fontWeight: 600 }}>
              {status.risk_inactivity_hours} hours
            </p>
          </div>
        </div>

        <div
          style={{
            padding: "1rem",
            border: "1px solid rgba(128,128,128,0.3)",
            borderRadius: 8,
          }}
        >
          <div>
            <strong>WhatsApp Webhook</strong>
            <p style={{ margin: "0.25rem 0 0", fontSize: "0.875rem", opacity: 0.8 }}>
              For lead ingestion from WhatsApp Business API
            </p>
            <div style={{ marginTop: "0.5rem", display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
              <StatusBadge ok={status.whatsapp_webhook_verify_token_set} />
              <span style={{ fontSize: "0.8rem", opacity: 0.8 }}>Verify token</span>
              <StatusBadge ok={status.whatsapp_webhook_secret_set} />
              <span style={{ fontSize: "0.8rem", opacity: 0.8 }}>App secret</span>
            </div>
          </div>
        </div>
      </div>

      <p style={{ marginTop: "1.5rem", fontSize: "0.8rem", opacity: 0.7 }}>
        Configure via <code style={{ background: "rgba(128,128,128,0.2)", padding: "0.1rem 0.3rem", borderRadius: 4 }}>.env</code> or <code style={{ background: "rgba(128,128,128,0.2)", padding: "0.1rem 0.3rem", borderRadius: 4 }}>.env.local</code>. See <code style={{ background: "rgba(128,128,128,0.2)", padding: "0.1rem 0.3rem", borderRadius: 4 }}>.env.example</code> for reference.
      </p>
    </div>
  );
}
