"use client";

import { useEffect, useState, useMemo } from "react";
import { Box, Button, Typography, useMediaQuery, useTheme } from "@mui/material";
import {
  QueueSlaIndicator,
  type SlaStatusData,
  type QueueSlaSummary,
} from "@/components/SLASafetyIndicator";
import { LeadPriorityCard } from "@/features/triage/components/LeadPriorityCard";
import {
  QueueFilterBar,
  type QueueFilterBarFilters,
  type QueueSortOption,
} from "@/features/triage/components/QueueFilterBar";

interface Lead {
  id: string;
  source_channel: string;
  source_external_id: string;
  priority: "vip" | "high" | "low";
  lifecycle_state?: "default" | "at_risk" | "recovered" | "lost";
  reason_tags: string[];
  created_at: string;
  sla_status?: SlaStatusData | null;
}

interface IngestionFailure {
  id: string;
  error_code: string;
  message: string;
  details?: unknown;
  created_at: string;
}

function sortLeads(leads: Lead[], sort: QueueSortOption): Lead[] {
  const copy = [...leads];
  switch (sort) {
    case "priority_desc":
      const prioOrder = { vip: 0, high: 1, low: 2 };
      return copy.sort((a, b) => prioOrder[a.priority] - prioOrder[b.priority]);
    case "created_desc":
      return copy.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    case "sla_soonest":
      return copy.sort((a, b) => {
        const ma = a.sla_status?.minutes_to_breach ?? Infinity;
        const mb = b.sla_status?.minutes_to_breach ?? Infinity;
        return ma - mb;
      });
    default:
      return copy;
  }
}

function filterLeads(leads: Lead[], filters: QueueFilterBarFilters): Lead[] {
  return leads.filter((lead) => {
    if (filters.priority != null && lead.priority !== filters.priority) return false;
    if (filters.lifecycle != null && lead.lifecycle_state !== filters.lifecycle) return false;
    if (filters.source != null && lead.source_channel !== filters.source) return false;
    return true;
  });
}

function buildLeadDetailHref(leadId: string, filters: QueueFilterBarFilters, sort: QueueSortOption): string {
  const params = new URLSearchParams({
    from: "triage",
    sort,
  });
  if (filters.priority) params.set("priority", filters.priority);
  if (filters.lifecycle) params.set("lifecycle", filters.lifecycle);
  if (filters.source) params.set("source", filters.source);
  return `/lead/${leadId}?${params.toString()}`;
}

