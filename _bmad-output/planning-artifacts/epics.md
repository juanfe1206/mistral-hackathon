---
stepsCompleted:
  - step-01-validate-prerequisites
  - step-02-design-epics
  - step-03-create-stories
  - step-04-final-validation
inputDocuments:
  - _bmad-output/planning-artifacts/prd.md
  - _bmad-output/planning-artifacts/architecture.md
  - _bmad-output/planning-artifacts/ux-design-specification.md
---

# Proyecto Mistral Hackathon - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for Proyecto Mistral Hackathon, decomposing the updated minimum-MVP requirements from the PRD, UX design, and Architecture into implementable stories.

## Requirements Inventory

### Functional Requirements

FR1: Salon staff can ingest leads from inbound WhatsApp conversations with source metadata.
FR2: The system can store lead interaction history with timestamps for each ingested lead.
FR3: The system can display a ranked lead queue ordered by current priority.
FR4: The system can classify each lead as VIP, high-risk, or low-priority.
FR5: The system can provide reason tags for each classification decision.
FR6: Salon staff can manually override lead priority when business context differs from AI output.
FR7: The system can detect at-risk leads from inactivity thresholds and trigger a visible At-Risk Pulse alert.
FR8: Salon staff can generate a recovery response draft for an at-risk lead.
FR9: The system can update and persist lead lifecycle state after recovery actions (At-Risk, Recovered, Lost).
FR10: The system can require explicit human approval before sending VIP/high-risk replies.
FR11: The system can display urgent first-response SLA status at lead and queue level.
FR12: The system can expose KPI summaries for recovery count, SLA compliance, and queue aging.

### NonFunctional Requirements

NFR1: Priority queue updates and lead-state transitions are reflected to users within 2 seconds under normal operating load.
NFR2: AI classification results are available within 5 seconds for 95% of new lead events.
NFR3: Recovery reply generation is available within 8 seconds for 95% of requests.
NFR4: KPI panel views load within 3 seconds for 95% of requests.
NFR5: All data in transit is encrypted using TLS 1.2+.
NFR6: All persisted lead and message data is encrypted at rest.
NFR7: Role-based access controls are enforced for owner/admin and operator actions in MVP.
NFR8: Security-relevant actions (login, send approvals, policy edits) are audit logged.
NFR9: Core lead triage and recovery workflows achieve at least 99.0% monthly availability during MVP.
NFR10: Failed classification or reply-generation attempts are surfaced to the user with a retry action.
NFR11: No lead event is silently dropped; ingestion failures are logged and visible in operator UI.
NFR12: Core operator workflows meet WCAG 2.1 AA criteria for keyboard navigation and contrast.
NFR13: Priority/risk indicators include non-color cues so status is understandable without color dependence.
NFR14: Critical actions (approve, send, override) are fully operable via keyboard-only interaction.

### Additional Requirements

- Starter template requirement: Initialize with Next.js (`create-next-app`) + TypeScript before domain stories.
- Core stack requirement: Next.js App Router, Prisma + PostgreSQL, Redis, Better Auth.
- Contract requirement: REST-first route handlers with schema validation at API boundaries.
- Auditability requirement: Keep critical action history (approve/send/override) and decision rationale traceable.
- MVP scope guardrail: WhatsApp-only ingestion for MVP; multi-channel adapters are post-MVP.
- UX requirement: Triage-first, mobile and desktop interaction parity with low cognitive load.
- Accessibility requirement: Keyboard-operable critical flows and non-color status cues.
- Reliability requirement: User-visible retry/failure states for classification and draft generation.

### FR Coverage Map

FR1: Epic 1 - WhatsApp lead ingestion
FR2: Epic 1 - Interaction history and timeline
FR3: Epic 1 - Ranked queue foundation
FR4: Epic 2 - AI classification tiers
FR5: Epic 2 - Classification reason tags
FR6: Epic 2 - Manual priority override
FR7: Epic 2 - At-Risk detection and pulse alert
FR8: Epic 2 - Recovery draft generation
FR9: Epic 2 - Lead lifecycle persistence (At-Risk/Recovered/Lost)
FR10: Epic 2 - Approval gate for VIP/high-risk send
FR11: Epic 3 - Urgent SLA status visibility
FR12: Epic 3 - KPI summaries (recovery/SLA/aging)

