"use client";

import { useTheme } from "@mui/material/styles";
import Box from "@mui/material/Box";

export type SlaStatus = "safe" | "warning" | "breach-risk" | "breached" | "recovering" | "n_a";

export type SlaTrend = "up" | "down" | "stable";

export interface SlaStatusData {
  status: SlaStatus;
  minutes_to_breach: number | null;
  minutes_over: number | null;
  first_response_at: string | null;
  /** Optional: trend for status change; when available, show arrow (↑/↓/−) per UX spec */
  trend?: SlaTrend;
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

export type SlaIndicatorVariant = "inline" | "summary" | "compact";

interface LeadSlaIndicatorProps {
  slaStatus: SlaStatusData | null;
  /** @deprecated Use variant="compact" instead */
  compact?: boolean;
  variant?: SlaIndicatorVariant;
  unavailable?: boolean;
  onRetry?: () => void;
}

interface QueueSlaIndicatorProps {
  summary: QueueSlaSummary | null;
  unavailable?: boolean;
  onRetry?: () => void;
  /** Optional: when at-risk leads exist, fires on click (UX: "Clicking opens filtered list") */
  onAtRiskClick?: () => void;
  variant?: SlaIndicatorVariant;
}

function getTrendSymbol(trend?: SlaTrend): string {
  if (!trend) return "";
  if (trend === "up") return "↑";
  if (trend === "down") return "↓";
  return "−";
}

function getStatusConfig(status: SlaStatus, palette: { success: { main: string }; warning: { main: string }; error: { main: string }; grey: { [k: number]: string } }) {
  switch (status) {
    case "safe":
      return { icon: "✓", label: "SLA safe", color: palette.success.main, ariaLabel: "SLA safe" };
    case "warning":
      return { icon: "!", label: "Approaching breach", color: palette.warning.main, ariaLabel: "SLA warning" };
    case "breach-risk":
      return { icon: "!", label: "Breach risk", color: palette.warning.main, ariaLabel: "SLA at breach risk" };
    case "breached":
      return { icon: "✕", label: "Breached", color: palette.error.main, ariaLabel: "SLA breached" };
    case "recovering":
      return { icon: "↻", label: "Recovered late", color: palette.grey[600] ?? "#757575", ariaLabel: "Responded after SLA breach" };
    default:
      return { icon: "−", label: "N/A", color: palette.grey[500] ?? "#9e9e9e", ariaLabel: "SLA not applicable" };
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
  return getStatusConfig(sla.status, { success: { main: "#2e7d32" }, warning: { main: "#ed6c02" }, error: { main: "#d32f2f" }, grey: { 500: "#9e9e9e", 600: "#757575" } }).label;
}

export function LeadSlaIndicator({ slaStatus, compact, variant = "inline", unavailable = false, onRetry }: LeadSlaIndicatorProps) {
  const theme = useTheme();
  const palette = theme.palette as { success: { main: string }; warning: { main: string }; error: { main: string }; grey?: { [k: number]: string } };
  const isCompact = variant === "compact" || compact;

  if (unavailable) {
    return (
      <Box
        component="span"
        role="status"
        aria-label="SLA status temporarily unavailable"
        sx={{
          fontSize: isCompact ? "0.65rem" : "0.75rem",
          padding: isCompact ? "0.1rem 0.35rem" : "0.2rem 0.5rem",
          borderRadius: 1,
          backgroundColor: `${palette.grey?.[400] ?? "#bdbdbd"}20`,
          display: "inline-flex",
          alignItems: "center",
          gap: "0.25rem",
        }}
      >
        SLA -
        {onRetry && !isCompact && (
          <button
            type="button"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onRetry(); }}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onRetry(); } }}
            aria-label="Retry loading SLA"
            style={{ padding: "0.1rem 0.35rem", fontSize: "0.7rem", border: "1px solid rgba(128,128,128,0.4)", borderRadius: 4, background: "var(--background)", color: "var(--foreground)", cursor: "pointer" }}
          >
            Retry
          </button>
        )}
      </Box>
    );
  }
  if (!slaStatus) return null;
  const cfg = getStatusConfig(slaStatus.status, palette);
  const label = getActionableLabel(slaStatus);
  const trendSym = getTrendSymbol(slaStatus.trend);

  return (
    <Box
      component="span"
      role="status"
      aria-label={cfg.ariaLabel + (label ? ": " + label : "") + (trendSym ? " trend " + trendSym : "")}
      sx={{
        fontSize: variant === "compact" ? "0.65rem" : variant === "summary" ? "0.875rem" : "0.75rem",
        fontWeight: 600,
        padding: variant === "compact" ? "0.1rem 0.35rem" : variant === "summary" ? "0.5rem 0.75rem" : "0.2rem 0.5rem",
        borderRadius: variant === "summary" ? 2 : 1,
        backgroundColor: `${cfg.color}20`,
        color: cfg.color,
        display: "inline-flex",
        alignItems: "center",
        gap: "0.25rem",
        border: variant === "summary" ? `2px solid ${cfg.color}40` : "none",
      }}
    >
      <span aria-hidden="true">{cfg.icon}</span>
      {trendSym && <span aria-hidden="true">{trendSym}</span>}
      {label}
    </Box>
  );
}

