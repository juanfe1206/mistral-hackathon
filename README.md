# Mistral Lead Ops

**Lead operations platform for triage, AI-powered prioritization, and at-risk recovery—built for the Mistral Hackathon.**

Mistral Lead Ops is a full-stack SaaS application that helps teams manage leads from WhatsApp (and future channels), prioritize them with **Mistral AI** classification, detect at-risk leads by inactivity, and recover them with **Mistral-generated** draft messages behind an approval gate. The app includes a ranked triage queue, SLA visibility, manual priority overrides with audit trail, and a KPI dashboard for recovery and queue health.

---

## Table of Contents

- [What We Built](#what-we-built)
- [Built with the BMAD Method](#built-with-the-bmad-method)
- [Features](#features)
- [Mistral AI Integration](#mistral-ai-integration)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Environment Setup](#environment-setup)
- [Database and Mock Data](#database-and-mock-data)
- [Running the App](#running-the-app)
- [Scripts Reference](#scripts-reference)
- [Architecture and Docs](#architecture-and-docs)
- [Testing](#testing)
- [License](#license)

---

## What We Built

For the hackathon we implemented an end-to-end lead operations MVP:

1. **Ingestion and ranked queue** — WhatsApp webhook ingestion with source metadata, persisted interaction timeline, and a triage queue sorted by priority and SLA.
2. **AI classification and prioritization** — Mistral classifies each lead as VIP, high, or low with explainable reason tags; operators can override priority with an audit trail.
3. **At-risk detection and recovery** — Inactivity-based risk detection (configurable threshold), at-risk list with risk pulses, and Mistral-generated recovery drafts with approval-gated send.
4. **Governance and visibility** — SLA status in queue and lead views, KPI summary (recovery count, SLA compliance, queue aging), and a design-system–aligned UI with responsive and accessibility considerations.

All critical actions (priority overrides, draft approval, send) are auditable. The app is tenant-scoped and ready for multi-tenant use.

---

## Built with the BMAD Method

This project was planned and implemented using **BMAD** (Build Method for AI-Assisted Development)—a structured methodology that uses AI workflows and role-based agents to go from idea to working software.

### What BMAD provides

- **Phased workflows** — From analysis (product brief, domain/technical/market research) through planning (PRD, UX design), solutioning (architecture, epics and stories, implementation readiness), and implementation (sprint planning, story creation, dev story, code review, retrospectives).
- **Role-based agents** — Specialized personas (e.g. Architect, Scrum Master, UX Designer, Developer, Tech Writer) invoked via Cursor commands; each follows a defined workflow and produces consistent artifacts.
- **Traceable artifacts** — All planning and implementation outputs are written to a single output tree so decisions and progress are visible and reviewable.

### How we used it for this hackathon

1. **Planning** — We ran BMAD analysis and plan workflows to produce a product brief, PRD, UX design specification, and architecture decision document. Epics and stories were created from those and tracked in `_bmad-output/implementation-artifacts/sprint-status.yaml`.
2. **Implementation** — Each feature was developed by following the **dev-story** workflow: load the story file, implement against acceptance criteria and architecture, then (optionally) run **code-review** and **retrospective** workflows.
3. **Documentation** — This README and other docs were produced with the **Tech Writer** agent and aligned to the project’s documentation standards.

### Where to look in the repo

| Location | Contents |
|----------|----------|
| `_bmad/` | BMAD framework: workflows (analysis, plan, solutioning, implementation), agents, core tasks, and config. |
| `_bmad-output/planning-artifacts/` | Product brief, PRD, UX design spec, architecture, epics. |
| `_bmad-output/implementation-artifacts/` | Story files, sprint status, code reviews, retrospectives. |
| `.cursor/commands/` | Cursor commands that invoke BMAD workflows and agents (e.g. `bmad-bmm-create-story`, `bmad-agent-bmm-tech-writer`). |

If you use Cursor, you can run BMAD workflows yourself (e.g. create a new story, run a code review, or open the Tech Writer agent) via the command palette and the commands under `.cursor/commands/`.

---

## Features

| Area | Description |
|------|-------------|
| **Triage queue** | Ranked list of leads (VIP → high → low) with filters (priority, lifecycle, source), sort (priority, created, SLA), and SLA indicators. |
| **Lead detail** | Per-lead view with interaction timeline, classification reason tags, priority override, and recovery flow (generate draft → approve → send). |
| **At-risk** | Dedicated view of at-risk leads with risk pulses; mark as Recovered or Lost and generate recovery drafts. |
| **Insights** | KPI summary panel: recovery count, SLA compliance, queue aging. |
| **Settings** | Configuration status (database, Mistral API, risk inactivity hours, WhatsApp webhook). |

---

## Mistral AI Integration

We use **Mistral** in two places:

### 1. Lead classification (`mistral-small-latest`)

- **Purpose:** Assign each lead a priority (`vip` | `high` | `low`) and explainable **reason tags**.
- **Input:** Channel, source metadata, and interaction summary.
- **Output:** Structured JSON with `priority` and `reasonTags`; stored in `classifications` and shown in the triage queue and lead detail.
- **Implementation:** `src/server/services/mistral-classifier.ts` with `responseFormat: { type: "json_object" }` and a strict system prompt for salon-lead context.

### 2. Recovery draft generation (`mistral-small-latest`)

- **Purpose:** Generate short, on-brand recovery messages for at-risk leads.
- **Input:** Lead channel, metadata, risk reason, and recent interactions.
- **Output:** Plain message body (no greeting/meta); tone configurable (warm, neutral, direct).
- **Flow:** Draft is created as `ReplyDraft`; operator reviews in lead detail, approves, then sends. Approval and send are audited.
- **Implementation:** `src/server/services/reply-service.ts`; API: `POST /api/replies/generate` (body: `leadId`, optional `tone`).

Both flows require `MISTRAL_API_KEY` in the environment. If the key is missing, classification and draft generation fail with clear errors.

---

## Tech Stack

| Layer | Technology |
|-------|-------------|
| **Runtime** | Node.js 20.x (LTS) |
| **Framework** | Next.js 16 (App Router) |
| **Language** | TypeScript |
| **Database** | PostgreSQL (Prisma ORM 7, Prisma Migrate) |
| **AI** | Mistral API (`@mistralai/mistralai`) |
| **UI** | React 19, MUI 7, Emotion |
| **Validation** | Zod |
| **Package manager** | pnpm |

---

## Project Structure

```text
mistral-hackathon/
├── prisma/
│   ├── schema.prisma          # Data model (leads, interactions, classifications, risk, replies, audit)
│   ├── seed.ts                # Mock leads + interactions for demo
│   └── migrations/
├── src/
│   ├── app/
│   │   ├── (dashboard)/       # Triage, At-risk, Insights, Lead [id], Settings
│   │   ├── api/               # REST BFF: leads, risk-pulses, replies/generate, kpi, webhooks/whatsapp
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/            # Shared UI (e.g. KPISummaryPanel, SLASafetyIndicator)
│   ├── features/              # Triage, risk-pulse, reply-composer, lead-detail
│   ├── server/
│   │   ├── services/          # mistral-classifier, reply-service, risk-service, etc.
│   │   └── repositories/     # lead, interaction, risk, audit
│   ├── lib/                   # db, classification types, utils
│   └── styles/                # Theme tokens (MUI)
├── tests/                     # Unit and API tests
├── scripts/                   # Backfill, Mistral spike
└── _bmad-output/              # Planning and implementation artifacts
```

---

## Prerequisites

- **Node.js** 20.x or later (LTS recommended)
- **pnpm** (project uses pnpm as package manager)
- **PostgreSQL** (local or hosted, e.g. [Neon](https://neon.tech), [Supabase](https://supabase.com), [Railway](https://railway.app))

---

## Environment Setup

1. Create `.env.local` in the project root with the following variables (create the file if it does not exist):

2. Edit `.env.local` and set:

   | Variable | Description |
   |----------|-------------|
   | `DATABASE_URL` | PostgreSQL connection string (required for run and migrations). |
   | `MISTRAL_API_KEY` | Mistral API key (required for classification and recovery drafts). |
   | `WHATSAPP_VERIFY_TOKEN` | Optional; for WhatsApp webhook verification. |
   | `WHATSAPP_APP_SECRET` | Optional; for validating incoming WhatsApp webhooks. |
   | `RISK_INACTIVITY_HOURS` | Optional; inactivity threshold in hours for at-risk detection (default `24`). |

   For local MVP without real WhatsApp, you can leave `WHATSAPP_VERIFY_TOKEN` and `WHATSAPP_APP_SECRET` unset and use seed data.

---

## Database and Mock Data

With no real WhatsApp data, you can run migrations and seed mock leads:

```bash
# 1. Run migrations (requires PostgreSQL and DATABASE_URL)
pnpm db:migrate

# 2. Seed mock leads for demo
pnpm db:seed

# 3. Start dev server
pnpm dev
```

Then open [http://localhost:3000/triage](http://localhost:3000/triage) to see the triage queue with sample leads.

**No PostgreSQL?** Use a free tier (Neon, Supabase, or Railway), create a database, and set `DATABASE_URL` in `.env.local`.

---

## Running the App

```bash
# Install dependencies
pnpm install

# Generate Prisma client and run migrations (if not done above)
pnpm db:generate
pnpm db:migrate

# Development
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000). Main entry points:

- **Triage:** [http://localhost:3000/triage](http://localhost:3000/triage)
- **At-risk:** [http://localhost:3000/at-risk](http://localhost:3000/at-risk)
- **Insights:** [http://localhost:3000/insights](http://localhost:3000/insights)
- **Settings:** [http://localhost:3000/settings](http://localhost:3000/settings)

---

## Scripts Reference

| Script | Description |
|--------|-------------|
| `pnpm dev` | Start development server |
| `pnpm build` | Prisma generate + production build |
| `pnpm start` | Start production server |
| `pnpm lint` | Run ESLint |
| `pnpm db:generate` | Generate Prisma client |
| `pnpm db:migrate` | Run database migrations |
| `pnpm db:push` | Push schema without migration files |
| `pnpm db:seed` | Seed mock leads (for MVP demo) |
| `pnpm db:seed:demo` | Seed with demo flag (if supported) |
| `pnpm test` | Run Vitest once |
| `pnpm test:watch` | Run Vitest in watch mode |
| `pnpm backfill:interactions` | Backfill interaction data (see `scripts/`) |
| `pnpm mistral:spike` | Mistral classification spike script |

---

## Architecture and Docs

- **Architecture:** [_bmad-output/planning-artifacts/architecture.md](_bmad-output/planning-artifacts/architecture.md) — decisions, data model, API and event patterns, project structure.
- **Sprint status:** [_bmad-output/implementation-artifacts/sprint-status.yaml](_bmad-output/implementation-artifacts/sprint-status.yaml) — epics and stories delivered for the hackathon.
- **BMAD method:** See [Built with the BMAD Method](#built-with-the-bmad-method) for how this project used BMAD workflows and agents.

---

## Testing

- **Unit tests:** Vitest; service and component tests under `src` and `tests/`.
- **API tests:** e.g. `tests/api/leads-detail.test.ts`, `tests/api/leads-queue.test.ts`, `tests/webhooks/whatsapp.test.ts`, `tests/integration/api/kpi-reconciliation.test.ts`.

Run all tests:

```bash
pnpm test
```

---

## License

See repository license file.

---

*Built for the Mistral Hackathon — triage, classify, and recover leads with Mistral AI.*
