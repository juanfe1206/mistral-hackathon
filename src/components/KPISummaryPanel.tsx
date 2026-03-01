"use client";

/** NFR13: icon + text for each metric; never color-only. */

import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Skeleton,
  Stack,
  Typography,
} from "@mui/material";

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
      <Box
        role="status"
        aria-label="Loading KPI metrics"
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: 2,
        }}
      >
        {[1, 2, 3, 4].map((i) => (
          <Card
            key={i}
            variant="outlined"
            sx={{ minHeight: 96 }}
            aria-hidden="true"
          >
            <CardContent>
              <Skeleton variant="rounded" width="62%" height={14} sx={{ mb: 1 }} />
              <Skeleton variant="rounded" width="40%" height={30} />
            </CardContent>
          </Card>
        ))}
      </Box>
    );
  }

  if (unavailable) {
    return (
      <Alert
        severity="warning"
        role="alert"
        aria-live="polite"
        sx={{ display: "flex", alignItems: "center", gap: 1 }}
      >
        KPIs temporarily unavailable
        {onRetry && (
          <Button
            size="small"
            variant="outlined"
            onClick={onRetry}
            aria-label="Retry loading KPIs"
            sx={{ ml: "auto", minHeight: 44 }}
          >
            Retry
          </Button>
        )}
      </Alert>
    );
  }

  if (!summary) {
    return (
      <Box
        role="status"
        aria-label="No KPI data"
        sx={{ p: 2, border: "1px solid", borderColor: "divider", borderRadius: 2 }}
      >
        No data yet
      </Box>
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
    <Box
      role="region"
      aria-label="KPI summary"
      sx={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
        gap: 2,
      }}
    >
      {cards.map((card) => (
        <Card
          key={card.label}
          variant="outlined"
          role="article"
          aria-label={card.ariaLabel}
        >
          <CardContent>
            <Stack spacing={0.75}>
              <Typography variant="caption" color="text.secondary">
                <span aria-hidden="true">{card.icon}</span> {card.label}
              </Typography>
              <Typography variant="h5" sx={{ fontSize: "1.45rem", fontWeight: 700 }}>
                {card.value}
              </Typography>
            </Stack>
          </CardContent>
        </Card>
      ))}
    </Box>
  );
}
