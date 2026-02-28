---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8]
inputDocuments:
  - "_bmad-output/planning-artifacts/prd.md"
  - "_bmad-output/planning-artifacts/ux-design-specification.md"
  - "_bmad-output/planning-artifacts/product-brief-Proyecto Mistral Hackathon-2026-02-28.md"
workflowType: 'architecture'
lastStep: 8
status: 'complete'
completedAt: '2026-02-28'
project_name: 'Proyecto Mistral Hackathon'
user_name: 'Rodri'
date: '2026-02-28'
---

# Architecture Decision Document

_This document builds collaboratively through step-by-step discovery. Sections are appended as we work through each architectural decision together._

## Project Context Analysis

### Requirements Overview

**Functional Requirements:**
The PRD now defines a minimum MVP contract of 12 FRs across four domains: intake and ranked queue foundation, AI classification and prioritization, at-risk recovery loop, and human-control/KPI visibility. Architecturally, this supports a lean modular design with clear boundaries between ingestion, decisioning, recovery workflows, and KPI read models. The system must support deterministic lead-state transitions and auditable critical actions without introducing non-MVP capability overhead.

**Non-Functional Requirements:**
The MVP NFR baseline (14 NFRs) requires low-latency operational UX (2s queue/state updates, 5s classification p95, 8s draft generation p95, 3s KPI load p95), secure operations (TLS, encryption at rest, RBAC, audit logs), reliability (99.0% monthly availability with visible retries/failures), and accessibility (WCAG 2.1 AA + keyboard-operable critical actions). Architecture decisions are aligned to these explicit MVP constraints.

**Scale & Complexity:**
This is a medium-complexity MVP for a hackathon scope: it still requires real-time triage, AI decisioning, and approval-gated critical messaging, but excludes advanced post-MVP breadth (multi-channel ingestion, deep diagnostics, advanced team ops automation).

- Primary domain: Full-stack SaaS lead-ops platform with AI-assisted workflow orchestration
- Complexity level: Medium
- Estimated architectural components: 8-10 core components/services (web app, auth/RBAC, tenant model, ingestion gateway, lead workflow engine, classification service, reply generation service, SLA/risk monitor, KPI read model, observability stack)

### Technical Constraints & Dependencies

- MVP channel scope is constrained to WhatsApp ingestion only; architecture should allow future channel adapters without changing core lead lifecycle semantics.
- Human approval is mandatory for VIP/high-risk interactions; policy gating must be first-class and enforceable.
- Explainability artifacts (reason tags/confidence) must be persisted with decision history for trust and debugging.
- Real-time UX expectations require event propagation and low-latency state synchronization to clients.
- Critical action history (approval/send/override) must remain auditable for MVP troubleshooting.
- Platform should remain online-first; offline behavior is not an MVP requirement.
- UI stack direction (MUI + custom domain components) influences API design toward compact triage payloads and rapid incremental updates.

### Cross-Cutting Concerns Identified

- Tenant isolation and authorization boundaries across every read/write path
- Auditability and traceability for AI decisions, overrides, approvals, and sends
- Reliability patterns: idempotency keys, retries with dead-letter/replay support, failure visibility
- Observability for SLA breach risk, queue pressure, latency budgets, and service health
- Policy-driven automation controls with confidence-aware routing
- Accessibility-by-design in core operational flows (keyboard, non-color status semantics, SR announcements)
- Change-safe integration contracts (versioning + backward compatibility)

## Starter Template Evaluation

### Primary Technology Domain

Full-stack web application based on project requirements analysis.

### Starter Options Considered

1. Next.js (`create-next-app`)
- Strong fit for full-stack App Router + API routes + real-time UX updates.
- Current and actively maintained; latest CLI options include TypeScript, App Router, linter choice, and configurable defaults.
- Easy alignment with MUI design system and triage-first UX requirements.

