"use client";

import { useEffect, useState } from "react";
import { Alert, Box, Button, Chip, CircularProgress, Stack, Typography } from "@mui/material";

interface SettingsStatus {
  mistral_configured: boolean;
  risk_inactivity_hours: string;
  whatsapp_webhook_verify_token_set: boolean;
  whatsapp_webhook_secret_set: boolean;
  database_configured: boolean;
}

function StatusBadge({ ok }: { ok: boolean }) {
  return (
    <Chip
      role="status"
      aria-label={ok ? "Configured" : "Not configured"}
      label={ok ? "Configured" : "Not set"}
      color={ok ? "success" : "default"}
      variant={ok ? "filled" : "outlined"}
      size="small"
      sx={{ fontWeight: 700 }}
    />
  );
}

export default function SettingsPage() {
  const [status, setStatus] = useState<SettingsStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((json) => {
        if (json.data) setStatus(json.data);
        else setError(json.error?.message ?? "Failed to load");
      })
      .catch((err) => setError(String(err)))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <Box sx={{ p: 3, maxWidth: 800, mx: "auto", display: "flex", alignItems: "center", gap: 1.5 }}>
        <CircularProgress size={20} />
        <Typography>Loading settings...</Typography>
      </Box>
    );
  }

  if (error || !status) {
    return (
      <Box sx={{ p: 3, maxWidth: 800, mx: "auto" }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          Error: {error ?? "Could not load settings"}
        </Alert>
        <Button
          type="button"
          variant="outlined"
          onClick={() => window.location.reload()}
          sx={{ minHeight: 44 }}
        >
          Retry
        </Button>
      </Box>
    );
  }

  return (
    <Box component="main" sx={{ p: 3, maxWidth: 800, mx: "auto" }}>
      <Typography variant="h5" component="h1" sx={{ fontWeight: 600, mb: 1 }}>
        Settings
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Configuration status for Mistral Lead Ops
      </Typography>

      <Stack spacing={2}>
        <Box sx={{ p: 2, border: "1px solid", borderColor: "divider", borderRadius: 2 }}>
          <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "flex-start", sm: "center" }} spacing={1}>
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                Mistral API
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Used for lead classification and recovery draft generation
              </Typography>
            </Box>
            <StatusBadge ok={status.mistral_configured} />
          </Stack>
        </Box>

        <Box sx={{ p: 2, border: "1px solid", borderColor: "divider", borderRadius: 2 }}>
          <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "flex-start", sm: "center" }} spacing={1}>
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                Database
              </Typography>
              <Typography variant="body2" color="text.secondary">
                PostgreSQL connection for leads, interactions, and classifications
              </Typography>
            </Box>
            <StatusBadge ok={status.database_configured} />
          </Stack>
        </Box>

        <Box sx={{ p: 2, border: "1px solid", borderColor: "divider", borderRadius: 2 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            At-risk inactivity threshold
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Leads without contact for this many hours are flagged at-risk
          </Typography>
          <Typography variant="h6" sx={{ mt: 1 }}>
            {status.risk_inactivity_hours} hours
          </Typography>
        </Box>

        <Box sx={{ p: 2, border: "1px solid", borderColor: "divider", borderRadius: 2 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            WhatsApp Webhook
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            For lead ingestion from WhatsApp Business API
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap alignItems="center">
            <Typography variant="caption" color="text.secondary">
              Verify token
            </Typography>
            <StatusBadge ok={status.whatsapp_webhook_verify_token_set} />
            <Typography variant="caption" color="text.secondary">
              App secret
            </Typography>
            <StatusBadge ok={status.whatsapp_webhook_secret_set} />
          </Stack>
        </Box>
      </Stack>

      <Typography variant="caption" color="text.secondary" sx={{ mt: 3, display: "block" }}>
        Configure via <code>.env</code> or <code>.env.local</code>. See <code>.env.example</code> for reference.
      </Typography>
    </Box>
  );
}
