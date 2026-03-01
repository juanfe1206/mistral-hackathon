# Story 4.3: Implement Phase 3 Governance Component

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a salon operator or support user,
I want the decision timeline to match the UX spec (DecisionTimeline),
so that override, approval, and send history are auditable and clear.

## Acceptance Criteria

1. **Given** the UX spec for DecisionTimeline
   **When** the component is implemented
   **Then** timestamped events show actor, decision rationale, and state transition
   **And** compact and audit-mode variants are available
   **And** expandable entries and filter by event type work as specified

2. **Given** lead detail or support context
   **When** I view the timeline
   **Then** semantic list and `aria-expanded` behavior meet accessibility requirements

## Tasks / Subtasks

- [x] Task 1: Build `DecisionTimeline` component foundation (AC: #1, #2)
  - [x] Create `src/features/governance/components/DecisionTimeline.tsx`
  - [x] Implement anatomy: timestamp, event label/type, actor, rationale, state transition
  - [x] Implement states: normal, flagged, expanded event, empty timeline
  - [x] Implement variants: compact chronological list and detailed audit mode
  - [x] Implement per-entry expand/collapse with keyboard support and correct `aria-expanded`
- [x] Task 2: Add event-type filtering and data mapping (AC: #1)
  - [x] Add event-type filter controls (instant apply, no page reload)
  - [x] Normalize timeline item shape for UI (`event_type`, `occurred_at`, actor, rationale, transition)
  - [x] Ensure unknown/missing fields degrade safely with explicit placeholders
- [x] Task 3: Integrate into lead detail and support contexts (AC: #1, #2)
  - [x] Replace ad hoc timeline/history presentation in `src/app/(dashboard)/lead/[id]/page.tsx` with `DecisionTimeline`
  - [x] Ensure timeline includes governance-relevant events (override, approval, send, lifecycle updates)
  - [x] Keep interaction timeline endpoint usage stable unless additive fields are required
- [x] Task 4: API/service alignment for auditable events (AC: #1)
  - [x] Reuse existing audit and timeline flows (`audit-repository`, `override-service`, `approval-service`, `risk-service`)
  - [x] If required, add additive response fields through existing route/service layers (no parallel endpoints)
  - [x] Preserve existing response envelope and tenant scope behavior
- [x] Task 5: Tests and accessibility guardrails (AC: #1, #2)
  - [x] Add component tests for variants, expansion behavior, and filter interactions
  - [x] Add integration coverage for lead detail timeline render and governance event visibility
  - [x] Assert semantic ordered-list output and keyboard operability for expandable entries

## Dev Notes

- **Primary UX source:** `DecisionTimeline` requirements in UX spec (timestamped events, actor, rationale, transition, compact/audit variants, expandable entries, event-type filtering).
- **Current baseline in app:** `src/app/(dashboard)/lead/[id]/page.tsx` already fetches `/api/leads/[id]/timeline` and renders a basic interaction list; also shows override history separately. Story 4.3 should converge these into one spec-aligned governance timeline experience.
- **Existing backend assets to reuse:** audit event persistence and policy/audit emitters already exist in:
  - `src/server/repositories/audit-repository.ts`
  - `src/server/services/override-service.ts`
  - `src/server/services/approval-service.ts`
  - `src/server/services/risk-service.ts`
- **Scope boundary:** This story is Phase 3 governance UI + integration alignment. Do not redesign reply or risk flows from 4.2 and do not introduce unrelated new domains.

### Project Structure Notes

- Use feature-first component placement consistent with Epic 4:
  - `src/features/governance/components/DecisionTimeline.tsx` (new)
  - `src/features/governance/components/DecisionTimeline.test.tsx` (new)
- Integration target:
  - `src/app/(dashboard)/lead/[id]/page.tsx` (modify existing timeline/history blocks)
- Route/service/repository updates should remain additive and localized:
  - `src/app/api/leads/[id]/timeline/route.ts` (optional additive changes)
  - `src/server/services/*` and `src/server/repositories/*` only if needed to expose missing governance metadata

### References

- [Source: _bmad-output/planning-artifacts/epics.md — Epic 4, Story 4.3 acceptance criteria]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md — DecisionTimeline definition and Phase 3 roadmap]
- [Source: _bmad-output/planning-artifacts/architecture.md — feature-first UI structure, auditable critical actions, testing with each feature change]
- [Source: _bmad-output/implementation-artifacts/4-2-implement-phase-2-risk-recovery-components.md — existing componentization and integration patterns]

---

## Developer Context (Implementation Guardrails)

### Technical Requirements

- **DecisionTimeline contract:**
  - Input items must represent timestamp (`occurred_at`), event type/label, actor, rationale, and state transition.
  - Support expand/collapse details per entry and filter by event type.
  - Render both compact and audit variants without duplicating business logic.
- **Governance event coverage:**
  - Must visibly cover override, approval, send, and lifecycle state-change history.
  - Keep event labels factual and concise; preserve chronology ordering.
- **Accessibility:**
  - Timeline rendered as semantic ordered list.
  - Expandable controls keyboard-operable and synchronized with `aria-expanded`.
  - State and severity signals cannot rely on color-only cues.

### Architecture Compliance

- **Reuse before build:** Extend existing timeline/audit data flows; do not create duplicate repositories/services.
- **Boundary discipline:** API routes -> services -> repositories. No server logic embedded in UI components.
- **Data shape discipline:** Keep API boundary snake_case and map to component types explicitly in UI.

### Library & Framework Requirements

- Current stack in repo:
  - `next` 16.1.6
  - `react` / `react-dom` 19.2.3
  - `@mui/material` 7.3.8
- Use MUI primitives and existing theme tokens from Epic 4; avoid adding new UI libraries.

### File Structure Requirements

- `src/features/governance/components/DecisionTimeline.tsx` (new)
- `src/features/governance/components/DecisionTimeline.test.tsx` (new)
- `src/app/(dashboard)/lead/[id]/page.tsx` (modified)
- `src/app/api/leads/[id]/timeline/route.ts` (optional modified)
- `tests/integration/*` timeline-related integration test updates (modified/new as needed)

### Testing Requirements

- **Unit:** DecisionTimeline variants, empty state, expand/collapse behavior, event-type filtering.
- **Accessibility:** Semantic list structure, keyboard activation, `aria-expanded` correctness, non-color status cues.
- **Integration:** Lead detail timeline shows governance events and remains stable with existing lead detail actions.

### Previous Story Intelligence (4.2)

- Story 4.2 introduced feature-scoped components and replaced ad hoc UI blocks in at-risk/lead detail flows.
- Continue the same approach: componentize governance timeline instead of adding another inline-only block.
- Preserve policy-gate and audit behavior already wired in 4.2; this story focuses on timeline clarity and auditability presentation.

### Git Intelligence Summary

- Recent commits are concentrated on Epic 4 componentization and related integration updates.
- Follow established conventions from those commits: feature-folder components, MUI theme usage, explicit tests.

### Project Context Reference

- No `project-context.md` file detected. Context derived from epics, UX spec, architecture, and implementation artifacts.

### Story Completion Status

- **Status:** ready-for-dev
- **Completion note:** Ultimate context engine analysis completed - comprehensive developer guide created for Phase 3 governance timeline component.

## Dev Agent Record

### Agent Model Used

GPT-5 Codex

### Debug Log References

### Completion Notes List

- 2026-03-01: Story created via create-story workflow. Target: DecisionTimeline component (Phase 3) with auditable, accessible governance history in lead/support contexts.
- 2026-03-01: Implemented `DecisionTimeline` with compact/audit variants, event-type filtering, expandable entries, semantic ordered-list rendering, and non-color flagged cues.
- 2026-03-01: Integrated governance timeline in lead detail page and normalized additive timeline fields (`event_label`, `actor`, `rationale`, `transition`, `source`, `flagged`) from API.
- 2026-03-01: Extended timeline service to merge interaction and audit governance events (override/approval/send/lifecycle/reply-generated) without adding parallel endpoints.
- 2026-03-01: Validation run: `pnpm test` passed (149 tests passed, 1 skipped). `pnpm lint` passed with pre-existing warnings unrelated to this story.

### File List

- _bmad-output/implementation-artifacts/4-3-implement-phase-3-governance-component.md (modified)
- _bmad-output/implementation-artifacts/sprint-status.yaml (modified, story status)
- src/features/governance/components/DecisionTimeline.tsx (new)
- src/features/governance/components/DecisionTimeline.test.tsx (new)
- src/app/(dashboard)/lead/[id]/page.tsx (modified)
- src/app/api/leads/[id]/timeline/route.ts (modified)
- src/server/repositories/audit-repository.ts (modified)
- src/server/services/lead-service.ts (modified)
- tests/api/leads-timeline.test.ts (modified)
- tests/integration/lead-detail-governance-timeline.test.tsx (new)

## Change Log

- 2026-03-01: Story created and set to `ready-for-dev`.
- 2026-03-01: Implemented DecisionTimeline governance UI, merged audit + interaction timeline events, added tests, and moved story to `review`.
