"use client";

export type SlaStatus = "safe" | "warning" | "breach-risk" | "breached" | "recovering" | "n_a";

export interface SlaStatusData {
  status: SlaStatus;
  minutes_to_breach: number | null;
  minutes_over: number | null;
  first_response_at: string | null;
}

export interface QueueSlaSummary {
  count_safe: number;
  count_warning: number;
  count_breach_risk: number;
  count_breached: number;
  count_recovering: number;
  count_n_a: number;
  total_tracked: number;
  sla_safe_percent: number | null;
}

interface LeadSlaIndicatorProps {
  slaStatus: SlaStatusData | null;
  compact?: boolean;
  unavailable?: boolean;
  onRetry?: () => void;
}

interface QueueSlaIndicatorProps {
  summary: QueueSlaSummary | null;
  unavailable?: boolean;
  onRetry?: () => void;
}

function getStatusConfig(status: SlaStatus) {
  switch (status) {
    case "safe":
      return { icon: "+", label: "SLA safe", bgColor: "rgba(0, 128, 0, 0.15)", ariaLabel: "SLA safe" };
    case "warning":
      return { icon: "!", label: "Approaching breach", bgColor: "rgba(200, 160, 0, 0.2)", ariaLabel: "SLA warning" };
    case "breach-risk":
      return { icon: "!", label: "Breach risk", bgColor: "rgba(220, 100, 0, 0.25)", ariaLabel: "SLA at breach risk" };
    case "breached":
      return { icon: "X", label: "Breached", bgColor: "rgba(220, 50, 50, 0.2)", ariaLabel: "SLA breached" };
    case "recovering":
      return { icon: "~", label: "Recovered late", bgColor: "rgba(128, 128, 128, 0.2)", ariaLabel: "Responded after SLA breach" };
    default:
      return { icon: "-", label: "N/A", bgColor: "rgba(128, 128, 128, 0.12)", ariaLabel: "SLA not applicable" };
  }
}

function getActionableLabel(sla: SlaStatusData): string {
  if (sla.status === "n_a") return "-";
  if (sla.status === "safe" && sla.minutes_to_breach != null) return `${sla.minutes_to_breach}m to breach`;
  if (sla.status === "safe" && sla.first_response_at) return "Responded in time";
  if (sla.status === "warning" && sla.minutes_to_breach != null) return `${sla.minutes_to_breach}m to breach`;
  if (sla.status === "breach-risk" && sla.minutes_to_breach != null) return `${sla.minutes_to_breach}m to breach`;
  if (sla.status === "breached" && sla.minutes_over != null) return `Breached ${sla.minutes_over}m ago`;
  if (sla.status === "recovering" && sla.minutes_over != null) return `Responded ${sla.minutes_over}m late`;
  return getStatusConfig(sla.status).label;
}

export function LeadSlaIndicator({ slaStatus, compact = false, unavailable = false, onRetry }: LeadSlaIndicatorProps) {
  if (unavailable) {
    return (
      <span role="status" aria-label="SLA status temporarily unavailable" style={{ fontSize: compact ? "0.65rem" : "0.75rem", padding: compact ? "0.1rem 0.35rem" : "0.2rem 0.5rem", borderRadius: 4, backgroundColor: "rgba(128, 128, 128, 0.1)", display: "inline-flex", alignItems: "center", gap: "0.25rem" }}>
        SLA -
        {onRetry && !compact && (
          <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); onRetry(); }} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onRetry(); } }} aria-label="Retry loading SLA" style={{ padding: "0.1rem 0.35rem", fontSize: "0.7rem", border: "1px solid rgba(128,128,128,0.4)", borderRadius: 4, background: "var(--background)", color: "var(--foreground)", cursor: "pointer" }}>
            Retry
          </button>
        )}
      </span>
    );
  }
  if (!slaStatus) return null;
  const cfg = getStatusConfig(slaStatus.status);
  const label = getActionableLabel(slaStatus);
  return (
    <span role="status" aria-label={cfg.ariaLabel + (label ? ": " + label : "")} style={{ fontSize: compact ? "0.65rem" : "0.75rem", fontWeight: 600, padding: compact ? "0.1rem 0.35rem" : "0.2rem 0.5rem", borderRadius: 4, backgroundColor: cfg.bgColor, display: "inline-flex", alignItems: "center", gap: "0.25rem" }}>
      <span aria-hidden="true">{cfg.icon}</span>
      {label}
    </span>
  );
}

export function QueueSlaIndicator({ summary, unavailable = false, onRetry }: QueueSlaIndicatorProps) {
  if (unavailable) {
    return (
      <div role="alert" aria-live="polite" style={{ padding: "0.4rem 0.75rem", fontSize: "0.875rem", border: "1px solid rgba(200, 100, 0, 0.4)", borderRadius: 6, backgroundColor: "rgba(200, 100, 0, 0.08)" }}>
        <span aria-hidden="true">!</span> SLA temporarily unavailable
        {onRetry && (
          <button type="button" onClick={onRetry} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onRetry(); } }} aria-label="Retry loading SLA" style={{ marginLeft: "0.5rem", padding: "0.2rem 0.5rem", fontSize: "0.75rem", border: "1px solid rgba(128,128,128,0.4)", borderRadius: 4, background: "var(--background)", color: "var(--foreground)", cursor: "pointer" }}>
            Retry
          </button>
        )}
      </div>
    );
  }
  if (!summary) return null;
  const { count_breached, count_breach_risk, count_warning, sla_safe_percent, total_tracked } = summary;
  const atRisk = count_breached + count_breach_risk + count_warning;
  let label: string;
  let icon: string;
  let bgColor: string;
  let ariaLabel: string;
  if (total_tracked === 0) {
    label = "No SLA leads";
    icon = "-";
    bgColor = "rgba(128, 128, 128, 0.12)";
    ariaLabel = "No VIP or high-priority leads to track";
  } else if (atRisk === 0) {
    label = sla_safe_percent != null ? "SLA Safe " + sla_safe_percent + "%" : "SLA Safe";
    icon = "+";
    bgColor = "rgba(0, 128, 0, 0.15)";
    ariaLabel = label;
  } else {
    label = atRisk + " at risk";
    icon = "!";
    bgColor = "rgba(200, 100, 0, 0.2)";
    ariaLabel = atRisk + " leads at SLA risk";
  }
  return (
    <span role="status" aria-label={ariaLabel} style={{ fontSize: "0.875rem", fontWeight: 600, padding: "0.25rem 0.6rem", borderRadius: 6, backgroundColor: bgColor, display: "inline-flex", alignItems: "center", gap: "0.35rem" }}>
      <span aria-hidden="true">{icon}</span>
      {label}
    </span>
  );
}