## Epic List

### Epic 1: MVP Foundation, Ingestion, and Ranked Queue
Users can run the product foundation and process WhatsApp leads in a ranked operational queue with persistent lead history.
**FRs covered:** FR1, FR2, FR3

### Epic 2: AI Prioritization and At-Risk Recovery Loop
Users can prioritize leads with explainable AI, intervene with overrides, and execute the at-risk recovery flow with human approval control.
**FRs covered:** FR4, FR5, FR6, FR7, FR8, FR9, FR10

### Epic 3: Operational Visibility for Demo Control
Users can monitor urgent SLA risk and KPI outcomes to demonstrate business impact clearly.
**FRs covered:** FR11, FR12

### Epic 4: UX & Design Alignment
Users experience the product as specified in the UX Design Specification: premium-concierge theme, custom triage and risk components, consistent visual hierarchy, and accessibility compliance, so that the prototype is demo-ready and matches agreed design direction.
**Design spec alignment:** UX Design Specification (design system, Hybrid Command + Signal Board + Premium Calm, custom components Phases 1–3).

## Epic 1: MVP Foundation, Ingestion, and Ranked Queue

Users can run the product foundation and process WhatsApp leads in a ranked operational queue with persistent lead history.

### Story 1.0: Initialize Project from Approved Starter Template

As a developer,
I want to bootstrap the codebase using the approved Next.js starter with baseline configuration,
So that all MVP stories are built on a consistent, runnable foundation.

**Acceptance Criteria:**

**Given** the repository is available
**When** I initialize the app with Next.js `create-next-app` and TypeScript
**Then** the app runs locally with working dev/build/lint scripts
**And** baseline environment setup is documented for the team

**Given** baseline dependencies are installed
**When** the initialization story is completed
**Then** only foundational setup is included
**And** domain entities/endpoints are added only by later stories that need them

### Story 1.1: Ingest WhatsApp Leads with Source Metadata

As a salon operator,
I want inbound WhatsApp leads to be captured as lead records with source metadata,
So that I can act on new opportunities from one channel in MVP.

**Acceptance Criteria:**

**Given** a valid WhatsApp lead payload arrives
**When** ingestion is processed
**Then** a lead record is created with source metadata
**And** ingestion failures are surfaced with a visible error state

**Given** a lead was ingested
**When** I open the lead detail
**Then** the source channel metadata is displayed
**And** the lead is available in the triage queue

### Story 1.2: Persist Interaction Timeline and Ranked Queue View

As a salon operator,
I want timestamped lead history and a ranked queue view,
So that I can understand context and focus first on the most urgent leads.

**Acceptance Criteria:**

**Given** lead interactions occur
**When** events are stored
**Then** each event is timestamped and shown in lead history
**And** history remains consistent after refresh

**Given** multiple leads with different priority values
**When** I open the queue
**Then** leads are displayed in deterministic ranked order
**And** queue/state updates are reflected within MVP latency targets

## Epic 2: AI Prioritization and At-Risk Recovery Loop

Users can prioritize leads with explainable AI, intervene with overrides, and execute the at-risk recovery flow with human approval control.

### Story 2.1: Classify Leads and Show Reason Tags

As a salon operator,
I want each lead classified with visible reason tags,
So that I can trust and understand prioritization decisions.

**Acceptance Criteria:**

**Given** a newly ingested or updated lead
**When** classification runs
**Then** the lead is labeled VIP, high-risk, or low-priority
**And** reason tags are shown in queue/detail views

**Given** classification fails
**When** the result cannot be produced
**Then** the UI shows a retry-capable error state
**And** no failure is silently ignored

