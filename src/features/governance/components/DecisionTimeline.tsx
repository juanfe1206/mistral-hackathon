"use client";

import { useMemo, useState } from "react";
import {
  Box,
  Button,
  Chip,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";

export type DecisionTimelineVariant = "compact" | "audit";

export interface DecisionTimelineItem {
  id: string;
  event_type: string;
  occurred_at: string;
  event_label?: string | null;
  actor?: string | null;
  rationale?: string | null;
  transition?: string | null;
  flagged?: boolean;
  source?: "interaction" | "audit";
  details?: Record<string, unknown>;
}

interface DecisionTimelineProps {
  items: DecisionTimelineItem[];
  initialVariant?: DecisionTimelineVariant;
}

function toHumanLabel(value: string): string {
  return value
    .replace(/[._]/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function DecisionTimeline({
  items,
  initialVariant = "compact",
}: DecisionTimelineProps) {
  const [variant, setVariant] = useState<DecisionTimelineVariant>(initialVariant);
  const [filter, setFilter] = useState("all");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const eventTypes = useMemo(
    () => Array.from(new Set(items.map((item) => item.event_type))),
    [items]
  );

  const filteredItems = useMemo(
    () => (filter === "all" ? items : items.filter((item) => item.event_type === filter)),
    [filter, items]
  );

  const toggleExpanded = (itemId: string) => {
    setExpanded((prev) => ({ ...prev, [itemId]: !prev[itemId] }));
  };

  return (
    <Box
      sx={{
        p: 2,
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 2,
      }}
    >
      <Stack
        direction={{ xs: "column", md: "row" }}
        spacing={1.5}
        alignItems={{ xs: "stretch", md: "center" }}
        sx={{ mb: 2 }}
      >
        <Typography variant="h6" sx={{ fontSize: "1rem", fontWeight: 600 }}>
          Decision timeline
        </Typography>

        <ToggleButtonGroup
          exclusive
          value={variant}
          onChange={(_, value: DecisionTimelineVariant | null) => {
            if (value) setVariant(value);
          }}
          size="small"
          aria-label="Timeline variant"
        >
          <ToggleButton value="compact" aria-label="Compact timeline">
            Compact
          </ToggleButton>
          <ToggleButton value="audit" aria-label="Audit timeline">
            Audit
          </ToggleButton>
        </ToggleButtonGroup>

        <FormControl size="small" sx={{ minWidth: 180, ml: { md: "auto" } }}>
          <InputLabel id="decision-timeline-filter">Event type</InputLabel>
          <Select
            labelId="decision-timeline-filter"
            value={filter}
            label="Event type"
            onChange={(event) => setFilter(event.target.value)}
            inputProps={{ "aria-label": "Filter timeline by event type" }}
          >
            <MenuItem value="all">All events</MenuItem>
            {eventTypes.map((eventType) => (
              <MenuItem key={eventType} value={eventType}>
                {toHumanLabel(eventType)}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Stack>

      {filteredItems.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          No timeline events match the selected filter.
        </Typography>
      ) : (
        <Box component="ol" sx={{ m: 0, pl: 3 }}>
          {filteredItems.map((item) => {
            const isExpanded = Boolean(expanded[item.id]);
            const actor = item.actor?.trim() || "Unknown actor";
            const rationale = item.rationale?.trim() || "No rationale recorded";
            const transition = item.transition?.trim() || "State transition unavailable";
            const eventLabel = item.event_label?.trim() || toHumanLabel(item.event_type);
            const panelId = `timeline-details-${item.id}`;

            return (
              <Box
                component="li"
                key={item.id}
                sx={{
                  mb: 1.5,
                  border: "1px solid",
                  borderColor: "divider",
                  borderRadius: 1.5,
                  p: 1.25,
                  listStylePosition: "outside",
                }}
              >
                <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                  <Chip label={eventLabel} size="small" variant="outlined" />
                  {item.flagged ? (
                    <Chip
                      label="Flagged event"
                      color="warning"
                      size="small"
                      variant="filled"
                    />
                  ) : null}
                  {item.source ? (
                    <Typography variant="caption" color="text.secondary">
                      Source: {item.source}
                    </Typography>
                  ) : null}
                </Stack>

                <Typography variant="body2" sx={{ mt: 0.75 }}>
                  {new Date(item.occurred_at).toLocaleString()}
                </Typography>

                {variant === "audit" ? (
                  <Box sx={{ mt: 0.75 }}>
                    <Typography variant="body2">Actor: {actor}</Typography>
                    <Typography variant="body2">Transition: {transition}</Typography>
                    <Typography variant="body2">Rationale: {rationale}</Typography>
                  </Box>
                ) : null}

                <Button
                  size="small"
                  sx={{ mt: 1 }}
                  onClick={() => toggleExpanded(item.id)}
                  onKeyDown={(event) => {
                    if (event.key === " " || event.key === "Spacebar") {
                      event.preventDefault();
                      toggleExpanded(item.id);
                    }
                  }}
                  aria-expanded={isExpanded}
                  aria-controls={panelId}
                >
                  {isExpanded ? "Collapse details" : "Expand details"}
                </Button>

                {isExpanded ? (
                  <Box id={panelId} sx={{ mt: 0.75 }}>
                    <Typography variant="body2">Actor: {actor}</Typography>
                    <Typography variant="body2">Transition: {transition}</Typography>
                    <Typography variant="body2">Rationale: {rationale}</Typography>
                  </Box>
                ) : null}
              </Box>
            );
          })}
        </Box>
      )}
    </Box>
  );
}
