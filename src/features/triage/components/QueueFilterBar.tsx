"use client";

import {
  Box,
  Chip,
  FormControl,
  InputLabel,
  Select,
  SelectChangeEvent,
  MenuItem,
  useMediaQuery,
  useTheme,
  Drawer,
  Button,
  Skeleton,
  Typography,
} from "@mui/material";
import { useState } from "react";

export type QueueFilterState = "default" | "filter-active" | "sort-active" | "loading" | "no-results";
export type QueueFilterVariant = "horizontal" | "collapsible";

export interface QueueFilterBarFilters {
  priority?: "vip" | "high" | "low";
  lifecycle?: "at_risk" | "recovered" | "lost";
  source?: "whatsapp";
}

export type QueueSortOption =
  | "priority_desc"
  | "created_desc"
  | "sla_soonest";

export interface QueueFilterBarProps {
  filters: QueueFilterBarFilters;
  sort: QueueSortOption;
  onFiltersChange: (filters: QueueFilterBarFilters) => void;
  onSortChange: (sort: QueueSortOption) => void;
  state?: QueueFilterState;
  variant?: QueueFilterVariant;
  loading?: boolean;
  noResults?: boolean;
}

const SORT_OPTIONS: { value: QueueSortOption; label: string }[] = [
  { value: "priority_desc", label: "Priority (high first)" },
  { value: "created_desc", label: "Newest first" },
  { value: "sla_soonest", label: "SLA soonest" },
];

const PRIORITY_OPTIONS: { value: QueueFilterBarFilters["priority"]; label: string }[] = [
  { value: "vip", label: "VIP" },
  { value: "high", label: "High" },
  { value: "low", label: "Low" },
];

const LIFECYCLE_OPTIONS: { value: QueueFilterBarFilters["lifecycle"]; label: string }[] = [
  { value: "at_risk", label: "At Risk" },
  { value: "recovered", label: "Recovered" },
  { value: "lost", label: "Lost" },
];

const SOURCE_OPTIONS: { value: QueueFilterBarFilters["source"]; label: string }[] = [
  { value: "whatsapp", label: "WhatsApp" },
];