2. Create T3 App (`create-t3-app`)
- Strong typesafe full-stack baseline (Next.js + optional tRPC/Prisma/Auth).
- Good for teams that want opinionated full-stack conventions from day one.
- Trade-off: defaults are often Tailwind-oriented and can add stack complexity for MVP.

3. NestJS starter (`nest new`) + separate frontend
- Excellent backend structure, but requires composing frontend and backend foundations manually.
- Better for backend-heavy teams with explicit service separation goals.
- Trade-off: slower MVP setup for current UX-first constraints.

### Selected Starter: Next.js (create-next-app)

**Rationale for Selection:**
Next.js gives the best speed-to-MVP and lowest integration friction for your constraints: real-time triage UX, TypeScript, MUI component architecture, and incremental backend evolution. It avoids early over-commitment to extra stack layers while keeping clean upgrade paths for service extraction, eventing, and advanced multi-tenant operations.

**Initialization Command:**

```bash
pnpm create next-app@latest mistral-lead-ops --ts --eslint --app --src-dir --import-alias "@/*" --use-pnpm --yes --no-tailwind
```

**Architectural Decisions Provided by Starter:**

**Language & Runtime:**
TypeScript-enabled React application on Node.js, with modern Next.js runtime conventions.

**Styling Solution:**
No Tailwind baseline (`--no-tailwind`), leaving the styling layer clean for MUI + design tokens from UX specs.

**Build Tooling:**
Next.js integrated build/dev pipeline with App Router conventions and production-ready optimization defaults.

**Testing Framework:**
No full test harness is forced by default; architecture can add focused test layers (unit/integration/e2e) in implementation stories.

**Code Organization:**
App Router + optional `src/` structure gives clear route/module boundaries and supports feature-oriented foldering for lead ops domains.

**Development Experience:**
Fast local iteration, strong TypeScript/editor support, integrated linting, and straightforward deployment options.

**Note:** Project initialization using this command should be the first implementation story.

## Core Architectural Decisions

### Decision Priority Analysis

**Critical Decisions (Block Implementation):**
- Data store and tenancy model: PostgreSQL 18.x with strict tenant scoping (`tenant_id` enforced in all domain tables).
- AuthN/AuthZ baseline: Better Auth v1 + role-based authorization (Owner/Admin, Operator/Staff).
- API contract style: REST-first BFF endpoints in Next.js Route Handlers with schema validation.
- Eventing backbone: domain events for lead lifecycle transitions to satisfy auditability and replay.
- Deployment baseline: managed Postgres + managed Redis + Next.js hosting with environment isolation.

**Important Decisions (Shape Architecture):**
- ORM + migrations: Prisma ORM v7 + Prisma Migrate.
- Caching/queues: Redis 8.x for short-lived cache, job queues, and idempotency/retry coordination.
- Frontend state strategy: Server-first data fetching + React Query for client cache + minimal local UI state store.
- Observability: structured logs, traces, metrics, and SLA/risk domain events.
- Contract governance: versioned API routes and integration event schemas.

**Deferred Decisions (Post-MVP):**
- GraphQL federation or multi-service API gateway.
- Full event streaming platform (Kafka/NATS) beyond Redis-backed queueing.
- Multi-region active-active tenancy.
- Advanced policy engine externalization (OPA/Cedar) if rule complexity grows.

### Data Architecture

- **Primary DB:** PostgreSQL 18.x (latest patch line currently 18.3).
- **Modeling approach:** relational core with normalized entities:
  - tenants, users, roles, memberships
  - leads, interactions, classifications, risk_pulses
  - response_actions, approvals, overrides, SLA_snapshots
  - audit_events, integration_events
- **Validation strategy:** Zod schemas at API boundary + Prisma schema constraints + DB constraints.
- **Migration strategy:** Prisma Migrate with forward-only migrations and rollback playbooks per release.
- **Caching strategy:** Redis 8.x for:
  - queue views and computed urgency snapshots (short TTL)
  - distributed locks/idempotency keys
  - async job coordination for classification/reply generation.

