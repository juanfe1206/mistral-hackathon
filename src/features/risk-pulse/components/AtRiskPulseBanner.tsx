"use client";

import type { ReactNode } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Chip,
  Stack,
  Typography,
  useTheme,
} from "@mui/material";

export type RiskPulseBannerState = "monitoring" | "escalated" | "acknowledged" | "resolved";
export type RiskPulseBannerVariant = "inline" | "sticky";

interface BannerAction {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}

interface AtRiskPulseBannerProps {
  state: RiskPulseBannerState;
  reason: string;
  detectedAt: string;
  variant?: RiskPulseBannerVariant;
  primaryAction: BannerAction;
  secondaryActions?: BannerAction[];
  leadName?: string;
  children?: ReactNode;
}

const STATE_META: Record<
  RiskPulseBannerState,
  { icon: string; label: string; severity: "info" | "warning" | "success" }
> = {
  monitoring: { icon: "◔", label: "Monitoring", severity: "info" },
  escalated: { icon: "⚠", label: "Escalated", severity: "warning" },
  acknowledged: { icon: "↻", label: "Acknowledged", severity: "info" },
  resolved: { icon: "✓", label: "Resolved", severity: "success" },
};

function formatElapsed(detectedAt: string): string {
  const elapsedMs = Math.max(0, Date.now() - new Date(detectedAt).getTime());
  const elapsedMin = Math.floor(elapsedMs / 60000);
  if (elapsedMin < 60) return `${elapsedMin}m`;
  const hours = Math.floor(elapsedMin / 60);
  const minutes = elapsedMin % 60;
  return `${hours}h ${minutes}m`;
}

export function AtRiskPulseBanner({
  state,
  reason,
  detectedAt,
  variant = "inline",
  primaryAction,
  secondaryActions = [],
  leadName,
  children,
}: AtRiskPulseBannerProps) {
  const theme = useTheme();
  const meta = STATE_META[state];
  const elapsed = formatElapsed(detectedAt);

  const content = (
    <>
      <CardContent sx={{ pb: children ? 1 : 2 }}>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems={{ xs: "flex-start", sm: "center" }}>
          <Chip
            label={`${meta.icon} ${meta.label}`}
            color={meta.severity}
            variant="filled"
            role="status"
            aria-live="polite"
            aria-atomic="true"
            sx={{ fontWeight: 700 }}
          />
          {leadName ? (
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
              {leadName}
            </Typography>
          ) : null}
          <Typography variant="body2" color="text.secondary" sx={{ ml: { sm: "auto" } }}>
            Elapsed: {elapsed}
          </Typography>
        </Stack>

        <Typography sx={{ mt: 1 }}>
          {reason}
        </Typography>
      </CardContent>

      <CardActions sx={{ px: 2, pb: 2, pt: 0, flexWrap: "wrap", gap: 1 }}>
        <Button
          variant="contained"
          onClick={primaryAction.onClick}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              primaryAction.onClick();
            }
          }}
          disabled={primaryAction.disabled}
          sx={{ minHeight: 44 }}
          aria-label={primaryAction.label}
        >
          {primaryAction.label}
        </Button>
        {secondaryActions.map((action) => (
          <Button
            key={action.label}
            variant="outlined"
            onClick={action.onClick}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                action.onClick();
              }
            }}
            disabled={action.disabled}
            sx={{ minHeight: 44 }}
            aria-label={action.label}
          >
            {action.label}
          </Button>
        ))}
      </CardActions>

      {children ? (
        <Box sx={{ px: 2, pb: 2 }}>
          {children}
        </Box>
      ) : null}
    </>
  );

  if (variant === "sticky") {
    return (
      <Box sx={{ position: "sticky", top: 0, zIndex: 4 }}>
        <Alert severity={meta.severity} icon={<span aria-hidden="true">{meta.icon}</span>} sx={{ mb: 1 }}>
          <Typography component="span" sx={{ fontWeight: 700 }}>
            {meta.label}
          </Typography>
        </Alert>
        <Card sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: 2 }}>{content}</Card>
      </Box>
    );
  }

  return <Card sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: 2 }}>{content}</Card>;
}