### Story 2.2: Allow Manual Priority Override with Audit Trail

As a salon operator,
I want to override AI priority when business context requires it,
So that operational decisions remain under human control.

**Acceptance Criteria:**

**Given** a classified lead is visible
**When** I apply a manual override
**Then** the new priority is persisted and reflected in ranking
**And** the override action is audit logged with actor and timestamp

**Given** a lead has override history
**When** I inspect lead details
**Then** I can see the current effective priority and override trace
**And** keyboard-only operation is supported for critical controls

### Story 2.3: Detect At-Risk Leads and Persist Lifecycle State

As a salon operator,
I want at-risk leads to be flagged and lifecycle states persisted,
So that I can run recovery workflows and track outcomes.

**Acceptance Criteria:**

**Given** inactivity thresholds are configured
**When** a lead crosses threshold conditions
**Then** the lead is marked At-Risk with a visible pulse indicator
**And** the reason for risk is displayed to the user

**Given** recovery outcomes occur
**When** I mark results
**Then** lifecycle state is persisted as At-Risk, Recovered, or Lost
**And** state transitions are reflected in queue and detail views

### Story 2.4: Generate Recovery Draft with Approval-Gated Send

As a salon operator,
I want recovery draft generation and approval-gated send for critical leads,
So that I can act quickly without losing control over high-impact messages.

**Acceptance Criteria:**

**Given** a lead is At-Risk
**When** I request a recovery draft
**Then** a draft message is generated within MVP response targets
**And** generation failure shows a retry option

**Given** a lead is VIP or high-risk
**When** I attempt to send the reply
**Then** explicit approval is required before send
**And** approve/send actions are audit logged with timestamps

## Epic 3: Operational Visibility for Demo Control

Users can monitor urgent SLA risk and KPI outcomes to demonstrate business impact clearly.

### Story 3.1: Show Urgent SLA Status in Queue and Lead Views

As a salon owner,
I want urgent first-response SLA status on leads and queue,
So that I can detect and prevent service-level breaches.

**Acceptance Criteria:**

**Given** lead response timestamps exist
**When** I open queue or lead details
**Then** SLA status is visible at queue and lead level
**And** status indicators include non-color cues

**Given** SLA data is temporarily unavailable
**When** the UI renders status
**Then** a clear fallback/error state is shown
**And** user action guidance is provided where applicable

### Story 3.2: Display KPI Summary Panel for MVP Outcomes

As a salon owner,
I want KPI summaries for recovery count, SLA compliance, and queue aging,
So that I can evaluate MVP impact in daily use and demo presentation.

**Acceptance Criteria:**

**Given** lead and response events are available
**When** I open the KPI panel
**Then** recovery count, SLA compliance, and queue aging metrics are displayed
**And** values reconcile with underlying event records

**Given** there is insufficient data for a metric
**When** the KPI panel loads
**Then** a no-data state is shown for that metric
**And** the panel still loads within MVP performance targets

## Epic 4: UX & Design Alignment

Users experience the product as specified in the UX Design Specification: premium-concierge theme, custom triage and risk components, consistent visual hierarchy, and accessibility compliance, so that the prototype is demo-ready and matches agreed design direction.

**Design spec alignment:** UX Design Specification (design system, Hybrid Command + Signal Board + Premium Calm, custom components Phases 1–3).

### Story 4.0: Apply Design System Foundation

As a developer,
I want the app to use the agreed design tokens and MUI theme from the UX spec,
So that all screens share the premium-concierge visual foundation.

**Acceptance Criteria:**

**Given** the UX Design Specification design system section
**When** the design system foundation is implemented
**Then** Editorial Premium color tokens (Primary, Accent, Surface, Text) are applied
**And** typography uses Plus Jakarta Sans (headings) and Inter (body)
**And** spacing follows the 8px base unit and layout grid (12-col desktop, 4-col mobile)