### Authentication & Security

- **Authentication:** Better Auth v1 with credential/OAuth support and session management.
- **Authorization:** RBAC + tenant-scoped permission checks on every protected endpoint.
- **Security middleware:** CSRF/session protections, rate limiting on auth + message-send routes, secure headers.
- **Encryption:** TLS in transit; encrypted storage at rest via managed providers.
- **API security:** signed server-side sessions, per-tenant access enforcement, security/audit event logging for privileged actions.

### API & Communication Patterns

- **API style:** REST-first BFF endpoints in Next.js Route Handlers.
- **Documentation:** OpenAPI generated from route schemas + shared domain schema docs.
- **Error handling standard:** typed error envelope (`code`, `message`, `details`, `correlationId`).
- **Rate limiting:** tenant-aware and endpoint-class aware (stricter on mutation and AI generation routes).
- **Service communication:** modular monolith boundary with async domain events:
  - lead.ingested
  - lead.classified
  - lead.at_risk
  - reply.generated
  - action.approved/sent
  - sla.updated

### Frontend Architecture

- **Component architecture:** feature modules aligned to domain (triage, lead-detail, risk-pulse, reply-composer, insights).
- **State management:** server-state dominant; React Query for cached fetches + lightweight local store for transient UI controls.
- **Routing strategy:** App Router with role/tenant guard middleware.
- **Performance optimization:** partial rendering/streaming where useful, optimistic updates for safe interactions, background revalidation for queue freshness.
- **Bundle optimization:** route-level code splitting and strict dependency budget for operator-critical surfaces.

### Infrastructure & Deployment

- **Hosting strategy:** Next.js deployment platform (Vercel or equivalent) + managed Postgres + managed Redis.
- **CI/CD:** branch-based checks (typecheck, lint, test, migration validation) and controlled release promotion by environment.
- **Environment model:** `dev`, `staging`, `prod` with isolated databases/redis and strict secret management.
- **Monitoring/logging:** centralized logs, traces, and SLA domain metrics; alerting on latency SLOs and queue risk thresholds.
- **Scaling strategy:** start as modular monolith, scale read/write hotspots and worker throughput independently, extract services only when bottlenecks are proven.

### Decision Impact Analysis

**Implementation Sequence:**
1. Bootstrap Next.js app and baseline tooling.
2. Implement tenant/auth/RBAC foundation.
3. Define Prisma schema + migrations for lead lifecycle and audit events.
4. Build ingestion and classification pipeline with async jobs.
5. Build triage/risk/reply UX with policy-gated actions.
6. Add observability, KPI aggregation, and SLA monitoring.
7. Harden contracts, retries, and idempotency flows.

**Cross-Component Dependencies:**
- Tenant/auth model constrains every API and DB query path.
- Event schema design drives audit timeline, KPI pipeline, and retry/replay behavior.
- Caching and queue policy choices directly affect SLA latency and UX freshness.
- Validation contracts connect frontend forms, API boundaries, and integration adapters.

## Implementation Patterns & Consistency Rules

### Pattern Categories Defined

**Critical Conflict Points Identified:**
12 areas where AI agents could make different choices and create integration conflicts.

### Naming Patterns

**Database Naming Conventions:**
- Tables: plural snake_case (`leads`, `risk_pulses`, `audit_events`)
- Columns: snake_case (`tenant_id`, `created_at`, `last_contact_at`)
- Primary keys: `id` (UUID)
- Foreign keys: `<entity>_id` (`lead_id`, `user_id`)
- Indexes: `idx_<table>_<column(s)>` (`idx_leads_tenant_id_status`)