export function QueueFilterBar({
  filters,
  sort,
  onFiltersChange,
  onSortChange,
  state = "default",
  loading = false,
  noResults = false,
}: QueueFilterBarProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [drawerOpen, setDrawerOpen] = useState(false);

  const hasActiveFilters =
    filters.priority != null || filters.lifecycle != null || filters.source != null;
  const activeFilterCount = [filters.priority, filters.lifecycle, filters.source].filter(Boolean).length;

  const handleSortChange = (e: SelectChangeEvent<QueueSortOption>) => {
    onSortChange(e.target.value as QueueSortOption);
  };

  const handlePriorityClick = (value: QueueFilterBarFilters["priority"]) => {
    onFiltersChange({ ...filters, priority: filters.priority === value ? undefined : value });
  };

  const handleLifecycleClick = (value: QueueFilterBarFilters["lifecycle"]) => {
    onFiltersChange({ ...filters, lifecycle: filters.lifecycle === value ? undefined : value });
  };

  const handleSourceClick = (value: QueueFilterBarFilters["source"]) => {
    onFiltersChange({ ...filters, source: filters.source === value ? undefined : value });
  };

  const handleReset = () => {
    onFiltersChange({});
    onSortChange("priority_desc");
  };

  const chipSize = isMobile ? "medium" : "small";
  const chipSx = isMobile ? { minWidth: 44, minHeight: 44 } : undefined;

  const filterContent = loading ? (
    <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 1, py: 1 }}>
      <Skeleton variant="rounded" width={60} height={32} />
      <Skeleton variant="rounded" width={80} height={32} />
      <Skeleton variant="rounded" width={100} height={32} />
      <Skeleton variant="rounded" width={160} height={40} />
    </Box>
  ) : (
    <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 1, py: 1 }}>
      {noResults && (
        <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>
          No results match filters
        </Typography>
      )}
      <Chip
        label="All"
        onClick={() => handlePriorityClick(undefined)}
        role="button"
        aria-label="Filter by all priorities"
        aria-pressed={!filters.priority}
        color={!filters.priority ? "primary" : "default"}
        variant={!filters.priority ? "filled" : "outlined"}
        size={chipSize}
        sx={chipSx}
        disabled={loading}
      />
      {PRIORITY_OPTIONS.map((opt) => (
        <Chip
          key={opt.value}
          label={opt.label}
          onClick={() => handlePriorityClick(opt.value)}
          role="button"
          aria-label={`Filter by ${opt.label} priority`}
          aria-pressed={filters.priority === opt.value}
          color={filters.priority === opt.value ? "primary" : "default"}
          variant={filters.priority === opt.value ? "filled" : "outlined"}
          size={chipSize}
          sx={chipSx}
          disabled={loading}
        />
      ))}
      {LIFECYCLE_OPTIONS.map((opt) => (
        <Chip
          key={opt.value}
          label={opt.label}
          onClick={() => handleLifecycleClick(opt.value)}
          role="button"
          aria-label={`Filter by lifecycle: ${opt.label}`}
          aria-pressed={filters.lifecycle === opt.value}
          color={filters.lifecycle === opt.value ? "primary" : "default"}
          variant={filters.lifecycle === opt.value ? "filled" : "outlined"}
          size={chipSize}
          sx={chipSx}
          disabled={loading}
        />
      ))}
      {SOURCE_OPTIONS.map((opt) => (
        <Chip
          key={opt.value}
          label={opt.label}
          onClick={() => handleSourceClick(opt.value)}
          role="button"
          aria-label={`Filter by source: ${opt.label}`}
          aria-pressed={filters.source === opt.value}
          color={filters.source === opt.value ? "primary" : "default"}
          variant={filters.source === opt.value ? "filled" : "outlined"}
          size={chipSize}
          sx={chipSx}
          disabled={loading}
        />
      ))}
      <FormControl size="small" sx={{ minWidth: 160 }} disabled={loading}>
        <InputLabel id="queue-sort-label">Sort by</InputLabel>
        <Select
          labelId="queue-sort-label"
          id="queue-sort"
          value={sort}
          label="Sort by"
          onChange={handleSortChange}
          aria-label="Sort queue"
        >
          {SORT_OPTIONS.map((opt) => (
            <MenuItem key={opt.value} value={opt.value}>
              {opt.label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      {hasActiveFilters && (
        <Button size="small" onClick={handleReset} aria-label="Reset filters" disabled={loading} sx={isMobile ? { minWidth: 44, minHeight: 44 } : undefined}>
          Reset
        </Button>
      )}
    </Box>
  );

  if (isMobile) {
    return (
      <>
        <Button
          onClick={() => setDrawerOpen(true)}
          aria-label="Open filter options"
          aria-expanded={drawerOpen}
          variant="outlined"
          size="small"
          sx={{ minWidth: 44, minHeight: 44 }}
          disabled={loading}
        >
          {activeFilterCount > 0 ? `Filters (${activeFilterCount})` : "Filters"}
        </Button>
        <Drawer
          anchor="bottom"
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          PaperProps={{ sx: { borderTopLeftRadius: 12, borderTopRightRadius: 12 } }}
        >
          <Box sx={{ p: 2 }}>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                mb: 1,
              }}
            >
              <Typography variant="subtitle2">Filters and sort</Typography>
              <Button
                onClick={() => setDrawerOpen(false)}
                size="small"
                sx={{ minWidth: 44, minHeight: 44 }}
              >
                Done
              </Button>
            </Box>
            {filterContent}
          </Box>
        </Drawer>
      </>
    );
  }

  return (
    <Box
      role="toolbar"
      aria-label="Queue filters and sort"
      sx={{
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        gap: 1,
        py: 1.5,
        px: 0,
      }}
    >
      {filterContent}
    </Box>
  );
}
