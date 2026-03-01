# Story 4.2: Implement Phase 2 Risk & Recovery Components

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a salon operator,
I want at-risk pulse and reply composer to match the UX spec (AtRiskPulseBanner, ConciergeReplyComposer),
so that risk escalation and recovery actions feel clear and premium.

## Acceptance Criteria

1. **Given** the UX spec for AtRiskPulseBanner and ConciergeReplyComposer
   **When** Phase 2 components are implemented
   **Then** AtRiskPulseBanner surfaces pulse indicator, risk cause, elapsed time, and recovery CTA with correct states
   **And** ConciergeReplyComposer supports draft, tone, confidence marker, and approve/send with policy gate behavior

2. **Given** at-risk and reply flows
   **When** I use these components
   **Then** accessibility (labels, keyboard shortcuts, status announcements) matches spec
   **And** variants (inline vs modal, quick vs full mode) work per breakpoint

## Tasks / Subtasks

- [x] Task 1: Build AtRiskPulseBanner component (AC: #1, #2)
  - [x] Create `src/features/risk-pulse/components/AtRiskPulseBanner.tsx`
  - [x] Implement anatomy: pulse indicator, risk cause, elapsed time, CTA for recovery actions
  - [x] Implement states: monitoring, escalated, acknowledged, resolved
  - [x] Implement variants: inline card banner and sticky top strip
  - [x] Include non-color urgency cues (icon + text), live region announcement behavior, and keyboard-operable CTAs
- [x] Task 2: Build ConciergeReplyComposer component (AC: #1, #2)
  - [x] Create `src/features/reply-composer/components/ConciergeReplyComposer.tsx`
  - [x] Support draft generation, manual edit, tone selector, confidence marker, approve/send controls
  - [x] Implement policy gate UI for VIP/high-risk leads (explicit approval before send)
  - [x] Implement modes: quick mode (inline) and full mode (modal fallback on smaller screens)
  - [x] Implement states: drafting, generated, edited, pending approval, sent, failed
- [x] Task 3: Integrate components into at-risk and lead-detail flows (AC: #1, #2)
  - [x] Replace at-risk page alert blocks in `src/app/(dashboard)/at-risk/page.tsx` with AtRiskPulseBanner usage
  - [x] Replace lead-detail inline recovery block in `src/app/(dashboard)/lead/[id]/page.tsx` with ConciergeReplyComposer
  - [x] Wire components to existing APIs: `/api/risk-pulses`, `/api/replies/generate`, `/api/leads/[id]/approve-reply`, `/api/leads/[id]/mark-lifecycle`
  - [x] Preserve existing retry/failure behavior (NFR10) and audit-logged approval/send flow (NFR8)
- [x] Task 4: Accessibility and responsive compliance (AC: #2)
  - [x] Ensure keyboard paths for generate/approve/send/mark lifecycle actions
  - [x] Ensure status changes are announced (`aria-live`) and status does not rely on color only (NFR13)
  - [x] Ensure touch targets are at least 44px for mobile controls (NFR12)
  - [x] Validate inline vs modal and quick vs full mode behavior across breakpoints
- [x] Task 5: Tests and regression guardrails (AC: #1, #2)
  - [x] Add unit tests for AtRiskPulseBanner states/variants
  - [x] Add unit tests for ConciergeReplyComposer policy-gate states and action transitions
  - [x] Add integration coverage for lead-detail flow using generate/approve/send policy branches
  - [x] Verify existing triage and SLA component behavior remains stable

## Dev Notes

- **Architecture:** Keep domain components in feature folders (`src/features/risk-pulse/components/`, `src/features/reply-composer/components/`). Shared cross-feature primitives remain in `src/components/`.
- **Current flow baseline:** `src/app/(dashboard)/at-risk/page.tsx` and `src/app/(dashboard)/lead/[id]/page.tsx` currently implement risk and recovery UX with inline styles and ad hoc controls. Story 4.2 replaces this with reusable, spec-aligned components.
- **API contracts already exist:** Use current server contracts rather than creating parallel endpoints:
  - `GET /api/risk-pulses`
  - `POST /api/replies/generate`
  - `POST /api/leads/[id]/approve-reply`
  - `POST /api/leads/[id]/mark-lifecycle`
- **Data and policy constraints:** Approval gating logic is already enforced in `approval-service` for VIP/high-risk. UI must reflect the same rule without duplicating divergent logic.
- **MVP guardrail:** Stay scoped to Phase 2 UX componentization and flow alignment. Do not introduce Phase 3 timeline/governance component work.

### Project Structure Notes

- New component paths should align with architecture feature boundaries:
  - `src/features/risk-pulse/components/AtRiskPulseBanner.tsx`
  - `src/features/reply-composer/components/ConciergeReplyComposer.tsx`
- Existing pages to update:
  - `src/app/(dashboard)/at-risk/page.tsx`
  - `src/app/(dashboard)/lead/[id]/page.tsx`
- Existing service and route layers remain source of truth for behavior:
  - `src/server/services/reply-service.ts`
  - `src/server/services/approval-service.ts`
  - `src/app/api/replies/generate/route.ts`
  - `src/app/api/leads/[id]/approve-reply/route.ts`

### References

- [Source: _bmad-output/planning-artifacts/ux-design-specification.md — Component Strategy: AtRiskPulseBanner, ConciergeReplyComposer; Implementation Roadmap Phase 2; Accessibility Baseline]
- [Source: _bmad-output/planning-artifacts/epics.md — Epic 4, Story 4.2 acceptance criteria]
- [Source: _bmad-output/planning-artifacts/architecture.md — Frontend architecture boundaries, feature-first structure, MUI theming constraints]
- [Source: _bmad-output/implementation-artifacts/4-1-implement-phase-1-journey-components.md — Phase 1 conventions and component integration patterns]

---

## Developer Context (Implementation Guardrails)

### Technical Requirements

- **AtRiskPulseBanner contract:**
  - Inputs should include risk reason, detected timestamp, lifecycle state, and actions (recover/lost/open composer).
  - Display elapsed time since detection and a clear recovery CTA.
  - Support states `monitoring | escalated | acknowledged | resolved` and render non-color state cues.
- **ConciergeReplyComposer contract:**
  - Support generate draft, edit draft, choose tone, view confidence marker, approve, and send.
  - For `vip` or `high` priority, block send until approval state is reached.
  - For `low` priority, allow direct send path while preserving audit action behavior.
  - Expose quick mode (inline) and full mode (modal) while keeping one source of state truth.
- **Lifecycle controls:**
  - Preserve existing recovered/lost actions and integrate them as contextual actions near AtRiskPulseBanner.
  - Keep UI state resilient to API failures; expose retry-capable error affordances.
- **Styling and theming:**
  - Use MUI theme tokens from Story 4.0 (`src/styles/theme.ts`, `src/styles/tokens.ts`), not raw ad hoc color literals.
  - Use status palette semantics with icon+text labels for accessibility compliance.

### Architecture Compliance

- **Naming:** Components and files in PascalCase; feature hooks/helpers in camelCase.
- **Boundary rules:** Route handlers call services; components should not directly embed server logic.
- **No duplicate flows:** Reuse existing endpoints/services for generate/approve/send and lifecycle updates.
- **Data shape discipline:** Keep snake_case at API boundary and component-facing types explicit in UI layer.

### Library & Framework Requirements

- **Next.js App Router + React 19:** keep current client/server component split and route conventions.
- **MUI v7 (`@mui/material`):** use Box/Card/Alert/Dialog/Chip/Button/TextField with `sx` and theme usage.
- **No new UI framework dependencies:** stay within existing MUI + Emotion stack.

### File Structure Requirements

- `src/features/risk-pulse/components/AtRiskPulseBanner.tsx` (new)
- `src/features/risk-pulse/components/AtRiskPulseBanner.test.tsx` (new)
- `src/features/reply-composer/components/ConciergeReplyComposer.tsx` (new)
- `src/features/reply-composer/components/ConciergeReplyComposer.test.tsx` (new)
- `src/app/(dashboard)/at-risk/page.tsx` (modify to compose AtRiskPulseBanner)
- `src/app/(dashboard)/lead/[id]/page.tsx` (modify to compose ConciergeReplyComposer + lifecycle actions)

### Testing Requirements

- **Unit tests:**
  - AtRiskPulseBanner: state/variant rendering, CTA callbacks, accessibility labels.
  - ConciergeReplyComposer: draft lifecycle, policy gate logic, quick/full mode rendering.
- **Integration tests:**
  - Lead detail recovery flow: generate -> approve (VIP/high) -> send.
  - Low-priority flow: generate/edit -> send without approval.
- **Regression checks:**
  - Ensure existing APIs and approval-service semantics are unchanged.
  - Ensure triage and at-risk navigation flows still work end-to-end.

### Previous Story Intelligence (4.1)

- Story 4.1 established componentized triage conventions and MUI-first patterns.
- Reuse these patterns for 4.2:
  - Feature-scoped components for domain UI
  - Theme-driven styling and status semantics
  - Explicit accessibility support (keyboard, aria-labels, non-color cues)
- Avoid reintroducing inline-style-only patterns for core workflow surfaces.

### Git Intelligence Summary

- Recent commits focused on UX/story artifacts and Phase 1 components (`triage/page.tsx`, `LeadPriorityCard`, `QueueFilterBar`, `SLASafetyIndicator`).
- Current repository already includes service and API support for recovery generation and approval-gated send; 4.2 should focus on UI component alignment and integration, not backend redesign.

### Latest Tech Information

- Project currently runs on:
  - `next` 16.1.6
  - `react` / `react-dom` 19.2.3
  - `@mui/material` 7.3.8
- Implementation should follow this installed stack and avoid introducing patterns incompatible with these versions.

### Project Context Reference

- No `project-context.md` file detected. Story context derived from epics, PRD, architecture, UX specification, and implementation artifacts.

### Story Completion Status

- **Status:** done
- **Completion note:** Ultimate context engine analysis completed - comprehensive developer guide created for Phase 2 risk and recovery components with explicit integration and accessibility guardrails.

## Dev Agent Record

### Agent Model Used

GPT-5 Codex

### Debug Log References

### Completion Notes List

- 2026-03-01: Story created via create-story workflow. Target: Phase 2 UX components (AtRiskPulseBanner and ConciergeReplyComposer), integrated with existing risk/reply approval APIs and lifecycle controls.
- Checklist validation pass applied: reinforced anti-reinvention guardrails (reuse of existing routes/services), explicit accessibility acceptance mapping, and responsive variant requirements.
- 2026-03-01: Implemented `AtRiskPulseBanner` with monitoring/escalated/acknowledged/resolved states, elapsed-time display, inline + sticky variants, non-color urgency cues, live status labels, and keyboard-operable CTA actions.
- 2026-03-01: Implemented `ConciergeReplyComposer` with tone selection, confidence marker, generate/approve/send controls, VIP/high approval gate behavior, quick/full modes, and mobile full-mode modal fallback.
- 2026-03-01: Replaced at-risk and lead-detail inline risk/recovery blocks with reusable feature components while preserving existing API integrations and retry/error handling.
- 2026-03-01: Added unit and integration tests covering banner variants/states, composer policy transitions, and lead-detail recovery branches (generate->approve->send and direct send). Full regression suite passed.

### File List

- _bmad-output/implementation-artifacts/4-2-implement-phase-2-risk-recovery-components.md (modified)
- _bmad-output/implementation-artifacts/sprint-status.yaml (modified, story status)
- src/features/risk-pulse/components/AtRiskPulseBanner.tsx (new)
- src/features/risk-pulse/components/AtRiskPulseBanner.test.tsx (new)
- src/features/reply-composer/components/ConciergeReplyComposer.tsx (new)
- src/features/reply-composer/components/ConciergeReplyComposer.test.tsx (new)
- src/app/(dashboard)/at-risk/page.tsx (modified)
- src/app/(dashboard)/lead/[id]/page.tsx (modified)
- tests/integration/lead-detail-recovery-flow.test.tsx (new)

## Change Log

- 2026-03-01: Added Phase 2 risk/recovery UI components and integrated them into at-risk and lead-detail flows with accessibility and policy-gated send behavior.
- 2026-03-01: Added unit + integration coverage for component states, transitions, and recovery policy branches; verified with full test and lint runs.
