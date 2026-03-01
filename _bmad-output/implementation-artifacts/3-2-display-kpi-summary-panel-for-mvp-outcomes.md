# Story 3.2: Display KPI Summary Panel for MVP Outcomes

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a salon owner,
I want KPI summaries for recovery count, SLA compliance, and queue aging,
So that I can evaluate MVP impact in daily use and demo presentation.

## Acceptance Criteria

1. **Given** lead and response events are available  
   **When** I open the KPI panel  
   **Then** recovery count, SLA compliance, and queue aging metrics are displayed  
   **And** values reconcile with underlying event records  

2. **Given** there is insufficient data for a metric  
   **When** the KPI panel loads  
   **Then** a no-data state is shown for that metric  
   **And** the panel still loads within MVP performance targets  

## Tasks / Subtasks

- [x] Task 1: Define KPI data model and kpi-service (AC: #1)
  - [x] Recovery count: count of leads with lifecycle_state = 'recovered'
  - [x] SLA compliance: reuse sla-service.getQueueSlaSummary → sla_safe_percent (or compute (safe+recovering)/total_tracked)
  - [x] Queue aging: oldest VIP/high lead without first response (minutes in queue), or count of leads >N minutes waiting
  - [x] NFR4: Panel load target 3 seconds p95
- [x] Task 2: Implement kpi-service (AC: #1)
  - [x] Create `src/server/services/kpi-service.ts` with `getKpiSummary(tenantId)`
  - [x] Return: `{ recovery_count, sla_compliance_percent, queue_aging_minutes, queue_aging_count }`
  - [x] Reuse lead-repository, sla-service, reply-draft-repository; no new DB schema
  - [x] Tenant-scoped; error envelope on failure
- [x] Task 3: Create GET /api/kpi endpoint (AC: #1, #2)
  - [x] Query: ?tenant_id=... (or from auth). Return KPI summary.
  - [x] NFR10/AC2: On failure, return error envelope with retry/user guidance
  - [x] On insufficient data: return zeros or nulls with clear no-data semantics
- [x] Task 4: Create insights page and KPIPanel component (AC: #1, #2)
  - [x] Add `src/app/(dashboard)/insights/page.tsx` (architecture: insights/page.tsx)
  - [x] Create KPIPanel or KpiSummaryCard component: recovery count, SLA %, queue aging
  - [x] Loading, empty, error states; NFR13: icon + text for each metric
  - [x] No-data state: show "—" or "No data" per metric when insufficient
- [x] Task 5: Add insights to navigation (AC: #1)
  - [x] Add Queue Insights / KPI link to dashboard nav (per UX: Triage, At-Risk, Queue Insights, Settings)
- [x] Task 6: Fallback/error handling (AC: #2)
  - [x] When KPI API fails: show "KPIs temporarily unavailable" with retry guidance
  - [x] When metric has no data: show "—" or "No data yet" with clear meaning
- [x] Task 7: Tests (AC: #1, #2)
  - [x] Test kpi-service: recovery count, SLA from sla-service, queue aging
  - [x] Test GET /api/kpi: success, tenant-scoped, error envelope, no-data
  - [x] Test insights page: load, metrics display, fallback when unavailable

## Dev Notes

### Critical Architecture Requirements

- **KPI read model:** Architecture defines "KPI read model" and "KPI aggregation pipeline" (prd, architecture). MVP: single GET /api/kpi aggregating from existing services.
- **Data sources:** Lead.lifecycleState (recovered), sla-service.getQueueSlaSummary, Lead.createdAt + ReplyDraft.sentAt for queue aging.
- **NFR4:** KPI panel loads within 3 seconds p95—keep aggregation lightweight; consider Redis cache for tenant KPI if needed (post-MVP).
- **NFR13:** Metrics use icon + text; never color-only.

### Project Structure Notes

- Architecture: `src/app/(dashboard)/insights/page.tsx`, `features/insights`. Use same pattern as triage: fetch, useState, loading/error/no-data.
- sla-service already exists; kpi-service orchestrates it + lead counts. No new tables.
- Queue aging: For MVP, "oldest VIP/high lead minutes without first response" or "count of VIP/high leads waiting >30m". Derive from Lead.createdAt, ReplyDraft.sentAt.

### References

- [Source: _bmad-output/planning-artifacts/architecture.md] — insights/page.tsx, KPI read model, features/insights
- [Source: _bmad-output/planning-artifacts/epics.md] — Story 3.2 AC, FR12
- [Source: _bmad-output/planning-artifacts/prd.md] — FR12, NFR4, KPI panel (recovery, SLA, queue aging)
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md] — Queue Insights in nav, empty/loading/error states

---

## Developer Context (Guardrails)

### Technical Requirements

| Requirement | Specification | Source |
|-------------|---------------|--------|
| Recovery count | Count leads where lifecycle_state = 'recovered' | PRD FR12, Lead model |
| SLA compliance | Reuse getQueueSlaSummary → sla_safe_percent | sla-service |
| Queue aging | Oldest VIP/high lead minutes in queue without first response, or count waiting >30m | PRD, epics |
| GET /api/kpi | Tenant-scoped; return { recovery_count, sla_compliance_percent, queue_aging_* } | architecture |
| NFR4 | KPI panel load <3s p95 | prd |
| AC2 | No-data state per metric; panel loads within targets | epics |
| NFR13 | Icon + text for each metric; never color-only | prd |

### Architecture Compliance

- **Route → service → repository:** KPI route calls kpi-service; no direct DB in route. Service uses lead-repository, sla-service, reply-draft-repository.
- **Error envelope:** `{ error: { code, message, details }, meta }` for failures.
- **Validation:** Tenant from auth/session or getOrCreateDefaultTenant.
- **Tenant scoping:** All KPI queries tenant-scoped.

### Library/Framework Requirements

- **Prisma:** Use existing Lead, ReplyDraft. No new tables. Count via lead-repository or direct aggregate.
- **Existing:** lead-repository, sla-service, reply-draft-repository.
- **No new external deps** for KPI aggregation.

### File Structure Requirements

```
src/
├── app/
│   ├── api/
│   │   └── kpi/
│   │       └── route.ts           # NEW: GET KPI summary
│   └── (dashboard)/
│       └── insights/
│           └── page.tsx           # NEW: KPI panel page
├── components/                    # OR src/features/insights/components/
│   └── KPISummaryPanel.tsx        # NEW: recovery, SLA, queue aging cards
├── server/
│   └── services/
│       └── kpi-service.ts         # NEW: getKpiSummary
prisma/
└── schema.prisma                  # NO CHANGES
```

### Testing Requirements

- **kpi-service:** Lead with lifecycle_state=recovered → recovery_count; SLA from sla-service; queue aging from Lead+ReplyDraft.
- **GET /api/kpi:** Success returns summary; wrong tenant → 404; failure → error envelope with retry.
- **No-data:** Empty tenant → zeros or nulls; UI shows "—" / "No data yet".
- **NFR4:** KPI endpoint responds quickly; avoid N+1.

---

## Previous Story Intelligence (Epic 3)

- **3.1:** sla-service has getQueueSlaSummary (count_safe, count_breached, sla_safe_percent). Reuse it. ReplyDraft.sentAt = first response. Lead has lifecycleState.
- **Triage/lead pages:** fetch, useState, loadData, loading/error states. SLASafetyIndicator uses icon+text (NFR13). Same pattern for KPISummaryPanel.
- **API pattern:** createSuccessResponse, createErrorResponse from error-envelope. Tenant via getOrCreateDefaultTenant or query param.

---

## Git Intelligence Summary

Repo: Next.js, React, pnpm, Prisma, Vitest. Patterns: src/, @/*, error envelope, route→service→repository. Epic 2–3: sla-service, lead-repository, reply-draft-repository. Tests in tests/api/, tests/services/. No React Query; use fetch + useState like triage page.

---

## Latest Technical Information

- **Queue aging definition:** MVP: "oldest VIP/high lead minutes waiting for first response" (Lead.createdAt to now, no ReplyDraft.sentAt). Alternative: "count of VIP/high leads >30m without response."
- **Recovery count:** Leads with lifecycle_state = 'recovered'. Single count query.
- **KPI caching:** NFR4 requires <3s load. If aggregation is slow, add Redis cache with short TTL; MVP can start without cache if queries are fast.

---

## Project Context Reference

No project-context.md. Use PRD, architecture, epics, UX spec. UX: "Queue Insights" in primary nav (Triage, At-Risk, Queue Insights, Settings). Empty/loading/error states per UX patterns. Skeleton for list-heavy views.

---

## Change Log

- 2026-03-01: Story created via create-story workflow. Target: KPI summaries (recovery count, SLA compliance, queue aging), insights page, no-data handling, NFR4/NFR13.
- 2026-03-01: Story 3.2 implementation complete. kpi-service, GET /api/kpi, insights page, KPISummaryPanel, dashboard nav, tests.
- 2026-03-01: Code review fixes applied. Added sprint-status to File List; nav updated (At-Risk, Settings); KPI API no longer exposes err.message in details; loading skeleton for KPISummaryPanel; integration test for AC1 reconciliation.

---

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

- KPI read model: kpi-service aggregates recovery count (lead-repository.countLeadsByLifecycleState), SLA compliance (sla-service.getQueueSlaSummary), queue aging (lead-repository.findVipHighLeadsByTenant + reply-draft-repository.getEarliestSentAtByLeadIds). No new DB schema.
- GET /api/kpi: tenant-scoped via query param or getOrCreateDefaultTenant; error envelope on failure (no err.message in details per architecture); zeros/null for no-data.
- KPISummaryPanel: 4 metric cards with icon+text (NFR13), skeleton loading state, unavailable/no-data states, retry on API failure.
- Dashboard layout with nav: Triage, At-Risk, Queue Insights, Settings, Home (per UX spec).
- Tests: kpi-service (5), GET /api/kpi (5), KPISummaryPanel (5), integration kpi-reconciliation (1, runs when DATABASE_URL set). All 118+ tests pass.

### File List

- _bmad-output/implementation-artifacts/sprint-status.yaml (modified: story status)
- src/server/repositories/lead-repository.ts (modified: countLeadsByLifecycleState, findVipHighLeadsByTenant)
- src/server/services/kpi-service.ts (new)
- src/app/api/kpi/route.ts (new; code review: no err.message in error details)
- src/app/(dashboard)/insights/page.tsx (new)
- src/app/(dashboard)/layout.tsx (new; code review: At-Risk, Settings nav per UX)
- src/components/KPISummaryPanel.tsx (new; code review: skeleton loading state)
- tests/services/kpi-service.test.ts (new)
- tests/api/kpi.test.ts (new)
- tests/components/KPISummaryPanel.test.tsx (new)
- tests/integration/api/kpi-reconciliation.test.ts (new; AC1 reconciliation)
