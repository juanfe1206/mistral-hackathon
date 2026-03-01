# Story 4.0: Apply Design System Foundation

Status: done



## Story

As a developer,  
I want the app to use the agreed design tokens and MUI theme from the UX spec,  
so that all screens share the premium-concierge visual foundation.

## Acceptance Criteria

1. **Given** the UX Design Specification design system section
  **When** the design system foundation is implemented  
   **Then** Editorial Premium color tokens (Primary, Accent, Surface, Text) are applied  
   **And** typography uses Plus Jakarta Sans (headings) and Inter (body)  
   **And** spacing follows the 8px base unit and layout grid (12-col desktop, 4-col mobile)
2. **Given** MUI is the component base
  **When** theme is configured  
   **Then** custom token layer overrides default Material styling  
   **And** status semantics (success, warning, error, info) are defined and accessible

## Tasks / Subtasks

- [x] Task 1: Design tokens and theme foundation (AC: #1, #2)
  - [x] Define `src/styles/tokens.ts` with Editorial Premium palette, spacing base 8px, typography scale
  - [x] Create `src/styles/theme.ts` using MUI `createTheme()` with token overrides
  - [x] Add status semantic colors (success, warning, error, info) with accessible contrast
- [x] Task 2: Typography and layout (AC: #1)
  - [x] Configure Plus Jakarta Sans (headings) and Inter (body) in theme typography
  - [x] Set breakpoints and grid: 12-col desktop (1024+), 4-col mobile (320–767)
  - [x] Wire theme into app via ThemeProvider in layout
- [x] Task 3: Integration and verification (AC: #1, #2)
  - [x] Ensure globals/layout use theme (no Tailwind); MUI as single styling base
  - [x] Smoke-check one page with tokens applied; confirm status colors and contrast

## Dev Notes

- **Architecture:** Styling is MUI-only; architecture explicitly chose `--no-tailwind` at init. Use `src/styles/tokens.ts` and `src/styles/theme.ts` per project structure. No new Tailwind dependencies.
- **Source tree:** `src/styles/`, `src/app/layout.tsx`, `src/app/globals.css`. Feature components will consume theme via `sx`, `useTheme`, or styled components in later stories.
- **Testing:** Unit tests for theme shape and token values; optional visual regression for one screen. NFR12/NFR13: status must not rely on color alone; document non-color cues for status semantics.

### Project Structure Notes

- Alignment: Architecture defines `src/styles/tokens.ts` and `src/styles/theme.ts`; `src/config/` for runtime config only. Keep design tokens in `src/styles/`.
- No conflicts: Epics 1–3 did not introduce a competing design system; this story establishes the foundation for Epic 4 Phase 1–3 components.

### References

- [Source: _bmad-output/planning-artifacts/ux-design-specification.md — Design System Foundation, Visual Design Foundation, Color System, Typography System, Spacing & Layout]
- [Source: _bmad-output/planning-artifacts/architecture.md — Frontend Architecture, Project Structure, Starter Template (no Tailwind), src/styles/]
- [Source: _bmad-output/planning-artifacts/epics.md — Epic 4, Story 4.0 AC]

---

## Developer Context (Implementation Guardrails)

### Technical Requirements

- **Palette (exact):** Primary `#2D3A3A`, Accent `#B88A44`, Surface `#FAF7F2`, Text `#111111`. Map to MUI `palette.primary`, `palette.secondary` (or custom `palette.accent` via augmentation), background default, and `palette.text.primary`.
- **Typography:** Headings → Plus Jakarta Sans; body/UI → Inter. Load fonts (e.g. next/font/google or link in layout). Set in `theme.typography` (h1–h6, subtitle1/2, body1/2, button, caption).
- **Spacing:** Base unit 8px. Use `theme.spacing()`; MUI default is 8; confirm or set. No arbitrary spacing values; use multiples of 8.
- **Layout grid:** Desktop 12 columns (1024px+), tablet 768–1023, mobile 4 columns (320–767). Use MUI `Grid`/breakpoints; align with UX breakpoint strategy.
- **Status semantics:** Define success, warning, error, info in palette (e.g. `palette.success.main`, etc.) with WCAG AA contrast. Use for alerts, chips, and status indicators; do not rely on color alone—pair with icon/label per NFR13.
- **MUI only:** Do not add Tailwind or other CSS frameworks. Override MUI defaults via `createTheme()` and component overrides if needed.

### Architecture Compliance

- **Naming:** Constants in UPPER_SNAKE_CASE; theme object keys follow MUI conventions.
- **File locations:** `src/styles/tokens.ts` (raw tokens/constants), `src/styles/theme.ts` (createTheme and export). No design tokens in `src/config/`.
- **API/backend:** This story is frontend-only; no API or DB changes.
- **Enforcement:** Theme must be consumed via MUI ThemeProvider; all new UI in later stories will use this theme.

### Library & Framework Requirements

- **MUI (Material UI):** Use current major version in project (v5 or v6). Use `createTheme()` from `@mui/material/styles`. Wrap app with `ThemeProvider` and pass the custom theme. For v6, optional `cssVariables: true` for CSS variables; not required for this story.
- **React/Next.js:** Use App Router layout to provide theme; no class-based components required.
- **Fonts:** Use Next.js font optimization (e.g. `next/font/google`) for Plus Jakarta Sans and Inter to avoid layout shift and respect UX typography spec.

### File Structure Requirements

- `src/styles/tokens.ts`: Export palette hex values, spacing base, breakpoint keys, typography font families. Keep as plain constants for single source of truth.
- `src/styles/theme.ts`: Import tokens, call `createTheme({ palette, typography, spacing, breakpoints, components? })`, export default theme. Use TypeScript; extend Theme interface if adding custom keys (e.g. `accent`).
- `src/app/layout.tsx`: Import theme and ThemeProvider; wrap children with `<ThemeProvider theme={theme}>`. Preserve existing layout structure (e.g. body, metadata).
- `src/app/globals.css`: Only global resets or MUI CssBaseline; no Tailwind directives. Remove any Tailwind imports if present.

### Testing Requirements

- **Unit:** Assert theme object has expected `palette.primary.main`, `palette.secondary` (or accent), typography font families, and spacing multiplier. Optional: snapshot theme shape.
- **Accessibility:** Status colors (success/warning/error/info) must meet contrast ratio (4.5:1 for text, 3:1 for large text/graphics). Document that status indicators will pair with non-color cues in components (Story 4.1+).
- **Manual:** Load app; confirm one page uses theme (e.g. background Surface, primary button color). No visual regression tool required for this story.

### Latest Tech Information (MUI Theming)

- **MUI v5/v6:** `createTheme()` accepts `palette`, `typography`, `spacing`, `breakpoints`, `components`. Use `ThemeProvider` from `@mui/material/styles`. For custom theme keys (e.g. `status`, `accent`), use TypeScript module augmentation on `Theme` and `ThemeOptions`.
- **v6 optional:** `createTheme({ cssVariables: true })` exposes CSS variables (`--mui-`*) for dynamic theming; not required for static premium-concierge theme.
- **Best practice:** Single theme file; one source of truth for tokens; component-level overrides only when needed for specific MUI components.

### Project Context Reference

- No `project-context.md` found in repo. All context from PRD, architecture, UX spec, and epics.

### Story Completion Status

- **Status:** done (see top-level Status)
- **Completion note:** Ultimate context engine analysis completed—comprehensive developer guide created for design system foundation. Epic 4 first story; establishes visual foundation for Phase 1–3 custom components.

## Dev Agent Record

### Agent Model Used

Code review (AI) – fixes applied per adversarial review.

### Debug Log References

### Completion Notes List

- Design tokens in `src/styles/tokens.ts`: Editorial Premium palette (Primary #2D3A3A, Accent #B88A44, Surface #FAF7F2, Text #111111), 8px spacing base, breakpoints (sm 320, md 768, lg 1024), status semantics (success, warning, error, info) with WCAG AA contrast.
- Theme in `src/styles/theme.ts`: createTheme() with token overrides; typography uses Plus Jakarta Sans (headings) and Inter (body) via CSS vars from next/font.
- Layout: ThemeProvider + CssBaseline in `src/app/layout.tsx`; Plus_Jakarta_Sans and Inter loaded with next/font/google.
- Home page smoke-check: MUI Box, Typography, Button, Chips (success/warning/error/info) on `src/app/page.tsx` to verify theme and status colors.
- Unit tests: `src/styles/theme.test.ts` asserts palette, spacing, typography, breakpoints. Status semantics documented for NFR13: components in later stories will pair status with icon/label.
- Fixed pre-existing leads-queue test mock (classifyAndPersistForLead + all leads classified) so full suite passes.

### File List

- src/styles/tokens.ts (new)
- src/styles/theme.ts (new)
- src/styles/theme.test.ts (new)
- src/components/theme/MuiThemeProvider.tsx (new)
- src/app/layout.tsx (modified)
- src/app/globals.css (modified)
- src/app/page.tsx (modified)
- package.json (modified – MUI/Emotion dependencies)
- pnpm-lock.yaml (modified)
- _bmad-output/implementation-artifacts/sprint-status.yaml (modified)
- tests/api/leads-queue.test.ts (modified – mock fix for route auto-classify)

## Change Log

- 2026-03-01: Design system foundation implemented. Added tokens, MUI theme, ThemeProvider in layout, Plus Jakarta Sans/Inter fonts, CssBaseline. Home page smoke-check with status chips. Unit tests for theme. Sprint status set to review.
- 2026-03-01: Code review (AI): File List updated with MuiThemeProvider, package.json, pnpm-lock.yaml; agent placeholder and Story Completion Status fixed; theme tests extended with WCAG AA contrast assertion; unused SPACING_MULTIPLIER removed from tokens.
- 2026-03-01: All review fixes applied. Status set to done; sprint-status synced.

