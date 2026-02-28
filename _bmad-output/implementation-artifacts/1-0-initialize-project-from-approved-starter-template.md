# Story 1.0: Initialize Project from Approved Starter Template

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a developer,
I want to bootstrap the codebase using the approved Next.js starter with baseline configuration,
so that all MVP stories are built on a consistent, runnable foundation.

## Acceptance Criteria

1. **Given** the repository is available  
   **When** I initialize the app with Next.js `create-next-app` and TypeScript  
   **Then** the app runs locally with working dev/build/lint scripts  
   **And** baseline environment setup is documented for the team  

2. **Given** baseline dependencies are installed  
   **When** the initialization story is completed  
   **Then** only foundational setup is included  
   **And** domain entities/endpoints are added only by later stories that need them  

## Tasks / Subtasks

- [x] Task 1: Bootstrap Next.js app per architecture spec (AC: #1)
  - [x] Run approved create-next-app command or align existing app to match
  - [x] Verify dev/build/lint scripts work
  - [x] Create .env.example with documented variables
- [x] Task 2: Ensure baseline-only scope (AC: #2)
  - [x] Confirm no domain entities, API routes, or business logic
  - [x] Document environment setup in README

## Dev Notes

### Critical Architecture Requirements

The architecture document ([Source: _bmad-output/planning-artifacts/architecture.md]) specifies:

**Approved initialization command:**
```bash
pnpm create next-app@latest mistral-lead-ops --ts --eslint --app --src-dir --import-alias "@/*" --use-pnpm --yes --no-tailwind
```

**Key flags (DO NOT deviate):**
- `--ts` — TypeScript enabled
- `--eslint` — ESLint for linting
- `--app` — App Router
- `--src-dir` — Source under `src/` directory (required for architecture structure)
- `--import-alias "@/*"` — Path alias for imports
- `--use-pnpm` — pnpm as package manager
- `--no-tailwind` — NO Tailwind; styling layer reserved for MUI + design tokens per UX spec

**Existing project context:** The workspace (`mistral-hackathon`) currently has a Next.js app with Tailwind, `app/` at root (no `src/`), and different defaults. The dev agent MUST either:
1. **Option A:** Create a fresh app in a subfolder (e.g., `mistral-lead-ops/`) using the exact command above, then consolidate into repo root if desired; OR
2. **Option B:** Align the existing root app to match: remove Tailwind, migrate to `src/` structure, add `--no-tailwind` equivalent (uninstall Tailwind, clean config), ensure `@/*` → `./src/*`, use pnpm. Do NOT add domain code.

### Project Structure Notes

Architecture expects this baseline structure ([Source: architecture.md#Project Structure & Boundaries]):

```
src/
├── app/
│   ├── layout.tsx
│   └── page.tsx
├── config/          # (empty or minimal for now)
├── lib/             # (empty or minimal for now)
└── styles/          # (theme tokens placeholder - MUI in later stories)
```

- Feature folders (`src/features/`), API routes (`src/app/api/`), domain code: **do NOT add** in this story.
- Only foundational setup: Next.js, TypeScript, ESLint, App Router, `src/` layout.

### Technical Requirements (Guardrails)

| Requirement | Specification | Source |
|-------------|---------------|--------|
| Package manager | pnpm | architecture.md |
| Styling | No Tailwind; MUI in later stories | architecture.md, ux-design |
| Source structure | `src/` directory required | architecture.md |
| Import alias | `@/*` → `./src/*` | architecture.md |
| Linting | ESLint | architecture.md |
| Router | App Router | architecture.md |

**create-next-app flags (use exactly):** `--ts --eslint --app --src-dir --import-alias "@/*" --use-pnpm --yes --no-tailwind`

**pnpm note:** If using pnpm v10+, `sharp` build scripts may require approval; run `pnpm approve-builds` if prompted.

### Architecture Compliance Checklist

- [x] App runs with `pnpm dev`, `pnpm build`, `pnpm start`
- [x] `pnpm lint` runs without errors
- [x] No Tailwind CSS (no tailwind.config, no @tailwind directives)
- [x] Code under `src/` (app/, layout.tsx, page.tsx)
- [x] No Prisma, Redis, auth, or domain code yet
- [x] .env.example documents any required env vars (can be minimal/empty for baseline)

### Library/Framework Requirements

- **Next.js:** Use `create-next-app@latest` — produces current stable (15.x or 16.x)
- **TypeScript:** Included via `--ts`
- **ESLint:** Included via `--eslint`
- **Do NOT add:** Tailwind, Prisma, Redis, Better Auth, MUI, React Query (later stories)

### File Structure Requirements

```
[project-root]/
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── globals.css
│   └── (no features/, config/, lib/ domains yet)
├── public/
├── package.json
├── tsconfig.json
├── next.config.ts
├── eslint.config.*
├── .env.example
└── README.md
```

### Testing Requirements

- No test harness required for this story (architecture defers to implementation stories).
- Ensure `pnpm build` succeeds as baseline validation.

### Git Intelligence Summary

Recent commits: `bmad planning`, `update gitignore for BMAD Framework`, `initiate next js app`. The repo already has a Next.js app with Tailwind and `app/` at root. Story 1.0 either aligns that app to the architecture (remove Tailwind, adopt `src/`) or bootstraps fresh per the approved command. Do not assume existing structure matches spec — verify and correct.

### Project Context Reference

No `project-context.md` found. Use PRD, architecture, and epics as primary references.

### References

- [Source: _bmad-output/planning-artifacts/architecture.md] — Starter Template Evaluation, Implementation Sequence
- [Source: _bmad-output/planning-artifacts/prd.md] — MVP scope guardrails
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md] — MUI/styling direction (no Tailwind)

## Dev Agent Record

### Agent Model Used

Cursor / Composer

### Debug Log References

### Completion Notes List

- Aligned existing Next.js app to architecture spec (Option B): removed Tailwind, migrated app/ to src/app/, set @/* → ./src/*.
- Removed tailwindcss, @tailwindcss/postcss; deleted postcss.config.mjs.
- Created src/config/, src/lib/, src/styles/ placeholders per architecture.
- Verified pnpm dev, pnpm build, pnpm lint (architecture requires pnpm).
- Created .env.example with baseline documentation; README documents environment setup.
- Code review fixes: pnpm alignment (.gitignore package-lock.json), Architecture Compliance Checklist verified, favicon added (icon.svg), File List completed.
- Code review round 2: Added package-lock.json to .gitignore, deleted package-lock.json, README pnpm-only instructions, File List added pnpm-lock.yaml.

### File List

- package.json (modified)
- tsconfig.json (modified)
- .env.example (created)
- README.md (modified)
- .gitignore (modified - package-lock.json added for pnpm alignment)
- pnpm-lock.yaml (created - pnpm lockfile)
- src/app/layout.tsx (created)
- src/app/page.tsx (created)
- src/app/globals.css (created)
- src/app/icon.svg (created - favicon)
- src/config/.gitkeep (created)
- src/lib/.gitkeep (created)
- src/styles/.gitkeep (created)
- app/ (deleted - migrated to src/app/)
- app/favicon.ico (deleted)
- postcss.config.mjs (deleted)
- package-lock.json (deleted - pnpm is package manager per architecture)
- _bmad-output/implementation-artifacts/sprint-status.yaml (modified - tracking)

### Change Log

- 2026-02-28: Story 1.0 implementation — aligned app to architecture (src/, no Tailwind), .env.example, README env setup.
- 2026-02-28: Code review fixes — pnpm alignment, Architecture Compliance Checklist, favicon (icon.svg), File List completion.
- 2026-02-28: Code review round 2 — .gitignore package-lock.json, delete package-lock.json, README pnpm-only, File List pnpm-lock.yaml.
