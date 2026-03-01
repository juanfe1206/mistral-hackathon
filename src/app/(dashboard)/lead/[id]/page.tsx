"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

interface Lead {
  id: string;
  source_channel: string;
  source_external_id: string;
  source_metadata: Record<string, unknown>;
  priority: "vip" | "high" | "low";
  created_at: string;
}

interface Interaction {
  id: string;
  event_type: string;
  occurred_at: string;
  payload: Record<string, unknown>;
}

export default function LeadDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [lead, setLead] = useState<Lead | null>(null);
  const [timeline, setTimeline] = useState<Interaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    if (!id) return;
    try {
      const [leadJson, timelineJson] = await Promise.all([
        fetch(`/api/leads/${id}`).then((r) => r.json()),
        fetch(`/api/leads/${id}/timeline`).then((r) => r.json()),
      ]);
      if (leadJson.data) {
        setLead(leadJson.data);
        setError(null);
      } else if (leadJson.error) {
        setError(leadJson.error.message);
      }
      if (timelineJson.data) setTimeline(timelineJson.data);
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    loadData();
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
      <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1rem", flexWrap: "wrap" }}>
        <Link
          href="/triage"
          style={{
            color: "var(--foreground)",
            textDecoration: "none",
          }}
        >
          ← Back to triage
        </Link>
        <button
          type="button"
          onClick={() => {
            setRefreshing(true);
            loadData();
          }}
          disabled={refreshing}
          style={{
            padding: "0.4rem 0.75rem",
            fontSize: "0.875rem",
            border: "1px solid rgba(128,128,128,0.4)",
            borderRadius: 6,
            background: "var(--background)",
            color: "var(--foreground)",
            cursor: refreshing ? "not-allowed" : "pointer",
          }}
        >
          {refreshing ? "Refreshing…" : "Refresh"}
        </button>
      </div>
      <h1 style={{ fontSize: "1.5rem", fontWeight: 600, marginBottom: "1rem" }}>
        Lead: {lead.source_external_id}
        <span
          style={{
            marginLeft: "0.5rem",
            fontSize: "0.75rem",
            fontWeight: 600,
            padding: "0.2rem 0.5rem",
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
      <div
        style={{
          padding: "1rem",
          border: "1px solid rgba(128,128,128,0.3)",
          borderRadius: 8,
        }}
      >
        <h2 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "0.75rem" }}>
          Interaction timeline
        </h2>
        {timeline.length === 0 ? (
          <p style={{ margin: 0, fontSize: "0.875rem", opacity: 0.7 }}>
            No interactions yet.
          </p>
        ) : (
          <ul style={{ margin: 0, paddingLeft: "1.25rem", fontSize: "0.875rem" }}>
            {timeline.map((i) => (
              <li key={i.id} style={{ marginBottom: "0.5rem" }}>
                <strong>{i.event_type}</strong> · {new Date(i.occurred_at).toLocaleString()}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
