"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

interface Lead {
  id: string;
  source_channel: string;
  source_external_id: string;
  created_at: string;
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [leadsRes, failuresRes] = await Promise.all([
          fetch("/api/leads"),
          fetch("/api/ingestion-failures?limit=10"),
        ]);
        const [leadsJson, failuresJson] = await Promise.all([
          leadsRes.json(),
          failuresRes.json(),
        ]);
        if (!leadsRes.ok || leadsJson.error) {
          setError(leadsJson.error?.message ?? "Request failed");
          return;
        }
        setLeads(leadsJson.data ?? []);
        if (failuresRes.ok && failuresJson.data?.length) {
          setFailures(failuresJson.data);
        }
      } catch (err) {
        setError(String(err));
      } finally {
        setLoading(false);
      }
    };
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
      <h1 style={{ fontSize: "1.5rem", fontWeight: 600, marginBottom: "1rem" }}>
        Triage Queue
      </h1>
      <p style={{ color: "var(--foreground)", opacity: 0.8, marginBottom: "1rem" }}>
        Inbound leads from WhatsApp
      </p>
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
              <div style={{ fontWeight: 600 }}>
                {lead.source_external_id} · {lead.source_channel}
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
