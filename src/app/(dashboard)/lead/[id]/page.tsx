"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { LeadSlaIndicator, type SlaStatusData } from "@/components/SLASafetyIndicator";

type Priority = "vip" | "high" | "low";

interface OverrideEntry {
  previous_priority: Priority;
  new_priority: Priority;
  reason: string | null;
  created_at: string;
}

interface RiskPulse {
  id: string;
  reason: string;
  detected_at: string;
  status: string;
}

interface Lead {
  id: string;
  source_channel: string;
  source_external_id: string;
  source_metadata: Record<string, unknown>;
  priority: Priority;
  lifecycle_state?: "default" | "at_risk" | "recovered" | "lost";
  reason_tags: string[];
  override_history?: OverrideEntry[];
  risk_pulses?: RiskPulse[];
  created_at: string;
  sla_status?: SlaStatusData | null;
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
  const [reclassifyError, setReclassifyError] = useState<string | null>(null);
  const [reclassifying, setReclassifying] = useState(false);
  const [overrideError, setOverrideError] = useState<string | null>(null);
  const [overriding, setOverriding] = useState(false);
  const [overrideOpen, setOverrideOpen] = useState(false);
  const [overrideReason, setOverrideReason] = useState("");
  const [markingLifecycle, setMarkingLifecycle] = useState(false);
  const [lifecycleError, setLifecycleError] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [generating, setGenerating] = useState(false);
  const [replyError, setReplyError] = useState<string | null>(null);
  const [replyErrorSource, setReplyErrorSource] = useState<"generate" | "approve" | "send" | null>(
    null
  );
  const [approved, setApproved] = useState(false);
  const [sending, setSending] = useState(false);

  const loadData = async () => {
    if (!id) return;
    try {
      const [leadJson, timelineJson] = await Promise.all([
        fetch(`/api/leads/${id}`).then((r) => r.json()),
        fetch(`/api/leads/${id}/timeline`).then((r) => r.json()),
      ]);
      setReclassifyError(null);
      setOverrideError(null);
      setLifecycleError(null);
      setReplyError(null);
      setReplyErrorSource(null);
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
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps -- loadData recreated each render; id is the trigger

  useEffect(() => {
    setDraft("");
    setApproved(false);
    setReplyError(null);
    setReplyErrorSource(null);
  }, [id]);

  useEffect(() => {
    if (!overrideOpen) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOverrideOpen(false);
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [overrideOpen]);

  const handleReclassify = async () => {
    if (!id) return;
    setReclassifying(true);
    setReclassifyError(null);
    try {
      const res = await fetch(`/api/leads/${id}/reclassify`, { method: "POST" });
      const json = await res.json();
      if (res.ok && json.data) {
        loadData();
      } else {
        setReclassifyError(json.error?.message ?? "Classification failed");
      }
    } catch (err) {
      setReclassifyError(String(err));
    } finally {
      setReclassifying(false);
    }
  };

  const handleOverride = async (newPriority: Priority) => {
    if (!id) return;
    setOverriding(true);
    setOverrideError(null);
    setOverrideOpen(false);
    try {
      const res = await fetch(`/api/leads/${id}/override-priority`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priority: newPriority, reason: overrideReason || undefined }),
      });
      const json = await res.json();
      if (res.ok && json.data) {
        setLead(json.data);
        setOverrideReason("");
        loadData();
      } else {
        setOverrideError(json.error?.message ?? "Override failed");
      }
    } catch (err) {
      setOverrideError(String(err));
    } finally {
      setOverriding(false);
    }
  };

  const needsApproval = lead?.priority === "vip" || lead?.priority === "high";

