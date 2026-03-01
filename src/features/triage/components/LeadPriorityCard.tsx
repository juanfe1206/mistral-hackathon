"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardActions,
  Chip,
  Button,
  Box,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import { LeadSlaIndicator, type SlaStatusData } from "@/components/SLASafetyIndicator";

export interface LeadPriorityCardLead {
  id: string;
  source_external_id: string;
  source_channel: string;
  priority: "vip" | "high" | "low";
  lifecycle_state?: "default" | "at_risk" | "recovered" | "lost";
  reason_tags: string[];
  sla_status: SlaStatusData | null;
  created_at: string;
}

export type LeadPriorityCardVariant = "compact" | "standard" | "expanded";
export type LeadPriorityCardState =
  | "default"
  | "hover"
  | "focused"
  | "selected"
  | "critical-at-risk"
  | "assigned"
  | "resolved"
  | "disabled";

export interface LeadPriorityCardProps {
  lead: LeadPriorityCardLead;
  variant?: LeadPriorityCardVariant;
  state?: LeadPriorityCardState;
  selected?: boolean;
  onActionClick?: (leadId: string) => void;
  detailHref?: string;
}


export function LeadPriorityCard({
  lead,
  variant = "standard",
  state = "default",
  selected = false,
  detailHref,
}: LeadPriorityCardProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [expanded, setExpanded] = useState(false);

  const priorityColor =
    lead.priority === "vip"
      ? theme.palette.secondary.main
      : lead.priority === "high"
        ? theme.palette.info.main
        : theme.palette.text.secondary;

  const lifecycleLabel =
    lead.lifecycle_state === "at_risk"
      ? "At-Risk"
      : lead.lifecycle_state === "recovered"
        ? "Recovered"
        : lead.lifecycle_state === "lost"
          ? "Lost"
          : null;

  const maxTags = 2;
  const displayTags = lead.reason_tags.slice(0, maxTags);
  const overflowCount = lead.reason_tags.length - maxTags;


  const computedState =
    lead.lifecycle_state === "at_risk"
      ? "critical-at-risk"
      : selected
        ? "selected"
        : state;

  const borderColor =
    computedState === "selected"
      ? theme.palette.primary.main
      : computedState === "critical-at-risk"
        ? theme.palette.warning.main
        : "transparent";

  const ariaLabel = `Lead ${lead.source_external_id} from ${lead.source_channel}, priority ${lead.priority}`;
  const showInlinePanel = expanded || selected;
  const leadDetailHref = detailHref ?? `/lead/${lead.id}`;
  const inlineActionsRegionId = `lead-inline-actions-${lead.id}`;

  return (
    <Card
      component="article"
      aria-label={ariaLabel}
      tabIndex={0}
      aria-expanded={variant === "compact" ? showInlinePanel : undefined}
      aria-controls={variant === "compact" ? inlineActionsRegionId : undefined}
      onClick={() => setExpanded((prev) => !prev)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " " || event.key === "Spacebar") {
          event.preventDefault();
          setExpanded((prev) => !prev);
        }
      }}
      sx={{
        border: "2px solid",
        borderColor,
        transition: "border-color 0.2s, box-shadow 0.2s",
        cursor: "pointer",
        "&:hover": { borderColor: theme.palette.primary.light },
        "&:focus-within": {
          outline: `2px solid ${theme.palette.primary.main}`,
          outlineOffset: 2,
        },
      }}
    >
      <CardContent sx={{ py: variant === "compact" ? 1 : 1.5, "&:last-child": { pb: variant === "compact" ? 1 : 1.5 } }}>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: 8,
          }}
        >
          {lifecycleLabel && (
            <Chip
              size={isMobile ? "medium" : "small"}
              label={lifecycleLabel}
              role="status"
              aria-label={`Lifecycle: ${lifecycleLabel}`}
              sx={{
                fontSize: "0.7rem",
                height: isMobile ? 44 : 20,
                minWidth: isMobile ? 44 : undefined,
                minHeight: isMobile ? 44 : undefined,
                "& .MuiChip-label": { px: 0.75 },
              }}
            />
          )}
          <Chip
            size={isMobile ? "medium" : "small"}
            label={lead.priority}
            sx={{
              fontSize: "0.7rem",
              height: isMobile ? 36 : 20,
              minWidth: isMobile ? 44 : undefined,
              minHeight: isMobile ? 44 : undefined,
              backgroundColor: `${priorityColor}20`,
              color: priorityColor,
              textTransform: "uppercase",
              "& .MuiChip-label": { px: 0.75 },
            }}
          />
          <span style={{ fontWeight: 600, fontSize: variant === "compact" ? "0.875rem" : "1rem" }}>
            {lead.source_external_id} · {lead.source_channel}
          </span>
          {lead.sla_status && (
            <LeadSlaIndicator
              slaStatus={lead.sla_status}
              variant="compact"
            />
          )}
          {displayTags.map((tag) => (
            <Chip
              key={tag}
              size={isMobile ? "medium" : "small"}
              label={tag}
              sx={{
                fontSize: "0.65rem",
                height: isMobile ? 36 : 18,
                minWidth: isMobile ? 44 : undefined,
                minHeight: isMobile ? 44 : undefined,
              }}
            />
          ))}
          {overflowCount > 0 && (
            <Chip
              size={isMobile ? "medium" : "small"}
              label={`+${overflowCount}`}
              sx={{
                fontSize: "0.65rem",
                height: isMobile ? 36 : 18,
                minWidth: isMobile ? 44 : undefined,
                minHeight: isMobile ? 44 : undefined,
              }}
            />
          )}
        </div>
        {(variant !== "compact" || showInlinePanel) && (
          <Box sx={{ fontSize: "0.875rem", opacity: 0.7, mt: 0.5 }}>
            {new Date(lead.created_at).toLocaleString()}
          </Box>
        )}
      </CardContent>
      {(showInlinePanel || variant !== "compact") && (
        <Box
          id={inlineActionsRegionId}
          component="div"
          role="region"
          aria-label="Inline actions"
          onClick={(e) => e.stopPropagation()}
          sx={{ borderTop: 1, borderColor: "divider", px: 1.5, py: 1 }}
        >
          <Button
            component={Link}
            href={leadDetailHref}
            size="small"
            variant="outlined"
            aria-label={`View lead ${lead.source_external_id}`}
            sx={{ minWidth: 44, minHeight: 44 }}
          >
            View
          </Button>
        </Box>
      )}
      {(!showInlinePanel && variant === "compact") && (
        <CardActions sx={{ pt: 0, px: 1.5, pb: 1 }}>
          <Button
            component={Link}
            href={leadDetailHref}
            size="small"
            variant="outlined"
            aria-label={`View lead ${lead.source_external_id}`}
            sx={{ minWidth: 44, minHeight: 44 }}
            onClick={(e) => e.stopPropagation()}
          >
            View
          </Button>
        </CardActions>
      )}
    </Card>
  );
}
