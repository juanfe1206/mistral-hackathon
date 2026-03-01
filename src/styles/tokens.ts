/**
 * Design tokens – Editorial Premium palette and layout.
 * Single source of truth for theme.ts. No design tokens in src/config.
 */

// Editorial Premium palette (UX spec)
export const PALETTE_PRIMARY = "#2D3A3A";
export const PALETTE_ACCENT = "#B88A44";
export const PALETTE_SURFACE = "#FAF7F2";
export const PALETTE_TEXT = "#111111";

// Status semantics – WCAG AA contrast; pair with icon/label (NFR13)
export const PALETTE_SUCCESS_MAIN = "#2e7d32";
export const PALETTE_WARNING_MAIN = "#ed6c02";
export const PALETTE_ERROR_MAIN = "#d32f2f";
export const PALETTE_INFO_MAIN = "#0288d1";

// Spacing (base unit 8px; theme uses this as MUI spacing multiplier)
export const SPACING_BASE_PX = 8;

// Breakpoint keys (px) – mobile-first
export const BREAKPOINT_KEYS = {
  xs: 0,
  sm: 320,
  md: 768,
  lg: 1024,
  xl: 1280,
} as const;

// Typography font families (use CSS vars from next/font in layout for optimized loading)
export const TYPOGRAPHY_HEADING_FONT_FAMILY = "var(--font-heading), \"Plus Jakarta Sans\", sans-serif";
export const TYPOGRAPHY_BODY_FONT_FAMILY = "var(--font-body), \"Inter\", sans-serif";
