---
stepsCompleted:
  - step-01-init
  - step-02-discovery
  - step-02b-vision
  - step-02c-executive-summary
  - step-03-success
  - step-04-journeys
  - step-05-domain
  - step-06-innovation
  - step-07-project-type
  - step-08-scoping
  - step-09-functional
  - step-10-nonfunctional
  - step-11-polish
  - step-12-complete
  - step-e-01-discovery
  - step-e-02-review
  - step-e-03-edit
inputDocuments:
  - "/Users/rodrigoholguera/Desktop/Programar/Proyecto Mistral Hackathon/_bmad-output/planning-artifacts/product-brief-Proyecto Mistral Hackathon-2026-02-28.md"
  - "/Users/rodrigoholguera/Desktop/Programar/Proyecto Mistral Hackathon/_bmad-output/brainstorming/brainstorming-session-2026-02-28.md"
documentCounts:
  briefCount: 1
  researchCount: 0
  brainstormingCount: 1
  projectDocsCount: 0
workflowType: 'prd'
workflow: 'edit'
classification:
  projectType: saas_b2b
  domain: general
  complexity: low
  projectContext: greenfield
lastEdited: '2026-02-28'
editHistory:
  - date: '2026-02-28'
    changes: 'Reduced scope to lean MVP and aligned Product Scope, Scoping, Functional Requirements, and NFRs to minimum showcase set.'
---

# Product Requirements Document - Proyecto Mistral Hackathon

**Author:** Rodri
**Date:** 2026-02-28

## Executive Summary

Proyecto Mistral Hackathon defines a salon-focused AI lead operations product for small teams that lose revenue through delayed or missed follow-up across WhatsApp and calls. The product centralizes lead handling, classifies conversation priority, and guides fast action so owners can protect high-intent opportunities without adding staff or operational overhead. The MVP is designed for short, repeated daily use: owners see a ranked queue, identify risk quickly, and execute guided responses in seconds.

Primary users are small salon owners (typically 2-5 staff) operating under constant multitasking pressure. Their core failure mode is not lead generation but lead conversion leakage caused by fragmented tools (spreadsheets, notebooks, ad hoc message tracking). The product addresses this by converting unstructured inbound traffic into a prioritized workflow with explainable AI recommendations and response paths. Success is defined by measurable gains in recovery of at-risk leads, faster response to VIP/high-risk leads, and improved customer retention/reputation signals.

### What Makes This Special

The differentiator is concierge-grade, risk-aware lead management tuned for salon operations rather than generic CRM breadth. Three capabilities define this edge: (1) AI tiering of inbound leads by value/risk with reason tags, (2) proactive At-Risk Pulse detection with recovery triggers, and (3) one-click concierge reply generation with confidence-gated autonomy. This creates a high-clarity operating loop where owners act on the highest-leverage conversation first, then automate low-risk traffic safely.

The core insight is that small salons need decision speed and prioritization quality more than feature-heavy pipeline tooling. By focusing on real-time triage and recovery moments, the product can produce visible conversion impact within days, while maintaining human approval on critical interactions (VIP/at-risk) to preserve brand tone and trust.

## Project Classification

- Project Type: SaaS B2B platform
- Domain: General business software (salon lead operations)
- Complexity: Low domain complexity (non-regulated baseline)
- Project Context: Greenfield (new product build)

## Success Criteria

### User Success

Salon owners can identify lead priority immediately, respond to VIP/high-risk leads in under 5 minutes, and recover at-risk opportunities without manual spreadsheet/notebook tracking. The product should feel like operational relief: fewer missed follow-ups, clearer next actions, and confidence that urgent conversations are handled first.

### Business Success

At 3 months, the product demonstrates measurable conversion and service-quality impact for small salons. At 12 months, it establishes durable retention and reputation improvements driven by consistent lead handling.

### Technical Success

The system produces stable, explainable lead classification with reason tags, reliable risk escalation events, and low-latency reply generation suitable for real-time operations. Human-approval gating must remain enforceable for VIP/high-risk interactions while operators retain manual control for other conversations.

### Measurable Outcomes

- Lead recovery rate: increase from ~20% baseline to >=35% by month 3.
- VIP/high-risk first-response SLA: >=90% of those leads receive first response in <5 minutes.
- Median time from new lead arrival to first prioritized action: <=2 minutes during business hours.
- Demo KPI coverage: product visibly reports recovery count, first-response SLA compliance, and queue aging for 100% of demo scenarios.

## Product Scope

### MVP - Minimum Viable Product