**API Naming Conventions:**
- Routes: plural kebab-case resources (`/api/leads`, `/api/risk-pulses`)
- Route params: `[id]` in file-system routes, exposed as `id` in handlers
- Query params: snake_case in URL (`tenant_id`, `updated_after`), mapped to typed DTOs
- Headers: standard casing (`Authorization`, `Content-Type`, `X-Request-Id`)

**Code Naming Conventions:**
- Components: PascalCase (`LeadPriorityCard.tsx`)
- Functions/vars: camelCase (`getLeadQueue`, `tenantId`)
- Types/interfaces/enums: PascalCase (`LeadStatus`, `RiskLevel`)
- Constants: UPPER_SNAKE_CASE for global constants

### Structure Patterns

**Project Organization:**
- Feature-first structure for app code (`src/features/triage`, `src/features/risk-pulse`)
- Shared utilities in `src/lib`, shared UI in `src/components`
- API route contracts and validators colocated with route handlers
- Domain services in `src/server/services`, data access in `src/server/repositories`

**File Structure Patterns:**
- Tests co-located for units (`*.test.ts(x)`), integration tests in `tests/integration`
- Schema/migrations under Prisma defaults
- Static assets under `public/`
- Config modules under `src/config`

### Format Patterns

**API Response Formats:**
- Success: `{ "data": ..., "meta": { "request_id": "...", "timestamp": "..." } }`
- Error: `{ "error": { "code": "...", "message": "...", "details": [...] }, "meta": { ... } }`
- Never return unwrapped mixed formats from endpoints.

**Data Exchange Formats:**
- JSON keys in snake_case at API boundary, camelCase internally in TS domain objects.
- Date/time: ISO-8601 UTC strings only.
- Booleans: strict `true/false`.
- Nulls: explicit `null` when value intentionally absent.

### Communication Patterns

**Event System Patterns:**
- Event names: domain dotted lowercase (`lead.ingested`, `lead.classified`, `reply.generated`)
- Event envelope:
  - `event_name`
  - `event_version`
  - `occurred_at`
  - `tenant_id`
  - `correlation_id`
  - `payload`
- Event versioning: increment `event_version` on payload breaking change.

**State Management Patterns:**
- Server state via React Query; cache keys must include `tenantId`.
- UI ephemeral state local to feature components unless shared cross-feature.
- State updates immutable; no direct mutation of cached objects.
- Action names in imperative form (`approveReply`, `markLeadAtRisk`).

### Process Patterns

**Error Handling Patterns:**
- Use typed domain errors mapped centrally to API error envelope.
- Log technical details server-side with `correlation_id`; show concise user-facing message.
- Retry only idempotent or explicitly key-protected operations.
- Any AI-service failure must surface actionable fallback path.

**Loading State Patterns:**
- Every async UI surface has `loading`, `empty`, `error`, `ready` states.
- Skeletons for list-heavy triage views; spinners only for short inline actions.
- Disable duplicate-submit buttons during pending mutation.
- Preserve filter/sort context across reloads and navigation.

### Enforcement Guidelines

**All AI Agents MUST:**
- Follow naming/format rules exactly for DB, API, and events.
- Include `tenant_id` and `correlation_id` in all write paths and event emissions.
- Use shared error envelope and never invent endpoint-specific error formats.
- Keep all VIP/high-risk send flows behind explicit approval gate checks.
- Add or update tests with every new feature/repository/service change.

**Pattern Enforcement:**
- CI checks: lint, typecheck, test, schema validation.
- PR checklist includes naming/format/event compliance.
- Violations documented in PR comments with fix before merge.
- Pattern updates must be made in architecture doc first, then applied in code.

### Pattern Examples

**Good Examples:**
- `POST /api/leads/{id}/approve-reply` returns wrapped success/error envelopes.
- Event emitted as `lead.at_risk` with `event_version: 1` and full envelope metadata.
- DB column `tenant_id` on every tenant-owned table.

