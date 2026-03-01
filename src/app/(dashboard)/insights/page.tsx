"use client";

import { useEffect, useState } from "react";
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
    <div style={{ padding: "1.5rem", maxWidth: 960, margin: "0 auto" }}>
      <h1 style={{ fontSize: "1.5rem", fontWeight: 600, margin: 0, marginBottom: "1rem" }}>
        Queue Insights
      </h1>
      <p style={{ color: "var(--foreground)", opacity: 0.8, marginBottom: "1.5rem" }}>
        KPI summaries for recovery count, SLA compliance, and queue aging
      </p>
      <KPISummaryPanel
        summary={summary}
        loading={loading}
        unavailable={unavailable}
        onRetry={loadData}
      />
    </div>
  );
}
