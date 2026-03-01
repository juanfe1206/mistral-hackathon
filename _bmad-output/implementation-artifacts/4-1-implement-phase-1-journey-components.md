# Story 4.1: Implement Phase 1 Journey Components

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a salon operator,
I want triage queue and filters to match the UX spec (LeadPriorityCard, QueueFilterBar, SLASafetyIndicator),
so that I can identify top urgent leads quickly with clear hierarchy and feedback.

## Acceptance Criteria

1. **Given** the UX spec component definitions for LeadPriorityCard, QueueFilterBar, SLASafetyIndicator
   **When** Phase 1 components are implemented
   **Then** LeadPriorityCard shows lead identity, urgency level, reason tags, SLA hint, and quick actions with specified states/variants
   **And** QueueFilterBar provides filter chips, sort selector, and instant-apply behavior
   **And** SLASafetyIndicator shows status chip, trend, and time-to-breach with non-color cues

2. **Given** core triage workflows
   **When** I use the queue
   **Then** components meet accessibility requirements (keyboard, aria-labels, focus, touch targets)
   **And** compact (mobile) and standard (desktop) variants behave per spec

## Tasks / Subtasks

- [x] Task 1: LeadPriorityCard component (AC: #1, #2)
  - [x] Create `src/features/triage/components/LeadPriorityCard.tsx` per UX spec anatomy
  - [x] Implement states: default, hover, focused, selected, critical-at-risk, assigned, resolved, disabled
  - [x] Implement variants: compact (mobile), standard (desktop), expanded (with inline details)
  - [x] Surface lead identity, urgency level, reason tags (max 2 primary before overflow), SLA hint, quick actions
  - [x] Use MUI Card primitives; consume theme from `src/styles/theme.ts`
  - [x] Landmark role in list, keyboard focus ring, aria-labels on actions
- [x] Task 2: QueueFilterBar component (AC: #1, #2)
  - [x] Create `src/features/triage/components/QueueFilterBar.tsx`
  - [x] Filter chips (priority, lifecycle, source), sort selector, quick presets, reset control
  - [x] Instant-apply behavior (no full-page reload)
  - [x] Variants: horizontal desktop bar, collapsible mobile drawer trigger
  - [x] States: default, filter-active, sort-active, loading, no-results
  - [x] Keyboard-operable chips and controls; selected-state announcements
- [x] Task 3: SLASafetyIndicator alignment (AC: #1, #2)
  - [x] Align existing `src/components/SLASafetyIndicator.tsx` to UX spec
  - [x] Add status chip, trend arrow, time-to-breach; use theme palette for status semantics
  - [x] Variants: inline chip, summary tile, compact badge
  - [x] States: safe, warning, breach-risk, breached, recovering
  - [x] Non-color cues: icon + text labels per NFR13; use `theme.palette.success/warning/error`
- [x] Task 4: Integrate into triage view (AC: #1, #2)
  - [x] Replace triage page lead blocks with LeadPriorityCard in `src/app/(dashboard)/triage/page.tsx`
  - [x] Add QueueFilterBar as persistent top control; wire filters/sort to lead list
  - [x] Use SLASafetyIndicator variants in triage header and lead cards
  - [x] Ensure "top 3 urgent leads in under 10 seconds" layout and hierarchy

## Dev Notes

- **Architecture:** Feature components in `src/features/triage/components/`. Shared UI (SLASafetyIndicator) in `src/components/`. MUI-only; no Tailwind.
- **Source tree:** `src/features/triage/`, `src/components/SLASafetyIndicator.tsx`, `src/app/(dashboard)/triage/page.tsx`.
- **Existing components:** SLASafetyIndicator exists with LeadSlaIndicator and QueueSlaIndicator; triage page uses raw Link blocks and inline styles. Story 4.1 refactors to UX spec and introduces LeadPriorityCard + QueueFilterBar.
- **Testing:** Unit tests per component; accessibility assertions (axe or manual) for keyboard, aria-labels, focus, touch targets. NFR12/NFR13: non-color status cues.

### Project Structure Notes

- Architecture: `src/features/triage/components/` for triage-domain components; `src/components/` for shared UI.
- Story 4.0 established theme in `src/styles/tokens.ts` and `theme.ts`; use `useTheme()`, `sx`, or styled components. Status semantics: `theme.palette.success`, etc.
- No conflicts: Epics 1–3 triage page is functional; this story replaces it with spec-aligned components.

### References

- [Source: _bmad-output/planning-artifacts/ux-design-specification.md — Component Strategy, LeadPriorityCard, QueueFilterBar, SLASafetyIndicator, Phase 1 Implementation Roadmap, Accessibility Baseline]
- [Source: _bmad-output/planning-artifacts/architecture.md — Frontend Architecture, Naming Conventions, Project Structure, src/features/triage]
- [Source: _bmad-output/planning-artifacts/epics.md — Epic 4, Story 4.1 AC]

---

## Developer Context (Implementation Guardrails)

### Technical Requirements

- **LeadPriorityCard:** Compose from MUI Card, CardContent, CardActions. Props: `lead` (id, source_external_id, source_channel, priority, lifecycle_state, reason_tags, sla_status, created_at), `variant` (compact | standard | expanded), `state` (default | hover | focused | selected | critical-at-risk | assigned | resolved | disabled). Primary action always visible; single click/tap opens inline action panel. Max 2 primary reason tags before overflow (truncate or show "+N").
- **QueueFilterBar:** Filter chips for priority (vip/high/low), lifecycle (at_risk/recovered/lost), source (whatsapp). Sort selector: priority desc, created desc, sla soonest. Instant-apply via callback; no page reload. Mobile: collapsible drawer with trigger button.
- **SLASafetyIndicator:** Use `theme.palette.success.main`, `theme.palette.warning.main`, `theme.palette.error.main` for status colors. Add trend arrow (↑/↓/−) when trend data available. Time-to-breach: "3m to breach" style. Non-color cues: icon + label per NFR13. Variants: `inline` (chip), `summary` (tile), `compact` (badge).
- **MUI:** Project uses `@mui/material` ^7.3.8. Use `ThemeProvider` and theme from `src/components/theme/MuiThemeProvider.tsx`.

### Architecture Compliance

- **Naming:** Components PascalCase (`LeadPriorityCard.tsx`); functions/vars camelCase.
- **File locations:** `src/features/triage/components/LeadPriorityCard.tsx`, `QueueFilterBar.tsx`; `src/components/SLASafetyIndicator.tsx` (shared).
- **API:** Leads from `/api/leads`; SLA from `/api/sla`. Use existing response shapes; no API changes.
- **State:** Triage page may use local state or React Query; filter/sort state preserved across reloads per architecture.

### Library & Framework Requirements

- **MUI v7:** Card, CardContent, CardActions, Chip, IconButton, Select, Drawer, useMediaQuery. Use `sx` or `styled()` with theme.
- **React/Next.js:** App Router; triage page is client component (`"use client"`). Use `useTheme()` for theme access.
- **No new dependencies:** Use existing MUI, React, Next.js.

### File Structure Requirements

- `src/features/triage/components/LeadPriorityCard.tsx`: New. Export `LeadPriorityCard`; props interface; MUI Card composition.
- `src/features/triage/components/QueueFilterBar.tsx`: New. Export `QueueFilterBar`; filter state + callbacks; instant-apply.
- `src/components/SLASafetyIndicator.tsx`: Modify. Add theme usage; trend arrow; variants; ensure NFR13 non-color cues.
- `src/app/(dashboard)/triage/page.tsx`: Modify. Import LeadPriorityCard, QueueFilterBar; replace lead blocks; wire filters/sort.

### Testing Requirements

- **Unit:** LeadPriorityCard renders with lead data and variant; QueueFilterBar applies filters/sort via callbacks; SLASafetyIndicator shows correct status and variant.
- **Accessibility:** Keyboard focus order; aria-labels on buttons/chips; touch targets ≥44px on mobile (NFR12). Status not color-only (NFR13).
- **Manual:** "Top 3 urgent leads in under 10 seconds" scenario on desktop and mobile.

### Previous Story Intelligence (4.0)

- **Design tokens:** `src/styles/tokens.ts` has Editorial Premium palette, 8px spacing, breakpoints (sm 320, md 768, lg 1024), status semantics.
- **Theme:** `src/styles/theme.ts` + `MuiThemeProvider.tsx`. Use `theme.palette.primary`, `theme.palette.secondary` (accent), `theme.palette.success/warning/error/info` for status.
- **Fonts:** Plus Jakarta Sans (headings), Inter (body) via next/font in layout.
- **MUI only:** No Tailwind. Do not add competing styling.
- **Files touched in 4.0:** tokens.ts, theme.ts, MuiThemeProvider.tsx, layout.tsx, globals.css, page.tsx.

### Git Intelligence Summary

- Recent work: design system foundation (4.0), epic 3 SLA/KPI, epic 2 classification/override/at-risk. Triage page and SLASafetyIndicator exist from earlier stories.
- Conventions: MUI for UI; Zod for validation; API response envelope `{ data, error, meta }`; snake_case at API boundary, camelCase in TS.

### Latest Tech Information (MUI v7)

- MUI v7 is in use (`@mui/material` ^7.3.8). Card, Chip, Select, Drawer APIs stable. `sx` prop and `useTheme()` standard.
- Accessibility: Use `aria-label`, `role`, `aria-expanded` per UX spec. Touch targets 44x44px on mobile.

### Project Context Reference

- No `project-context.md` found. Context from PRD, architecture, UX spec, epics.

### Story Completion Status

- **Status:** ready-for-dev (see top-level Status)
- **Completion note:** Ultimate context engine analysis completed—comprehensive developer guide created for Phase 1 journey components. Builds on design system (4.0); replaces triage page with spec-aligned LeadPriorityCard, QueueFilterBar, SLASafetyIndicator.

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

- LeadPriorityCard: MUI Card with lead identity, priority/lifecycle chips, reason tags (max 2 + overflow), LeadSlaIndicator (compact), View action. Variants compact/standard/expanded.
- QueueFilterBar: Filter chips (priority, lifecycle, source), sort selector, reset; instant-apply callbacks. Desktop horizontal bar, mobile collapsible drawer.
- SLASafetyIndicator: Theme palette (success/warning/error), trend arrow support, variants inline/summary/compact, NFR13 icon+text cues.
- Triage page: LeadPriorityCard list, QueueFilterBar, "Top urgent" + "More leads" hierarchy, filter/sort wired.

### File List

- src/features/triage/components/LeadPriorityCard.tsx (new)
- src/features/triage/components/LeadPriorityCard.test.tsx (new)
- src/features/triage/components/QueueFilterBar.tsx (new)
- src/features/triage/components/QueueFilterBar.test.tsx (new)
- src/components/SLASafetyIndicator.tsx (modified)
- src/app/(dashboard)/triage/page.tsx (modified)
- _bmad-output/implementation-artifacts/sprint-status.yaml (modified, when story status updated)

### Change Log

- 2025-03-01: Implemented Phase 1 journey components (LeadPriorityCard, QueueFilterBar, SLASafetyIndicator alignment, triage integration)
- 2026-03-01: Code review fixes (inline action panel, QueueFilterBar loading/noResults, NFR12 touch targets, SLASafetyIndicator sx, redundant role)
