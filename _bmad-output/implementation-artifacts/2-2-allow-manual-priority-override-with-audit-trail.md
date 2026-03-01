# Story 2.2: Allow Manual Priority Override with Audit Trail

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a salon operator,
I want to override AI priority when business context requires it,
so that operational decisions remain under human control.

## Acceptance Criteria

1. **Given** a classified lead is visible  
   **When** I apply a manual override  
   **Then** the new priority is persisted and reflected in ranking  
   **And** the override action is audit logged with actor and timestamp  

2. **Given** a lead has override history  
   **When** I inspect lead details  
   **Then** I can see the current effective priority and override trace  
   **And** keyboard-only operation is supported for critical controls  

## Tasks / Subtasks

- [x] Task 1: Add Prisma schema for overrides and audit (AC: #1)
  - [x] Add `priority_overrides` table: id, lead_id, tenant_id, previous_priority, new_priority, actor_id?, reason?, created_at
  - [x] Add index idx_priority_overrides_lead_id, idx_priority_overrides_tenant_id
  - [x] Add `audit_events` table: id, tenant_id, event_type, actor_id?, payload (Json), occurred_at, correlation_id?
  - [x] Run `prisma migrate dev`
- [x] Task 2: Implement override service and repository (AC: #1)
  - [x] Create `src/server/repositories/priority-override-repository.ts`: createOverride, getOverridesForLead (tenant-scoped)
  - [x] Create `src/server/repositories/audit-repository.ts`: createAuditEvent (or extend existing if present)
  - [x] Create override logic in lead-service or new override-service: validate, update lead.priority, persist override, emit audit
  - [x] Emit domain event `priority.overridden` with full envelope (event_name, occurred_at, tenant_id, correlation_id, payload)
- [x] Task 3: Create override API endpoint (AC: #1)
  - [x] POST /api/leads/[id]/override-priority: body { priority, reason? }; validate with Zod; tenant-scoped
  - [x] Return success envelope with updated lead; on error return typed error envelope
  - [x] Route → service → repository; no direct DB in route
- [x] Task 4: Expose override history in APIs (AC: #2)
  - [x] GET /api/leads/[id]: include override_history or latest override info
  - [x] Include effective priority (overridden vs AI-classified) in response
- [x] Task 5: Update lead detail UI for override (AC: #1, #2)
  - [x] Add override control (dropdown or action) with priority selector and optional reason
  - [x] Display override trace/timeline in lead detail
  - [x] NFR14: Override control fully operable via keyboard (focus, Enter/Space to activate)
- [x] Task 6: Tests (AC: #1, #2)
  - [x] Test: POST override-priority → lead.priority updated, override record created, audit event persisted
  - [x] Test: GET lead returns override history; effective priority correct
  - [x] Test: tenant scoping, 404 for missing lead, validation errors
  - [x] Test: keyboard accessibility (focus order, activation) or document UI path for manual QA

## Dev Notes

### Critical Architecture Requirements

- **Event:** Emit `priority.overridden` domain event (architecture.md) with envelope: event_name, event_version, occurred_at, tenant_id, correlation_id, payload { lead_id, previous_priority, new_priority, actor_id?, reason }.
- **Auditability:** Override actions must be audit logged (NFR8). Architecture lists `overrides` and `audit_events` tables.
- **NFR14:** Critical override action fully operable via keyboard-only interaction.

### Project Structure Notes

- Epic 2.1 established: classifications, lead.priority, reason_tags, triage, lead detail, reclassify.
- Architecture specifies `api/leads/[id]/override-priority` route.
- No overrides or audit_events tables yet; add via new migration.
- Reuse route→service→repository, error envelope, tenant scoping from 2.1.

### References

- [Source: _bmad-output/planning-artifacts/architecture.md] — overrides, audit_events, event envelope, API patterns
- [Source: _bmad-output/planning-artifacts/epics.md] — Story 2.2 AC
- [Source: _bmad-output/planning-artifacts/prd.md] — FR6, NFR8, NFR14
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md] — VIP Override flow, DecisionTimeline, keyboard operability

---

## Developer Context (Guardrails)

### Technical Requirements

| Requirement | Specification | Source |
|-------------|---------------|--------|
| Overrides table | id (UUID), lead_id, tenant_id, previous_priority, new_priority, actor_id?, reason?, created_at | architecture, FR6 |
| Audit events table | id, tenant_id, event_type, actor_id?, payload (Json), occurred_at, correlation_id? | architecture, NFR8 |
| Lead priority update | Update lead.priority when override succeeds; effective priority is overridden value | FR6, AC#1 |
| Override API | POST /api/leads/[id]/override-priority; body { priority: LeadPriority, reason?: string } | architecture |
| Error envelope | `{ error: { code, message, details }, meta }` for failures | architecture.md |
| Tenant scoping | All queries MUST include tenant_id | architecture.md |
| Domain event | priority.overridden with full envelope; log or publish | architecture.md |

### Architecture Compliance

- **Data:** PostgreSQL via Prisma. Add priority_overrides, audit_events. Indexes: idx_priority_overrides_lead_id, idx_priority_overrides_tenant_id; idx_audit_events_tenant_id, idx_audit_events_occurred_at.
- **Route → service → repository:** No direct DB in routes. Override handler calls override-service/lead-service.
- **Event:** priority.overridden with full envelope. Audit event persisted for NFR8.
- **Validation:** Zod at API boundary for { priority, reason? }.

### Library/Framework Requirements

- **Prisma:** Add PriorityOverride and AuditEvent models; new migration only.
- **Zod:** Use for override-priority request body validation.
- **Existing:** LeadPriority enum, lead-service patterns, error envelope, classification-repository.

### File Structure Requirements

```
src/
├── app/
│   ├── api/
│   │   └── leads/
│   │       └── [id]/
│   │           ├── route.ts                # EXISTS — ensure override history in GET response
│   │           └── override-priority/
│   │               └── route.ts             # NEW: POST override
│   └── (dashboard)/
│       └── lead/
│           └── [id]/
│               └── page.tsx                # UPDATE: override control, trace display, keyboard support
├── server/
│   ├── repositories/
│   │   ├── priority-override-repository.ts  # NEW
│   │   ├── audit-repository.ts               # NEW (or extend existing)
│   │   └── lead-repository.ts               # UPDATE: include overrides in findLeadById if needed
│   └── services/
│       ├── override-service.ts               # NEW (or extend lead-service)
│       └── lead-service.ts                   # UPDATE: call override logic or delegate
prisma/
├── schema.prisma                           # UPDATE: PriorityOverride, AuditEvent models
└── migrations/
```

### Testing Requirements

- **Override flow:** POST /api/leads/[id]/override-priority with valid body → lead.priority updated, override record created, audit event created.
- **Effective priority:** Overridden lead returns new priority; override history in GET response.
- **Validation:** Invalid priority enum, missing body → 400 with error envelope.
- **Tenant scoping:** Override for lead in different tenant → 404.
- **Keyboard:** Document NFR14 compliance path for manual QA (focus, Enter/Space).

---

## Previous Story Intelligence (Epic 2)

- **2.1:** Classifications, mistral-classifier, reason_tags, lead.priority. Route→service→repository; use classification-repository with tx. Error envelope, tenant scoping. Lead detail has Reclassify, reason tags. Tests: vi.mock mistral-classifier, NFR10 retry path.
- **Code review lessons:** lead-service must use repository (not prisma directly); events use full envelope.
- **Align with 2.1:** Same patterns for override-priority route; extend lead detail UI.

---

## Git Intelligence Summary

Repo: Next.js 16, React 19, pnpm, Prisma 7, leads/tenants/interactions/classifications, LeadPriority enum, WhatsApp webhook, triage + lead detail. Story 2.1 added classifications, mistral-classifier, reclassify API, reason tags in UI. Follow existing: src/, @/*, error envelope, Vitest, route→service→repository.

---

## Latest Technical Information

- **Prisma:** Add models with @map for snake_case. Use Prisma.Json for audit payload.
- **Actor identity:** MVP may not have full auth; actor_id can be optional or placeholder until Better Auth.
- **Override vs classification:** When overridden, effective priority = override; classification reason_tags remain for context. UI shows "Overridden from [previous] to [new]" trace.

---

## Project Context Reference

No project-context.md. Use PRD, architecture, epics, UX spec. UX: VIP Override flow (epics journey 2), DecisionTimeline for override trace. NFR14: keyboard-only for override. LeadPriorityCard anatomy from UX; override control should align with existing lead detail patterns.

---

## Change Log

- 2026-03-01: Story created via create-story workflow. Target: Manual priority override with audit trail; effective priority and override trace in lead detail; keyboard support for override control.
- 2026-03-01: Implementation complete. Prisma PriorityOverride and AuditEvent models, override-service, override-priority API, lead detail UI with override control and trace, tests.
- 2026-03-01: Code review (AI). Fixed: override-service uses lead-repository.updateLeadPriority; invalid JSON returns 400; Escape closes override dropdown (NFR14).

---

## Dev Agent Record

### Agent Model Used

Composer (dev-story workflow)

### Debug Log References

### Completion Notes List

- Prisma: PriorityOverride and AuditEvent models added. Migration 20260301101025 applied.
- Repositories: priority-override-repository (createOverride, getOverridesForLead), audit-repository (createAuditEvent) with tx support.
- Override-service: overridePriority updates lead, creates override record, creates audit event, emits priority.overridden domain event in transaction.
- API: POST /api/leads/[id]/override-priority with Zod validation; GET /api/leads/[id] returns override_history.
- Lead detail UI: Override button with dropdown (priority selector + optional reason), override trace section, aria-label and keyboard support (Enter/Space).
- Tests: leads-override-priority (6 tests), leads-detail (3 tests). Zod v4 uses error.flatten() for validation error details.
- [Code review] lead-repository.updateLeadPriority with tenant-scoped where; invalid JSON → 400; Escape key closes override dropdown.

### File List

- prisma/schema.prisma (modified)
- prisma/migrations/20260301101025_add_priority_overrides_and_audit_events/ (new)
- src/server/repositories/priority-override-repository.ts (new)
- src/server/repositories/audit-repository.ts (new)
- src/server/repositories/lead-repository.ts (modified)
- src/server/services/override-service.ts (new)
- src/app/api/leads/[id]/route.ts (modified)
- src/app/api/leads/[id]/override-priority/route.ts (new)
- src/app/(dashboard)/lead/[id]/page.tsx (modified)
- tests/api/leads-override-priority.test.ts (new)
- tests/api/leads-detail.test.ts (new)

---

## Senior Developer Review (AI)

**Date:** 2026-03-01  
**Reviewer:** Composer (code-review workflow)  
**Outcome:** Approve (after fixes applied)

### Findings Addressed

| # | Severity | Finding | Resolution |
|---|----------|---------|------------|
| 1 | MEDIUM | override-service used tx.lead.update directly — architecture requires route→service→repository; persistence should go through lead-repository | Added leadRepository.updateLeadPriority() with tenant-scoped where clause; override-service now delegates to repository |
| 2 | MEDIUM | request.json() throws on invalid JSON — API returned 500 instead of 400 for malformed body | Wrapped request.json() in try/catch; return 400 with INVALID_INPUT when JSON parse fails |
| 3 | MEDIUM | NFR14: Escape key to close override dropdown not implemented — keyboard users could not dismiss without selecting | Added useEffect to listen for Escape key when dropdown open; closes dropdown on Escape |

### Deferred (LOW)

- Override dropdown does not close on click-outside; acceptable for MVP
- overrideError uses Dismiss only (no Retry); reclassifyError has Retry — minor inconsistency
