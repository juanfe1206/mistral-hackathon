"use client";

import { useEffect, useState } from "react";
import { Box, Button, Stack, Typography } from "@mui/material";
import { KPISummaryPanel, type KpiSummaryData } from "@/components/KPISummaryPanel";

export default function InsightsPage() {
  const [summary, setSummary] = useState<KpiSummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [unavailable, setUnavailable] = useState(false);

  const loadData = async () => {
    setLoading(true);
    setUnavailable(false);
    try {
      const res = await fetch("/api/kpi");
      const json = await res.json();
      if (!res.ok || json.error) {
        setUnavailable(true);
        return;
      }
      setSummary(json.data ?? null);
    } catch {
      setUnavailable(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <Box component="main" sx={{ p: 3, maxWidth: 960, mx: "auto" }}>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems={{ xs: "flex-start", sm: "center" }} sx={{ mb: 2 }}>
        <Typography variant="h5" component="h1" sx={{ fontWeight: 600 }}>
          Queue Insights
        </Typography>
        <Button type="button" onClick={loadData} variant="outlined" size="small" sx={{ minHeight: 44 }}>
          {loading ? "Refreshing..." : "Refresh"}
        </Button>
      </Stack>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        KPI summaries for recovery count, SLA compliance, and queue aging
      </Typography>
      <KPISummaryPanel
        summary={summary}
        loading={loading}
        unavailable={unavailable}
        onRetry={loadData}
      />
    </Box>
  );
}
