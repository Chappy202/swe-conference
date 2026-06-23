# Requirements — Dispute Triage System (EARS Format)

> Internal prototype for banking operations users to triage and route customer payment disputes.
> Reference: [`docs/use-cases.md`](./use-cases.md) (Use Case 1 — Dispute Triage), [`.kiro/steering/product.md`](../.kiro/steering/product.md).
>
> Requirements follow the [EARS (Easy Approach to Requirements Syntax)](https://en.wikipedia.org/wiki/Easy_Approach_to_Requirements_Syntax) notation.

---

## EARS Patterns Used

| Pattern | Keyword | Usage |
|---------|---------|-------|
| Ubiquitous | *(none)* | Always-active behaviour — `The system shall...` |
| Event-Driven | **When** | Triggered by a specific event — `When <trigger>, the system shall...` |
| State-Driven | **While** | Active while in a state — `While <state>, the system shall...` |
| Unwanted Behaviour | **If...then** | Error/exception handling — `If <condition>, then the system shall...` |
| Optional/Conditional | **Where** | Context-dependent — `Where <condition>, the system shall...` |
| Complex | **While...when** | State + event — `While <state>, when <trigger>, the system shall...` |

---

## 1. Domain Constraints

| Constraint | Value |
|------------|-------|
| Currency | ZAR (South African Rand). Display format: `R10,000` |
| Dispute category | Single: Unauthorised / Fraudulent Charge |
| Payment types | Card, Apple Pay, EFT |
| Priority labels | P1, P2, Standard (derived from rules — never manually set) |
| Data source | Mock/seeded via Prisma + SQLite. No external integrations. |
| Auth | None. Open access for prototype. |

---

## 2. Data Model

### 2.1 Customer

Pre-seeded. Ops users select from existing customers when creating a dispute.

| Field | Type | Notes |
|-------|------|-------|
| id | Int | Primary key (auto-increment) |
| name | String | Full name |
| contactReference | String | Phone or email reference |
| accountIdentifier | String | Bank account number or card reference |
| createdAt | DateTime | Record creation timestamp |

### 2.2 Dispute

| Field | Type | Notes |
|-------|------|-------|
| id | Int | Primary key (auto-increment) |
| customerId | FK → Customer | Required |
| status | Enum | `Reported`, `UnderInvestigation`, `Escalated`, `Resolved`, `Referred` |
| category | String | Always `Unauthorised/Fraudulent Charge` for this prototype |
| totalAmount | Decimal (ZAR) | **Derived**: sum of linked transaction amounts. Updated on transaction add. |
| dateRaised | DateTime | Set on creation. Used as reference point for age calculations. |
| priority | Enum | `P1`, `P2`, `Standard`. Derived from triage rules. |
| recommendation | String | Triage recommendation text (e.g., "Immediate Fraud Freeze + P1 Escalation") |
| ruleTrace | JSON / String | Structured trace showing which rules fired and why |
| resolutionOutcome | Enum (nullable) | `Refunded`, `Declined`, `ChargebackInitiated`. Set on resolution. |
| createdAt | DateTime | Record creation timestamp |
| updatedAt | DateTime | Last modification timestamp |

### 2.3 Transaction

| Field | Type | Notes |
|-------|------|-------|
| id | Int | Primary key (auto-increment) |
| disputeId | FK → Dispute | Required. Many transactions per dispute. |
| amount | Decimal (ZAR) | Individual transaction amount |
| merchant | String | Merchant name / description |
| timestamp | DateTime | When the transaction occurred |
| paymentType | Enum | `Card`, `ApplePay`, `EFT` |
| createdAt | DateTime | When the transaction record was added to the dispute |

---

## 3. Status Lifecycle

### 3.1 Valid Transitions

```
Reported → Under Investigation
Under Investigation → Escalated
Under Investigation → Resolved
Under Investigation → Referred
Escalated → Resolved
```

### 3.2 Terminal States

`Resolved` and `Referred` are terminal — no outbound transitions. No backward transitions exist in the system.

### 3.3 Resolution Outcomes

| Outcome | Meaning |
|---------|---------|
| `Refunded` | Customer was refunded the disputed amount |
| `Declined` | Dispute rejected — transaction deemed legitimate |
| `Chargeback Initiated` | Sent to card network for recovery |

---

## 4. Triage Engine (Business Rules)

### 4.1 Rule Inputs

| Input | Source | Calculation |
|-------|--------|-------------|
| Transaction age | Each linked transaction | `dispute.dateRaised - transaction.timestamp` (hours) |
| Total dispute amount | Sum of all linked transactions | `SUM(transaction.amount)` |

### 4.2 Rule Conditions

| # | Condition | Fires when |
|---|-----------|-----------|
| R1 | Age rule | **Any** transaction has age < 48 hours relative to dispute `dateRaised` |
| R2 | Amount rule | Total dispute amount > R10,000 |

### 4.3 Recommendation Matrix

| R1 (Age < 48h) | R2 (Amount > R10K) | Priority | Recommendation |
|:---:|:---:|:---:|---|
| Yes | Yes | P1 | Immediate Fraud Freeze + P1 High Priority Escalation |
| No | Yes | P1 | P1 High Priority Escalation |
| Yes | No | P2 | Immediate Fraud Freeze |
| No | No | Standard | Standard Investigation |

### 4.4 Rule Trace Structure

```json
{
  "evaluatedAt": "2025-06-22T10:00:00Z",
  "inputs": {
    "youngestTransactionAge": "22 hours",
    "totalAmount": 16500
  },
  "rules": [
    { "rule": "R1", "condition": "Any transaction age < 48h", "result": true, "detail": "Transaction #3 age = 22h" },
    { "rule": "R2", "condition": "Total amount > R10,000", "result": true, "detail": "Total = R16,500" }
  ],
  "recommendation": "Immediate Fraud Freeze + P1 High Priority Escalation",
  "priority": "P1"
}
```

---

## 5. Functional Requirements (EARS)

### 5.1 Ops Dashboard

- **REQ-001:** The system shall display all disputes in a table view with columns: ID, customer name, status, priority, total amount (ZAR), and date raised.

- **REQ-002:** When the ops user selects one or more status filters, the system shall display only disputes matching the selected statuses.

- **REQ-003:** When the ops user selects one or more priority filters, the system shall display only disputes matching the selected priorities.

- **REQ-004:** When the ops user selects a sort field (date raised, total amount, or priority) and direction (ascending or descending), the system shall reorder the dispute list accordingly.

- **REQ-005:** The system shall default the dispute list sort order to priority descending (P1 first), then date raised descending (newest first).

- **REQ-006:** When the ops user clicks a dispute row, the system shall navigate to the dispute detail view for that dispute.

- **REQ-007:** The system shall display priority badges with distinct colours: P1 = red, P2 = amber, Standard = grey.

- **REQ-008:** The system shall display status badges with distinct colours per status value.

### 5.2 Create Dispute

- **REQ-009:** When the ops user clicks "New Dispute" from the dashboard, the system shall navigate to the dispute creation form.

- **REQ-010:** The system shall present a customer selection dropdown populated with all pre-seeded customers.

- **REQ-011:** The system shall present a repeatable transaction entry group with fields: amount (ZAR), merchant name, transaction timestamp, and payment type (Card / Apple Pay / EFT).

- **REQ-012:** When the ops user clicks "Add Transaction", the system shall add an additional empty transaction entry group to the form.

- **REQ-013:** If the ops user attempts to submit the form with zero transactions, then the system shall prevent submission and display a validation message indicating at least one transaction is required.

- **REQ-014:** If the ops user attempts to submit a transaction with a missing or non-positive amount, then the system shall prevent submission and display a validation error for the affected field.

- **REQ-015:** When the ops user submits a valid dispute form, the system shall create the dispute with status `Reported`, set `dateRaised` to the server timestamp, calculate `totalAmount` as the sum of all transaction amounts, execute the triage engine, and store the resulting priority, recommendation, and rule trace.

- **REQ-016:** When dispute creation succeeds, the system shall redirect the ops user to the newly created dispute's detail view.

### 5.3 Dispute Detail View

- **REQ-017:** The system shall display customer information: name, contact reference, and account identifier.

- **REQ-018:** The system shall display dispute metadata: status, priority, category, total amount (formatted as ZAR), and date raised.

- **REQ-019:** The system shall display all linked transactions in a table with columns: amount (ZAR), merchant, timestamp, and payment type.

- **REQ-020:** The system shall prominently display the triage recommendation text, highlighted by priority colour.

- **REQ-021:** The system shall display the full rule trace showing: which rules were evaluated, computed input values, which rules fired, and the resulting recommendation.

- **REQ-022:** The system shall display a status lifecycle indicator showing the current position and available transitions.

- **REQ-023:** While the dispute is in a non-terminal status, the system shall display action buttons only for valid transitions from the current status (per §3.1).

- **REQ-024:** While the dispute is in a terminal status (`Resolved` or `Referred`), the system shall not display any status transition actions.

### 5.4 Add Transaction (Post-Creation)

- **REQ-025:** While the dispute is in a non-terminal status, the system shall offer an "Add Transaction" action from the dispute detail view.

- **REQ-026:** When the ops user submits a new transaction with valid fields (amount, merchant, timestamp, payment type), the system shall link the transaction to the dispute, recalculate `totalAmount`, re-execute the triage engine with the updated transaction list, and store the new priority, recommendation, and rule trace.

- **REQ-027:** When triage re-evaluation completes after adding a transaction, the system shall replace the previous recommendation and rule trace with the new values.

- **REQ-028:** The system shall not permit editing or deletion of existing dispute or transaction records.

### 5.5 Status Progression

- **REQ-029:** While the dispute has status `Reported`, when the ops user clicks "Investigate", the system shall transition the status to `UnderInvestigation`.

- **REQ-030:** While the dispute has status `UnderInvestigation`, when the ops user clicks "Escalate", the system shall transition the status to `Escalated`.

- **REQ-031:** While the dispute has status `UnderInvestigation` or `Escalated`, when the ops user clicks "Resolve", the system shall prompt for a resolution outcome selection before completing the transition.

- **REQ-032:** When the ops user selects a resolution outcome (`Refunded`, `Declined`, or `Chargeback Initiated`) and confirms, the system shall transition the status to `Resolved` and store the selected outcome.

- **REQ-033:** While the dispute has status `UnderInvestigation`, when the ops user clicks "Refer", the system shall transition the status to `Referred` without requiring additional input.

- **REQ-034:** If the API receives a status transition request that violates the valid transition rules (§3.1), then the system shall reject the request with error code `INVALID_STATUS_TRANSITION` and a message describing the violation.

- **REQ-035:** If a transition to `Resolved` is requested without a `resolutionOutcome` value, then the system shall reject the request with error code `MISSING_RESOLUTION_OUTCOME`.

### 5.6 Triage Execution

- **REQ-036:** When a dispute is created, the system shall immediately execute the triage engine using the dispute's `dateRaised` and its linked transactions as inputs.

- **REQ-037:** When a transaction is added to an existing dispute, the system shall re-execute the triage engine using the dispute's original `dateRaised` and the complete updated transaction list.

- **REQ-038:** The system shall calculate transaction age as `dispute.dateRaised - transaction.timestamp` expressed in hours.

- **REQ-039:** Where any single linked transaction has age less than 48 hours, the system shall set rule R1 to `true`.

- **REQ-040:** Where the sum of all linked transaction amounts exceeds R10,000, the system shall set rule R2 to `true`.

- **REQ-041:** Where both R1 and R2 are true, the system shall assign priority `P1` and recommendation "Immediate Fraud Freeze + P1 High Priority Escalation".

- **REQ-042:** Where R1 is false and R2 is true, the system shall assign priority `P1` and recommendation "P1 High Priority Escalation".

- **REQ-043:** Where R1 is true and R2 is false, the system shall assign priority `P2` and recommendation "Immediate Fraud Freeze".

- **REQ-044:** Where both R1 and R2 are false, the system shall assign priority `Standard` and recommendation "Standard Investigation".

- **REQ-045:** The system shall produce a structured rule trace for every triage execution, recording: evaluation timestamp, computed input values, each rule's condition and result, and the final recommendation and priority.

---

## 6. API Requirements (EARS)

### 6.1 Disputes

- **REQ-046:** When a GET request is received at `/api/disputes`, the system shall return a JSON array of all disputes with support for query parameters: `status`, `priority`, `sortBy`, `sortOrder`.

- **REQ-047:** When a GET request is received at `/api/disputes/:id`, the system shall return the dispute detail including customer data, linked transactions, recommendation, and rule trace.

- **REQ-048:** If a GET request to `/api/disputes/:id` references a non-existent dispute, then the system shall return HTTP 404 with error code `DISPUTE_NOT_FOUND`.

- **REQ-049:** When a POST request is received at `/api/disputes` with a valid body (customerId, transactions array with at least one entry), the system shall create the dispute, execute triage, and return HTTP 201 with the created dispute.

- **REQ-050:** If a POST request to `/api/disputes` is missing required fields or contains invalid data, then the system shall return HTTP 400 with a descriptive error message.

- **REQ-051:** When a PATCH request is received at `/api/disputes/:id/status` with a valid status transition, the system shall update the dispute status and return HTTP 200 with the updated dispute.

### 6.2 Transactions

- **REQ-052:** When a POST request is received at `/api/disputes/:id/transactions` with valid transaction data, the system shall create the transaction, recalculate `totalAmount`, re-execute triage, and return HTTP 200 with the updated dispute.

- **REQ-053:** If a POST request to `/api/disputes/:id/transactions` targets a dispute in a terminal state, then the system shall return HTTP 400 with error code `DISPUTE_IN_TERMINAL_STATE`.

### 6.3 Customers

- **REQ-054:** When a GET request is received at `/api/customers`, the system shall return a JSON array of all pre-seeded customers.

### 6.4 Error Envelope

- **REQ-055:** If any API request results in an error, then the system shall return a JSON error envelope with structure: `{ "error": { "code": "<ERROR_CODE>", "message": "<description>", "status": <httpStatus>, "timestamp": "<ISO8601>" } }`.

---

## 7. Non-Functional Requirements (EARS)

- **REQ-056:** The system shall include `data-testid` attributes on all interactive UI elements.

- **REQ-057:** The system shall use semantic HTML elements with ARIA labels on icon-only buttons.

- **REQ-058:** The system shall use Tailwind CSS utility classes exclusively for styling, with no custom CSS unless extracted via `@apply`.

- **REQ-059:** If an API request fails due to a network error, then the system shall display a user-friendly error message with a retry option.

- **REQ-060:** The system shall be designed for desktop use with a minimum viewport width of 1024px.

- **REQ-061:** The system shall render correctly in modern evergreen browsers (Chrome, Firefox, Edge, Safari latest).

---

## 8. Seed Data Requirements

The database must be seeded with:

### 8.1 Customers

At least 3-5 pre-seeded customers with varied names, contact references, and account identifiers.

### 8.2 Disputes & Transactions

| Seed Case | Transactions | Expected Triage |
|-----------|-------------|-----------------|
| Case A: Both rules fire | Multiple transactions from a single robbery event. At least one < 48h old. Total > R10,000. | P1 — Immediate Fraud Freeze + P1 Escalation |
| Case B: Amount only | Transaction(s) older than 48h. Total > R10,000. | P1 — P1 High Priority Escalation |
| Case C: Age only | Transaction(s) < 48h old. Total ≤ R10,000. | P2 — Immediate Fraud Freeze |
| Case D: Neither rule | Transaction(s) older than 48h. Total ≤ R10,000. | Standard — Standard Investigation |
| Case E: Multi-transaction | Multiple transactions from one event (anchor story: robbery, Apple Pay, several stores). | Exercises the "any transaction qualifies" logic |

Cases should be in varied statuses to populate the dashboard meaningfully (some Reported, some Under Investigation, one Escalated, one Resolved).

Seed timestamps use **relative dates** (e.g., `Date.now() - 24h`) to keep the 48-hour triage rule exercisable across demo sessions.

---

## 9. UI Layout

### 9.1 Dashboard Page (`/`)

- Header with system title ("Dispute Triage").
- Filter bar: status checkboxes, priority checkboxes.
- Sort controls: dropdown for field, toggle for asc/desc.
- Disputes table with columns per REQ-001.
- "New Dispute" button (navigates to create form).
- Priority badges: P1 = red, P2 = amber, Standard = grey.
- Status badges with distinct colours per status.

### 9.2 Create Dispute Page (`/disputes/new`)

- Customer selection dropdown.
- Transaction entry: repeatable form group (amount, merchant, timestamp, payment type).
- "Add Transaction" button to add more rows.
- "Submit" button. Disabled until at least one transaction is added.
- Validation: all transaction fields required, amount must be positive.

### 9.3 Dispute Detail Page (`/disputes/:id`)

- Back link to dashboard.
- Customer info card.
- Dispute summary card (status, priority, amount, date raised, category).
- Triage recommendation card (prominent, highlighted by priority colour).
- Rule trace expandable/visible section.
- Transactions table.
- "Add Transaction" action (opens inline form or modal).
- Status action buttons (only valid transitions shown).
- Resolution outcome selector (shown only when resolving).

---

## 10. Out of Scope

- Authentication / authorization.
- Customer self-service portal.
- Actual payment reversals or refund processing.
- External integrations (banking, card networks, case management).
- AI/ML-based decisions.
- Notifications (SMS, email, push).
- Multiple dispute categories.
- Audit trail / compliance reporting.
- Editing or deleting existing dispute/transaction data.
- Re-opening referred cases.

---

## 11. Decisions Log

| # | Question | Decision |
|---|----------|----------|
| 1 | Status transition model | Linear with branches. No re-opening from Referred. |
| 2 | Transaction age calculation | `dispute.dateRaised - transaction.timestamp`. Fixed reference point. |
| 3 | Multiple transactions and age rule | Any single transaction qualifying triggers the rule. |
| 4 | Resolution outcomes | Fixed enum: Refunded, Declined, Chargeback Initiated. |
| 5 | Priority derivation | Three-tier from rules: P1 (amount), P2 (age only), Standard (neither). |
| 6 | Dispute creation | Ops user creates via form (not seed-only). |
| 7 | Dashboard capabilities | Filterable by status/priority, sortable by date/amount/priority. |
| 8 | Triage timing | On creation — immediate, stored on dispute. |
| 9 | Customer records | Pre-seeded. Ops user selects from existing customers. |
| 10 | Edit after creation | Can add transactions. Cannot edit/delete existing data. |
| 11 | Triage re-evaluation | Re-evaluates when transactions are added. |
| 12 | Seed data dates | Relative timestamps to keep triage rules exercisable. |

---

## Requirements Traceability

| Functional Area | Requirements | Count |
|-----------------|-------------|-------|
| Ops Dashboard | REQ-001 to REQ-008 | 8 |
| Create Dispute | REQ-009 to REQ-016 | 8 |
| Dispute Detail View | REQ-017 to REQ-024 | 8 |
| Add Transaction | REQ-025 to REQ-028 | 4 |
| Status Progression | REQ-029 to REQ-035 | 7 |
| Triage Execution | REQ-036 to REQ-045 | 10 |
| API (Disputes) | REQ-046 to REQ-051 | 6 |
| API (Transactions) | REQ-052 to REQ-053 | 2 |
| API (Customers) | REQ-054 | 1 |
| API (Error Handling) | REQ-055 | 1 |
| Non-Functional | REQ-056 to REQ-061 | 6 |
| **Total** | | **61** |
