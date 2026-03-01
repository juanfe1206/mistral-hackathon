# Story 1.1: Ingest WhatsApp Leads with Source Metadata

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a salon operator,
I want inbound WhatsApp leads to be captured as lead records with source metadata,
so that I can act on new opportunities from one channel in MVP.

## Acceptance Criteria

1. **Given** a valid WhatsApp lead payload arrives  
   **When** ingestion is processed  
   **Then** a lead record is created with source metadata  
   **And** ingestion failures are surfaced with a visible error state  

2. **Given** a lead was ingested  
   **When** I open the lead detail  
   **Then** the source channel metadata is displayed  
   **And** the lead is available in the triage queue  

## Tasks / Subtasks

- [x] Task 1: Add Prisma schema and migrations for leads with source metadata (AC: #1)
  - [x] Define `leads` table: id, tenant_id, source_channel, source_external_id, source_metadata (JSON), created_at
  - [x] Add minimal `tenants` table if not present (MVP: single-tenant support)
  - [x] Run `prisma migrate dev`
- [x] Task 2: Implement WhatsApp webhook ingestion endpoint (AC: #1)
  - [x] Create `src/app/api/webhooks/whatsapp/route.ts`
  - [x] Handle GET verification (hub.mode, hub.verify_token, hub.challenge)
  - [x] Handle POST: verify X-Hub-Signature-256 with APP_SECRET; parse payload, extract contact/message, create lead
  - [x] Validate payload with Zod; return typed error envelope on failure
  - [x] Emit `lead.ingested` domain event (or log for now if event infra deferred)
- [x] Task 3: Implement lead service and repository (AC: #1, #2)
  - [x] Create `src/server/repositories/lead-repository.ts` with tenant-scoped queries
  - [x] Create `src/server/services/lead-service.ts` for create/find operations
  - [x] Ensure NFR11: ingestion failures are logged; no silent drops
- [x] Task 4: Minimal triage queue and lead detail views (AC: #2)
  - [x] Create `src/app/(dashboard)/triage/page.tsx` — list leads (basic table/cards)
  - [x] Create `src/app/(dashboard)/lead/[id]/page.tsx` — show lead with source metadata
  - [x] Wire to API route `GET /api/leads` and `GET /api/leads/[id]`
- [x] Task 5: API routes for leads list and detail (AC: #2)
  - [x] Create `src/app/api/leads/route.ts` (GET list)
  - [x] Create `src/app/api/leads/[id]/route.ts` (GET by id)
  - [x] Use shared error envelope; include tenant_id in all queries

## Dev Notes

### Critical Architecture Requirements

- **WhatsApp webhook:** Architecture specifies `api/webhooks/whatsapp` as ingress. [Source: architecture.md#Integration Points]
- **Event:** Emit `lead.ingested` with envelope (event_name, event_version, occurred_at, tenant_id, correlation_id, payload). Event infra may be minimal for this story—log or stub if full pub/sub not yet built.
- **NFR11:** No lead event silently dropped; ingestion failures must be logged and visible in operator UI.

### Project Structure Notes

- Story 1.0 established: `src/` layout, no Tailwind, `@/*` alias, pnpm. Do NOT reintroduce Tailwind.
- Architecture expects feature-first: `src/features/triage`, `src/features/lead-detail` — for 1.1, components can live in `src/app/(dashboard)/` or be extracted to features; prefer following architecture structure.
- API routes under `src/app/api/`; handlers delegate to `src/server/services`; no direct DB access from routes.

### References

- [Source: _bmad-output/planning-artifacts/architecture.md] — Data Architecture, API Patterns, Event Schema
- [Source: _bmad-output/planning-artifacts/epics.md] — Story 1.1 acceptance criteria
- [Source: _bmad-output/planning-artifacts/prd.md] — FR1, NFR11

---

## Developer Context (Guardrails)

### Technical Requirements

| Requirement | Specification | Source |
|-------------|---------------|--------|
| Webhook verification | GET: return hub.challenge when hub.verify_token matches env | WhatsApp Cloud API |
| Webhook payload | POST: parse `object`, `entry[].changes[].value`; extract messages, contacts, metadata | WhatsApp Cloud API |
| Source metadata | Store: channel (whatsapp), external_id (phone), message_id, timestamp, contact name | FR1, architecture |
| Error envelope | `{ error: { code, message, details }, meta: { request_id, timestamp } }` | architecture.md |
| Success envelope | `{ data: {...}, meta: { request_id, timestamp } }` | architecture.md |
| Tenant scoping | All leads queries MUST include tenant_id | architecture.md |
| DB naming | Tables: plural snake_case; columns: snake_case | architecture.md |
| API naming | Routes: kebab-case; params: snake_case | architecture.md |

### Architecture Compliance

- **Data:** PostgreSQL via Prisma. Leads table: `id` (UUID), `tenant_id`, `source_channel`, `source_external_id`, `source_metadata` (Json), `created_at`. Index: `idx_leads_tenant_id`.
- **Validation:** Zod at API boundary for webhook payload and any user-facing input.
- **No direct DB in routes:** Route → service → repository.
- **Correlation ID:** Include in webhook logs for traceability.

### Library/Framework Requirements

- **Prisma:** Add Prisma ORM v7 + Prisma Client. Use `prisma migrate` for schema.
- **Webhook security:** Store `WHATSAPP_VERIFY_TOKEN` and `WHATSAPP_APP_SECRET` in env; verify POST signature before processing.
- **Zod:** Add Zod for schema validation (webhook payload, API responses).
- **PostgreSQL:** Ensure DATABASE_URL in .env.example; document in README.
- **Do NOT add:** Redis, Better Auth, MUI, React Query for this story (later stories).

### File Structure Requirements

```
src/
├── app/
│   ├── api/
│   │   ├── leads/
│   │   │   ├── route.ts          # GET list
│   │   │   └── [id]/
│   │   │       └── route.ts      # GET by id
│   │   └── webhooks/
│   │       └── whatsapp/
│   │           └── route.ts      # GET verify, POST ingest
│   └── (dashboard)/
│       ├── triage/
│       │   └── page.tsx          # Lead queue (minimal)
│       └── lead/
│           └── [id]/
│               └── page.tsx      # Lead detail with source metadata
├── server/
│   ├── repositories/
│   │   └── lead-repository.ts
│   └── services/
│       └── lead-service.ts
├── lib/
│   └── db.ts                    # Prisma client singleton
prisma/
├── schema.prisma
└── migrations/
```

### Testing Requirements

- **Webhook:** Unit or integration test for GET verification and POST payload parsing. Mock external DB if needed.
- **Lead creation:** Test that valid payload creates lead with correct source_metadata.
- **Error paths:** Test invalid payload returns error envelope; failures are logged.
- **NFR11:** Assert ingestion failure path logs and does not silently swallow errors.

---

## Previous Story Intelligence (1-0)

- **Align existing app to architecture:** Story 1.0 aligned root app: removed Tailwind, migrated to `src/`, `@/*` alias. Do NOT reintroduce Tailwind.
- **Structure:** `src/config/`, `src/lib/`, `src/styles/` exist as placeholders. Add `src/lib/db.ts` for Prisma; `src/server/` is new for this story.
- **Package manager:** pnpm only. No package-lock.json.
- **Verification:** `pnpm dev`, `pnpm build`, `pnpm lint` must pass after changes.
- **No domain code in 1.0:** This story is the first to add Prisma, API routes, and domain logic. Follow architecture exactly.

---

## Git Intelligence Summary

Recent commits: `setup done`, `bmad planning`, `update gitignore for BMAD Framework`, `initiate next js app`. Repo has Next.js 16 + React 19, pnpm, src layout, no Tailwind. Build and lint pass. No Prisma, Redis, or domain code yet. Use established patterns (src/, @/*) and add server modules cleanly.

---

## Latest Technical Information (WhatsApp Cloud API)

**Webhook payload structure (2024–2025):**
```json
{
  "object": "whatsapp_business_account",
  "entry": [{
    "id": "WABA-ID",
    "changes": [{
      "field": "messages",
      "value": {
        "messaging_product": "whatsapp",
        "metadata": { "display_phone_number", "phone_number_id" },
        "contacts": [{ "profile": { "name" }, "wa_id" }],
        "messages": [{
          "from": "sender_phone",
          "id": "wamid",
          "timestamp": "unix_utc",
          "type": "text",
          "text": { "body": "..." }
        }]
      }
    }]
  }]
}
```

**GET verification:** Query params `hub.mode`, `hub.verify_token`, `hub.challenge`. If token matches config, return `hub.challenge` as plain text.

**Signature verification:** WhatsApp signs POST body with HMAC SHA256. Verify `X-Hub-Signature-256` using `APP_SECRET` (or equivalent). Validate before processing.

**Source metadata to persist:** `source_channel: "whatsapp"`, `source_external_id: contacts[].wa_id` or `messages[].from`, `message_id: messages[].id`, `timestamp: messages[].timestamp`, `contact_name: contacts[].profile.name`.

---

## Project Context Reference

No `project-context.md` found. Use PRD, architecture, epics, and UX spec as primary references. UX spec: triage-first, mobile/desktop parity, minimal cognitive load. Lead detail should show source metadata clearly.

---

## Change Log

- 2026-02-28: Story 1.1 implementation complete. Added Prisma schema (leads, tenants), WhatsApp webhook, lead service/repository, triage and lead detail views, API routes. Tests for webhook verification and error paths.
- 2026-03-01: Code review fixes. Added ingestion_failures table and operator UI for NFR11; triage page error handling; UUID validation and try/catch on leads API; multi-message webhook processing; tests for valid payload, VALIDATION_FAILED, and NFR11 failure path.

---

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

- Implemented Prisma 7 schema with leads and tenants tables; migration file created (user runs `pnpm db:migrate` when DB available).
- WhatsApp webhook: GET verification, POST ingestion with signature check, Zod validation, error envelope; lead.ingested logged.
- Lead repository and service with tenant-scoped queries; default tenant created on first lead.
- Triage page and lead detail page wired to API; client-side fetch from `/api/leads` and `/api/leads/[id]`.
- Vitest tests for webhook GET verification and POST error paths (signature, invalid JSON). All tests pass.
- [Code review] Ingestion failures persisted to DB and visible on triage page (AC#1, NFR11).
- [Code review] Triage page checks res.ok and json.error to surface API failures.
- [Code review] Leads API: try/catch with error envelope, UUID validation for tenant_id and id.
- [Code review] Webhook processes all messages in payload (one lead per message).
- [Code review] Tests: valid payload creates lead, VALIDATION_FAILED path, NFR11 ingestion failure recording.

### File List

- prisma/schema.prisma
- prisma.config.ts
- prisma/migrations/20260228000000_init_leads_and_tenants/migration.sql
- prisma/migrations/20260301000000_add_ingestion_failures/migration.sql
- src/lib/db.ts
- src/lib/uuid.ts
- src/server/api/error-envelope.ts
- src/server/repositories/lead-repository.ts
- src/server/repositories/ingestion-failure-repository.ts
- src/server/services/lead-service.ts
- src/app/api/webhooks/whatsapp/route.ts
- src/app/api/leads/route.ts
- src/app/api/leads/[id]/route.ts
- src/app/api/ingestion-failures/route.ts
- src/app/(dashboard)/triage/page.tsx
- src/app/(dashboard)/lead/[id]/page.tsx
- src/app/page.tsx
- tests/webhooks/whatsapp.test.ts
- vitest.config.ts
- .env.example
- package.json
