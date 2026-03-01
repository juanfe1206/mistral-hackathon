# Story 2.3: Detect At-Risk Leads and Persist Lifecycle State

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a salon operator,
I want at-risk leads to be flagged and lifecycle states persisted,
so that I can run recovery workflows and track outcomes.

## Acceptance Criteria

1. **Given** inactivity thresholds are configured  
   **When** a lead crosses threshold conditions  
   **Then** the lead is marked At-Risk with a visible pulse indicator  
   **And** the reason for risk is displayed to the user  

2. **Given** recovery outcomes occur  
   **When** I mark results  
   **Then** lifecycle state is persisted as At-Risk, Recovered, or Lost  
   **And** state transitions are reflected in queue and detail views  

## Tasks / Subtasks

- [x] Task 1: Add Prisma schema for risk pulses and lifecycle state (AC: #1, #2)
  - [x] Add `risk_pulses` table: id, lead_id, tenant_id, reason (text), detected_at, status (active|recovered|lost), created_at
  - [x] Add `LeadLifecycleState` enum: default, at_risk, recovered, lost
  - [x] Add `lifecycle_state` to Lead model (default: default)
  - [x] Add indexes: idx_risk_pulses_lead_id, idx_risk_pulses_tenant_id, idx_risk_pulses_status
  - [x] Run `prisma migrate dev`
- [x] Task 2: Implement risk service and repository (AC: #1, #2)
  - [x] Create `src/server/repositories/risk-repository.ts`: createPulse, getActivePulsesForLead, updatePulseStatus, getPulsesByTenant
  - [x] Create `src/server/services/risk-service.ts`: detectAndFlagAtRisk, markLifecycle
  - [x] Inactivity logic: compare last interaction timestamp vs threshold; threshold config via RISK_INACTIVITY_HOURS env (default 24h)
  - [x] Emit domain event `lead.at_risk` with full envelope when pulse created
  - [x] Emit domain event lead.lifecycle_updated on Recovered/Lost transitions
- [x] Task 3: Create risk pulses API and lifecycle update endpoint (AC: #1, #2)
  - [x] GET /api/risk-pulses: list active at-risk leads for tenant
  - [x] POST /api/leads/[id]/mark-lifecycle: body { lifecycle_state: "recovered" | "lost" }; validate with Zod
  - [x] Route → service → repository; tenant-scoped
- [x] Task 4: Wire detection into lead lifecycle (AC: #1)
  - [x] Trigger at-risk check when lead detail loaded (GET /api/leads/[id])
  - [x] Detection runs detectAndFlagAtRisk; refetches lead if flagged
- [x] Task 5: Update triage queue and lead detail UI (AC: #1, #2)
  - [x] Add At-Risk Pulse indicator to queue cards (NFR13: non-color cues — ⚠ icon + text)
  - [x] Add AtRiskPulseBanner in lead detail when at-risk with reason and detected_at
  - [x] Add "Mark Recovered" / "Mark Lost" actions (NFR14: keyboard Enter/Space operable)
  - [x] Show risk reason and time since last contact
- [x] Task 6: Tests (AC: #1, #2)
  - [x] Test: risk-service detectAndFlagAtRisk (threshold, pulse creation, event)
  - [x] Test: risk-service markLifecycle (recovered/lost)
  - [x] Test: GET risk-pulses, tenant scoping, invalid tenant_id
  - [x] Test: POST mark-lifecycle (success, 404, invalid state, validation errors)

## Dev Notes

### Critical Architecture Requirements

- **Event:** Emit `lead.at_risk` domain event (architecture.md) with envelope: event_name, event_version, occurred_at, tenant_id, correlation_id, payload { lead_id, reason, pulse_id }.
- **Tables:** risk_pulses (architecture data model); Lead gets lifecycle_state for current state.
- **NFR13:** At-risk indicators must include non-color cues (icon + text) so status is understandable without color.
- **NFR14:** Mark Recovered/Lost actions fully operable via keyboard.

### Project Structure Notes

- Epic 2.1: classifications, lead.priority, reason_tags. Epic 2.2: override-priority, audit_events.
- Architecture specifies `api/risk-pulses`, `services/risk-service`, `features/risk-pulse`.
- No risk_pulses or lifecycle_state exists yet; add via new migration.
- Reuse route→service→repository, error envelope, tenant scoping from 2.1/2.2.

### References

- [Source: _bmad-output/planning-artifacts/architecture.md] — risk_pulses, lead.at_risk event, API patterns
- [Source: _bmad-output/planning-artifacts/epics.md] — Story 2.3 AC
- [Source: _bmad-output/planning-artifacts/prd.md] — FR7, FR9, NFR13, NFR14
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md] — At-Risk Pulse Recovery Flow, AtRiskPulseBanner, LeadPriorityCard critical-at-risk state

---

## Developer Context (Guardrails)

### Technical Requirements

| Requirement | Specification | Source |
|-------------|---------------|--------|
| risk_pulses table | id (UUID), lead_id, tenant_id, reason (text), detected_at, status (active\|recovered\|lost), created_at | architecture, FR7 |
| Lead lifecycle_state | Enum: default, at_risk, recovered, lost; default: default | FR9, AC#2 |
| At-risk detection | Compare last interaction occurred_at vs threshold; threshold configurable (env or tenant setting) | FR7, AC#1 |
| lead.at_risk event | Full envelope: event_name, event_version, occurred_at, tenant_id, correlation_id, payload | architecture |
| GET /api/risk-pulses | List active at-risk leads for tenant; optional filters | architecture |
| POST mark-lifecycle | /api/leads/[id]/mark-lifecycle; body { lifecycle_state: "recovered" \| "lost" } | FR9, AC#2 |
| Error envelope | `{ error: { code, message, details }, meta }` for failures | architecture |
| NFR13 | Non-color urgency: icon + text for at-risk; never color-only | prd |
| NFR14 | Mark Recovered/Lost keyboard operable | prd |

### Architecture Compliance

- **Data:** PostgreSQL via Prisma. Add risk_pulses, LeadLifecycleState enum, lead.lifecycle_state. Indexes: idx_risk_pulses_lead_id, idx_risk_pulses_tenant_id, idx_risk_pulses_status; idx_leads_lifecycle_state for queue filtering.
- **Route → service → repository:** No direct DB in routes. Risk handler calls risk-service.
- **Event:** lead.at_risk with full envelope when pulse created; consider lead.lifecycle_updated for Recovered/Lost.
- **Validation:** Zod at API boundary for mark-lifecycle body.

### Library/Framework Requirements

- **Prisma:** Add RiskPulse model, LeadLifecycleState enum, lead.lifecycle_state; new migration only.
- **Zod:** Use for mark-lifecycle request body validation.
- **Existing:** lead-service, lead-repository, Interaction model for last-contact timestamp.

### File Structure Requirements

```
src/
├── app/
│   ├── api/
│   │   ├── risk-pulses/
│   │   │   └── route.ts                 # NEW: GET list at-risk leads
│   │   └── leads/
│   │       └── [id]/
│   │           ├── route.ts            # UPDATE: include lifecycle_state, risk pulse in response
│   │           └── mark-lifecycle/
│   │               └── route.ts         # NEW: POST mark Recovered/Lost
│   └── (dashboard)/
│       ├── triage/
│       │   └── page.tsx                 # UPDATE: show at-risk pulse on cards (icon + text)
│       └── lead/
│           └── [id]/
│               └── page.tsx             # UPDATE: AtRiskPulseBanner, Mark Recovered/Lost, risk reason
├── server/
│   ├── repositories/
│   │   ├── risk-repository.ts           # NEW
│   │   └── lead-repository.ts           # UPDATE: include lifecycle_state, riskPulses if needed
│   └── services/
│       ├── risk-service.ts              # NEW
│       └── lead-service.ts              # UPDATE: may call risk check on interaction change
prisma/
├── schema.prisma                        # UPDATE: RiskPulse, LeadLifecycleState, lead.lifecycle_state
└── migrations/
```

### Testing Requirements

- **At-risk detection:** Lead with last interaction > threshold → pulse created, lead.lifecycle_state = at_risk, lead.at_risk event emitted.
- **Mark lifecycle:** POST mark-lifecycle with recovered → lead updated, pulse status updated.
- **GET risk-pulses:** Returns at-risk leads for tenant; tenant scoping.
- **Validation:** Invalid lifecycle_state → 400 with error envelope.
- **NFR13/NFR14:** Document UI path for manual QA (non-color cues, keyboard for mark actions).

---

## Previous Story Intelligence (Epic 2)

- **2.1:** Classifications, mistral-classifier, reason_tags, lead.priority. Route→service→repository; classification-repository with tx. Error envelope, tenant scoping.
- **2.2:** Override-priority, audit_events, priority_overrides. Override-service uses lead-repository.updateLeadPriority (not direct Prisma). Emit priority.overridden event. Zod v4 uses error.flatten() for validation details. Code review: use repository for persistence; invalid JSON → 400; Escape key for dropdown (NFR14).
- **Align with 2.1/2.2:** Same route→service→repository pattern; extend lead detail and triage UI; add new risk-service and risk-repository.

---

## Git Intelligence Summary

Repo: Next.js 16, React 19, pnpm, Prisma 7. Recent: Epic 2.1 (classifications, reclassify), Epic 2.2 (override-priority, audit). Patterns: src/, @/*, error envelope, Vitest, route→service→repository, Zod at boundaries. Lead model has priority, classifications, priorityOverrides; no risk_pulses or lifecycle_state yet.

---

## Latest Technical Information

- **Inactivity threshold:** MVP can use env var (e.g. RISK_INACTIVITY_HOURS=24) or hardcode 24h/48h; tenant config deferred to post-MVP.
- **Detection trigger:** Option A) on interaction create (webhook/ingestion path); Option B) on queue/detail fetch (simpler, no background job); Option C) cron/worker if BullMQ exists. Recommend Option A or B for MVP.
- **Lead.last_contact_at:** May need to derive from latest Interaction.occurred_at or add cached column; check Interaction model.

---

## Project Context Reference

No project-context.md. Use PRD, architecture, epics, UX spec. UX: At-Risk Pulse Recovery Flow, AtRiskPulseBanner (icon + text, non-color), LeadPriorityCard critical-at-risk state. NFR13: non-color cues. NFR14: keyboard for Mark Recovered/Lost.

---

## Change Log

- 2026-03-01: Story created via create-story workflow. Target: At-risk detection from inactivity threshold, visible pulse indicator, lifecycle state persistence (At-Risk/Recovered/Lost), queue and detail UI updates.
- 2026-03-01: Implementation complete. Prisma RiskPulse, LeadLifecycleState, risk-service, risk-pulses API, mark-lifecycle API, triage and lead detail UI, tests.
- 2026-03-01: Code review fixes. Audit logging for mark-lifecycle (NFR8); validate RISK_INACTIVITY_HOURS; log detection failures; getActivePulsesForLead tx support; Recovered/Lost badges in triage.

---

## Dev Agent Record

### Agent Model Used

Composer (dev-story workflow)

### Debug Log References

### Completion Notes List

- Prisma: RiskPulse model, LeadLifecycleState enum, LeadLifecycleState on Lead, RiskPulseStatus enum. Migration add_risk_pulses_and_lifecycle_state applied.
- Repositories: risk-repository (createPulse, getActivePulsesForLead, updatePulseStatus, getPulsesByTenant); lead-repository extended with updateLeadLifecycleState, activeRiskPulsesInclude.
- Risk-service: detectAndFlagAtRisk (inactivity threshold via RISK_INACTIVITY_HOURS env, default 24h), markLifecycle (recovered/lost). Emits lead.at_risk and lead.lifecycle_updated events.
- API: GET /api/risk-pulses (tenant-scoped active pulses); POST /api/leads/[id]/mark-lifecycle (Zod validation). GET /api/leads/[id] runs at-risk detection on load, returns lifecycle_state and risk_pulses.
- UI: Triage shows ⚠ At-Risk badge (NFR13). Lead detail shows AtRiskPulseBanner, Mark Recovered/Lost buttons (NFR14 keyboard), lifecycle state badges.
- Tests: risk-service (8), risk-pulses API (4), leads-mark-lifecycle API (8). leads-detail test updated with risk-service mock.
- Env: RISK_INACTIVITY_HOURS added to .env.example.
- [Code review] Mark-lifecycle now creates audit event lifecycle.marked (NFR8). RISK_INACTIVITY_HOURS validated (1-720h, fallback 24h). Detection failures logged in GET leads/[id]. getActivePulsesForLead accepts tx for transaction consistency. Triage shows Recovered/Lost badges (AC2).

### File List

- prisma/schema.prisma (modified)
- prisma/migrations/20260301102042_add_risk_pulses_and_lifecycle_state/ (new)
- src/server/repositories/risk-repository.ts (new)
- src/server/repositories/lead-repository.ts (modified)
- src/server/repositories/interaction-repository.ts (modified)
- src/server/services/risk-service.ts (new)
- src/app/api/risk-pulses/route.ts (new)
- src/app/api/leads/[id]/route.ts (modified)
- src/app/api/leads/[id]/mark-lifecycle/route.ts (new)
- src/app/api/leads/route.ts (modified)
- src/app/(dashboard)/triage/page.tsx (modified)
- src/app/(dashboard)/lead/[id]/page.tsx (modified)
- .env.example (modified)
- tests/api/risk-pulses.test.ts (new)
- tests/api/leads-mark-lifecycle.test.ts (new)
- tests/api/leads-detail.test.ts (modified)
- tests/services/risk-service.test.ts (new)