export default function TriagePage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [leads, setLeads] = useState<Lead[]>([]);
  const [failures, setFailures] = useState<IngestionFailure[]>([]);
  const [slaSummary, setSlaSummary] = useState<QueueSlaSummary | null>(null);
  const [slaUnavailable, setSlaUnavailable] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<QueueFilterBarFilters>({});
  const [sort, setSort] = useState<QueueSortOption>("priority_desc");

  const loadData = async () => {
    setLoading(true);
    setError(null);
    setSlaUnavailable(false);
    try {
      const [leadsRes, failuresRes, slaRes] = await Promise.all([
        fetch("/api/leads"),
        fetch("/api/ingestion-failures?limit=10"),
        fetch("/api/sla"),
      ]);
      const [leadsJson, failuresJson, slaJson] = await Promise.all([
        leadsRes.json(),
        failuresRes.json(),
        slaRes.json(),
      ]);
      if (!leadsRes.ok || leadsJson.error) {
        setError(leadsJson.error?.message ?? "Request failed");
        return;
      }
      setLeads(leadsJson.data ?? []);
      if (failuresRes.ok && failuresJson.data?.length) {
        setFailures(failuresJson.data);
      }
      if (slaRes.ok && slaJson.data?.queue_summary) {
        setSlaSummary(slaJson.data.queue_summary);
      } else {
        setSlaUnavailable(true);
      }
    } catch (err) {
      setError(String(err));
      setSlaUnavailable(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredLeads = useMemo(() => filterLeads(leads, filters), [leads, filters]);
  const sortedLeads = useMemo(() => sortLeads(filteredLeads, sort), [filteredLeads, sort]);

  // Top 3 urgent for "under 10 seconds" hierarchy
  const topUrgent = sortedLeads.slice(0, 3);
  const rest = sortedLeads.slice(3);

  if (loading) {
    return (
      <Box sx={{ p: 3, maxWidth: 960, mx: "auto" }}>
        <Typography>Loading leads…</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3, maxWidth: 960, mx: "auto" }}>
        <Typography color="error">Error loading leads: {error}</Typography>
      </Box>
    );
  }

  const atRiskCount = (slaSummary?.count_breached ?? 0) + (slaSummary?.count_breach_risk ?? 0) + (slaSummary?.count_warning ?? 0);

  return (
    <Box sx={{ p: 3, maxWidth: 960, mx: "auto" }} component="main" aria-label="Triage queue">
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2, flexWrap: "wrap" }}>
        <Typography variant="h5" component="h1" sx={{ fontWeight: 600, m: 0 }}>
          Triage Queue
        </Typography>
        <QueueSlaIndicator
          summary={slaSummary}
          unavailable={slaUnavailable}
          onRetry={loadData}
          onAtRiskClick={atRiskCount > 0 ? () => setFilters({ lifecycle: "at_risk" }) : undefined}
          variant="inline"
        />
        <Button variant="outlined" size="small" onClick={loadData} disabled={loading}>
          {loading ? "Refreshing…" : "Refresh"}
        </Button>
      </Box>

      <QueueFilterBar
        filters={filters}
        sort={sort}
        onFiltersChange={setFilters}
        onSortChange={setSort}
        state={filters.priority || filters.lifecycle || filters.source ? "filter-active" : "default"}
        loading={loading}
        noResults={sortedLeads.length === 0}
      />

      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Inbound leads from WhatsApp
      </Typography>

      {leads.length > 0 && leads.every((l) => !l.reason_tags?.length) && (
        <Box
          sx={{
            p: 1.5,
            mb: 2,
            bgcolor: "action.hover",
            border: "1px solid",
            borderColor: "divider",
            borderRadius: 2,
            fontSize: "0.85rem",
          }}
        >
          <strong>Mistral API demo:</strong> Leads are unclassified. Open any lead → click{" "}
          <strong>Reclassify</strong> to classify with Mistral AI. For at-risk leads, click{" "}
          <strong>Generate draft</strong> to create a recovery message.
        </Box>
      )}

      {failures.length > 0 && (
        <Box
          sx={{
            p: 2,
            mb: 2,
            border: "1px solid",
            borderColor: "error.main",
            borderRadius: 2,
            bgcolor: "error.light",
          }}
        >
          <Typography variant="subtitle2" color="error" sx={{ mb: 0.5 }}>
            Recent ingestion failures ({failures.length})
          </Typography>
          <Box component="ul" sx={{ m: 0, pl: 2.5, fontSize: "0.875rem" }}>
            {failures.slice(0, 5).map((f) => (
              <li key={f.id}>
                [{new Date(f.created_at).toLocaleString()}] {f.error_code}: {f.message}
              </li>
            ))}
          </Box>
        </Box>
      )}

      {leads.length === 0 ? (
        <Box sx={{ p: 4, border: "1px solid", borderColor: "divider", borderRadius: 2 }}>
          <Typography>No leads yet. Ingest leads via the WhatsApp webhook.</Typography>
        </Box>
      ) : sortedLeads.length === 0 ? (
        <Box sx={{ p: 4, border: "1px solid", borderColor: "divider", borderRadius: 2 }}>
          <Typography>No leads match the current filters.</Typography>
        </Box>
      ) : (
        <Box
          component="ol"
          role="list"
          aria-label="Prioritized lead list"
          sx={{ display: "flex", flexDirection: "column", gap: 1.5, listStyle: "none", m: 0, p: 0 }}
        >
          {topUrgent.length > 0 && (
            <Box component="li" sx={{ display: "contents" }}>
              <Typography variant="caption" sx={{ fontWeight: 600, color: "text.secondary", mb: -0.5 }}>
                Top urgent
              </Typography>
            </Box>
          )}
          {topUrgent.map((lead) => (
            <Box component="li" key={lead.id} sx={{ display: "contents" }}>
              <LeadPriorityCard
                lead={{
                  id: lead.id,
                  source_external_id: lead.source_external_id,
                  source_channel: lead.source_channel,
                  priority: lead.priority,
                  lifecycle_state: lead.lifecycle_state ?? "default",
                  reason_tags: lead.reason_tags ?? [],
                  sla_status: lead.sla_status ?? null,
                  created_at: lead.created_at,
                }}
                variant={isMobile ? "compact" : "standard"}
                state={lead.lifecycle_state === "at_risk" ? "critical-at-risk" : "default"}
                detailHref={buildLeadDetailHref(lead.id, filters, sort)}
              />
            </Box>
          ))}
          {rest.length > 0 && (
            <>
              {topUrgent.length > 0 && (
                <Box component="li" sx={{ display: "contents" }}>
                  <Typography variant="caption" sx={{ fontWeight: 600, color: "text.secondary", mt: 1, mb: -0.5 }}>
                    More leads
                  </Typography>
                </Box>
              )}
              {rest.map((lead) => (
                <Box component="li" key={lead.id} sx={{ display: "contents" }}>
                  <LeadPriorityCard
                    lead={{
                      id: lead.id,
                      source_external_id: lead.source_external_id,
                      source_channel: lead.source_channel,
                      priority: lead.priority,
                      lifecycle_state: lead.lifecycle_state ?? "default",
                      reason_tags: lead.reason_tags ?? [],
                      sla_status: lead.sla_status ?? null,
                      created_at: lead.created_at,
                    }}
                    variant={isMobile ? "compact" : "standard"}
                    detailHref={buildLeadDetailHref(lead.id, filters, sort)}
                  />
                </Box>
              ))}
            </>
          )}
        </Box>
      )}
    </Box>
  );
}
