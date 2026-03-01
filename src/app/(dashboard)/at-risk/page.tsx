"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Box, Button, Stack, Typography } from "@mui/material";
import { AtRiskPulseBanner, type RiskPulseBannerState } from "@/features/risk-pulse/components/AtRiskPulseBanner";

interface RiskPulse {
  id: string;
  lead_id: string;
  reason: string;
  detected_at: string;
  status: string;
  lead?: {
    id: string;
    source_channel: string;
    source_external_id: string;
    source_metadata?: Record<string, unknown>;
    priority: string;
    lifecycle_state?: string;
  };
}

function mapPulseStatus(status: string): RiskPulseBannerState {
  if (status === "resolved") return "resolved";
  if (status === "acknowledged") return "acknowledged";
  if (status === "monitoring") return "monitoring";
  return "escalated";
}

export default function AtRiskPage() {
  const router = useRouter();
  const [pulses, setPulses] = useState<RiskPulse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/risk-pulses");
      const json = await res.json();
      if (!res.ok || json.error) {
        setError(json.error?.message ?? "Failed to load");
        return;
      }
      setPulses(json.data ?? []);
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return (
      <Box sx={{ p: 3, maxWidth: 960, mx: "auto" }}>
        <Typography>Loading at-risk leads...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3, maxWidth: 960, mx: "auto" }}>
        <Typography color="error.main">Error: {error}</Typography>
        <Button type="button" onClick={loadData} sx={{ mt: 1, minHeight: 44 }}>
          Retry
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, maxWidth: 960, mx: "auto" }}>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems={{ xs: "flex-start", sm: "center" }} sx={{ mb: 2 }}>
        <Typography variant="h4" sx={{ fontSize: "1.5rem" }}>
          At-Risk Leads
        </Typography>
        <Button type="button" onClick={loadData} variant="outlined" sx={{ minHeight: 44 }}>
          Refresh
        </Button>
      </Stack>

      <Typography sx={{ color: "text.secondary", mb: 2 }}>
        Leads flagged for recovery. Open one to generate a premium concierge draft.
      </Typography>

      {pulses.length === 0 ? (
        <Box sx={{ p: 3, border: (theme) => `1px solid ${theme.palette.divider}`, borderRadius: 2, textAlign: "center" }}>
          <Typography>No at-risk leads right now.</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            At-risk leads appear when they exceed the inactivity threshold.
          </Typography>
          <Button component={Link} href="/triage" variant="text" sx={{ mt: 1 }}>
            View triage queue
          </Button>
        </Box>
      ) : (
        <Stack spacing={1.5}>
          {pulses.map((pulse, idx) => {
            const lead = pulse.lead;
            const contactName =
              lead?.source_metadata && typeof lead.source_metadata === "object" && "contact_name" in lead.source_metadata
                ? String((lead.source_metadata as { contact_name?: string }).contact_name || "").trim() || null
                : null;
            const displayName = contactName || lead?.source_external_id || "Unknown";

            return (
              <AtRiskPulseBanner
                key={pulse.id}
                variant={idx === 0 ? "sticky" : "inline"}
                state={mapPulseStatus(pulse.status)}
                reason={pulse.reason}
                detectedAt={pulse.detected_at}
                leadName={`${displayName} · ${lead?.priority ?? "unknown"}`}
                primaryAction={{
                  label: "Open recovery",
                  onClick: () => router.push(`/lead/${pulse.lead_id}`),
                }}
              />
            );
          })}
        </Stack>
      )}
    </Box>
  );
}
