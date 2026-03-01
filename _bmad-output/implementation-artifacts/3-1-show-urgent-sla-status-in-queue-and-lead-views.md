# Story 3.1: Show Urgent SLA Status in Queue and Lead Views

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a salon owner,
I want urgent first-response SLA status on leads and queue,
So that I can detect and prevent service-level breaches.

## Acceptance Criteria

1. **Given** lead response timestamps exist  
   **When** I open queue or lead details  
   **Then** SLA status is visible at queue and lead level  
   **And** status indicators include non-color cues  

2. **Given** SLA data is temporarily unavailable  
   **When** the UI renders status  
   **Then** a clear fallback/error state is shown  
   **And** user action guidance is provided where applicable  

## Tasks / Subtasks

- [x] Task 1: Define SLA data model and first-response tracking (AC: #1)
  - [x] Decide source for first_response_at: ReplyDraft.sentAt (min per lead when status=sent) OR add first_response_at to Lead updated on approve-reply send
  - [x] SLA target: 5 minutes for VIP/high-risk (PRD: >=90% first response in <5 min). Low-priority: optional or same target.
  - [x] SLA states: safe (responded in time), warning (approaching, e.g. <2m left), breach-risk (e.g. <1m left), breached (past target, no response)
  - [x] Only VIP/high leads require SLA tracking for MVP; low can show "—" or N/A
- [x] Task 2: Implement sla-service (AC: #1)
  - [x] Create `src/server/services/sla-service.ts` with `getLeadSlaStatus(leadId, tenantId)` and `getQueueSlaSummary(tenantId)`
  - [x] Compute per-lead: created_at, first_response_at (from ReplyDraft min sentAt), priority, target_minutes (5), status (safe/warning/breach-risk/breached), minutes_to_breach or minutes_over
  - [x] Queue summary: count_breached, count_at_risk, count_safe, overall_status
- [x] Task 3: Create GET /api/sla endpoint (AC: #1, #2)
  - [x] Query: ?tenant_id=... (or from auth). Optional: ?lead_id=... for single lead.
  - [x] Return: queue summary + per-lead sla_status when lead_id omitted; single lead when lead_id provided
  - [x] NFR10/AC2: On failure (DB error, missing tenant), return error envelope with retry/user guidance
- [x] Task 4: Embed SLA in leads API (AC: #1)
  - [x] GET /api/leads: extend response to include sla_status per lead (safe/warning/breach-risk/breached, minutes_to_breach)
  - [x] GET /api/leads/[id]: include lead-level sla_status
  - [x] Ensure SLA computation does not break existing response; add as optional enrichment
- [x] Task 5: SLASafetyIndicator component (AC: #1, #2)
  - [x] Create component per UX spec: status chip, trend/metric, time-to-breach
  - [x] States: Safe, warning, breach-risk, breached, recovering (recovering = responded after breach)
  - [x] NFR13: Use text labels + icon + color; never color alone. E.g. "3m to breach", "Breached 2m ago"
  - [x] Accessible: aria-label, role="status", readable numeric context
- [x] Task 6: Add SLA to triage page (AC: #1)
  - [x] Queue-level SLASafetyIndicator in triage header (e.g. "SLA Safe 92%" or "2 at risk")
  - [x] Per-lead SLA hint in LeadPriorityCard (compact badge per UX: Lead identity, urgency, reason tags, inactivity, **SLA hint**)
- [x] Task 7: Add SLA to lead detail page (AC: #1)
  - [x] Lead-level SLASafetyIndicator in lead header or prominent section
  - [x] Show actionable phrasing: "3m to breach" or "Responded in 2m" (safe)
- [x] Task 8: Fallback/error handling (AC: #2)
  - [x] When SLA API fails: show "SLA temporarily unavailable" with retry guidance
  - [x] When no SLA data for lead (e.g. low-priority): show "—" or "N/A" with clear meaning
- [x] Task 9: Tests (AC: #1, #2)
  - [x] Test sla-service: lead with/without first response, VIP/high vs low, breached vs safe
  - [x] Test GET /api/sla: success, tenant-scoped, error envelope
  - [x] Test GET /api/leads with sla_status embedded
  - [x] Test UI fallback when SLA unavailable

## Dev Notes

### Critical Architecture Requirements

- **Events:** Emit `sla.updated` when SLA-relevant state changes (architecture). Optional for MVP if SLA is computed on read.
- **API:** `api/sla/route.ts` per architecture.md. Extend `api/leads` and `api/leads/[id]` with sla_status.
- **NFR13:** Status indicators MUST combine color, icon, and text. Never color-only.
- **NFR1:** Queue/state updates within 2s—SLA computation should be fast; consider caching per-tenant if needed.

### Project Structure Notes

- Epic 2: reply-service, ReplyDraft, approve-reply. first_response = ReplyDraft.sentAt (earliest) when status=sent.
- Architecture specifies sla-service, api/sla. Lead model has no first_response_at; derive from ReplyDraft or add column.
- Triage page: `src/app/(dashboard)/triage/page.tsx` — add queue SLA header, lead cards get sla_status from API.
- Lead detail: `src/app/(dashboard)/lead/[id]/page.tsx` — add SLA indicator. Same patterns: fetch, loading, error, refresh.

### References

- [Source: _bmad-output/planning-artifacts/architecture.md] — api/sla, sla-service, sla.updated, SLA_snapshots
- [Source: _bmad-output/planning-artifacts/epics.md] — Story 3.1 AC, FR11
- [Source: _bmad-output/planning-artifacts/prd.md] — FR11, VIP/high-risk 5min target, NFR13
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md] — SLASafetyIndicator, states, anatomy, NFR13, "3m to breach"

---

## Developer Context (Guardrails)

### Technical Requirements

| Requirement | Specification | Source |
|-------------|---------------|--------|
| First-response SLA target | 5 minutes for VIP/high-risk | PRD, epics |
| SLA states | safe, warning, breach-risk, breached, recovering | UX spec |
| GET /api/sla | Queue summary + optional lead filter; tenant-scoped | architecture |
| sla_status in /api/leads | Per-lead: status, minutes_to_breach or minutes_over | FR11 |
| NFR13 | Non-color cues: icon + text + color for status | prd |
| AC2 | Fallback when unavailable: clear message + retry guidance | epics |
| Data source for first response | ReplyDraft.sentAt (min where status=sent) or Lead.first_response_at | derive or schema |

### Architecture Compliance

- **Route → service → repository:** SLA route calls sla-service; no direct DB in route. Service uses lead-repository, reply-draft-repository (or new sla-repository if snapshot table).
- **Error envelope:** `{ error: { code, message, details }, meta }` for failures.
- **Validation:** Tenant from auth/session; optional lead_id query param.
- **Tenant scoping:** All SLA queries tenant-scoped.

### Library/Framework Requirements

- **Prisma:** Use existing Lead, ReplyDraft. No new tables required if deriving first_response from ReplyDraft; or add first_response_at to Lead on approve-reply send.
- **Existing:** lead-repository, reply-draft-repository. lead-service getQueue, findLeadById.
- **No new external deps** for SLA computation (date math only).

### File Structure Requirements

```
src/
├── app/
│   ├── api/
│   │   ├── sla/
│   │   │   └── route.ts           # NEW: GET queue summary + per-lead SLA
│   │   └── leads/
│   │       ├── route.ts           # UPDATE: include sla_status in response
│   │       └── [id]/
│   │           └── route.ts       # UPDATE: include sla_status
│   └── (dashboard)/
│       ├── triage/
│       │   └── page.tsx           # UPDATE: queue SLA header, lead cards SLA hint
│       └── lead/
│           └── [id]/
│               └── page.tsx        # UPDATE: lead-level SLA indicator
├── server/
│   └── services/
│       └── sla-service.ts         # NEW: getLeadSlaStatus, getQueueSlaSummary
├── components/                     # OR src/features/triage/components/
│   └── SLASafetyIndicator.tsx     # NEW: reusable indicator (queue + lead)
prisma/
└── schema.prisma                  # OPTIONAL: add first_response_at to Lead
```

### Testing Requirements

- **sla-service:** VIP lead created 6m ago, no reply → breached. VIP lead replied in 2m → safe. High lead 4m ago, no reply → warning/breach-risk.
- **GET /api/sla:** Success returns queue summary; ?lead_id= returns single; wrong tenant → 404.
- **Fallback:** Mock SLA failure → UI shows "SLA temporarily unavailable" and retry.
- **NFR13:** Verify indicator has icon + text, not color-only.

---

## Previous Story Intelligence (Epic 2)

- **2.4:** ReplyDraft has sentAt; approve-reply sets status=sent. first_response_at = min(ReplyDraft.sentAt) for lead where status=sent. approval-service already updates ReplyDraft on send.
- **2.1–2.3:** Same route→service→repository; error envelope; tenant scoping; Zod at boundaries.
- **Triage/lead pages:** Use fetch, useState, loading/error states. Lifecycle badges (at_risk, recovered) use icon+text (NFR13). Add SLA badge similarly.

---

## Git Intelligence Summary

Repo: Next.js, React, pnpm, Prisma, Vitest. Patterns: src/, @/*, error envelope, route→service→repository. Epic 2: mistral-classifier, override-service, risk-service, reply-service, approval-service. Lead: priority, lifecycle_state, riskPulses, replyDrafts. Tests in tests/api/, tests/services/.

---

## Latest Technical Information

- **First-response definition:** First outbound message to lead. In MVP, that is when ReplyDraft is sent (approve-reply action=send). Use ReplyDraft.sentAt as source.
- **SLA target configurability:** MVP can hardcode 5 min. Configurable SLA thresholds (e.g. per-tenant) deferred to post-MVP.
- **Queue-level SLA:** Aggregate counts: how many VIP/high leads are safe, warning, breach-risk, breached. "92% SLA safe" = (safe+recovered) / total VIP+high.

---

## Project Context Reference

No project-context.md. Use PRD, architecture, epics, UX spec. UX: SLASafetyIndicator in Phase 1 (critical for triage). States: Safe, warning, breach-risk, breached, recovering. Prefer "3m to breach" over abstract "at risk".

---

## Change Log

- 2026-03-01: Story created via create-story workflow. Target: Urgent first-response SLA status at queue and lead level, SLASafetyIndicator, non-color cues (NFR13), fallback on unavailable.
- 2026-03-01: Implementation complete. sla-service, GET /api/sla, SLA embedded in leads API, SLASafetyIndicator component, triage and lead detail pages updated, fallback handling, tests.
- 2026-03-01: Code review fixes. HIGH: Added leads-detail test for SLA error fallback; aligned getQueueSlaSummary limit (100) with getLeadsWithSlaStatus. MEDIUM: QueueSlaIndicator onAtRiskClick prop for UX "click to filter"; component tests for SLA fallback.

---

## Dev Agent Record

### Agent Model Used

Composer (dev-story workflow)

### Debug Log References

### Completion Notes List

- sla-service: getLeadSlaStatus, getQueueSlaSummary, getLeadsWithSlaStatus. First response from ReplyDraft.sentAt (earliest). 5min target for VIP/high. States: safe, warning, breach-risk, breached, recovering, n_a.
- reply-draft-repository: getEarliestSentAtForLead, getEarliestSentAtByLeadIds (batch for N+1 avoidance)
- GET /api/sla: queue summary or single lead by lead_id; error envelope with retry hint on failure
- GET /api/leads, GET /api/leads/[id]: sla_status embedded per lead
- SLASafetyIndicator: LeadSlaIndicator and QueueSlaIndicator, NFR13 icon+text+color, fallback with Retry
- Triage: QueueSlaIndicator in header, LeadSlaIndicator compact on each card
- Lead detail: LeadSlaIndicator in header with onRetry
- Tests: sla-service (7), sla API (5), leads-queue and leads-detail updated with sla_status
- Code review: getQueueSlaSummary default limit 100 (matches triage leads); QueueSlaIndicator onAtRiskClick; component tests for fallback UI

### File List

- src/server/repositories/reply-draft-repository.ts (modified)
- src/server/services/sla-service.ts (modified)
- src/app/api/sla/route.ts (new)
- src/app/api/leads/route.ts (modified)
- src/app/api/leads/[id]/route.ts (modified)
- src/components/SLASafetyIndicator.tsx (modified)
- src/app/(dashboard)/triage/page.tsx (modified)
- src/app/(dashboard)/lead/[id]/page.tsx (modified)
- tests/services/sla-service.test.ts (new)
- tests/api/sla.test.ts (new)
- tests/api/leads-queue.test.ts (modified)
- tests/api/leads-detail.test.ts (modified)
- tests/components/SLASafetyIndicator.test.tsx (new)
