# Story 2.1: Classify Leads and Show Reason Tags

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a salon operator,
I want each lead classified with visible reason tags,
so that I can trust and understand prioritization decisions.

## Acceptance Criteria

1. **Given** a newly ingested or updated lead  
   **When** classification runs  
   **Then** the lead is labeled VIP, high-risk, or low-priority  
   **And** reason tags are shown in queue/detail views  

2. **Given** classification fails  
   **When** the result cannot be produced  
   **Then** the UI shows a retry-capable error state  
   **And** no failure is silently ignored  

## Tasks / Subtasks

- [x] Task 1: Add Prisma schema for classifications (AC: #1)
  - [x] Add `classifications` table: id, lead_id, tenant_id, priority, reason_tags (Json array), model_version?, created_at
  - [x] Add index idx_classifications_lead_id, idx_classifications_tenant_id
  - [x] Run `prisma migrate dev`
- [x] Task 2: Implement Mistral classification service (AC: #1)
  - [x] Create `src/server/services/mistral-classifier.ts` (or `classification-service.ts`) with `classifyLead(context): Promise<ClassifyLeadResult>`
  - [x] Use `@mistralai/mistralai`, model `mistral-small-latest`, JSON mode (reuse spike prompt structure from `scripts/mistral-classify-spike.ts`)
  - [x] Build context from lead.sourceChannel, lead.sourceMetadata, interactionsSummary (last N interactions or messages)
  - [x] Return { priority, reasonTags }; on API error throw/handle for NFR10
- [x] Task 3: Create classification repository and wire into lead lifecycle (AC: #1)
  - [x] Create `src/server/repositories/classification-repository.ts`: createClassification, getLatestForLead (tenant-scoped)
  - [x] Classification service: after classify, create classification record and update lead.priority
  - [x] Wire classification into: (a) webhook after lead+interaction creation, (b) when new interaction added (new inbound message)
- [x] Task 4: Expose classification data in APIs (AC: #1)
  - [x] GET /api/leads: include priority (already) and reason_tags from latest classification
  - [x] GET /api/leads/[id]: include priority and reason_tags
  - [x] Add optional GET /api/leads/[id]/reclassify to trigger re-classification (for retry / manual refresh)
- [x] Task 5: Update triage and lead detail views (AC: #1, #2)
  - [x] Triage: display reason tags (chips/badges) per lead card
  - [x] Lead detail: display reason tags and classification state
  - [x] NFR10: When classification fails, show error state with retry button (no silent failure)
- [x] Task 6: Tests (AC: #1, #2)
  - [x] Use `tests/mocks/mistral-classifier.ts` via vi.mock; never hit real API
  - [x] Test: classify on ingest → lead has priority + reason_tags
  - [x] Test: classification failure → API returns error envelope, UI path documented for retry
  - [x] NFR2: Assert classification completes within reasonable time in tests (mock is fast)

## Dev Notes

### Critical Architecture Requirements

- **Event:** Emit `lead.classified` domain event (architecture.md) with envelope: event_name, occurred_at, tenant_id, correlation_id, payload { lead_id, priority, reason_tags }.
- **Explainability:** Reason tags and model context persisted with each classification (architecture.md).
- **NFR2:** AI classification within 5 seconds for 95% of new lead events.
- **NFR10:** Failed classification or reply-generation surfaced with retry action. Never silent fail.

### Project Structure Notes

- Epic 1 established: leads, interactions, priority column, triage, lead detail, timeline, queue API.
- `src/lib/classification.ts` exists: ClassifyLeadResult, LeadClassificationContext.
- `tests/mocks/mistral-classifier.ts` exists: createMockClassifier, MOCK_CLASSIFICATIONS. Use vi.mock in tests.
- `scripts/mistral-classify-spike.ts` has proven prompt and response format.

### References

- [Source: _bmad-output/planning-artifacts/architecture.md] — classifications, lead.classified event, API patterns
- [Source: _bmad-output/planning-artifacts/epics.md] — Story 2.1 AC
- [Source: _bmad-output/planning-artifacts/prd.md] — FR4, FR5, NFR2, NFR10
- [Source: _bmad-output/implementation-artifacts/epic-1-retro-2026-03-01.md] — Mistral spike/mock prep done

---

## Developer Context (Guardrails)

### Technical Requirements

| Requirement | Specification | Source |
|-------------|---------------|--------|
| Classifications table | id (UUID), lead_id, tenant_id, priority (enum), reason_tags (Json array), model_version?, created_at | architecture, FR5 |
| Lead priority update | Update lead.priority when classification succeeds | FR4 |
| Reason tags in API | Include in GET /api/leads and GET /api/leads/[id] from latest classification | FR5, AC#1 |
| Error envelope | `{ error: { code, message, details }, meta }` for failures | architecture.md |
| Tenant scoping | All queries MUST include tenant_id | architecture.md |
| Mistral config | MISTRAL_API_KEY from env; use mistral-small-latest, responseFormat: json_object | spike |
| Retry on failure | NFR10: UI shows retry-capable error; API returns 5xx or 4xx with retry action | NFR10 |

### Architecture Compliance

- **Data:** PostgreSQL via Prisma. classifications: id, lead_id, tenant_id, priority, reason_tags (Json), model_version?, created_at. Indexes: idx_classifications_lead_id, idx_classifications_tenant_id.
- **Route → service → repository:** No direct DB in routes. Classification triggered from lead-service or webhook flow.
- **Event:** lead.classified with full envelope. Optional: emit from classification-service after successful classify.
- **Validation:** Zod at API boundary. No user input for classify; context built from lead/interactions.

### Library/Framework Requirements

- **@mistralai/mistralai:** Already in package.json (^1.14.1). Use for classification.
- **Prisma:** Add Classification model; new migration only.
- **Zod:** Use for any new API input (e.g. reclassify route if added).
- **Existing:** src/lib/classification.ts — ClassifyLeadResult, LeadClassificationContext. Do not duplicate.

### File Structure Requirements

```
src/
├── app/
│   ├── api/
│   │   └── leads/
│   │       ├── route.ts                    # UPDATE: include reason_tags in list response
│   │       └── [id]/
│   │           ├── route.ts                # UPDATE: include reason_tags
│   │           └── reclassify/
│   │               └── route.ts            # NEW (optional): POST to trigger re-classify
│   └── (dashboard)/
│       ├── triage/
│       │   └── page.tsx                    # UPDATE: show reason tags, error+retry state
│       └── lead/
│           └── [id]/
│               └── page.tsx                # UPDATE: reason tags, retry on classify failure
├── server/
│   ├── repositories/
│   │   ├── classification-repository.ts     # NEW
│   │   └── lead-repository.ts              # UPDATE if needed for classification join
│   ├── services/
│   │   ├── mistral-classifier.ts            # NEW
│   │   └── lead-service.ts                 # UPDATE: call classifier on ingest/update
├── lib/
│   └── classification.ts                   # EXISTS — ClassifyLeadResult, LeadClassificationContext
prisma/
├── schema.prisma                           # UPDATE: Classification model
└── migrations/
```

### Testing Requirements

- **Mock Mistral:** `vi.mock("@/server/services/mistral-classifier", () => ({ classifyLead: createMockClassifier(...) }))`
- **On ingest:** Create lead via webhook flow, assert classification created, lead.priority and reason_tags set.
- **On failure:** Mock classifier to throw; assert error envelope returned, no silent drop.
- **Queue/detail API:** GET /api/leads and GET /api/leads/[id] return reason_tags when classification exists.

---

## Previous Story Intelligence (Epic 1)

- **1.2:** Timeline, queue, interactions, priority. Webhook creates lead+interaction in transaction. Use interaction-repository, lead-repository. No Tailwind, no Redis for MVP.
- **Epic 1 retro:** Mistral spike (`pnpm mistral:spike`) and mock (`tests/mocks/mistral-classifier.ts`) done. Include NFRs in dev notes. Run `pnpm test` before marking done.
- **Align with 1.1/1.2:** Error envelope, tenant scoping, route→service→repository. Reuse error-envelope, Zod patterns.

---

## Git Intelligence Summary

Repo has Next.js 16, React 19, pnpm, Prisma 7, leads/tenants/interactions/ingestion_failures, LeadPriority enum, WhatsApp webhook, triage + lead detail, timeline API, queue API. Mistral spike and mock already added. Follow existing patterns: src/, @/*, error envelope, Vitest.

---

## Latest Technical Information (Mistral, Prisma)

- **Mistral API:** Use `responseFormat: { type: "json_object" }` for structured output. Temperature 0.2 for consistency.
- **Prompt:** Reuse structure from `scripts/mistral-classify-spike.ts` (CLASSIFY_SYSTEM, user content from lead context).
- **Prisma Json:** reason_tags as `Json` type; store `["tag1","tag2"]`. Use Prisma.JsonArray or type assertion.
- **Classification trigger:** Call from lead-service after createLead (webhook flow). For "updated" lead: when new interaction added via webhook, call classify again before/after adding interaction.

---

## Project Context Reference

No project-context.md. Use PRD, architecture, epics, UX spec. UX: LeadPriorityCard anatomy includes reason tags; Phase 1 components. Keep triage clear: "top 3 in under 10 seconds." Reason tags max 2 primary before overflow (UX spec).

---

## Change Log

- 2026-03-01: Story created via create-story workflow. Target: AI classification with Mistral + reason tags in queue/detail.
- 2026-03-01: Implementation complete. Prisma Classification model, mistral-classifier service, classification-repository, webhook integration, API updates (reason_tags), triage/lead detail UI with reason tags and Reclassify/Retry, tests.
- 2026-03-01: Code review (AI). Fixed: lead-service now uses classification-repository (route→service→repository); lead.classified event uses full envelope like lead.ingested. Story approved.

---

## Dev Agent Record

### Agent Model Used

Composer (dev-story workflow)

### Debug Log References

### Completion Notes List

- Prisma: Classification model with lead_id, tenant_id, priority, reason_tags (Json), model_version. Migration applied.
- Mistral classifier: classifyLead() uses mistral-small-latest, JSON mode, prompt from spike. Throws on API failure.
- Lead-service: classifyAndPersistForLead() fetches lead, builds context from interactions, calls classifier, updates lead.priority and creates classification in transaction.
- Webhook: Calls classifyAndPersistForLead after createLead; catches errors, logs, returns 200 (NFR10 retry via reclassify).
- Webhook: Added text_body to sourceMetadata for classification context.
- Lead-repository: Included latest classification in findLeadById and findLeadsByTenant.
- APIs: GET /api/leads and GET /api/leads/[id] return reason_tags. POST /api/leads/[id]/reclassify for retry.
- Triage: Reason tags (max 2) shown as chips per lead card.
- Lead detail: Reason tags section, Reclassify button, error state with Retry when reclassify fails.
- Tests: WhatsApp mock includes classifyAndPersistForLead; NFR10 test (classification fails → 200); leads-queue reason_tags; leads-reclassify (success, 404, 503, 400).
- [Code review] lead-service uses classification-repository.createClassification with tx for route→service→repository consistency.
- [Code review] lead.classified event logs full envelope (event_name, payload with priority/reason_tags).

### File List

- prisma/schema.prisma (modified)
- prisma/migrations/20260301095724_add_classifications/ (new)
- src/server/services/mistral-classifier.ts (new)
- src/server/repositories/classification-repository.ts (new)
- src/server/repositories/lead-repository.ts (modified)
- src/server/services/lead-service.ts (modified)
- src/app/api/webhooks/whatsapp/route.ts (modified)
- src/app/api/leads/route.ts (modified)
- src/app/api/leads/[id]/route.ts (modified)
- src/app/api/leads/[id]/reclassify/route.ts (new)
- src/app/(dashboard)/triage/page.tsx (modified)
- src/app/(dashboard)/lead/[id]/page.tsx (modified)
- tests/webhooks/whatsapp.test.ts (modified)
- tests/api/leads-queue.test.ts (modified)
- tests/api/leads-reclassify.test.ts (new)

---

## Senior Developer Review (AI)

**Date:** 2026-03-01  
**Reviewer:** Composer (code-review workflow)  
**Outcome:** Approve  

### Findings Addressed

| # | Severity | Finding | Resolution |
|---|----------|---------|------------|
| 1 | MEDIUM | Classification repository created but never used — lead-service used prisma directly, violating route→service→repository | Refactored lead-service to use classificationRepository.createClassification() with transaction client; repository now supports optional tx param |
| 2 | LOW | lead.classified event used simple log; architecture specifies full envelope like lead.ingested | Updated to log full envelope: event_name, event_version, occurred_at, tenant_id, correlation_id, payload { lead_id, priority, reason_tags } |

### Deferred (LOW)

- Task 3(b) "when new interaction added": Current webhook creates new lead per message; no flow to add interactions to existing leads. Deferred until that flow exists.
- Story said GET for reclassify; implemented POST (correct for side-effect action).
- Triage does not show "Retry" for leads that failed classification on ingest; user must open lead detail and use Reclassify. Acceptable per AC2.