**Anti-Patterns:**
- Mixing `camelCase` and `snake_case` randomly in API payloads.
- Endpoint returning plain `{ message: "ok" }` while others return wrapped envelopes.
- Emitting event names like `LeadAtRisk` in one service and `lead.at_risk` in another.
- Skipping tenant scoping in repository query methods.

## Project Structure & Boundaries

### Complete Project Directory Structure

```text
mistral-lead-ops/
├── README.md
├── package.json
├── pnpm-lock.yaml
├── next.config.ts
├── tsconfig.json
├── eslint.config.mjs
├── .env.example
├── .env.local
├── .gitignore
├── .github/
│   └── workflows/
│       ├── ci.yml
│       └── deploy.yml
├── prisma/
│   ├── schema.prisma
│   ├── seed.ts
│   └── migrations/
├── public/
│   ├── icons/
│   └── images/
├── tests/
│   ├── integration/
│   │   ├── api/
│   │   └── workflows/
│   ├── e2e/
│   └── fixtures/
└── src/
    ├── app/
    │   ├── (auth)/
    │   │   ├── login/page.tsx
    │   │   └── callback/route.ts
    │   ├── (dashboard)/
    │   │   ├── triage/page.tsx
    │   │   ├── at-risk/page.tsx
    │   │   ├── insights/page.tsx
    │   │   └── lead/[id]/page.tsx
    │   ├── api/
    │   │   ├── leads/
    │   │   │   ├── route.ts
    │   │   │   └── [id]/
    │   │   │       ├── route.ts
    │   │   │       ├── approve-reply/route.ts
    │   │   │       ├── override-priority/route.ts
    │   │   │       └── timeline/route.ts
    │   │   ├── risk-pulses/route.ts
    │   │   ├── replies/generate/route.ts
    │   │   ├── sla/route.ts
    │   │   └── webhooks/
    │   │       └── whatsapp/route.ts
    │   ├── layout.tsx
    │   ├── page.tsx
    │   └── globals.css
    ├── middleware.ts
    ├── config/
    │   ├── env.ts
    │   ├── auth.ts
    │   ├── api.ts
    │   └── observability.ts
    ├── features/
    │   ├── triage/
    │   │   ├── components/
    │   │   ├── hooks/
    │   │   └── state/
    │   ├── risk-pulse/
    │   ├── reply-composer/
    │   ├── lead-detail/
    │   └── insights/
    ├── components/
    │   ├── ui/
    │   ├── feedback/
    │   └── layout/
    ├── server/
    │   ├── api/
    │   │   ├── contracts/
    │   │   ├── validators/
    │   │   └── error-mapper.ts
    │   ├── services/
    │   │   ├── lead-service.ts
    │   │   ├── classification-service.ts
    │   │   ├── risk-service.ts
    │   │   ├── reply-service.ts
    │   │   ├── sla-service.ts
    │   │   └── audit-service.ts
    │   ├── repositories/
    │   │   ├── lead-repository.ts
    │   │   ├── user-repository.ts
    │   │   ├── risk-repository.ts
    │   │   └── audit-repository.ts
    │   ├── events/
    │   │   ├── publisher.ts
    │   │   ├── handlers/
    │   │   └── schemas/
    │   ├── queue/
    │   │   ├── redis.ts
    │   │   ├── workers/
    │   │   └── jobs/
    │   └── auth/
    │       ├── better-auth.ts
    │       ├── rbac.ts
    │       └── tenant-guard.ts
    ├── lib/
    │   ├── db.ts
    │   ├── redis.ts
    │   ├── logger.ts
    │   ├── request-context.ts
    │   └── utils.ts
    ├── types/
    │   ├── api.ts
    │   ├── domain.ts
    │   └── events.ts
    └── styles/
        ├── tokens.ts
        └── theme.ts
```

### Architectural Boundaries

**API Boundaries:**
- `src/app/api/**` is the only HTTP ingress.
- All handlers validate input and delegate to `src/server/services`.
- No direct DB access from route handlers.