export function QueueSlaIndicator({ summary, unavailable = false, onRetry, onAtRiskClick, variant = "inline" }: QueueSlaIndicatorProps) {
  const theme = useTheme();
  const palette = theme.palette;

  if (unavailable) {
    return (
      <Box
        role="alert"
        aria-live="polite"
        sx={{
          padding: "0.4rem 0.75rem",
          fontSize: "0.875rem",
          border: (t) => `1px solid ${t.palette.warning.main}66`,
          borderRadius: 1.5,
          backgroundColor: (t) => `${t.palette.warning.main}14`,
        }}
      >
        <span aria-hidden="true">!</span> SLA temporarily unavailable
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onRetry(); } }}
            aria-label="Retry loading SLA"
            style={{ marginLeft: "0.5rem", padding: "0.2rem 0.5rem", fontSize: "0.75rem", border: "1px solid rgba(128,128,128,0.4)", borderRadius: 4, background: "var(--background)", color: "var(--foreground)", cursor: "pointer" }}
          >
            Retry
          </button>
        )}
      </Box>
    );
  }
  if (!summary) return null;
  const { count_breached, count_breach_risk, count_warning, sla_safe_percent, total_tracked } = summary;
  const atRisk = count_breached + count_breach_risk + count_warning;
  let label: string;
  let icon: string;
  let color: string;
  let ariaLabel: string;
  if (total_tracked === 0) {
    label = "No SLA leads";
    icon = "−";
    color = palette.grey?.[500] ?? "#9e9e9e";
    ariaLabel = "No VIP or high-priority leads to track";
  } else if (atRisk === 0) {
    label = sla_safe_percent != null ? `SLA Safe ${sla_safe_percent}%` : "SLA Safe";
    icon = "✓";
    color = palette.success.main;
    ariaLabel = label;
  } else {
    label = `${atRisk} at risk`;
    icon = "!";
    color = palette.warning.main;
    ariaLabel = `${atRisk} leads at SLA risk`;
  }
  const baseSx = {
    fontSize: variant === "compact" ? "0.7rem" : variant === "summary" ? "1rem" : "0.875rem",
    fontWeight: 600,
    padding: variant === "compact" ? "0.15rem 0.4rem" : variant === "summary" ? "0.5rem 1rem" : "0.25rem 0.6rem",
    borderRadius: variant === "summary" ? 2 : 1.5,
    backgroundColor: `${color}20`,
    color,
    display: "inline-flex",
    alignItems: "center",
    gap: "0.35rem",
    border: variant === "summary" ? `2px solid ${color}40` : "none",
  };

  if (atRisk > 0 && onAtRiskClick) {
    return (
      <Box
        component="button"
        type="button"
        role="status"
        aria-label={ariaLabel}
        onClick={onAtRiskClick}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onAtRiskClick();
          }
        }}
        sx={{
          ...baseSx,
          border: "none",
          font: "inherit",
          cursor: "pointer",
          minWidth: 44,
          minHeight: 44,
        }}
      >
        <span aria-hidden="true">{icon}</span>
        {label}
      </Box>
    );
  }

  return (
    <Box
      component="span"
      role="status"
      aria-label={ariaLabel}
      sx={baseSx}
    >
      <span aria-hidden="true">{icon}</span>
      {label}
    </Box>
  );
}