- WhatsApp lead intake with timestamped interaction history and source metadata.
- AI classification into VIP/high-risk/low-priority with reason tags and ranked queue ordering.
- At-Risk Pulse detection and one-click recovery reply generation for flagged leads.
- Human approval gate for VIP/high-risk responses before send.
- Basic KPI panel for recovery count, urgent first-response SLA, and queue aging.
- Demo-ready end-to-end flow: ingest -> classify -> escalate -> recover.

### MVP Functional Requirement Mapping

- Intake + history -> FR1, FR2
- Classification + reason tags + queue -> FR3, FR4, FR5
- At-Risk escalation + recovery -> FR6, FR7, FR8
- Human control for sensitive replies -> FR9, FR10
- KPI visibility -> FR11, FR12

### Growth Features (Post-MVP)

- Multi-channel ingestion beyond WhatsApp/call notes (Instagram DM, email, deeper telephony).
- Expanded analytics, benchmarking, and export/reporting.
- Stronger policy automation and confidence-based routing controls.
- Richer customer retention/churn prediction workflows.

### Vision (Future)

- Autonomous-but-supervised revenue operations assistant for salons.
- Multi-location/team support with advanced permissions.
- Deeper CRM and campaign intelligence integration while preserving rapid, risk-aware lead triage as core value.

## User Journeys

### Journey 1: Primary User Success Path - Carla (Salon Owner, Daily Lead Control)

**Opening scene:** Carla starts her day with 20+ inbound conversations across WhatsApp and calls. She feels behind before opening the salon because she cannot quickly tell which leads are revenue-critical.

**Rising action:** She opens the product and immediately sees a ranked queue: VIP, high-risk, and low-priority leads with explainability tags. She taps the top at-risk VIP card, sees inactivity signal + risk reason, and triggers one-click concierge recovery reply.

**Climax:** Within minutes, the customer responds and books. Carla sees the lead status move from At-Risk to Recovered with SLA compliance preserved.

**Resolution:** Carla regains confidence and control. Instead of reacting to noise, she executes high-value actions first and protects revenue with short check-ins during the day.

### Journey 2: Primary User Edge Case - Carla (False Priority / Recovery Failure)

**Opening scene:** A lead is classified as low-priority, but Carla knows from context it may be high value. She worries automation might send the wrong tone.

**Rising action:** She reviews the AI reason tags, overrides priority, and disables auto-send for this lead. Later, an at-risk pulse triggers but the first recovery draft underperforms.

**Climax:** Carla regenerates a more tailored response with one-click assistance, applies manual edits, and sends with human approval.

**Resolution:** The system supports recovery from AI misclassification without losing trust. Carla keeps control while still benefiting from speed and suggestions.

### Journey 3: Admin/Operations User - Luis (Salon Manager Configuring Team Workflow)

**Opening scene:** Luis manages a 4-person salon team and needs consistent response standards across staff.

**Rising action:** He configures SLA targets, sets VIP detection thresholds, and defines escalation rules (who gets notified, when, and for which risk score).

**Climax:** During peak hours, Luis sees SLA drift emerging and uses queue controls to rebalance assignment and prevent misses.

**Resolution:** Team performance becomes predictable. The salon runs with shared operational standards rather than ad hoc personal habits.

### Journey 4: Support/Troubleshooting User - Ana (Customer Success / Internal Support)

**Opening scene:** A salon reports "the AI missed an important lead yesterday." Trust is at risk.

**Rising action:** Ana opens lead timeline history: classification snapshots, risk escalations, suggested drafts, and override actions. She identifies that inactivity threshold was too conservative for this salon's response pattern.

**Climax:** She applies recommended configuration adjustments and walks the owner through the corrected workflow.

**Resolution:** Issue is resolved with auditability and clear root cause, reducing churn risk and strengthening confidence in the product.

### Journey 5: Integration/API-Facing Journey - Marco (Implementation Partner / Technical Operator)

**Opening scene:** Marco is onboarding a new salon and needs data flow from WhatsApp/call notes into the lead pipeline.

**Rising action:** He maps incoming message metadata to lead schema, validates event ingestion, and checks classification/risk events in test mode.

**Climax:** A full test run shows ingest -> classify -> pulse -> recovery action works with expected latency and event consistency.

**Resolution:** Technical onboarding is repeatable and reliable, enabling faster deployments without custom firefighting.

### Journey Requirements Summary

- Real-time prioritized inbox with explainability tags and fast state transitions.
- Human-in-the-loop controls: override priority, approve/reject/regenerate responses.
- Configurable SLA and escalation policy management for operations users.
- End-to-end audit trail and timeline replay for support diagnostics.
- Stable integration interfaces for message ingestion, event processing, and validation.
- Clear failure recovery paths (misclassification, missed pulse, low-quality draft, ingest lag).