**Component Boundaries:**
- `src/features/**` owns domain UI behavior.
- `src/components/ui/**` is presentation-only and reusable.
- Feature components can consume shared UI; shared UI cannot depend on features.

**Service Boundaries:**
- `services` contain business rules and publish domain events.
- `repositories` own persistence queries and tenant scoping.
- `events/queue` handle async processing and retries.

**Data Boundaries:**
- Prisma is the single ORM path (`src/lib/db.ts`).
- All tenant-owned entities require `tenant_id`.
- Redis is used for cache/queue/idempotency, not source-of-truth domain data.

### Requirements to Structure Mapping

**Feature/FR Mapping:**
- Intake and queue foundation (FR1-FR3): `api/webhooks/whatsapp`, `services/lead-service`, `repositories/lead-repository`, `features/triage`
- AI classification and prioritization (FR4-FR6): `services/classification-service`, `features/triage`, `api/leads/[id]/override-priority`
- At-risk recovery loop (FR7-FR9): `features/risk-pulse`, `services/risk-service`, `api/risk-pulses`, `api/replies/generate`
- Human control and KPI visibility (FR10-FR12): `api/leads/[id]/approve-reply`, `services/reply-service`, `services/sla-service`, `features/insights`

**Cross-Cutting Concerns:**
- Auth + tenant isolation: `middleware.ts`, `server/auth/*`, repository layer
- Auditability: `services/audit-service`, `events/publisher`, approval/override/send action logs
- Observability: `lib/logger.ts`, `config/observability.ts`, worker instrumentation
- Accessibility/UI consistency: `styles/theme.ts`, `components/ui`, feature contracts

### Integration Points

**Internal Communication:**
- Route handler -> service -> repository
- Service -> event publisher -> async handlers/workers
- Frontend fetches API via typed contracts and shared response envelope

**External Integrations:**
- WhatsApp webhook ingress: `api/webhooks/whatsapp`
- Future adapters added under `api/webhooks/*` and normalized by lead-service (post-MVP)

**Data Flow:**
1. Ingest external event
2. Persist lead interaction
3. Trigger classification and risk checks
4. Update queue/SLA projections
5. Surface UI updates and action flows
6. Record audit trail and metrics events

### File Organization Patterns

**Configuration Files:**
- Runtime env and provider config in `src/config/*`
- Shared infra clients in `src/lib/*`

**Source Organization:**
- Feature-first for UI
- Layered server modules for domain logic and persistence

**Test Organization:**
- Unit tests co-located
- Integration tests in `tests/integration`
- E2E journeys in `tests/e2e` aligned to core user flows

**Asset Organization:**
- Static assets in `public/`
- Theme/design tokens in `src/styles/`

### Development Workflow Integration

**Development Server Structure:**
- Single Next.js app with modular boundaries.
- Workers/jobs run in same repo with clear server modules.

**Build Process Structure:**
- CI validates type, lint, tests, and migration integrity before deploy.

**Deployment Structure:**
- App deploy + managed Postgres + managed Redis with env-specific isolation (`dev/staging/prod`).

## Architecture Validation Results

### Coherence Validation ✅

**Decision Compatibility:**
All selected technologies are compatible for the chosen modular-monolith full-stack approach: Next.js + Node LTS + Prisma + PostgreSQL + Redis + Better Auth. No version-level blockers identified in the documented stack decisions. Security, tenancy, and eventing choices align with one another and do not introduce architectural contradictions.

**Pattern Consistency:**
Implementation patterns support the architecture directly: naming, response envelopes, event schema conventions, and tenant/correlation requirements align with API, data, and observability decisions. Pattern definitions are specific enough to reduce multi-agent divergence in coding style and behavior.

**Structure Alignment:**
The project structure reflects the architecture boundaries correctly (route handlers, service layer, repository layer, async events/workers). Requirements are mapped to concrete modules and integration points, supporting both implementation sequencing and maintainability.

