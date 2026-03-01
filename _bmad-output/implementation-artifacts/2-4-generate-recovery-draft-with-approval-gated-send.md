# Story 2.4: Generate Recovery Draft with Approval-Gated Send

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a salon operator,
I want recovery draft generation and approval-gated send for critical leads,
so that I can act quickly without losing control over high-impact messages.

## Acceptance Criteria

1. **Given** a lead is At-Risk  
   **When** I request a recovery draft  
   **Then** a draft message is generated within MVP response targets  
   **And** generation failure shows a retry option  

2. **Given** a lead is VIP or high-risk  
   **When** I attempt to send the reply  
   **Then** explicit approval is required before send  
   **And** approve/send actions are audit logged with timestamps  

## Tasks / Subtasks

- [x] Task 1: Implement reply generation service (AC: #1)
  - [x] Create `src/server/services/reply-service.ts` with `generateRecoveryDraft(leadId, tenantId)` 
  - [x] Use Mistral chat completion (text generation, not JSON) for draft body; reuse `@mistralai/mistralai` and `MISTRAL_API_KEY`
  - [x] Include lead context: interactions summary, source metadata, risk reason in system/user prompt for personalized draft
  - [x] NFR3: Target ≤8s p95; prefer `mistral-small-latest` for speed; limit max_tokens
  - [x] NFR10: Throw on API failure; caller exposes retry option in UI
  - [x] Emit or record `reply.generated` domain event (architecture)
- [x] Task 2: Create POST /api/replies/generate endpoint (AC: #1)
  - [x] Body: `{ lead_id: string }` validated with Zod; tenant-scoped
  - [x] Validate lead exists, is at-risk (has active risk pulse or lifecycle_state = at_risk)
  - [x] Return `{ draft: string }` in success envelope; on failure return error envelope with retry hint
  - [x] Route → reply-service → no direct DB in route
- [x] Task 3: Implement approval-gate logic (AC: #2)
  - [x] Policy: low priority → send allowed without approval; vip/high → require explicit approval before send
  - [x] Create `src/server/services/approval-service.ts` or extend reply-service with `approveAndSend` flow
  - [x] Check lead.priority (vip | high) to enforce approval gate
- [x] Task 4: Create POST /api/leads/[id]/approve-reply endpoint (AC: #2)
  - [x] Body: `{ draft_text: string, action: "approve" | "send" }` (or combined approve-and-send for low-risk)
  - [x] For VIP/high: require `action: "approve"` first; then separate `action: "send"` or allow approve+send in one call
  - [x] For low: allow direct send without prior approve
  - [x] NFR8: Create audit events `action.approved` and `action.sent` via audit-repository
  - [x] Validate lead exists, tenant-scoped; Zod at boundary
- [x] Task 5: Persist reply drafts and sent state (AC: #2)
  - [x] Add `reply_drafts` or `response_actions` table: id, lead_id, tenant_id, draft_text, status (draft|approved|sent), approved_at, sent_at, actor_id, created_at
  - [x] Or: store approval/send as audit-only if MVP defers persistence; document choice
  - [x] Architecture mentions response_actions, approvals; align with existing audit_events pattern
- [x] Task 6: ConciergeReplyComposer UI (AC: #1, #2)
  - [x] Add ConciergeReplyComposer to lead detail page when lead is at-risk
  - [x] "Generate" button → POST /api/replies/generate; show draft in editable textarea
  - [x] "Approve" (VIP/high only) and "Send" buttons; NFR14: keyboard operable (Enter/Space)
  - [x] Show approval-required message for VIP/high before send; disable Send until approved
  - [x] Retry button on generation failure
- [x] Task 7: Tests (AC: #1, #2)
  - [x] Test: reply-service generateRecoveryDraft (success, Mistral failure, lead context)
  - [x] Test: POST /api/replies/generate (success, 404, non-at-risk lead, validation)
  - [x] Test: approve-reply (low-risk direct send, vip/high approve then send, audit events, validation)

## Dev Notes

### Critical Architecture Requirements

- **Events:** Emit `reply.generated` when draft created; `action.approved` when human approves (VIP/high); `action.sent` when reply sent. Full envelope per architecture.
- **API:** `api/replies/generate`, `api/leads/[id]/approve-reply` per architecture.md.
- **NFR3:** Recovery reply generation ≤8s for 95% of requests—use mistral-small, limit tokens.
- **NFR8:** Approve/send actions audit logged.
- **NFR10:** Generation failures surfaced with retry action.
- **NFR14:** Approve/Send buttons keyboard operable.

### Project Structure Notes

- Epic 2.1–2.3: classifications, override, risk-service, mark-lifecycle, audit-repository.
- Architecture specifies `api/replies/generate`, `api/leads/[id]/approve-reply`, `reply-service`.
- Mistral already used in `mistral-classifier.ts`; reuse client pattern for text generation.
- No reply/replies API exists yet; add from scratch.

### References

- [Source: _bmad-output/planning-artifacts/architecture.md] — api/replies/generate, approve-reply, reply.generated, action.approved/sent
- [Source: _bmad-output/planning-artifacts/epics.md] — Story 2.4 AC
- [Source: _bmad-output/planning-artifacts/prd.md] — FR8, FR10, NFR3, NFR8, NFR10, NFR14
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md] — At-Risk Pulse Recovery Flow, ConciergeReplyComposer, approval policy (low=auto, VIP/high=approval)

---

## Developer Context (Guardrails)

### Technical Requirements

| Requirement | Specification | Source |
|-------------|---------------|--------|
| POST /api/replies/generate | Body: { lead_id }; returns { draft }; tenant-scoped | architecture, FR8 |
| POST /api/leads/[id]/approve-reply | Body: { draft_text, action }; approval gate for vip/high | architecture, FR10 |
| Draft generation | Mistral chat completion, text (not JSON), recovery tone | NFR3, FR8 |
| NFR3 | ≤8s p95 for draft generation | prd |
| NFR8 | action.approved, action.sent audit logged | prd |
| NFR10 | Generation failure → retry option in UI | prd |
| NFR14 | Approve/Send keyboard operable | prd |
| Approval policy | low → send allowed; vip/high → approval required before send | UX spec |

### Architecture Compliance

- **Route → service → repository:** No direct DB in routes. Reply handler calls reply-service; approve-reply calls approval/reply-service.
- **Error envelope:** `{ error: { code, message, details }, meta }` for failures.
- **Event envelope:** event_name, event_version, occurred_at, tenant_id, correlation_id, payload.
- **Validation:** Zod at API boundary for all request bodies.
- **Tenant scoping:** All queries and writes tenant-scoped.

### Library/Framework Requirements

- **Mistral:** Use `@mistralai/mistralai` (already in package.json). Chat completion for text; no JSON mode for draft body.
- **Prisma:** Add reply_drafts or response_actions if persisting; or rely on audit_events only for MVP.
- **Zod:** Request body validation; use .safeParse and flatten for error details (see override-priority route).
- **Existing:** audit-repository (createAuditEvent), lead-service (findLeadById), risk-repository (getActivePulsesForLead).

### File Structure Requirements

```
src/
├── app/
│   ├── api/
│   │   ├── replies/
│   │   │   └── generate/
│   │   │       └── route.ts           # NEW: POST generate draft
│   │   └── leads/
│   │       └── [id]/
│   │           └── approve-reply/
│   │               └── route.ts       # NEW: POST approve/send
│   └── (dashboard)/
│       └── lead/
│           └── [id]/
│               └── page.tsx           # UPDATE: ConciergeReplyComposer
├── server/
│   ├── services/
│   │   ├── reply-service.ts           # NEW: generateRecoveryDraft
│   │   └── approval-service.ts        # NEW (or extend reply-service)
│   └── repositories/
│       └── (reply-repository.ts)      # OPTIONAL: if persisting drafts
prisma/
├── schema.prisma                     # UPDATE: add reply_drafts/response_actions if needed
└── migrations/
```

### Testing Requirements

- **Draft generation:** Lead at-risk → draft returned; non-at-risk → 400/404; Mistral failure → error with retry hint.
- **Approve/send:** Low-risk → send allowed; VIP/high → approve first, then send; audit events created.
- **Validation:** Invalid lead_id, missing draft_text, invalid action → 400 with error envelope.
- **Tenant scoping:** Wrong tenant → 404.

---

## Previous Story Intelligence (Epic 2)

- **2.1:** mistral-classifier (chat.complete, mistral-small-latest), classification-repository, reason_tags.
- **2.2:** override-priority, audit-repository, override-service. Zod v4 .safeParse + flatten for validation details.
- **2.3:** risk-service, risk-repository, mark-lifecycle, detectAndFlagAtRisk. Lead has lifecycle_state, riskPulses. At-risk = active pulse or lifecycle_state=at_risk.
- **Align with 2.1–2.3:** Same route→service→repository; error envelope; tenant scoping; audit for critical actions; keyboard support (NFR14).

---

## Git Intelligence Summary

Repo: Next.js 16, React 19, pnpm, Prisma 7, Vitest. Patterns: src/, @/*, error envelope, route→service→repository, Zod at boundaries. Mistral @mistralai/mistralai in mistral-classifier.ts. Lead model: priority, lifecycle_state, riskPulses, classifications.

---

## Latest Technical Information

- **Mistral text generation:** Use `client.chat.complete()` with messages; omit `responseFormat: json_object` for plain text. Include lead context (interactions, risk reason) in user message.
- **MVP send behavior:** Actual WhatsApp outbound may be stubbed; "send" can persist approval/sent state and emit `action.sent` event. Channel delivery can be deferred post-MVP.
- **Reply draft storage:** Option A) In-memory/ephemeral (generate → return → approve/send in same session). Option B) Persist reply_drafts table for audit trail. Recommend B for NFR8 alignment.

---

## Project Context Reference

No project-context.md. Use PRD, architecture, epics, UX spec. UX: ConciergeReplyComposer (Generate, edit, approve, send). Policy: Low risk = auto-send allowed; VIP/high-risk = human approval required.

---

## Change Log

- 2026-03-01: Story created via create-story workflow. Target: Recovery draft generation (Mistral), approval gate for VIP/high-risk, audit approve/send, ConciergeReplyComposer UI.
- 2026-03-01: Implementation complete. reply-service, approval-service, replies/generate, approve-reply APIs, ReplyDraft schema, ConciergeReplyComposer UI, tests.
- 2026-03-01: Code review fixes. HIGH: draft_text max 4096 + trim. MED: Retry only for generation errors; event_version in audit; valid UUID in test. Tests: whitespace-only, max-length validation.

---

## Dev Agent Record

### Agent Model Used

Composer (dev-story workflow)

### Debug Log References

### Completion Notes List

- [Code review] Fixed HIGH: draft_text max length (4096) + trim validation. Fixed MED: Retry button only for generation errors; event_version in audit payloads; valid UUID in reply-service test. Added tests for whitespace-only and max-length validation.
- reply-service: generateRecoveryDraft using Mistral mistral-small-latest, audit reply.generated
- POST /api/replies/generate: body { lead_id }, tenant-scoped, at-risk validation, retry hint on failure
- approval-service: policy vip/high → approve first then send; low → direct send; ReplyDraft persistence
- POST /api/leads/[id]/approve-reply: body { draft_text, action: approve|send }, audit action.approved/action.sent
- Prisma ReplyDraft model, ReplyDraftStatus enum, reply-draft-repository
- ConciergeReplyComposer in lead detail when at-risk: Generate, Approve (VIP/high), Send, Retry; NFR14 keyboard
- Tests: reply-service (6), replies-generate API (7), approval-service (6), leads-approve-reply API (8)

### File List

- prisma/schema.prisma (modified)
- prisma/migrations/20260301104614_add_reply_drafts/ (new)
- src/server/services/reply-service.ts (new)
- src/server/services/approval-service.ts (new)
- src/server/repositories/reply-draft-repository.ts (new)
- src/app/api/replies/generate/route.ts (new)
- src/app/api/leads/[id]/approve-reply/route.ts (new)
- src/app/(dashboard)/lead/[id]/page.tsx (modified)
- tests/services/reply-service.test.ts (new)
- tests/services/approval-service.test.ts (new)
- tests/api/replies-generate.test.ts (new)
- tests/api/leads-approve-reply.test.ts (new)
