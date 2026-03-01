# Story 1.2: Persist Interaction Timeline and Ranked Queue View

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a salon operator,
I want timestamped lead history and a ranked queue view,
so that I can understand context and focus first on the most urgent leads.

## Acceptance Criteria

1. **Given** lead interactions occur  
   **When** events are stored  
   **Then** each event is timestamped and shown in lead history  
   **And** history remains consistent after refresh  

2. **Given** multiple leads with different priority values  
   **When** I open the queue  
   **Then** leads are displayed in deterministic ranked order  
   **And** queue/state updates are reflected within MVP latency targets  

## Tasks / Subtasks

- [ ] Task 1: Add Prisma schema for interactions and lead priority (AC: #1, #2)
  - [ ] Define `interactions` table: id, lead_id, tenant_id, event_type, occurred_at, payload (JSON), created_at
  - [ ] Add `priority` enum/column to `leads` (vip, high, low) with default 'low'
  - [ ] Run `prisma migrate dev`
- [ ] Task 2: Create interaction on lead ingestion (AC: #1)
  - [ ] Update WhatsApp webhook to create first interaction when creating lead (event_type: 'ingested', timestamp from message)
  - [ ] Backfill existing leads: create interaction from source_metadata if present
- [ ] Task 3: Implement timeline API and repository (AC: #1)
  - [ ] Create `src/server/repositories/interaction-repository.ts` with tenant-scoped queries
  - [ ] Create `src/app/api/leads/[id]/timeline/route.ts` (GET returns interactions ordered by occurred_at)
  - [ ] Lead service/repository: add getTimelineForLead, createInteraction
- [ ] Task 4: Implement ranked queue API (AC: #2)
  - [ ] Update `GET /api/leads` to sort by priority (vip > high > low), then created_at desc
  - [ ] Ensure deterministic ordering; include priority in response
- [ ] Task 5: Update triage and lead detail views (AC: #1, #2)
  - [ ] Triage page: display leads in API order (already fetched); show priority indicator
  - [ ] Lead detail: add timeline section showing interactions with timestamps
  - [ ] NFR1: Ensure page loads and refreshes reflect updates within 2s (server response + client render)

## Dev Notes

### Critical Architecture Requirements

- **Timeline API:** Architecture specifies `api/leads/[id]/timeline/route.ts`. [Source: architecture.md#Project Structure]
- **Event envelope:** Interaction events follow event schema patterns; `occurred_at` in ISO-8601 UTC.
- **NFR1:** Queue/state updates reflected within 2 seconds under normal load. Client fetch + render must feel responsive.

### Project Structure Notes

- Story 1.1 established: Prisma, lead-repository, lead-service, triage page, lead detail, webhook. Extend, do not replace.
- Follow architecture: `src/server/repositories/`, `src/server/services/`, `src/app/api/`.
- No Tailwind. Use existing styles (CSS variables, inline styles, or MUI when added later).

### References

- [Source: _bmad-output/planning-artifacts/architecture.md] — Data Architecture, API Patterns, Event Schema
- [Source: _bmad-output/planning-artifacts/epics.md] — Story 1.2 acceptance criteria
- [Source: _bmad-output/planning-artifacts/prd.md] — FR2, FR3, NFR1

---

## Developer Context (Guardrails)

### Technical Requirements

| Requirement | Specification | Source |
|-------------|---------------|--------|
| Interactions table | id (UUID), lead_id, tenant_id, event_type, occurred_at, payload (Json), created_at | FR2, architecture |
| Priority column | leads.priority enum: 'vip' \| 'high' \| 'low', default 'low' | FR3, epics AC#2 |
| Timeline ordering | occurred_at ASC (chronological) | UX, FR2 |
| Queue ordering | priority (vip > high > low), then created_at DESC | FR3, deterministic |
| Error envelope | `{ error: { code, message, details }, meta }` | architecture.md |
| Success envelope | `{ data, meta }` | architecture.md |
| Tenant scoping | All queries MUST include tenant_id | architecture.md |
| DB naming | Tables: plural snake_case; columns: snake_case | architecture.md |
| API naming | Routes: kebab-case; params: snake_case | architecture.md |

### Architecture Compliance

- **Data:** PostgreSQL via Prisma. Interactions: `id`, `lead_id`, `tenant_id`, `event_type`, `occurred_at`, `payload` (Json), `created_at`. Index: `idx_interactions_lead_id`, `idx_interactions_tenant_id`.
- **Validation:** Zod at API boundary for any user input.
- **No direct DB in routes:** Route → service → repository.
- **Priority schema:** Add to leads; classification (story 2.1) will populate it via AI. For 1.2, all leads default to 'low'.

### Library/Framework Requirements

- **Prisma:** Use existing Prisma setup. Add Interaction model, add priority to Lead. New migration only.
- **Zod:** Use for timeline query params (e.g., limit, offset) if needed.
- **No new deps:** No Redis, React Query, or real-time libs for this story. Simple fetch + display.
- **Do NOT add:** Redis caching, WebSockets, MUI, React Query for 1.2.

### File Structure Requirements

```
src/
├── app/
│   ├── api/
│   │   ├── leads/
│   │   │   ├── route.ts              # GET list (add sort by priority)
│   │   │   └── [id]/
│   │   │       ├── route.ts          # GET by id (unchanged)
│   │   │       └── timeline/
│   │   │           └── route.ts     # GET timeline (NEW)
│   │   └── webhooks/
│   │       └── whatsapp/
│   │           └── route.ts          # UPDATE: create interaction on lead create
│   └── (dashboard)/
│       ├── triage/
│       │   └── page.tsx               # UPDATE: show priority, ensure order from API
│       └── lead/
│           └── [id]/
│               └── page.tsx           # UPDATE: add timeline section
├── server/
│   ├── repositories/
│   │   ├── lead-repository.ts         # UPDATE: add priority to queries, getTimeline or delegate
│   │   └── interaction-repository.ts # NEW
│   └── services/
│       └── lead-service.ts            # UPDATE: createInteraction, getTimeline
├── lib/
│   └── db.ts                          # unchanged
prisma/
├── schema.prisma                      # UPDATE: Interaction model, Lead.priority
└── migrations/
```

### Testing Requirements

- **Timeline:** Unit/integration test: create lead + interactions, GET timeline returns in order.
- **Queue order:** Test GET /api/leads returns leads sorted by priority then created_at.
- **Webhook:** Test that creating lead also creates first interaction with correct timestamp.
- **Backfill:** Test (or script) that existing leads get an initial interaction from source_metadata.
- **NFR1:** Assert timeline and queue APIs respond within acceptable latency (no hard 2s in unit test; integration/manual).

---

## Previous Story Intelligence (1-1)

- **Align with 1.1 patterns:** Error envelope, tenant scoping, Prisma, route→service→repository. Reuse `lead-repository`, `lead-service`, `error-envelope`.
- **Webhook:** 1.1 creates lead from WhatsApp payload. For 1.2, when creating lead, also create first interaction. Use `messages[].timestamp` (Unix UTC) for `occurred_at`; event_type `'ingested'`.
- **Source metadata:** Stored in lead.source_metadata. For backfill of existing leads without interaction: create one interaction with occurred_at = lead.created_at, payload = { source: 'backfill' }.
- **Triage page:** Fetches `/api/leads`. Currently displays in response order. API will now return ranked order; no client-side sort needed.
- **Lead detail:** Fetches `/api/leads/[id]`. Add second fetch to `/api/leads/[id]/timeline` and render list.
- **Tests:** 1.1 uses Vitest, `tests/webhooks/whatsapp.test.ts`. Add tests in `tests/` for timeline and queue order.
- **Do NOT:** Reintroduce Tailwind. Do not add Redis, Better Auth, MUI, React Query. Keep scope to persistence + API + minimal UI.

---

## Git Intelligence Summary

Recent commits: `1,1 story dev`, `setup done`, `bmad planning`. Repo has Next.js 16, React 19, pnpm, Prisma 7, leads/tenants/ingestion_failures schema, WhatsApp webhook, triage + lead detail pages. Follow established patterns: `src/`, `@/*`, `src/server/repositories`, `src/server/services`, error envelope, Zod validation. Add interaction-repository and timeline route alongside existing structure.

---

## Latest Technical Information (Prisma 7, PostgreSQL)

- **Prisma 7:** Use `prisma migrate dev` for schema changes. Relation: Lead hasMany Interaction; Interaction belongsTo Lead.
- **JSON columns:** Prisma `Json` type for payload. Use `Prisma.JsonObject` or type assertions as needed.
- **Indexes:** Add `idx_interactions_lead_id` for timeline queries; `idx_leads_tenant_id_priority` for ranked queue if needed.
- **Priority ordering:** SQL `ORDER BY CASE priority WHEN 'vip' THEN 1 WHEN 'high' THEN 2 WHEN 'low' THEN 3 END ASC, created_at DESC` (or Prisma `orderBy` with multiple clauses).

---

## Project Context Reference

No `project-context.md` found. Use PRD, architecture, epics, and UX spec. UX spec: triage-first, "top 3 in under 10 seconds", LeadPriorityCard, QueueFilterBar (Phase 2). For 1.2: timeline in lead detail, queue ordered by priority. Keep simple; full UX components come in later stories.

---

## Change Log

- 2026-03-01: Story created via create-story workflow. Target: interaction timeline persistence + ranked queue.

---

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
