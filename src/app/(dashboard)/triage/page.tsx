"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  QueueSlaIndicator,
  LeadSlaIndicator,
  type SlaStatusData,
  type QueueSlaSummary,
} from "@/components/SLASafetyIndicator";

interface Lead {
  id: string;
  source_channel: string;
  source_external_id: string;
  priority: "vip" | "high" | "low";
  lifecycle_state?: "default" | "at_risk" | "recovered" | "lost";
  reason_tags: string[];
  created_at: string;
  sla_status?: SlaStatusData | null;
}

interface IngestionFailure {
  id: string;
  error_code: string;
  message: string;
  details?: unknown;
  created_at: string;
}

export default function TriagePage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [failures, setFailures] = useState<IngestionFailure[]>([]);
  const [slaSummary, setSlaSummary] = useState<QueueSlaSummary | null>(null);
  const [slaUnavailable, setSlaUnavailable] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    setSlaUnavailable(false);
    try {
      const [leadsRes, failuresRes, slaRes] = await Promise.all([
        fetch("/api/leads"),
        fetch("/api/ingestion-failures?limit=10"),
        fetch("/api/sla"),
      ]);
      const [leadsJson, failuresJson, slaJson] = await Promise.all([
        leadsRes.json(),
        failuresRes.json(),
        slaRes.json(),
      ]);
      if (!leadsRes.ok || leadsJson.error) {
        setError(leadsJson.error?.message ?? "Request failed");
        return;
      }
      setLeads(leadsJson.data ?? []);
      if (failuresRes.ok && failuresJson.data?.length) {
        setFailures(failuresJson.data);
      }
      if (slaRes.ok && slaJson.data?.queue_summary) {
        setSlaSummary(slaJson.data.queue_summary);
      } else {
        setSlaUnavailable(true);
      }
    } catch (err) {
      setError(String(err));
      setSlaUnavailable(true);
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
        <p>Loading leads…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: "1.5rem", maxWidth: 960, margin: "0 auto" }}>
        <p style={{ color: "crimson" }}>Error loading leads: {error}</p>
      </div>
    );
  }

  return (
    <div style={{ padding: "1.5rem", maxWidth: 960, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1rem", flexWrap: "wrap" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 600, margin: 0 }}>
          Triage Queue
        </h1>
        <QueueSlaIndicator
          summary={slaSummary}
          unavailable={slaUnavailable}
          onRetry={loadData}
        />
        <button
          type="button"
          onClick={loadData}
          disabled={loading}
          style={{
            padding: "0.4rem 0.75rem",
            fontSize: "0.875rem",
            border: "1px solid rgba(128,128,128,0.4)",
            borderRadius: 6,
            background: "var(--background)",
            color: "var(--foreground)",
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "Refreshing…" : "Refresh"}
        </button>
      </div>
      <p style={{ color: "var(--foreground)", opacity: 0.8, marginBottom: "1rem" }}>
        Inbound leads from WhatsApp
      </p>
      {leads.length > 0 && leads.every((l) => !l.reason_tags?.length) && (
        <div
          style={{
            padding: "0.75rem 1rem",
            marginBottom: "1rem",
            background: "rgba(90, 90, 140, 0.15)",
            border: "1px solid rgba(90, 90, 140, 0.4)",
            borderRadius: 8,
            fontSize: "0.85rem",
          }}
        >
          <strong>Mistral API demo:</strong> Leads are unclassified. Open any lead → click{" "}
          <strong>Reclassify</strong> to classify with Mistral AI. For at-risk leads, click{" "}
          <strong>Generate draft</strong> to create a recovery message.
        </div>
      )}
      {failures.length > 0 && (
        <div
          style={{
            padding: "1rem",
            marginBottom: "1rem",
            border: "1px solid rgba(220, 50, 50, 0.5)",
            borderRadius: 8,
            backgroundColor: "rgba(220, 50, 50, 0.08)",
          }}
        >
          <h2 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "0.5rem", color: "crimson" }}>
            Recent ingestion failures ({failures.length})
          </h2>
          <ul style={{ margin: 0, paddingLeft: "1.25rem", fontSize: "0.875rem" }}>
            {failures.slice(0, 5).map((f) => (
              <li key={f.id}>
                [{new Date(f.created_at).toLocaleString()}] {f.error_code}: {f.message}
              </li>
            ))}
          </ul>
        </div>
      )}
      {leads.length === 0 ? (
        <p
          style={{
            padding: "2rem",
            border: "1px solid rgba(128,128,128,0.3)",
            borderRadius: 8,
          }}
        >
          No leads yet. Ingest leads via the WhatsApp webhook.
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {leads.map((lead) => (
            <Link
              key={lead.id}
              href={`/lead/${lead.id}`}
              style={{
                display: "block",
                padding: "1rem",
                border: "1px solid rgba(128,128,128,0.3)",
                borderRadius: 8,
                textDecoration: "none",
                color: "var(--foreground)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                {lead.lifecycle_state === "at_risk" && (
                  <span
                    role="status"
                    aria-label="At-risk lead"
                    style={{
                      fontSize: "0.7rem",
                      fontWeight: 600,
                      padding: "0.15rem 0.4rem",
                      borderRadius: 4,
                      backgroundColor: "rgba(200, 100, 0, 0.2)",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.25rem",
                    }}
                  >
                    <span aria-hidden="true">⚠</span>
                    At-Risk
                  </span>
                )}
                {lead.lifecycle_state === "recovered" && (
                  <span
                    role="status"
                    aria-label="Recovered lead"
                    style={{
                      fontSize: "0.7rem",
                      fontWeight: 600,
                      padding: "0.15rem 0.4rem",
                      borderRadius: 4,
                      backgroundColor: "rgba(0, 128, 0, 0.15)",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.25rem",
                    }}
                  >
                    <span aria-hidden="true">✓</span>
                    Recovered
                  </span>
                )}
                {lead.lifecycle_state === "lost" && (
                  <span
                    role="status"
                    aria-label="Lost lead"
                    style={{
                      fontSize: "0.7rem",
                      fontWeight: 600,
                      padding: "0.15rem 0.4rem",
                      borderRadius: 4,
                      backgroundColor: "rgba(128, 128, 128, 0.2)",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.25rem",
                    }}
                  >
                    Lost
                  </span>
                )}
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
                <span style={{ fontWeight: 600 }}>
                  {lead.source_external_id} · {lead.source_channel}
                </span>
                {lead.sla_status && (
                  <LeadSlaIndicator slaStatus={lead.sla_status} compact />
                )}
                {(lead.reason_tags ?? []).slice(0, 2).map((tag) => (
                  <span
                    key={tag}
                    style={{
                      fontSize: "0.65rem",
                      padding: "0.1rem 0.35rem",
                      borderRadius: 4,
                      backgroundColor: "rgba(128, 128, 128, 0.15)",
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <div style={{ fontSize: "0.875rem", opacity: 0.7 }}>
                {new Date(lead.created_at).toLocaleString()}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
