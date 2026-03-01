# Sprint Change Proposal – Proyecto Mistral Hackathon

**Date:** 2026-03-01  
**Workflow:** Correct Course  
**Mode:** Incremental  
**Author:** Lucas (via Correct Course workflow)

---

## 1. Issue Summary

### Problem Statement

The current product prototype delivers a **simplified UX** that does not follow the agreed **UX Design Specification**. The simplification was a deliberate trade-off for hackathon timeline; after reviewing the final prototype, the team decided the result is too simple and wants to align the product with the documented design.

### Context

- **When discovered:** End of implementation, during final prototype review.
- **Root cause:** Time pressure led to implementing minimal UI; UX spec (design system, custom components, visual direction, accessibility) was not fully implemented.
- **Evidence:** UX Design Specification exists and is detailed (custom components, Editorial Premium theme, Hybrid Command direction, Phase 1–3 component roadmap); current UI does not reflect it.

### Category

**New requirement emerged from stakeholders** (post-review decision to raise design bar) combined with **misunderstanding of original requirements** (scope was effectively “ship simple” during build; the spec was always the intended target).

---

## 2. Impact Analysis

### 2.1 Checklist Summary

| Section | Finding |
|--------|---------|
| **1. Trigger & Context** | [x] Done – Trigger: final prototype review. Problem: simple UX vs. UX spec. Evidence: spec exists, prototype doesn’t match. |
| **2. Epic Impact** | [x] Done – No single “trigger” epic; Epics 1–3 delivered simple UI. **Add new Epic 4** for UX & Design Alignment. Epics 1–3 remain valid; no renumbering. |
| **3. Artifact Conflict** | [x] Done – PRD: minor (optional ref to UX alignment). Architecture: already supports MUI/theme; no structural change. UX spec: source of truth; we are aligning to it. Other: optional Storybook/tokens. |
| **4. Path Forward** | [x] Done – **Direct Adjustment** selected. Add Epic 4 + stories. Effort: Medium. Risk: Low. Rollback and MVP scope reduction not needed. |

### 2.2 Epic Impact

- **Epic 1 (MVP Foundation, Ingestion, Ranked Queue):** No scope change. Remains as-is; Epic 4 will apply design to its surfaces later.
- **Epic 2 (AI Prioritization, At-Risk Recovery):** No scope change. Epic 4 will align lead cards, risk pulse, reply composer to spec.
- **Epic 3 (Operational Visibility):** No scope change. Epic 4 will align KPI panel and SLA indicators to spec.
- **New Epic 4 (UX & Design Alignment):** Added to bring UI in line with UX Design Specification (design system, custom components, visual direction, accessibility).

### 2.3 Artifact Impact

- **PRD:** Optional addition: “UI must align with UX Design Specification for MVP demo.” No requirement removal.
- **Architecture:** No structural change. Custom components from UX spec (e.g. `LeadPriorityCard`, `AtRiskPulseBanner`) become explicit in-scope; already compatible with current structure.
- **UX Design Specification:** No change; remains source of truth.
- **Epics document:** Add Epic 4 and its stories (see Section 4).

### 2.4 Recommended Approach

- **Option chosen:** Direct Adjustment (add Epic 4 and design-focused stories).
- **Rationale:** Delivers against existing UX spec without redoing Epics 1–3. Clear scope, medium effort, low risk. Keeps MVP achievable and improves demo quality.

---

## 3. Detailed Change Proposals

*(Proposals are added incrementally; each presented for Approve [a] / Edit [e] / Skip [s].)*

### Change 1: Add Epic 4 – UX & Design Alignment

**Artifact:** `_bmad-output/planning-artifacts/epics.md`

**Type:** Epic addition

**Proposed addition (after Epic 3):**

```markdown
## Epic 4: UX & Design Alignment

Users experience the product as specified in the UX Design Specification: premium-concierge theme, custom triage and risk components, consistent visual hierarchy, and accessibility compliance, so that the prototype is demo-ready and matches agreed design direction.

**Design spec alignment:** UX Design Specification (design system, Hybrid Command + Signal Board + Premium Calm, custom components Phases 1–3).
```

**Rationale:** Captures the sprint change in a single epic. References the existing UX spec so implementation can pull from it directly. No new FRs; this epic fulfils already-documented UX requirements.

**Status:** ✅ Approved and applied to `epics.md`.

---

### Change 2: Optional PRD line (UX alignment)

**Artifact:** `_bmad-output/planning-artifacts/prd.md`

**Type:** Optional requirement addition

**Proposed addition:** In the **Product Scope** or **MVP Strategy** section, add one sentence so MVP explicitly references UX alignment:

- **Suggested location:** End of "MVP Feature Set (Phase 1)" or under "MVP Scope Guardrails".
- **Suggested text:**  
  "UI and interaction patterns must align with the UX Design Specification for MVP demo (design system, custom triage/risk components, and accessibility baseline)."

**Rationale:** Makes the sprint change visible in the PRD so future readers see that MVP includes design alignment, not only functional delivery.

**Status:** ✅ Approved and applied to `prd.md`.

---

## 4. Implementation Handoff

**Change scope classification:** **Moderate** – New epic and backlog updates; development team implements Epic 4; PO/SM may want to slot Epic 4 into sprint planning.

**Handoff recipients:**
- **Development team:** Implement Epic 4 (Stories 4.0–4.5) using UX Design Specification as reference.
- **Product Owner / Scrum Master:** Include Epic 4 in backlog; prioritize and schedule after Epics 1–3 or in parallel as capacity allows.

**Deliverables produced:**
- Sprint Change Proposal document (this file).
- Updated `epics.md` with Epic 4 and Stories 4.0–4.5.
- Updated `prd.md` with UX alignment requirement in MVP Feature Set.

**Success criteria:** Epic 4 stories are implemented so the prototype matches the UX spec (design system, custom components, flows, accessibility); demo is no longer “too simple” versus agreed design.

---

## 5. Final Approval

**Status:** ✅ Approved by user (2026-03-01).

Do you approve this Sprint Change Proposal for implementation? **(yes / no / revise)**

| ID | Title | Purpose |
|----|--------|---------|
| **4.0** | Apply design system foundation | Theme tokens (Editorial Premium colors, Plus Jakarta Sans / Inter), spacing, MUI theme. |
| **4.1** | Implement Phase 1 journey components | LeadPriorityCard, QueueFilterBar, SLASafetyIndicator per UX spec (anatomy, states, variants, accessibility). |
| **4.2** | Implement Phase 2 risk & recovery components | AtRiskPulseBanner, ConciergeReplyComposer per UX spec. |
| **4.3** | Implement Phase 3 governance component | DecisionTimeline per UX spec (audit/override/send history). |
| **4.4** | Align triage and at-risk flows to spec | Apply components to triage queue and at-risk views; one-surface actioning, reason tags, feedback patterns. |
| **4.5** | Responsive and accessibility validation | Breakpoints, WCAG 2.2 AA, keyboard, non-color cues, “top 3 in 10 seconds” check. |
```

**Rationale:** Mirrors the UX spec’s implementation roadmap (Phases 1–3) and adds integration (4.4) and validation (4.5). Stories are sized for incremental delivery.

---

**Review this change:** Approve [a], Edit [e], or Skip [s]?
