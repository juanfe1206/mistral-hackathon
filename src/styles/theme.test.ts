import { describe, it, expect } from "vitest";
import theme from "./theme";
import {
  PALETTE_PRIMARY,
  PALETTE_ACCENT,
  PALETTE_SURFACE,
  PALETTE_TEXT,
  PALETTE_SUCCESS_MAIN,
  PALETTE_WARNING_MAIN,
  PALETTE_ERROR_MAIN,
  PALETTE_INFO_MAIN,
  SPACING_BASE_PX,
  TYPOGRAPHY_HEADING_FONT_FAMILY,
  TYPOGRAPHY_BODY_FONT_FAMILY,
} from "./tokens";

/** Relative luminance (0–1) per WCAG. */
function relativeLuminance(hex: string): number {
  const n = parseInt(hex.slice(1), 16);
  const r = (n >> 16) / 255;
  const g = ((n >> 8) & 0xff) / 255;
  const b = (n & 0xff) / 255;
  const [rl, gl, bl] = [r, g, b].map((c) =>
    c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
  );
  return 0.2126 * rl + 0.7162 * gl + 0.0722 * bl;
}

/** Contrast ratio (WCAG); L1 = lighter, L2 = darker. */
function contrastRatio(hexForeground: string, hexBackground: string): number {
  const L1 = relativeLuminance(hexForeground);
  const L2 = relativeLuminance(hexBackground);
  const [light, dark] = L1 >= L2 ? [L1, L2] : [L2, L1];
  return (light + 0.05) / (dark + 0.05);
}

const WCAG_AA_LARGE_TEXT_MIN = 3;

describe("theme", () => {
  it("exposes Editorial Premium palette as palette.primary.main and palette.secondary.main", () => {
    expect(theme.palette.primary.main).toBe(PALETTE_PRIMARY);
    expect(theme.palette.secondary.main).toBe(PALETTE_ACCENT);
  });

  it("uses Surface and Text tokens for background and text", () => {
    expect(theme.palette.background.default).toBe(PALETTE_SURFACE);
    expect(theme.palette.text.primary).toBe(PALETTE_TEXT);
  });

  it("defines status semantic colors (success, warning, error, info) with accessible contrast", () => {
    expect(theme.palette.success.main).toBe(PALETTE_SUCCESS_MAIN);
    expect(theme.palette.warning.main).toBe(PALETTE_WARNING_MAIN);
    expect(theme.palette.error.main).toBe(PALETTE_ERROR_MAIN);
    expect(theme.palette.info.main).toBe(PALETTE_INFO_MAIN);
  });

  it("meets WCAG AA contrast for status (white on status background ≥ 3:1 for large text/graphics)", () => {
    const statusHexes = [
      PALETTE_SUCCESS_MAIN,
      PALETTE_WARNING_MAIN,
      PALETTE_ERROR_MAIN,
      PALETTE_INFO_MAIN,
    ];
    const white = "#ffffff";
    for (const hex of statusHexes) {
      const ratio = contrastRatio(white, hex);
      expect(ratio).toBeGreaterThanOrEqual(WCAG_AA_LARGE_TEXT_MIN);
    }
  });

  it("uses 8px base unit for spacing", () => {
    expect(theme.spacing(1)).toBe(`${SPACING_BASE_PX}px`);
    expect(theme.spacing(2)).toBe(`${SPACING_BASE_PX * 2}px`);
  });

  it("configures typography with heading and body font families", () => {
    expect(theme.typography.fontFamily).toBe(TYPOGRAPHY_BODY_FONT_FAMILY);
    expect(theme.typography.h1.fontFamily).toBe(TYPOGRAPHY_HEADING_FONT_FAMILY);
    expect(theme.typography.body1.fontFamily).toBe(TYPOGRAPHY_BODY_FONT_FAMILY);
  });

  it("sets breakpoints for 12-col desktop (1024+) and 4-col mobile (320-767)", () => {
    expect(theme.breakpoints.values.lg).toBe(1024);
    expect(theme.breakpoints.values.sm).toBe(320);
    expect(theme.breakpoints.values.md).toBe(768);
  });
});
