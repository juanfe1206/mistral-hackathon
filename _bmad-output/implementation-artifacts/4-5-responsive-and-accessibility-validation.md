# Story 4.5: Responsive and Accessibility Validation

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a product owner,
I want the prototype validated for responsive behavior and WCAG 2.2 AA,
so that we can confidently demo on mobile and desktop and meet accessibility commitments.

## Acceptance Criteria

1. **Given** breakpoint strategy (mobile 320-767, tablet 768-1023, desktop 1024+)
   **When** views are tested across breakpoints
   **Then** layout and interaction logic are consistent and meet spec
   **And** touch targets are at least 44px on mobile

2. **Given** WCAG 2.2 AA and UX spec accessibility baseline
   **When** accessibility is validated
   **Then** contrast, keyboard operability, and non-color status cues are confirmed
   **And** screen-reader announcements for risk/SLA updates work
   **And** the "top 3 in 10 seconds" scenario is validated on desktop and mobile

## Tasks / Subtasks

- [ ] Task 1: Build a responsive validation matrix for core flows (AC: #1, #2)
  - [ ] Validate `triage`, `at-risk`, and `lead/[id]` at 320, 375, 768, 1024, and 1280 widths
  - [ ] Confirm CTA order and interaction logic are unchanged across breakpoints
  - [ ] Confirm no clipping/overflow for reason tags, SLA indicators, pulse banners, and composer controls
- [ ] Task 2: Enforce mobile touch and layout requirements (AC: #1)
  - [ ] Verify critical interactive controls are >=44px in mobile variants
  - [ ] Tighten spacing/layout where needed without introducing a new design system
  - [ ] Ensure triage hierarchy keeps "Top urgent" visible and scannable on mobile and desktop
- [ ] Task 3: Validate keyboard and screen-reader behavior in critical flows (AC: #2)
  - [ ] Verify keyboard-only operation for queue filtering, lead actions, and recovery actions
  - [ ] Confirm focus visibility/order and escape behavior for overlays/drawers
  - [ ] Ensure risk/SLA updates are announced with accessible text semantics, not color alone
- [ ] Task 4: Validate contrast and non-color status cues (AC: #2)
  - [ ] Confirm warning/error/safe states meet WCAG 2.2 AA contrast expectations
  - [ ] Confirm icons/labels accompany color for risk and SLA states
  - [ ] Confirm status text remains understandable in color-blind simulation
- [ ] Task 5: Add regression tests and validation evidence (AC: #1, #2)
  - [ ] Add/update component and integration tests for responsive and keyboard behavior
  - [ ] Add assertions for landmarks/roles/labels on triage and at-risk surfaces
  - [ ] Add a concise validation checklist artifact documenting pass/fail by breakpoint and a11y scenario

## Dev Notes

- **Story intent:** This is a validation + hardening story, not a net-new feature story.
- **Scope boundary:** Only adjust code needed to satisfy responsive/a11y requirements from the UX spec and existing Epic 4 component contracts.
- **Primary surfaces to validate and patch:**
  - `src/app/(dashboard)/triage/page.tsx`
  - `src/app/(dashboard)/at-risk/page.tsx`
  - `src/app/(dashboard)/lead/[id]/page.tsx`
- **Primary component targets for accessibility verification:**
  - `src/features/triage/components/LeadPriorityCard.tsx`
  - `src/features/triage/components/QueueFilterBar.tsx`
  - `src/components/SLASafetyIndicator.tsx`
  - `src/features/risk-pulse/components/AtRiskPulseBanner.tsx`
  - `src/features/reply-composer/components/ConciergeReplyComposer.tsx`
  - `src/features/governance/components/DecisionTimeline.tsx`

### Project Structure Notes

- Follow existing feature-first structure and avoid ad hoc UI logic in page files when behavior belongs in reusable components.
- Keep route -> service -> repository boundaries intact for any API-related accessibility state changes.
- Add automated coverage in existing test suites:
  - `tests/integration/*.test.tsx`
  - `src/features/**/components/*.test.tsx`
  - `tests/components/*.test.tsx`
- If manual validation evidence is added, store it in `_bmad-output/implementation-artifacts/` with Story 4.5 naming.

### References

- [Source: _bmad-output/planning-artifacts/epics.md - Epic 4, Story 4.5 acceptance criteria]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md - Responsive strategy, breakpoint strategy, accessibility strategy, testing strategy]
- [Source: _bmad-output/planning-artifacts/architecture.md - Frontend boundaries, testing standards, consistency rules]
- [Source: _bmad-output/implementation-artifacts/4-4-align-triage-and-at-risk-flows-to-spec.md - Prior Epic 4 integration baseline]

---

## Developer Context (Implementation Guardrails)

### Technical Requirements

- Validate against declared breakpoints: 320-767 (mobile), 768-1023 (tablet), 1024+ (desktop).
- Preserve the "top 3 urgent leads in under 10 seconds" behavior and visual hierarchy.
- Ensure all critical actions are keyboard operable and include visible focus states.
- Ensure risk/SLA semantics are communicated by text/icon plus color.
- Ensure dynamic risk/SLA state changes are announced accessibly (appropriate live region semantics where required).

### Architecture Compliance

- Keep App Router page composition consistent with existing Epic 4 implementation.
- Reuse and patch existing components instead of creating duplicates.
- Keep API payload and error-envelope patterns unchanged unless a schema-backed change is required.
- Keep test updates coupled to behavior changes in the same PR.

### Library & Framework Requirements

- Use project-pinned stack:
  - `next` 16.1.6
  - `react` / `react-dom` 19.2.3
  - `@mui/material` 7.3.8
- Keep MUI-based implementation patterns from Story 4.0+.
- Do not introduce a second UI framework.

### File Structure Requirements

- Page-level validation/hardening:
  - `src/app/(dashboard)/triage/page.tsx`
  - `src/app/(dashboard)/at-risk/page.tsx`
  - `src/app/(dashboard)/lead/[id]/page.tsx`
- Component-level fixes only where behavior is shared:
  - `src/features/triage/components/*`
  - `src/features/risk-pulse/components/*`
  - `src/features/reply-composer/components/*`
  - `src/components/SLASafetyIndicator.tsx`
- Testing:
  - `tests/integration/*`
  - `src/features/**/components/*.test.tsx`
  - `tests/components/*`

### Testing Requirements

- Responsive:
  - Validate component/page behavior at representative breakpoint widths.
  - Verify no hidden primary actions in mobile compact variants.
- Accessibility:
  - Validate keyboard path for filter -> lead -> recovery -> approve/send.
  - Validate semantic landmarks/lists/labels and screen-reader-friendly status text.
  - Validate contrast and non-color status cues for SLA/risk states.
- Regression:
  - Keep existing Epic 4 flow tests passing and extend for new checks.

### Previous Story Intelligence

- Story 4.4 aligned triage and at-risk flows to spec using existing Epic 4 components.
- Key implication for 4.5: prioritize validation and small hardening fixes; do not redesign flow architecture.
- Preserve existing flow-entry points and integration patterns:
  - triage -> lead detail
  - at-risk -> lead detail recovery
  - decision timeline visibility in lead detail

### Git Intelligence Summary

- Recent commits show stable pattern:
  - implement feature component contracts first
  - integrate in dashboard pages
  - add integration/component tests in the same iteration
- Continue this pattern for 4.5 to minimize regressions and review churn.

### Latest Tech Information

- Next.js 16 is the current major line for this project context; project is already on `16.1.6`.
- React 19.2 is current in this codebase; React published late-2025/early-2026 RSC vulnerability advisories with patch guidance, so keep React dependencies fully patched within 19.2.x line when touching related areas.
- Material UI v7 is the active supported major line; this repo is already on `@mui/material` 7.3.8.
- WCAG 2.2 has been a W3C Recommendation since October 5, 2023 and is the target baseline for this story.

### Project Context Reference

- No `project-context.md` file detected. Context derived from epics, PRD, architecture, UX specification, and Epic 4 implementation artifacts.

### Story Completion Status

- **Status:** ready-for-dev
- **Completion note:** Ultimate context engine analysis completed - comprehensive developer guide created

## Dev Agent Record

### Agent Model Used

GPT-5 Codex

### Debug Log References

- Workflow executed from `_bmad/bmm/workflows/4-implementation/create-story/workflow.yaml`
- Target story auto-discovered from `sprint-status.yaml`: `4-5-responsive-and-accessibility-validation`

### Completion Notes List

- 2026-03-01: Story created via create-story workflow in automated mode.
- 2026-03-01: Consolidated context from epics, PRD, architecture, UX design, previous Epic 4 story artifact, and recent git history.
- 2026-03-01: Added responsive/a11y validation guardrails, implementation boundaries, and testing expectations for Story 4.5.

### File List

- _bmad-output/implementation-artifacts/4-5-responsive-and-accessibility-validation.md (new)
- _bmad-output/implementation-artifacts/sprint-status.yaml (modified, story status)

## Change Log

- 2026-03-01: Story created and set to `ready-for-dev`.
