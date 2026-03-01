"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

interface RiskPulse {
  id: string;
  lead_id: string;
  reason: string;
  detected_at: string;
  status: string;
  lead?: {
    id: string;
    source_channel: string;
    source_external_id: string;
    source_metadata?: Record<string, unknown>;
    priority: string;
    lifecycle_state?: string;
  };
}

export default function AtRiskPage() {
  const [pulses, setPulses] = useState<RiskPulse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/risk-pulses");
      const json = await res.json();
      if (!res.ok || json.error) {
        setError(json.error?.message ?? "Failed to load");
        return;
      }
      setPulses(json.data ?? []);
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return (
      <div style={{ padding: "1.5rem", maxWidth: 960, margin: "0 auto" }}>
        <p>Loading at-risk leads…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: "1.5rem", maxWidth: 960, margin: "0 auto" }}>
        <p style={{ color: "crimson" }}>Error: {error}</p>
        <button
          type="button"
          onClick={loadData}
          style={{
            marginTop: "0.5rem",
            padding: "0.4rem 0.75rem",
            fontSize: "0.875rem",
            border: "1px solid rgba(128,128,128,0.4)",
            borderRadius: 6,
            background: "var(--background)",
            color: "var(--foreground)",
            cursor: "pointer",
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: "1.5rem", maxWidth: 960, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1rem", flexWrap: "wrap" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 600, margin: 0 }}>
          At-Risk Leads
        </h1>
        <button
          type="button"
          onClick={loadData}
          style={{
            padding: "0.4rem 0.75rem",
            fontSize: "0.875rem",
            border: "1px solid rgba(128,128,128,0.4)",
            borderRadius: 6,
            background: "var(--background)",
            color: "var(--foreground)",
            cursor: "pointer",
          }}
        >
          Refresh
        </button>
      </div>
      <p style={{ color: "var(--foreground)", opacity: 0.8, marginBottom: "1.5rem" }}>
        Leads flagged for recovery — open to generate a recovery draft with Mistral AI
      </p>

      {pulses.length === 0 ? (
        <div
          style={{
            padding: "2rem",
            border: "1px solid rgba(128,128,128,0.3)",
            borderRadius: 8,
            textAlign: "center",
          }}
        >
          <p style={{ margin: 0, opacity: 0.9 }}>No at-risk leads right now.</p>
          <p style={{ margin: "0.5rem 0 0", fontSize: "0.875rem", opacity: 0.7 }}>
            At-risk leads appear when they exceed the inactivity threshold.
          </p>
          <Link
            href="/triage"
            style={{
              display: "inline-block",
              marginTop: "1rem",
              color: "var(--foreground)",
              textDecoration: "underline",
              fontSize: "0.875rem",
            }}
          >
            View triage queue →
          </Link>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {pulses.map((pulse) => {
            const lead = pulse.lead;
            const contactName =
              lead?.source_metadata && typeof lead.source_metadata === "object" && "contact_name" in lead.source_metadata
                ? String((lead.source_metadata as { contact_name?: string }).contact_name || "").trim() || null
                : null;
            const displayName = contactName || lead?.source_external_id || "Unknown";

            return (
              <Link
                key={pulse.id}
                href={`/lead/${pulse.lead_id}`}
                style={{
                  display: "block",
                  padding: "1rem",
                  border: "1px solid rgba(200, 100, 0, 0.4)",
                  borderRadius: 8,
                  textDecoration: "none",
                  color: "var(--foreground)",
                  backgroundColor: "rgba(200, 100, 0, 0.08)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                  <span
                    role="status"
                    aria-label="At-risk"
                    style={{
                      fontSize: "0.7rem",
                      fontWeight: 600,
                      padding: "0.15rem 0.4rem",
                      borderRadius: 4,
                      backgroundColor: "rgba(200, 100, 0, 0.25)",
                    }}
                  >
                    ⚠ At-Risk
                  </span>
                  {lead?.priority && (
                    <span
                      style={{
                        fontSize: "0.7rem",
                        fontWeight: 600,
                        padding: "0.15rem 0.4rem",
                        borderRadius: 4,
                        textTransform: "uppercase",
                        backgroundColor:
                          lead.priority === "vip"
                            ? "rgba(180, 100, 20, 0.25)"
                            : lead.priority === "high"
                              ? "rgba(80, 120, 200, 0.2)"
                              : "rgba(128, 128, 128, 0.2)",
                      }}
                    >
                      {lead.priority}
                    </span>
                  )}
                  <span style={{ fontWeight: 600 }}>{displayName}</span>
                  <span style={{ fontSize: "0.8rem", opacity: 0.8 }}>· {pulse.reason}</span>
                  <span style={{ fontSize: "0.75rem", opacity: 0.7, marginLeft: "auto" }}>
                    Detected {new Date(pulse.detected_at).toLocaleString()}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