## Innovation & Novel Patterns

### Detected Innovation Areas

- Risk-aware AI lead operations loop: not only classifying leads, but continuously re-evaluating inactivity and triggering proactive recovery actions.
- Concierge-grade response orchestration: AI-generated premium-tone replies with confidence-gated autonomy (auto for low-risk, human approval for VIP/at-risk).
- Operational clarity over feature breadth: innovation focused on decision velocity and triage quality for small teams, not CRM complexity.
- Explainable prioritization model: reason-tag visibility makes AI actions auditable and usable during high-pressure service moments.

### Market Context & Competitive Landscape

Most SMB tools in this space focus on inbox consolidation or generic CRM tracking. This concept differentiates by combining triage intelligence, at-risk detection, and recovery generation into one operational loop optimized for salon conversion leakage. The novelty is the integrated "detect -> escalate -> recover" flow with explicit human control thresholds.

### Validation Approach

- Pilot with seeded real-world lead scenarios (VIP, at-risk, low-priority) and compare outcomes against manual baseline.
- Validate three hypotheses:
  - AI ranking improves action order quality.
  - At-Risk Pulse increases recovered bookings.
  - Concierge reply generation reduces response latency without degrading tone quality.
- Measure against MVP KPIs: recovery rate, SLA compliance, and retention/reputation proxies.
- Include qualitative trust checks on explainability and override confidence.

### Risk Mitigation

- Misclassification risk: human override, reason tags, and reclassification triggers.
- Over-automation risk on sensitive leads: approval gate for VIP/at-risk replies.
- Model inconsistency risk: guardrail prompts, fallback templates, and audit logs for tuning.
- Adoption risk: UX optimized for short daily check-ins and visible recovery win moments.

## SaaS B2B Specific Requirements

### Project-Type Overview

Proyecto Mistral Hackathon is a SaaS B2B product for small salon teams that need reliable lead operations with AI-assisted prioritization, escalation, and response execution. The product must support multi-user collaboration, policy-based controls, and measurable operational outcomes rather than single-user utility workflows.

### Technical Architecture Considerations

- Tenant-isolated data model per salon with strict separation of leads, message history, SLA settings, and AI policy configuration.
- Event-driven lead lifecycle (ingest -> classify -> reprioritize -> escalate -> recover) with timestamped audit trail.
- Policy engine for confidence-gated autonomy: low-risk auto actions allowed, VIP/at-risk flows require human approval.
- Explainability persistence: reason tags and model context saved alongside each classification decision for trust and debugging.
- Operational observability: SLA breach risk indicators, escalation events, and response latency tracking by tenant and team member.

### Tenant Model

- Single salon as primary tenant unit for MVP.
- Tenant-scoped users, settings, integrations, and reporting.
- Multi-location tenancy deferred to post-MVP, with schema ready for later extension.

### RBAC Matrix

- Owner/Admin: configure thresholds, policies, users, and escalation rules.
- Operator/Staff: process queue, send/review responses, and perform permitted overrides.
- Support role (internal): read diagnostic timelines and system events under controlled tenant access.

### Subscription Tiers

- MVP: single hackathon tier with all core capabilities enabled to reduce packaging complexity.
- Post-MVP: tiering by automation limits, analytics depth, and multi-location support.

### Integration List

- Core MVP integrations:
  - WhatsApp message ingestion interface.
- Internal integration contracts:
  - Lead ingestion API/events.
  - Classification service interface.
  - Recovery reply generation service.
  - KPI aggregation pipeline.

### Compliance Requirements

- Baseline SMB SaaS controls: tenant isolation, RBAC, secure secret handling, and audit logging.
- Privacy-conscious defaults for customer communication records.
- No extra regulated-domain compliance obligations at current general-domain classification.

### Implementation Considerations

- Prioritize deterministic state transitions and debuggability over broad channel expansion in MVP.
- Use seeded datasets and scenario replay to validate ranking/escalation behavior quickly.
- Define explicit fallback behavior for model uncertainty (manual queue + template response options).
- Prevent MVP scope drift into full CRM breadth to preserve speed and differentiation.

## Project Scoping & Phased Development

### MVP Strategy & Philosophy

**MVP Approach:** Problem-solving and validated-learning MVP focused on recovering high-value leads quickly.  
**Resource Requirements:** 3 junior developers: one integration/full-stack lead, one workflow/UI lead, and one AI service lead.

### MVP Feature Set (Phase 1)