### Requirements Coverage Validation ✅

**Epic/Feature Coverage:**
All MVP feature domains from PRD are mapped: WhatsApp lead intake and ranked queue, AI classification with reason tags and override, at-risk pulse and recovery loop, approval-gated VIP/high-risk sends, and KPI visibility (recovery count, SLA, queue aging).

**Functional Requirements Coverage:**
All 12 MVP FRs are covered by architectural components, API boundaries, and mapped file/module locations. Cross-cutting MVP FRs (tenant isolation, auditability, and critical action logging) are handled in foundational layers.

**Non-Functional Requirements Coverage:**
NFR coverage is architecturally present for performance, reliability, security, and accessibility, aligned to the MVP baseline.

### Implementation Readiness Validation ✅

**Decision Completeness:**
Critical and important decisions are documented with concrete stack choices and rationale, including deferred items to prevent MVP scope drift.

**Structure Completeness:**
Directory tree and module boundaries are specific and implementation-ready; no placeholder-only architecture sections remain.

**Pattern Completeness:**
Conflict-prone implementation zones are covered (naming, formats, events, error/loading states, enforcement process), with explicit good/anti-pattern examples.

### Gap Analysis Results

**Critical Gaps:** None blocking implementation.

**Important Gaps:**
- No explicit schema for OpenAPI generation toolchain yet (choice can be finalized in first implementation story).
- No explicit queue library named (e.g., BullMQ vs equivalent); current architecture supports either and should lock one in implementation bootstrap.
- No formal SLO dashboard spec yet; current observability architecture is sufficient to start.

**Nice-to-Have Gaps:**
- Add architecture decision records (ADRs) for major future changes.
- Add canonical event catalog markdown file with examples per event type.
- Add sequence diagrams for top 3 runtime workflows (ingest, risk escalation, approval-send).

### Validation Issues Addressed

- Potential naming inconsistency risk resolved via strict conventions across DB/API/code/event layers.
- Potential service boundary ambiguity resolved through route -> service -> repository layering rules.
- Potential multi-agent drift risk reduced via enforcement section (CI + PR checklist + architecture-first change process).

### Architecture Completeness Checklist

**✅ Requirements Analysis**
- [x] Project context thoroughly analyzed
- [x] Scale and complexity assessed
- [x] Technical constraints identified
- [x] Cross-cutting concerns mapped

**✅ Architectural Decisions**
- [x] Critical decisions documented with versions
- [x] Technology stack fully specified
- [x] Integration patterns defined
- [x] Performance considerations addressed

**✅ Implementation Patterns**
- [x] Naming conventions established
- [x] Structure patterns defined
- [x] Communication patterns specified
- [x] Process patterns documented

**✅ Project Structure**
- [x] Complete directory structure defined
- [x] Component boundaries established
- [x] Integration points mapped
- [x] Requirements to structure mapping complete

### Architecture Readiness Assessment

**Overall Status:** READY FOR IMPLEMENTATION

**Confidence Level:** High

**Key Strengths:**
- Strong alignment between product requirements and technical boundaries
- Explicit multi-agent consistency rules reducing integration conflicts
- Clear modular path from MVP to future scalability needs without premature complexity

**Areas for Future Enhancement:**
- Formalize event catalog and consumer contracts
- Add deeper operational runbooks (incident/debug/replay)
- Add service extraction criteria thresholds based on measured bottlenecks

### Implementation Handoff

**AI Agent Guidelines:**
- Follow all architectural decisions exactly as documented
- Use implementation patterns consistently across all components
- Respect project structure and boundaries
- Refer to this document for all architectural questions

**First Implementation Priority:**
`pnpm create next-app@latest mistral-lead-ops --ts --eslint --app --src-dir --import-alias "@/*" --use-pnpm --yes --no-tailwind`
