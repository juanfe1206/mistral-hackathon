"use client";

/** NFR13: icon + text for each metric; never color-only. */

export interface KpiSummaryData {
  recovery_count: number;
  sla_compliance_percent: number | null;
  queue_aging_minutes: number | null;
  queue_aging_count: number;
}

interface KPISummaryPanelProps {
  summary: KpiSummaryData | null;
  loading?: boolean;
  unavailable?: boolean;
  onRetry?: () => void;
}

function formatValue(value: number | null): string {
  if (value === null) return "—";
  return String(value);
}

export function KPISummaryPanel({
  summary,
  loading = false,
  unavailable = false,
  onRetry,
}: KPISummaryPanelProps) {
  if (loading) {
    return (
      <div
        role="status"
        aria-label="Loading KPI metrics"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
          gap: "1rem",
        }}
      >
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            style={{
              padding: "1rem",
              border: "1px solid rgba(128,128,128,0.3)",
              borderRadius: 8,
              minHeight: 72,
              backgroundColor: "rgba(128,128,128,0.06)",
            }}
            aria-hidden="true"
          >
            <div
              style={{
                width: "60%",
                height: 12,
                borderRadius: 4,
                backgroundColor: "rgba(128,128,128,0.2)",
                marginBottom: "0.5rem",
              }}
            />
            <div
              style={{
                width: "40%",
                height: 20,
                borderRadius: 4,
                backgroundColor: "rgba(128,128,128,0.15)",
              }}
            />
          </div>
        ))}
      </div>
    );
  }

  if (unavailable) {
    return (
      <div
        role="alert"
        aria-live="polite"
        style={{
          padding: "1rem",
          border: "1px solid rgba(200, 100, 0, 0.4)",
          borderRadius: 8,
          backgroundColor: "rgba(200, 100, 0, 0.08)",
        }}
      >
        <span aria-hidden="true" style={{ marginRight: "0.35rem" }}>
          !
        </span>
        KPIs temporarily unavailable
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onRetry();
              }
            }}
            aria-label="Retry loading KPIs"
            style={{
              marginLeft: "0.5rem",
              padding: "0.2rem 0.5rem",
              fontSize: "0.75rem",
              border: "1px solid rgba(128,128,128,0.4)",
              borderRadius: 4,
              background: "var(--background)",
              color: "var(--foreground)",
              cursor: "pointer",
            }}
          >
            Retry
          </button>
        )}
      </div>
    );
  }

  if (!summary) {
    return (
      <div
        role="status"
        aria-label="No KPI data"
        style={{
          padding: "1rem",
          border: "1px solid rgba(128,128,128,0.3)",
          borderRadius: 8,
        }}
      >
        No data yet
      </div>
    );
  }

  const cards = [
    {
      icon: "✓",
      label: "Recovery count",
      value: formatValue(summary.recovery_count),
      ariaLabel: `Recovery count: ${summary.recovery_count} leads recovered`,
    },
    {
      icon: "%",
      label: "SLA compliance",
      value:
        summary.sla_compliance_percent !== null
          ? `${summary.sla_compliance_percent}%`
          : "—",
      ariaLabel:
        summary.sla_compliance_percent !== null
          ? `SLA compliance: ${summary.sla_compliance_percent} percent`
          : "SLA compliance: No data yet",
    },
    {
      icon: "⏱",
      label: "Queue aging (oldest)",
      value:
        summary.queue_aging_minutes !== null
          ? `${summary.queue_aging_minutes}m`
          : "—",
      ariaLabel:
        summary.queue_aging_minutes !== null
          ? `Oldest VIP/high lead waiting ${summary.queue_aging_minutes} minutes`
          : "Queue aging: No VIP/high leads waiting",
    },
    {
      icon: "#",
      label: "Waiting >30m",
      value: formatValue(summary.queue_aging_count),
      ariaLabel: `${summary.queue_aging_count} VIP/high leads waiting over 30 minutes`,
    },
  ];

  return (
    <div
      role="region"
      aria-label="KPI summary"
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
        gap: "1rem",
      }}
    >
      {cards.map((card) => (
        <div
          key={card.label}
          role="article"
          aria-label={card.ariaLabel}
          style={{
            padding: "1rem",
            border: "1px solid rgba(128,128,128,0.3)",
            borderRadius: 8,
            display: "flex",
            flexDirection: "column",
            gap: "0.25rem",
          }}
        >
          <span style={{ fontSize: "0.75rem", opacity: 0.8 }}>
            <span aria-hidden="true">{card.icon}</span> {card.label}
          </span>
          <span style={{ fontSize: "1.25rem", fontWeight: 600 }}>{card.value}</span>
        </div>
      ))}
    </div>
  );
}