**Given** MUI is the component base
**When** theme is configured
**Then** custom token layer overrides default Material styling
**And** status semantics (success, warning, error, info) are defined and accessible

### Story 4.1: Implement Phase 1 Journey Components

As a salon operator,
I want triage queue and filters to match the UX spec (LeadPriorityCard, QueueFilterBar, SLASafetyIndicator),
So that I can identify top urgent leads quickly with clear hierarchy and feedback.

**Acceptance Criteria:**

**Given** the UX spec component definitions for LeadPriorityCard, QueueFilterBar, SLASafetyIndicator
**When** Phase 1 components are implemented
**Then** LeadPriorityCard shows lead identity, urgency level, reason tags, SLA hint, and quick actions with specified states/variants
**And** QueueFilterBar provides filter chips, sort selector, and instant-apply behavior
**And** SLASafetyIndicator shows status chip, trend, and time-to-breach with non-color cues

**Given** core triage workflows
**When** I use the queue
**Then** components meet accessibility requirements (keyboard, aria-labels, focus, touch targets)
**And** compact (mobile) and standard (desktop) variants behave per spec

### Story 4.2: Implement Phase 2 Risk & Recovery Components

As a salon operator,
I want at-risk pulse and reply composer to match the UX spec (AtRiskPulseBanner, ConciergeReplyComposer),
So that risk escalation and recovery actions feel clear and premium.

**Acceptance Criteria:**

**Given** the UX spec for AtRiskPulseBanner and ConciergeReplyComposer
**When** Phase 2 components are implemented
**Then** AtRiskPulseBanner surfaces pulse indicator, risk cause, elapsed time, and recovery CTA with correct states
**And** ConciergeReplyComposer supports draft, tone, confidence marker, and approve/send with policy gate behavior

**Given** at-risk and reply flows
**When** I use these components
**Then** accessibility (labels, keyboard shortcuts, status announcements) matches spec
**And** variants (inline vs modal, quick vs full mode) work per breakpoint

### Story 4.3: Implement Phase 3 Governance Component

As a salon operator or support user,
I want the decision timeline to match the UX spec (DecisionTimeline),
So that override, approval, and send history are auditable and clear.

**Acceptance Criteria:**

**Given** the UX spec for DecisionTimeline
**When** the component is implemented
**Then** timestamped events show actor, decision rationale, and state transition
**And** compact and audit-mode variants are available
**And** expandable entries and filter by event type work as specified

**Given** lead detail or support context
**When** I view the timeline
**Then** semantic list and aria-expanded behavior meet accessibility requirements

### Story 4.4: Align Triage and At-Risk Flows to Spec

As a salon operator,
I want the triage and at-risk views to use the new components and one-surface actioning,
So that the experience matches the UX spec's flows and feedback patterns.

**Acceptance Criteria:**

**Given** Phase 1–3 components are available
**When** triage queue and at-risk views are updated
**Then** lead cards, filter bar, and SLA indicators are used consistently
**And** at-risk pulse and reply composer are integrated into the flows
**And** reason tags, feedback (success/warning/error), and action proximity follow the spec

**Given** the "top 3 urgent leads in under 10 seconds" goal
**When** I open the app
**Then** default view and interaction cost align with UX spec flow optimization principles

### Story 4.5: Responsive and Accessibility Validation

As a product owner,
I want the prototype validated for responsive behavior and WCAG 2.2 AA,
So that we can confidently demo on mobile and desktop and meet accessibility commitments.

**Acceptance Criteria:**

**Given** breakpoint strategy (mobile 320–767, tablet 768–1023, desktop 1024+)
**When** views are tested across breakpoints
**Then** layout and interaction logic are consistent and meet spec
**And** touch targets are at least 44px on mobile

**Given** WCAG 2.2 AA and UX spec accessibility baseline
**When** accessibility is validated
**Then** contrast, keyboard operability, and non-color status cues are confirmed
**And** screen-reader announcements for risk/SLA updates work
**And** the "top 3 in 10 seconds" scenario is validated on desktop and mobile