  const handleGenerateDraft = async () => {
    if (!id) return;
    setGenerating(true);
    setReplyError(null);
    setReplyErrorSource(null);
    try {
      const res = await fetch("/api/replies/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lead_id: id }),
      });
      const json = await res.json();
      if (res.ok && json.data?.draft) {
        setDraft(json.data.draft);
        setApproved(false);
      } else {
        setReplyError(json.error?.message ?? "Draft generation failed");
        setReplyErrorSource("generate");
      }
    } catch (err) {
      setReplyError(String(err));
      setReplyErrorSource("generate");
    } finally {
      setGenerating(false);
    }
  };

  const handleApprove = async () => {
    if (!id || !draft.trim()) return;
    setSending(true);
    setReplyError(null);
    setReplyErrorSource(null);
    try {
      const res = await fetch(`/api/leads/${id}/approve-reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ draft_text: draft, action: "approve" }),
      });
      const json = await res.json();
      if (res.ok) {
        setApproved(true);
      } else {
        setReplyError(json.error?.message ?? "Approval failed");
        setReplyErrorSource("approve");
      }
    } catch (err) {
      setReplyError(String(err));
      setReplyErrorSource("approve");
    } finally {
      setSending(false);
    }
  };

  const handleSend = async () => {
    if (!id || !draft.trim()) return;
    if (needsApproval && !approved) return;
    setSending(true);
    setReplyError(null);
    setReplyErrorSource(null);
    try {
      const res = await fetch(`/api/leads/${id}/approve-reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ draft_text: draft, action: "send" }),
      });
      const json = await res.json();
      if (res.ok) {
        setDraft("");
        setApproved(false);
        loadData();
      } else {
        setReplyError(json.error?.message ?? "Send failed");
        setReplyErrorSource("send");
      }
    } catch (err) {
      setReplyError(String(err));
      setReplyErrorSource("send");
    } finally {
      setSending(false);
    }
  };

  const handleMarkLifecycle = async (lifecycleState: "recovered" | "lost") => {
    if (!id) return;
    setMarkingLifecycle(true);
    setLifecycleError(null);
    try {
      const res = await fetch(`/api/leads/${id}/mark-lifecycle`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lifecycle_state: lifecycleState }),
      });
      const json = await res.json();
      if (res.ok && json.data) {
        setLead(json.data);
        loadData();
      } else {
        setLifecycleError(json.error?.message ?? "Failed to update lifecycle");
      }
    } catch (err) {
      setLifecycleError(String(err));
    } finally {
      setMarkingLifecycle(false);
    }
  };

  const PRIORITIES: Priority[] = ["vip", "high", "low"];

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
        <button
          type="button"
          onClick={handleReclassify}
          disabled={reclassifying}
          style={{
            padding: "0.4rem 0.75rem",
            fontSize: "0.875rem",
            border: "1px solid rgba(128,128,128,0.4)",
            borderRadius: 6,
            background: "var(--background)",
            color: "var(--foreground)",
            cursor: reclassifying ? "not-allowed" : "pointer",
          }}
        >
          {reclassifying ? "Classifying…" : "Reclassify"}
        </button>
        <div style={{ position: "relative" }}>
          <button
            type="button"
            onClick={() => setOverrideOpen(!overrideOpen)}
            disabled={overriding}
            aria-haspopup="listbox"
            aria-expanded={overrideOpen}
            aria-label="Override priority"
            style={{
              padding: "0.4rem 0.75rem",
              fontSize: "0.875rem",
              border: "1px solid rgba(128,128,128,0.4)",
              borderRadius: 6,
              background: "var(--background)",
              color: "var(--foreground)",
              cursor: overriding ? "not-allowed" : "pointer",
            }}
          >
            {overriding ? "Overriding…" : "Override priority"}
          </button>
          {overrideOpen && (
            <div
              role="listbox"
              aria-label="Select priority"
              style={{
                position: "absolute",
                top: "100%",
                left: 0,
                marginTop: 4,
                padding: "0.5rem",
                border: "1px solid rgba(128,128,128,0.4)",
                borderRadius: 6,
                background: "var(--background)",
                boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                zIndex: 10,
                minWidth: 140,
              }}
            >
              <input
                type="text"
                placeholder="Reason (optional)"
                value={overrideReason}
                onChange={(e) => setOverrideReason(e.target.value)}
                aria-label="Override reason"
                onKeyDown={(e) => e.stopPropagation()}
                style={{
                  width: "100%",
                  padding: "0.35rem 0.5rem",
                  marginBottom: "0.5rem",
                  fontSize: "0.875rem",
                  border: "1px solid rgba(128,128,128,0.4)",
                  borderRadius: 4,
                  background: "var(--background)",
                }}
              />
              {PRIORITIES.filter((p) => p !== lead.priority).map((p) => (
                <button
                  key={p}
                  type="button"
                  role="option"
                  aria-selected={false}
                  onClick={() => handleOverride(p)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handleOverride(p);
                    }
                  }}
                  style={{
                    display: "block",
                    width: "100%",
                    padding: "0.35rem 0.5rem",
                    marginBottom: "0.25rem",
                    fontSize: "0.875rem",
                    border: "none",
                    borderRadius: 4,
                    background: "transparent",
                    color: "var(--foreground)",
                    cursor: "pointer",
                    textAlign: "left",
                  }}
                >
                  Set to {p}
                </button>
              ))}
            </div>
          )}
        </div>
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
        <span style={{ marginLeft: "0.5rem" }}>
          <LeadSlaIndicator
            slaStatus={lead.sla_status ?? null}
            unavailable={!lead.sla_status}
            onRetry={loadData}
          />
        </span>
        {lead.lifecycle_state && lead.lifecycle_state !== "default" && (
          <span
            style={{
              marginLeft: "0.5rem",
              fontSize: "0.75rem",
              fontWeight: 600,
              padding: "0.2rem 0.5rem",
              borderRadius: 4,
              textTransform: "uppercase",
              backgroundColor:
                lead.lifecycle_state === "at_risk"
                  ? "rgba(200, 100, 0, 0.2)"
                  : lead.lifecycle_state === "recovered"
                    ? "rgba(0, 128, 0, 0.15)"
                    : "rgba(128, 128, 128, 0.2)",
            }}
          >
            {lead.lifecycle_state.replace("_", "-")}
          </span>
        )}
      </h1>
      {lead.lifecycle_state === "at_risk" && (
        <div
          role="alert"
          aria-live="polite"
          style={{
            padding: "1rem",
            marginBottom: "1rem",
            border: "1px solid rgba(200, 100, 0, 0.5)",
            borderRadius: 8,
            backgroundColor: "rgba(200, 100, 0, 0.08)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
            <span aria-hidden="true">⚠</span>
            <strong>At-Risk Pulse</strong>
          </div>
          {(lead.risk_pulses ?? [])[0] && (
            <p style={{ margin: "0 0 0.75rem 0", fontSize: "0.875rem" }}>
              {(lead.risk_pulses ?? [])[0].reason} · Detected{" "}
              {new Date((lead.risk_pulses ?? [])[0].detected_at).toLocaleString()}
            </p>
          )}
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={() => handleMarkLifecycle("recovered")}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  handleMarkLifecycle("recovered");
                }
              }}
              disabled={markingLifecycle}
              aria-label="Mark as Recovered"
              style={{
                padding: "0.4rem 0.75rem",
                fontSize: "0.875rem",
                border: "1px solid rgba(128,128,128,0.4)",
                borderRadius: 6,
                background: "var(--background)",
                color: "var(--foreground)",
                cursor: markingLifecycle ? "not-allowed" : "pointer",
              }}
            >
              {markingLifecycle ? "Updating…" : "Mark Recovered"}
            </button>
            <button
              type="button"
              onClick={() => handleMarkLifecycle("lost")}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  handleMarkLifecycle("lost");
                }
              }}
              disabled={markingLifecycle}
              aria-label="Mark as Lost"
              style={{
                padding: "0.4rem 0.75rem",
                fontSize: "0.875rem",
                border: "1px solid rgba(128,128,128,0.4)",
                borderRadius: 6,
                background: "var(--background)",
                color: "var(--foreground)",
                cursor: markingLifecycle ? "not-allowed" : "pointer",
              }}
            >
              {markingLifecycle ? "Updating…" : "Mark Lost"}
            </button>
          </div>
          <div style={{ marginTop: "1rem", paddingTop: "1rem", borderTop: "1px solid rgba(200,100,0,0.3)" }}>
            <h3 style={{ fontSize: "0.95rem", fontWeight: 600, marginBottom: "0.5rem" }}>Concierge Reply</h3>
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Generate or edit your recovery message…"
              aria-label="Reply draft"
              rows={4}
              style={{
                width: "100%",
                padding: "0.5rem",
                fontSize: "0.875rem",
                border: "1px solid rgba(128,128,128,0.4)",
                borderRadius: 6,
                background: "var(--background)",
                color: "var(--foreground)",
                resize: "vertical",
              }}
            />
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginTop: "0.5rem" }}>
              <button
                type="button"
                onClick={handleGenerateDraft}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleGenerateDraft();
                  }
                }}
                disabled={generating}
                aria-label="Generate recovery draft"
                style={{
                  padding: "0.4rem 0.75rem",
                  fontSize: "0.875rem",
                  border: "1px solid rgba(128,128,128,0.4)",
                  borderRadius: 6,
                  background: "var(--background)",
                  color: "var(--foreground)",
                  cursor: generating ? "not-allowed" : "pointer",
                }}
              >
                {generating ? "Generating…" : "Generate"}
              </button>
              {replyError && replyErrorSource === "generate" && (
                <button
                  type="button"
                  onClick={handleGenerateDraft}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handleGenerateDraft();
                    }
                  }}
                  disabled={generating}
                  aria-label="Retry draft generation"
                  style={{
                    padding: "0.4rem 0.75rem",
                    fontSize: "0.875rem",
                    border: "1px solid rgba(220,50,50,0.5)",
                    borderRadius: 6,
                    background: "rgba(220,50,50,0.1)",
                    color: "var(--foreground)",
                    cursor: generating ? "not-allowed" : "pointer",
                  }}
                >
                  Retry
                </button>
              )}
              {needsApproval && (
                <>
                  <button
                    type="button"
                    onClick={handleApprove}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        handleApprove();
                      }
                    }}
                    disabled={sending || !draft.trim()}
                    aria-label="Approve draft"
                    style={{
                      padding: "0.4rem 0.75rem",
                      fontSize: "0.875rem",
                      border: "1px solid rgba(128,128,128,0.4)",
                      borderRadius: 6,
                      background: "var(--background)",
                      color: "var(--foreground)",
                      cursor: sending || !draft.trim() ? "not-allowed" : "pointer",
                    }}
                  >
                    {sending ? "…" : "Approve"}
                  </button>
                  <span style={{ fontSize: "0.75rem", opacity: 0.8, alignSelf: "center" }}>
                    {approved ? "✓ Approved" : "Approval required before send"}
                  </span>
                </>
              )}
              <button
                type="button"
                onClick={handleSend}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                disabled={sending || !draft.trim() || (needsApproval && !approved)}
                aria-label="Send reply"
                style={{
                  padding: "0.4rem 0.75rem",
                  fontSize: "0.875rem",
                  border: "1px solid rgba(128,128,128,0.4)",
                  borderRadius: 6,
                  background: "var(--background)",
                  color: "var(--foreground)",
                  cursor: sending || !draft.trim() || (needsApproval && !approved) ? "not-allowed" : "pointer",
                }}
              >
                {sending ? "Sending…" : "Send"}
              </button>
            </div>
            {replyError && (
              <p style={{ margin: "0.5rem 0 0", fontSize: "0.875rem", color: "crimson" }}>
                {replyError}
              </p>
            )}
          </div>
        </div>
      )}
      {lead.lifecycle_state === "recovered" && (
        <div
          role="status"
          style={{
            padding: "0.5rem 1rem",
            marginBottom: "1rem",
            border: "1px solid rgba(0, 128, 0, 0.3)",
            borderRadius: 8,
            backgroundColor: "rgba(0, 128, 0, 0.08)",
            fontSize: "0.875rem",
          }}
        >
          ✓ Recovered
        </div>
      )}
      {lead.lifecycle_state === "lost" && (
        <div
          role="status"
          style={{
            padding: "0.5rem 1rem",
            marginBottom: "1rem",
            border: "1px solid rgba(128, 128, 128, 0.4)",
            borderRadius: 8,
            backgroundColor: "rgba(128, 128, 128, 0.08)",
            fontSize: "0.875rem",
          }}
        >
          Lost
        </div>
      )}
      {lifecycleError && (
        <div
          style={{
            padding: "1rem",
            marginBottom: "1rem",
            border: "1px solid rgba(220, 50, 50, 0.5)",
            borderRadius: 8,
            backgroundColor: "rgba(220, 50, 50, 0.08)",
          }}
        >
          <p style={{ margin: "0 0 0.5rem 0", color: "crimson" }}>Lifecycle update failed: {lifecycleError}</p>
          <button
            type="button"
            onClick={() => setLifecycleError(null)}
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
            Dismiss
          </button>
        </div>
      )}
      {(lead.override_history ?? []).length > 0 && (
        <div
          style={{
            padding: "1rem",
            border: "1px solid rgba(128,128,128,0.3)",
            borderRadius: 8,
            marginBottom: "1rem",
          }}
        >
          <h2 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "0.5rem" }}>
            Override trace
          </h2>
          <ul style={{ margin: 0, paddingLeft: "1.25rem", fontSize: "0.875rem" }}>
            {(lead.override_history ?? []).map((o, idx) => (
              <li key={idx} style={{ marginBottom: "0.35rem" }}>
                Overridden from <strong>{o.previous_priority}</strong> to{" "}
                <strong>{o.new_priority}</strong>
                {o.reason ? ` — ${o.reason}` : ""} · {new Date(o.created_at).toLocaleString()}
              </li>
            ))}
          </ul>
        </div>
      )}
      {(lead.reason_tags ?? []).length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem", marginBottom: "1rem" }}>
          {(lead.reason_tags ?? []).map((tag) => (
            <span
              key={tag}
              style={{
                fontSize: "0.75rem",
                padding: "0.2rem 0.5rem",
                borderRadius: 4,
                backgroundColor: "rgba(128, 128, 128, 0.15)",
              }}
            >
              {tag}
            </span>
          ))}
        </div>
      )}
      {overrideError && (
        <div
          style={{
            padding: "1rem",
            marginBottom: "1rem",
            border: "1px solid rgba(220, 50, 50, 0.5)",
            borderRadius: 8,
            backgroundColor: "rgba(220, 50, 50, 0.08)",
          }}
        >
          <p style={{ margin: "0 0 0.5rem 0", color: "crimson" }}>Override failed: {overrideError}</p>
          <button
            type="button"
            onClick={() => setOverrideError(null)}
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
            Dismiss
          </button>
        </div>
      )}
      {reclassifyError && (
        <div
          style={{
            padding: "1rem",
            marginBottom: "1rem",
            border: "1px solid rgba(220, 50, 50, 0.5)",
            borderRadius: 8,
            backgroundColor: "rgba(220, 50, 50, 0.08)",
          }}
        >
          <p style={{ margin: "0 0 0.5rem 0", color: "crimson" }}>Classification failed: {reclassifyError}</p>
          <button
            type="button"
            onClick={() => {
              setReclassifyError(null);
              handleReclassify();
            }}
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
            Retry classification
          </button>
        </div>
      )}
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
