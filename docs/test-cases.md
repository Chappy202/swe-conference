# Test Cases — Create & Resolve High-Value Fraud Dispute

> **Selected User Journey:** An ops user creates a dispute for a robbery victim with multiple Apple Pay transactions totalling > R10,000 (all < 48 hours old), reviews the P1 triage recommendation, investigates, and resolves the case with a refund.
>
> This journey exercises: customer listing, dispute creation with triage, detail view with rule trace, status transitions (Reported → Under Investigation → Resolved), and resolution outcome capture.

---

## Backend Unit Tests (Vitest)

### Triage Engine

## TC-001: Both Rules Fire — Amount > R10K AND Age < 48h
- GIVEN a dispute with dateRaised = now
- AND transactions totalling R16,500 with youngest age = 22 hours
- WHEN the triage engine evaluates the dispute
- THEN priority shall be `P1`
- AND recommendation shall be "Immediate Fraud Freeze + P1 High Priority Escalation"
- AND ruleTrace.rules[0] (R1 Age < 48h) result shall be `true`
- AND ruleTrace.rules[1] (R2 Amount > R10K) result shall be `true`

## TC-002: Amount Only — Amount > R10K AND Age >= 48h
- GIVEN a dispute with dateRaised = now
- AND transactions totalling R12,000 with youngest age = 72 hours
- WHEN the triage engine evaluates the dispute
- THEN priority shall be `P1`
- AND recommendation shall be "P1 High Priority Escalation"
- AND ruleTrace.rules[0] (R1) result shall be `false`
- AND ruleTrace.rules[1] (R2) result shall be `true`

## TC-003: Age Only — Amount <= R10K AND Age < 48h
- GIVEN a dispute with dateRaised = now
- AND transactions totalling R5,000 with youngest age = 12 hours
- WHEN the triage engine evaluates the dispute
- THEN priority shall be `P2`
- AND recommendation shall be "Immediate Fraud Freeze"
- AND ruleTrace.rules[0] (R1) result shall be `true`
- AND ruleTrace.rules[1] (R2) result shall be `false`

## TC-004: Neither Rule — Amount <= R10K AND Age >= 48h
- GIVEN a dispute with dateRaised = now
- AND transactions totalling R3,000 with youngest age = 96 hours
- WHEN the triage engine evaluates the dispute
- THEN priority shall be `Standard`
- AND recommendation shall be "Standard Investigation"
- AND ruleTrace.rules[0] (R1) result shall be `false`
- AND ruleTrace.rules[1] (R2) result shall be `false`

## TC-005: Age Calculation Uses dateRaised Not Current Time
- GIVEN a dispute with dateRaised = "2025-06-22T10:00:00Z"
- AND a transaction with timestamp = "2025-06-22T08:00:00Z" (2 hours before dateRaised)
- WHEN the triage engine evaluates the dispute
- THEN the transaction age shall be calculated as 2 hours
- AND R1 (< 48h) shall fire as `true`

## TC-006: Any Single Transaction Qualifies for Age Rule
- GIVEN a dispute with dateRaised = now
- AND three transactions: two aged 72h, one aged 20h
- WHEN the triage engine evaluates the dispute
- THEN R1 shall fire as `true` (any single transaction qualifies)

---

### Status Transitions

## TC-007: Valid Transition — Reported to Under Investigation
- GIVEN a dispute with status `Reported`
- WHEN a status transition to `UnderInvestigation` is requested
- THEN the status shall change to `UnderInvestigation`
- AND updatedAt shall be refreshed

## TC-008: Valid Transition — Under Investigation to Resolved with Outcome
- GIVEN a dispute with status `UnderInvestigation`
- WHEN a status transition to `Resolved` is requested with resolutionOutcome = "Refunded"
- THEN the status shall change to `Resolved`
- AND resolutionOutcome shall be "Refunded"

## TC-009: Invalid Transition — Reported to Resolved (Skips Steps)
- GIVEN a dispute with status `Reported`
- WHEN a status transition to `Resolved` is requested
- THEN the system shall reject with error code `INVALID_STATUS_TRANSITION`
- AND the status shall remain `Reported`

## TC-010: Missing Resolution Outcome on Resolve
- GIVEN a dispute with status `UnderInvestigation`
- WHEN a status transition to `Resolved` is requested without resolutionOutcome
- THEN the system shall reject with error code `MISSING_RESOLUTION_OUTCOME`

## TC-011: Terminal State Rejects Further Transitions
- GIVEN a dispute with status `Resolved`
- WHEN any status transition is requested
- THEN the system shall reject with error code `INVALID_STATUS_TRANSITION`

---

### API Routes

## TC-012: GET /api/customers Returns Pre-Seeded Customers
- GIVEN the database is seeded with customers
- WHEN GET /api/customers is called
- THEN HTTP 200 is returned
- AND the response is a non-empty array of customer objects with id, name, contactReference, accountIdentifier

