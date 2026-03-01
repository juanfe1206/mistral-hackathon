"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

interface Lead {
  id: string;
  source_channel: string;
  source_external_id: string;
  source_metadata: Record<string, unknown>;
  created_at: string;
}

export default function LeadDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/leads/${id}`)
      .then((res) => res.json())
      .then((json) => {
        if (json.data) setLead(json.data);
        else if (json.error) setError(json.error.message);
      })
      .catch((err) => setError(String(err)))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div style={{ padding: "1.5rem", maxWidth: 960, margin: "0 auto" }}>
        <p>Loading lead…</p>
      </div>
    );
  }

  if (error || !lead) {
    return (
      <div style={{ padding: "1.5rem", maxWidth: 960, margin: "0 auto" }}>
        <p style={{ color: "crimson" }}>{error ?? "Lead not found."}</p>
        <Link href="/triage" style={{ color: "var(--foreground)" }}>
          ← Back to triage
        </Link>
      </div>
    );
  }

  const meta = lead.source_metadata ?? {};

  return (
    <div style={{ padding: "1.5rem", maxWidth: 640, margin: "0 auto" }}>
      <Link
        href="/triage"
        style={{
          display: "inline-block",
          marginBottom: "1rem",
          color: "var(--foreground)",
          textDecoration: "none",
        }}
      >
        ← Back to triage
      </Link>
      <h1 style={{ fontSize: "1.5rem", fontWeight: 600, marginBottom: "1rem" }}>
        Lead: {lead.source_external_id}
      </h1>
      <div
        style={{
          padding: "1rem",
          border: "1px solid rgba(128,128,128,0.3)",
          borderRadius: 8,
          marginBottom: "1rem",
        }}
      >
        <h2 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "0.5rem" }}>
          Source metadata
        </h2>
        <dl style={{ margin: 0, fontSize: "0.875rem" }}>
          <dt style={{ opacity: 0.7 }}>Channel</dt>
          <dd style={{ margin: "0 0 0.5rem 0" }}>{lead.source_channel}</dd>
          <dt style={{ opacity: 0.7 }}>External ID</dt>
          <dd style={{ margin: "0 0 0.5rem 0" }}>{lead.source_external_id}</dd>
          <dt style={{ opacity: 0.7 }}>Contact name</dt>
          <dd style={{ margin: "0 0 0.5rem 0" }}>
            {(meta.contact_name as string) ?? "—"}
          </dd>
          <dt style={{ opacity: 0.7 }}>Message ID</dt>
          <dd style={{ margin: "0 0 0.5rem 0" }}>
            {(meta.message_id as string) ?? "—"}
          </dd>
          <dt style={{ opacity: 0.7 }}>Timestamp</dt>
          <dd style={{ margin: "0 0 0.5rem 0" }}>
            {meta.timestamp
              ? new Date(Number(meta.timestamp) * 1000).toISOString()
              : "—"}
          </dd>
          <dt style={{ opacity: 0.7 }}>Created at</dt>
          <dd style={{ margin: 0 }}>{new Date(lead.created_at).toLocaleString()}</dd>
        </dl>
      </div>
    </div>
  );
}
