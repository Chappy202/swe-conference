---
title: Product Context
inclusion: always
---

# Product: Dispute Triage System

Internal prototype for banking operations users to triage and route customer payment disputes. The system captures a dispute, applies rule-based logic, recommends a next action, and tracks the case through its lifecycle.

Reference: `docs/use-cases.md` (Use Case 1 — Dispute Triage).

## Domain Focus

**Sub-category: Unauthorised / Fraudulent Charge**

A customer claims they never made the purchase, or their card was compromised. This carries high regulatory risk and tight time windows.

**Anchor user story:** A customer is robbed at gunpoint. Attackers take the phone, obtain the PIN, and make multiple Apple Pay transactions at several stores totalling ~R16,500. The customer locks the card to fraud. The dispute covers all transactions from that single event as one case.

## User Journey (Single Flow)

The system supports one focused journey for an internal ops user:

1. **Reported** — Case is raised and appears on the ops dashboard.
2. **Under Investigation** — Ops user opens the case, reviews transactions, and the system provides a triage recommendation with a transparent rule trace.
3. **Escalated** — If rules or the ops user determine escalation is needed.
4. **Resolved** — Case is closed with an outcome, OR **Referred** back to the customer for additional information.

### Status Transitions (Linear with Branches)

```
Reported → Under Investigation
Under Investigation → Escalated | Resolved | Referred
Escalated → Resolved
```

`Resolved` and `Referred` are terminal states. No backward transitions. Resolving requires a resolution outcome: `Refunded`, `Declined`, or `Chargeback Initiated`.

### Customers

Customers are pre-seeded. The ops user selects from existing customers when creating a dispute. No customer management UI.

## Triage Rules (Fraud Sub-Category)

The system applies simple, transparent rules and shows the user *why* a recommendation was made.

| Condition | Priority | Recommendation |
|-----------|----------|---------------|
| Both conditions met | P1 | Immediate Fraud Freeze + P1 Escalation |
| Total dispute amount > R10,000 (only) | P1 | P1 High Priority Escalation |
| Transaction age < 48 hours (only) | P2 | Immediate Fraud Freeze |
| Neither condition met | Standard | Standard Investigation |

**Age calculation:** `dispute.dateRaised - transaction.timestamp`. Fixed at creation time. If *any* linked transaction is < 48 hours old relative to `dateRaised`, the age rule fires.

**Re-evaluation:** Triage runs on dispute creation and re-runs when transactions are added (total amount or age eligibility may change).

Rules are deterministic and rule-based only. No AI/ML. The rule trace must be visible to the ops user on every case.

## Data Model (Core Entities)

- **Customer** — Name, contact reference, account identifier.
- **Dispute** — Status (Reported / Under Investigation / Escalated / Resolved / Referred), category (Unauthorised/Fraudulent Charge), total amount (ZAR), date raised, rule trace, priority, resolution outcome.
- **Transaction** — Linked to one Dispute. Amount (ZAR), merchant, timestamp, payment type (card/Apple Pay/EFT). Multiple transactions per dispute.

One dispute covers multiple transactions from a single fraud event. The dispute total is the sum of its transactions.

## Currency

All monetary values are in **ZAR** (South African Rand). Format: `R10,000`.

## Technical Constraints

- All data is mock/seeded via Prisma + SQLite. No real banking integrations.
- Backend logic is implemented in the Express server with typed service layers.
- Frontend is an internal ops dashboard (React + Tailwind). Not customer-facing.
- Payment types limited to: Card, Apple Pay, EFT.
- Priority indicated by simple labels (P1, P2, Standard).

## NOT in Scope

- Authentication or user login (all access is open for prototype).
- Customer self-service portal (this is internal ops only).
- Actual payment reversals or refund processing.
- Integration with core banking, card processing, or case management platforms.
- AI/ML-based decisions.
- Notifications (SMS, email, push).
- Multiple dispute categories beyond Unauthorised/Fraudulent Charge.
- Audit trail or compliance reporting.

## UI Expectations

- Ops dashboard listing all disputes with status and priority.
- Dispute detail view showing: customer info, linked transactions, triage recommendation with rule trace, status lifecycle.
- Ability to progress a case through statuses (Investigate → Escalate → Resolve/Refer).
- Use `data-testid` attributes on all interactive elements.
- Tailwind utility classes only. No custom CSS unless extracted via `@apply`.