## TC-013: POST /api/disputes Creates Dispute with Triage
- GIVEN a valid customer exists with id = 1
- WHEN POST /api/disputes is called with customerId=1 and two transactions totalling R15,000
- THEN HTTP 201 is returned
- AND the response contains status = "Reported"
- AND totalAmount = 15000
- AND priority and recommendation are populated
- AND ruleTrace is a valid structured object

## TC-014: POST /api/disputes Rejects Empty Transactions
- GIVEN a valid customer exists
- WHEN POST /api/disputes is called with customerId=1 and an empty transactions array
- THEN HTTP 400 is returned
- AND the error message indicates at least one transaction is required

## TC-015: POST /api/disputes Rejects Invalid Customer
- GIVEN no customer exists with id = 999
- WHEN POST /api/disputes is called with customerId=999
- THEN HTTP 400 is returned

## TC-016: PATCH /api/disputes/:id/status Performs Valid Transition
- GIVEN a dispute exists with status `Reported`
- WHEN PATCH /api/disputes/:id/status is called with { status: "UnderInvestigation" }
- THEN HTTP 200 is returned
- AND the response shows status = "UnderInvestigation"

## TC-017: GET /api/disputes/:id Returns Full Detail
- GIVEN a dispute exists with id = 1
- WHEN GET /api/disputes/1 is called
- THEN HTTP 200 is returned
- AND the response includes customer object, transactions array, ruleTrace, and recommendation

## TC-018: GET /api/disputes/:id Returns 404 for Non-Existent
- GIVEN no dispute exists with id = 9999
- WHEN GET /api/disputes/9999 is called
- THEN HTTP 404 is returned
- AND error code is `DISPUTE_NOT_FOUND`

## TC-019: POST /api/disputes/:id/transactions Re-Evaluates Triage
- GIVEN a dispute exists with totalAmount = R8,000 (Standard priority)
- WHEN a transaction of R5,000 is added
- THEN totalAmount becomes R13,000
- AND triage re-evaluates (R2 now fires)
- AND priority updates accordingly

## TC-020: POST /api/disputes/:id/transactions Rejects Terminal State
- GIVEN a dispute exists with status `Resolved`
- WHEN POST /api/disputes/:id/transactions is called
- THEN HTTP 400 is returned
- AND error code is `DISPUTE_IN_TERMINAL_STATE`

---

## E2E Playwright Test (Full User Journey)

## TC-E2E-001: Create High-Value Fraud Dispute and Resolve with Refund
- GIVEN the app is running with seeded customers
- WHEN the ops user navigates to the dashboard
- THEN the "All Disputes" heading is visible
- AND the "New Dispute" button is visible

- WHEN the ops user clicks "New Dispute"
- THEN the create dispute page loads with customer dropdown and transaction form

- WHEN the ops user selects a customer from the dropdown
- AND enters a transaction: amount=4500, merchant="Sportscene Sandton City", timestamp=(recent), paymentType="Apple Pay"
- AND clicks "Add Transaction"
- AND enters a second transaction: amount=7200, merchant="iStore Gateway Mall", timestamp=(recent), paymentType="Apple Pay"
- AND enters a third transaction: amount=4800, merchant="Clicks Rosebank", timestamp=(recent), paymentType="Apple Pay"
- AND clicks "Submit Dispute"
- THEN the system redirects to the dispute detail page
- AND the dispute shows status "Reported"
- AND priority badge shows "P1"
- AND recommendation shows "Immediate Fraud Freeze + P1 High Priority Escalation"
- AND all three transactions are listed in the transactions table
- AND the total amount shows R16,500

- WHEN the ops user clicks "Begin Investigation"
- THEN the status updates to "Under Investigation"
- AND "Escalate", "Resolve", and "Refer" buttons appear

- WHEN the ops user clicks "Resolve"
- THEN the resolution outcome modal appears

- WHEN the ops user selects "Refunded" and clicks "Confirm Resolve"
- THEN the status updates to "Resolved"
- AND the resolution outcome shows "Refunded"
- AND no action buttons are visible (terminal state)

---

## Traceability

| Test Case | Requirements Covered |
|-----------|---------------------|
| TC-001 to TC-006 | REQ-036 to REQ-045 (Triage Engine) |
| TC-007 to TC-011 | REQ-029 to REQ-035 (Status Progression) |
| TC-012 | REQ-054 (Customers API) |
| TC-013 to TC-020 | REQ-046 to REQ-053 (API Disputes & Transactions) |
| TC-E2E-001 | REQ-009 to REQ-016 (Create), REQ-017 to REQ-024 (Detail), REQ-029/031/032 (Status), REQ-036/041 (Triage) |
