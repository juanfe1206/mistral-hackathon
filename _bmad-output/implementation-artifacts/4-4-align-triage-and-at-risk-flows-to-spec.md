# Story 4.4: Align Triage and At-Risk Flows to Spec

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a salon operator,
I want the triage and at-risk views to use the new components and one-surface actioning,
so that the experience matches the UX spec's flows and feedback patterns.

## Acceptance Criteria

1. **Given** Phase 1-3 components are available
   **When** triage queue and at-risk views are updated
   **Then** lead cards, filter bar, and SLA indicators are used consistently
   **And** at-risk pulse and reply composer are integrated into the flows
   **And** reason tags, feedback (success/warning/error), and action proximity follow the spec

2. **Given** the "top 3 urgent leads in under 10 seconds" goal
   **When** I open the app
   **Then** default view and interaction cost align with UX spec flow optimization principles

## Tasks / Subtasks

- [ ] Task 1: Standardize triage and at-risk surfaces around Epic 4 components (AC: #1, #2)
  - [ ] Ensure `LeadPriorityCard`, `QueueFilterBar`, and `QueueSlaIndicator` remain the default triage interaction primitives
  - [ ] Ensure `AtRiskPulseBanner` is the primary at-risk escalation surface in `at-risk` and lead detail contexts
  - [ ] Remove ad hoc UI fragments that conflict with the UX spec hierarchy and state language
- [ ] Task 2: Implement one-surface actioning across triage and at-risk flows (AC: #1, #2)
  - [ ] Ensure at-risk CTAs route directly to lead recovery context with minimal navigation
  - [ ] Keep critical actions (review, generate draft, approve/send, lifecycle mark) close to the selected lead context
  - [ ] Preserve triage context (filters/sort) during back-and-forth navigation where feasible
- [ ] Task 3: Align feedback and status semantics to the UX spec (AC: #1)
  - [ ] Ensure success/warning/error feedback is explicit and local to the action zone
  - [ ] Ensure reason tags and SLA/risk status use non-color cues and clear labels
  - [ ] Ensure loading/empty/error states are consistent between triage and at-risk surfaces
- [ ] Task 4: Validate responsive and accessibility behavior in updated flows (AC: #1, #2)
  - [ ] Validate keyboard operability for queue filtering, lead actions, and at-risk CTAs
  - [ ] Validate mobile compact and desktop standard variants of critical components
  - [ ] Validate touch target and semantic list/landmark behavior in triage and at-risk views
- [ ] Task 5: Add and update tests for flow alignment regressions (AC: #1, #2)
  - [ ] Add integration tests for triage -> at-risk -> lead detail recovery flow
  - [ ] Add assertions for "top 3 urgent" hierarchy visibility and default action proximity
  - [ ] Add/adjust tests for feedback states and accessibility cues (non-color status, aria labels)

## Dev Notes

- **Epic alignment:** This story is integration-focused for Epic 4 and must reuse already delivered components from stories 4.1, 4.2, and 4.3.
- **Current implementation baseline:**
  - `src/app/(dashboard)/triage/page.tsx` already uses `LeadPriorityCard`, `QueueFilterBar`, and `QueueSlaIndicator`
  - `src/app/(dashboard)/at-risk/page.tsx` already uses `AtRiskPulseBanner`
  - `src/app/(dashboard)/lead/[id]/page.tsx` already includes `AtRiskPulseBanner`, `ConciergeReplyComposer`, and `DecisionTimeline`
- **Primary gap to close:** flow consistency and action proximity across these surfaces (not net-new domain capabilities).
- **Scope boundary:** Do not introduce new platform features or post-MVP scope. Keep changes constrained to UX-flow alignment and consistency.

### Project Structure Notes

- Primary touch points:
  - `src/app/(dashboard)/triage/page.tsx`
  - `src/app/(dashboard)/at-risk/page.tsx`
  - `src/app/(dashboard)/lead/[id]/page.tsx`
- Reuse existing feature components:
  - `src/features/triage/components/LeadPriorityCard.tsx`
  - `src/features/triage/components/QueueFilterBar.tsx`
  - `src/features/risk-pulse/components/AtRiskPulseBanner.tsx`
  - `src/features/reply-composer/components/ConciergeReplyComposer.tsx`
  - `src/features/governance/components/DecisionTimeline.tsx`
- Test targets:
  - `tests/integration/*` for multi-surface flow and hierarchy checks
  - component tests where behavior contracts change

### References

- [Source: _bmad-output/planning-artifacts/epics.md - Epic 4, Story 4.4 acceptance criteria]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md - Journey flows, component strategy, flow optimization, responsive/accessibility]
- [Source: _bmad-output/planning-artifacts/architecture.md - feature-first boundaries, UI consistency, testing expectations]
- [Source: _bmad-output/implementation-artifacts/4-1-implement-phase-1-journey-components.md - triage componentization patterns]
- [Source: _bmad-output/implementation-artifacts/4-2-implement-phase-2-risk-recovery-components.md - at-risk and reply flow componentization]
- [Source: _bmad-output/implementation-artifacts/4-3-implement-phase-3-governance-component.md - decision timeline integration patterns]

---

## Developer Context (Implementation Guardrails)

### Technical Requirements

- Keep triage-first hierarchy explicit, with a visible "Top urgent" segment and immediate actions near each lead.
- Preserve deterministic sorting/filtering behavior and low interaction cost in core triage loops.
- Ensure at-risk escalation consistently routes into recovery actions without unnecessary context switches.
- Ensure feedback semantics are consistent across surfaces:
  - success: clear completion signal and state refresh
  - warning: explicit urgency and next action
  - error: clear cause with direct retry/recovery action

### Architecture Compliance

- Follow route -> service -> repository boundaries for any API/data changes.
- Prefer component composition and prop contracts over duplicating UI logic in route pages.
- Keep API response envelope and tenant-safe patterns intact when extending flow data needs.
- Keep accessibility and test updates coupled to any behavior changes.

### Library & Framework Requirements

- Runtime stack in repo:
  - `next` 16.1.6
  - `react` / `react-dom` 19.2.3
  - `@mui/material` 7.3.8
- Use existing MUI + tokenized theme foundations introduced in Story 4.0.
- Do not add alternative UI frameworks for this story.

### File Structure Requirements

- Page-level alignment updates:
  - `src/app/(dashboard)/triage/page.tsx`
  - `src/app/(dashboard)/at-risk/page.tsx`
  - `src/app/(dashboard)/lead/[id]/page.tsx`
- Component-level updates only when needed for shared behavior consistency:
  - `src/features/triage/components/*`
  - `src/features/risk-pulse/components/*`
  - `src/features/reply-composer/components/*`
- Integration tests under `tests/integration` must cover updated journey behavior.

### Testing Requirements

- Integration coverage for:
  - triage list hierarchy and quick action entry points
  - at-risk escalation list and navigation to recovery surface
  - recovery action loop behavior in lead detail context
- Accessibility coverage for:
  - keyboard operation on filters/actions
  - semantic landmarks/lists in queue-like surfaces
  - non-color status cues for risk/SLA states
- Regression checks for loading/empty/error behavior consistency between triage and at-risk pages.

### Previous Story Intelligence

- **4.1:** Established triage UI primitives (`LeadPriorityCard`, `QueueFilterBar`, SLA indicator) and mobile/desktop variants.
- **4.2:** Established At-Risk and reply composer patterns in live flows.
- **4.3:** Established governance timeline integration and additive data mapping patterns.
- **Implication for 4.4:** Align and consolidate behavior using existing components; avoid rebuilding solved UI blocks.

### Git Intelligence Summary

- Recent commits heavily emphasize Epic 4 componentization, integration, and tests.
- Existing convention is to evolve feature components first, then integrate in page routes with accompanying tests.
- Continue this pattern for Story 4.4 to minimize regressions and maintain consistency.

### Latest Tech Information

- React 19.2 is documented as current stable with updated React docs and security patch updates available in 19.2.x streams.
- Material UI v7 documentation is current and includes dedicated App Router integration guidance for Next.js.
- WCAG 2.2 is the active accessibility baseline to align with this story's validation direction.
- Use the current project-pinned versions unless a deliberate upgrade is scoped and tested in a separate change.

### Project Context Reference

- No `project-context.md` file detected. Context derived from epics, PRD, architecture, UX specification, and Epic 4 implementation artifacts.

### Story Completion Status

- **Status:** ready-for-dev
- **Completion note:** Ultimate context engine analysis completed - comprehensive developer guide created for triage/at-risk flow alignment.

## Dev Agent Record

### Agent Model Used

GPT-5 Codex

### Debug Log References

- Workflow executed from `_bmad/bmm/workflows/4-implementation/create-story/workflow.yaml`
- Target story auto-discovered from `sprint-status.yaml`: `4-4-align-triage-and-at-risk-flows-to-spec`

### Completion Notes List

- 2026-03-01: Story created via create-story workflow in automated mode.
- 2026-03-01: Consolidated Epic 4 context from epics, UX design specification, architecture, previous story artifacts, and recent git history.
- 2026-03-01: Added implementation guardrails, flow-specific tasks, and test expectations for triage and at-risk alignment.

### File List

- _bmad-output/implementation-artifacts/4-4-align-triage-and-at-risk-flows-to-spec.md (new)
- _bmad-output/implementation-artifacts/sprint-status.yaml (modified, story status)

## Change Log

- 2026-03-01: Story created and set to `ready-for-dev`.