**Core User Journeys Supported:**
- Primary owner success path (prioritize, detect risk, recover).
- Primary owner edge-case recovery (override, regenerate, approve).
- Minimal admin operations flow (SLA thresholds and escalation basics).

**Must-Have Capabilities:**
- Ingestion pipeline for WhatsApp leads (call-note ingestion deferred).
- Lead classification with explainable reason tags.
- Ranked priority queue for immediate action order.
- At-Risk Pulse escalation logic and visible alert state.
- Recovery reply generation for at-risk leads.
- Human approval gate for VIP/high-risk sends.
- Basic KPI panel (recovery count, first-response SLA, queue aging).

**MVP Scope Guardrails (Out of Scope):**
- Multi-channel connectors beyond WhatsApp.
- Full team assignment and advanced RBAC workflows.
- Auto-response automation policies for low-priority leads.
- Support-grade deep timeline diagnostics and replay tooling.
- Multi-location and franchise capabilities.

### Post-MVP Features

**Phase 2 (Post-MVP):**
- Enhanced team workflows and role controls.
- Additional channels (Instagram DM, email).
- Deeper analytics and historical reporting.
- Policy tuning and automation governance tooling.

**Phase 3 (Expansion):**
- Multi-location/franchise architecture.
- Advanced retention and churn intelligence.
- Deeper CRM/campaign integrations.
- Higher-autonomy modes with stronger safety controls.

### Risk Mitigation Strategy

**Technical Risks:** Model inconsistency and false prioritization; mitigated through reason tags, overrides, deterministic escalation rules, and replay testing.

**Market Risks:** Low trust in automation; mitigated through visible recovered-lead outcomes, approval gating, and KPI-based before/after evidence.

**Resource Risks:** Over-scoping under hackathon constraints; mitigated by freezing MVP to one end-to-end journey loop and deferring non-core channels/features.

## Functional Requirements

### MVP Functional Contract (Minimum Showcase Set)

### Intake & Queue Foundation

- FR1: Salon staff can ingest leads from inbound WhatsApp conversations with source metadata.
- FR2: The system can store lead interaction history with timestamps for each ingested lead.
- FR3: The system can display a ranked lead queue ordered by current priority.

### AI Classification & Prioritization

- FR4: The system can classify each lead as VIP, high-risk, or low-priority.
- FR5: The system can provide reason tags for each classification decision.
- FR6: Salon staff can manually override lead priority when business context differs from AI output.

### At-Risk Recovery Loop

- FR7: The system can detect at-risk leads from inactivity thresholds and trigger a visible At-Risk Pulse alert.
- FR8: Salon staff can generate a recovery response draft for an at-risk lead.
- FR9: The system can update and persist lead lifecycle state after recovery actions (At-Risk, Recovered, Lost).

### Human Control & KPI Visibility

- FR10: The system can require explicit human approval before sending VIP/high-risk replies.
- FR11: The system can display urgent first-response SLA status at lead and queue level.
- FR12: The system can expose KPI summaries for recovery count, SLA compliance, and queue aging.

### Post-MVP Backlog (Deferred by Design)

Call-note ingestion, multi-channel connectors, advanced RBAC/team assignment, low-priority auto-response automation, deep support diagnostics, and multi-location capabilities are explicitly deferred to post-MVP phases.

## Non-Functional Requirements

### MVP Baseline

### Performance

- NFR1: Priority queue updates and lead-state transitions are reflected to users within 2 seconds under normal operating load.
- NFR2: AI classification results are available within 5 seconds for 95% of new lead events.
- NFR3: Recovery reply generation is available within 8 seconds for 95% of requests.
- NFR4: KPI panel views load within 3 seconds for 95% of requests.

### Security

- NFR5: All data in transit is encrypted using TLS 1.2+.
- NFR6: All persisted lead and message data is encrypted at rest.
- NFR7: Role-based access controls are enforced for owner/admin and operator actions in MVP.
- NFR8: Security-relevant actions (login, send approvals, policy edits) are audit logged.

### Reliability

- NFR9: Core lead triage and recovery workflows achieve at least 99.0% monthly availability during MVP.
- NFR10: Failed classification or reply-generation attempts are surfaced to the user with a retry action.
- NFR11: No lead event is silently dropped; ingestion failures are logged and visible in operator UI.

### Accessibility

- NFR12: Core operator workflows meet WCAG 2.1 AA criteria for keyboard navigation and contrast.
- NFR13: Priority/risk indicators include non-color cues so status is understandable without color dependence.
- NFR14: Critical actions (approve, send, override) are fully operable via keyboard-only interaction.
