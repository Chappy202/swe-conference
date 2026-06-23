# API Specification — Dispute Triage System

RESTful JSON API served under `/api` on port 3001. All endpoints return `application/json`. Monetary values are raw numbers representing ZAR (South African Rand). The frontend formats these with a `R` prefix for display.

Reference: [`docs/requirements.md`](./requirements.md) (Section 6 — API Requirements), [`docs/architecture.md`](./architecture.md) (Section 9 — API Surface).

---

## Enums

| Name | Values |
|------|--------|
| Status | `Reported`, `UnderInvestigation`, `Escalated`, `Resolved`, `Referred` |
| Priority | `P1`, `P2`, `Standard` |
| PaymentType | `Card`, `ApplePay`, `EFT` |
| ResolutionOutcome | `Refunded`, `Declined`, `ChargebackInitiated` |

---

## Error Envelope

All error responses use a consistent envelope:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable description of what went wrong.",
    "status": 400,
    "timestamp": "2025-06-22T10:00:00.000Z"
  }
}
```

---

## GET /api/customers

List all pre-seeded customers. Used to populate the customer selection dropdown on the dispute creation form.

**Query parameters:** None.

**Success response (200):**

An array of customer objects:

- id (number) — primary key
- name (string) — full name
- contactReference (string) — phone or email reference
- accountIdentifier (string) — bank account number or card reference
- createdAt (string, ISO8601) — record creation timestamp

**Error responses:**

- None specific — returns an empty array if no customers exist.

**Example:**

Request: `GET /api/customers`

Response:
```json
[
  {
    "id": 1,
    "name": "Thabo Mokoena",
    "contactReference": "+27 82 345 6789",
    "accountIdentifier": "4532-XXXX-XXXX-8821",
    "createdAt": "2025-06-20T08:00:00.000Z"
  },
  {
    "id": 2,
    "name": "Naledi Dlamini",
    "contactReference": "naledi.dlamini@email.co.za",
    "accountIdentifier": "6221-XXXX-XXXX-4410",
    "createdAt": "2025-06-20T08:00:00.000Z"
  },
  {
    "id": 3,
    "name": "Sipho Nkosi",
    "contactReference": "+27 71 987 6543",
    "accountIdentifier": "5412-XXXX-XXXX-3367",
    "createdAt": "2025-06-20T08:00:00.000Z"
  }
]
```

---

## GET /api/disputes

List all disputes with optional filtering and sorting.

**Query parameters:**

- status (string, optional) — comma-separated filter: `Reported`, `UnderInvestigation`, `Escalated`, `Resolved`, `Referred`
- priority (string, optional) — comma-separated filter: `P1`, `P2`, `Standard`
- sortBy (string, optional, default: `"priority"`) — field to sort by: `dateRaised`, `totalAmount`, `priority`
- sortOrder (string, optional, default: `"desc"`) — `asc` or `desc`

**Success response (200):**

An array of dispute summary objects:

- id (number) — primary key
- customerId (number) — foreign key to customer
- customerName (string) — denormalized customer name for list display
- status (string) — current lifecycle status
- category (string) — always `"Unauthorised/Fraudulent Charge"`
- totalAmount (number) — sum of transaction amounts in ZAR
- dateRaised (string, ISO8601) — when the dispute was reported
- priority (string) — `P1`, `P2`, or `Standard`
- recommendation (string) — triage recommendation text
- resolutionOutcome (string | null) — set only when resolved
- createdAt (string, ISO8601) — record creation timestamp
- updatedAt (string, ISO8601) — last modification timestamp

Default sort is priority descending (P1 first), then dateRaised descending (newest first).

**Error responses:**

- None specific — returns an empty array if no disputes match filters.

**Example:**

Request: `GET /api/disputes?status=Reported,UnderInvestigation&priority=P1&sortBy=dateRaised&sortOrder=desc`

Response:
```json
[
  {
    "id": 1,
    "customerId": 1,
    "customerName": "Thabo Mokoena",
    "status": "Reported",
    "category": "Unauthorised/Fraudulent Charge",
    "totalAmount": 16500,
    "dateRaised": "2025-06-22T09:30:00.000Z",
    "priority": "P1",
    "recommendation": "Immediate Fraud Freeze + P1 High Priority Escalation",
    "resolutionOutcome": null,
    "createdAt": "2025-06-22T09:30:00.000Z",
    "updatedAt": "2025-06-22T09:30:00.000Z"
  },
  {
    "id": 3,
    "customerId": 2,
    "customerName": "Naledi Dlamini",
    "status": "UnderInvestigation",
    "category": "Unauthorised/Fraudulent Charge",
    "totalAmount": 12800,
    "dateRaised": "2025-06-19T14:00:00.000Z",
    "priority": "P1",
    "recommendation": "P1 High Priority Escalation",
    "resolutionOutcome": null,
    "createdAt": "2025-06-19T14:00:00.000Z",
    "updatedAt": "2025-06-20T11:15:00.000Z"
  }
]
```

---

## GET /api/disputes/:id

Get full dispute detail including customer info, transactions, triage recommendation, and rule trace.

**Path parameters:**

- id (number, required) — the dispute ID

**Success response (200):**

- id (number) — primary key
- customerId (number) — foreign key to customer
- customer (object) — nested customer: `{ id, name, contactReference, accountIdentifier }`
- status (string) — current lifecycle status
- category (string) — always `"Unauthorised/Fraudulent Charge"`
- totalAmount (number) — sum of transaction amounts in ZAR
- dateRaised (string, ISO8601) — when the dispute was reported
- priority (string) — `P1`, `P2`, or `Standard`
- recommendation (string) — triage recommendation text
- ruleTrace (object) — structured trace: `{ evaluatedAt, inputs, rules, recommendation, priority }`
- resolutionOutcome (string | null) — set only when resolved
- transactions (array) — `[{ id, amount, merchant, timestamp, paymentType, createdAt }]`
- createdAt (string, ISO8601) — record creation timestamp
- updatedAt (string, ISO8601) — last modification timestamp

**Error responses:**

- 404 `DISPUTE_NOT_FOUND` — the requested dispute does not exist

**Example:**

Request: `GET /api/disputes/1`

Response:
```json
{
  "id": 1,
  "customerId": 1,
  "customer": {
    "id": 1,
    "name": "Thabo Mokoena",
    "contactReference": "+27 82 345 6789",
    "accountIdentifier": "4532-XXXX-XXXX-8821"
  },
  "status": "Reported",
  "category": "Unauthorised/Fraudulent Charge",
  "totalAmount": 16500,
  "dateRaised": "2025-06-22T09:30:00.000Z",
  "priority": "P1",
  "recommendation": "Immediate Fraud Freeze + P1 High Priority Escalation",
  "ruleTrace": {
    "evaluatedAt": "2025-06-22T09:30:00.000Z",
    "inputs": {
      "youngestTransactionAge": "22 hours",
      "totalAmount": 16500
    },
    "rules": [
      {
        "rule": "R1",
        "condition": "Any transaction age < 48h",
        "result": true,
        "detail": "Transaction #3 age = 22h"
      },
      {
        "rule": "R2",
        "condition": "Total amount > R10,000",
        "result": true,
        "detail": "Total = R16,500"
      }
    ],
    "recommendation": "Immediate Fraud Freeze + P1 High Priority Escalation",
    "priority": "P1"
  },
  "resolutionOutcome": null,
  "transactions": [
    {
      "id": 1,
      "amount": 4500,
      "merchant": "Sportscene Sandton City",
      "timestamp": "2025-06-21T11:15:00.000Z",
      "paymentType": "ApplePay",
      "createdAt": "2025-06-22T09:30:00.000Z"
    },
    {
      "id": 2,
      "amount": 7200,
      "merchant": "iStore Gateway Mall",
      "timestamp": "2025-06-21T11:42:00.000Z",
      "paymentType": "ApplePay",
      "createdAt": "2025-06-22T09:30:00.000Z"
    },
    {
      "id": 3,
      "amount": 4800,
      "merchant": "Clicks Rosebank",
      "timestamp": "2025-06-21T12:05:00.000Z",
      "paymentType": "ApplePay",
      "createdAt": "2025-06-22T09:30:00.000Z"
    }
  ],
  "createdAt": "2025-06-22T09:30:00.000Z",
  "updatedAt": "2025-06-22T09:30:00.000Z"
}
```

---

## POST /api/disputes

Create a new dispute with transactions. The triage engine runs immediately on creation.

**Request body:**

- customerId (number, required) — must reference an existing customer
- transactions (array, required, min 1) — array of transaction objects:
  - amount (number, required, > 0) — transaction amount in ZAR
  - merchant (string, required) — merchant name
  - timestamp (string ISO8601, required) — when the transaction occurred
  - paymentType (string, required) — `"Card"` | `"ApplePay"` | `"EFT"`

The server automatically:
1. Sets `dateRaised` to the current server timestamp
2. Sets `status` to `Reported`
3. Calculates `totalAmount` as the sum of all transaction amounts
4. Runs the triage engine to determine `priority`, `recommendation`, and `ruleTrace`

**Success response (201):**

Full dispute object (same shape as GET /api/disputes/:id response).

**Error responses:**

- 400 — validation failed (missing required fields, empty transactions array, non-positive amounts, invalid paymentType, customer not found)

**Example:**

Request:
```json
{
  "customerId": 1,
  "transactions": [
    {
      "amount": 4500,
      "merchant": "Sportscene Sandton City",
      "timestamp": "2025-06-21T11:15:00.000Z",
      "paymentType": "ApplePay"
    },
    {
      "amount": 7200,
      "merchant": "iStore Gateway Mall",
      "timestamp": "2025-06-21T11:42:00.000Z",
      "paymentType": "ApplePay"
    },
    {
      "amount": 4800,
      "merchant": "Clicks Rosebank",
      "timestamp": "2025-06-21T12:05:00.000Z",
      "paymentType": "ApplePay"
    }
  ]
}
```

Response (201):
```json
{
  "id": 1,
  "customerId": 1,
  "customer": {
    "id": 1,
    "name": "Thabo Mokoena",
    "contactReference": "+27 82 345 6789",
    "accountIdentifier": "4532-XXXX-XXXX-8821"
  },
  "status": "Reported",
  "category": "Unauthorised/Fraudulent Charge",
  "totalAmount": 16500,
  "dateRaised": "2025-06-22T09:30:00.000Z",
  "priority": "P1",
  "recommendation": "Immediate Fraud Freeze + P1 High Priority Escalation",
  "ruleTrace": {
    "evaluatedAt": "2025-06-22T09:30:00.000Z",
    "inputs": {
      "youngestTransactionAge": "22 hours",
      "totalAmount": 16500
    },
    "rules": [
      {
        "rule": "R1",
        "condition": "Any transaction age < 48h",
        "result": true,
        "detail": "Transaction #3 age = 22h"
      },
      {
        "rule": "R2",
        "condition": "Total amount > R10,000",
        "result": true,
        "detail": "Total = R16,500"
      }
    ],
    "recommendation": "Immediate Fraud Freeze + P1 High Priority Escalation",
    "priority": "P1"
  },
  "resolutionOutcome": null,
  "transactions": [
    {
      "id": 1,
      "amount": 4500,
      "merchant": "Sportscene Sandton City",
      "timestamp": "2025-06-21T11:15:00.000Z",
      "paymentType": "ApplePay",
      "createdAt": "2025-06-22T09:30:00.000Z"
    },
    {
      "id": 2,
      "amount": 7200,
      "merchant": "iStore Gateway Mall",
      "timestamp": "2025-06-21T11:42:00.000Z",
      "paymentType": "ApplePay",
      "createdAt": "2025-06-22T09:30:00.000Z"
    },
    {
      "id": 3,
      "amount": 4800,
      "merchant": "Clicks Rosebank",
      "timestamp": "2025-06-21T12:05:00.000Z",
      "paymentType": "ApplePay",
      "createdAt": "2025-06-22T09:30:00.000Z"
    }
  ],
  "createdAt": "2025-06-22T09:30:00.000Z",
  "updatedAt": "2025-06-22T09:30:00.000Z"
}
```

Error (400):
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "At least one transaction is required.",
    "status": 400,
    "timestamp": "2025-06-22T09:30:00.000Z"
  }
}
```

---

## PATCH /api/disputes/:id/status

Progress a dispute through its lifecycle states.

**Path parameters:**

- id (number, required) — the dispute ID

**Valid transitions:**

| From | To |
|------|----|
| Reported | UnderInvestigation |
| UnderInvestigation | Escalated, Resolved, Referred |
| Escalated | Resolved |

**Request body:**

- status (string, required) — the target status
- resolutionOutcome (string, required if status is `"Resolved"`) — `"Refunded"` | `"Declined"` | `"ChargebackInitiated"`

**Success response (200):**

Full updated dispute object (same shape as GET /api/disputes/:id response).

**Error responses:**

- 400 `INVALID_STATUS_TRANSITION` — the requested transition violates the state machine rules
- 400 `MISSING_RESOLUTION_OUTCOME` — transitioning to Resolved without providing resolutionOutcome
- 404 `DISPUTE_NOT_FOUND` — the dispute does not exist

**Example (Investigate):**

Request: `PATCH /api/disputes/1/status`
```json
{
  "status": "UnderInvestigation"
}
```

Response (200):
```json
{
  "id": 1,
  "customerId": 1,
  "customer": {
    "id": 1,
    "name": "Thabo Mokoena",
    "contactReference": "+27 82 345 6789",
    "accountIdentifier": "4532-XXXX-XXXX-8821"
  },
  "status": "UnderInvestigation",
  "category": "Unauthorised/Fraudulent Charge",
  "totalAmount": 16500,
  "dateRaised": "2025-06-22T09:30:00.000Z",
  "priority": "P1",
  "recommendation": "Immediate Fraud Freeze + P1 High Priority Escalation",
  "ruleTrace": {
    "evaluatedAt": "2025-06-22T09:30:00.000Z",
    "inputs": {
      "youngestTransactionAge": "22 hours",
      "totalAmount": 16500
    },
    "rules": [
      {
        "rule": "R1",
        "condition": "Any transaction age < 48h",
        "result": true,
        "detail": "Transaction #3 age = 22h"
      },
      {
        "rule": "R2",
        "condition": "Total amount > R10,000",
        "result": true,
        "detail": "Total = R16,500"
      }
    ],
    "recommendation": "Immediate Fraud Freeze + P1 High Priority Escalation",
    "priority": "P1"
  },
  "resolutionOutcome": null,
  "transactions": [
    {
      "id": 1,
      "amount": 4500,
      "merchant": "Sportscene Sandton City",
      "timestamp": "2025-06-21T11:15:00.000Z",
      "paymentType": "ApplePay",
      "createdAt": "2025-06-22T09:30:00.000Z"
    },
    {
      "id": 2,
      "amount": 7200,
      "merchant": "iStore Gateway Mall",
      "timestamp": "2025-06-21T11:42:00.000Z",
      "paymentType": "ApplePay",
      "createdAt": "2025-06-22T09:30:00.000Z"
    },
    {
      "id": 3,
      "amount": 4800,
      "merchant": "Clicks Rosebank",
      "timestamp": "2025-06-21T12:05:00.000Z",
      "paymentType": "ApplePay",
      "createdAt": "2025-06-22T09:30:00.000Z"
    }
  ],
  "createdAt": "2025-06-22T09:30:00.000Z",
  "updatedAt": "2025-06-22T10:15:00.000Z"
}
```

**Example (Resolve with outcome):**

Request: `PATCH /api/disputes/1/status`
```json
{
  "status": "Resolved",
  "resolutionOutcome": "Refunded"
}
```

**Example (Invalid transition error):**

Request: `PATCH /api/disputes/1/status`
```json
{
  "status": "Resolved"
}
```
(when dispute is still in `Reported` status)

Response (400):
```json
{
  "error": {
    "code": "INVALID_STATUS_TRANSITION",
    "message": "Cannot transition from 'Reported' to 'Resolved'.",
    "status": 400,
    "timestamp": "2025-06-22T10:20:00.000Z"
  }
}
```

---

## POST /api/disputes/:id/transactions

Add a transaction to an existing dispute. Triggers triage re-evaluation with the updated transaction list.

**Path parameters:**

- id (number, required) — the dispute ID

**Request body:**

- amount (number, required, > 0) — transaction amount in ZAR
- merchant (string, required) — merchant name
- timestamp (string ISO8601, required) — when the transaction occurred
- paymentType (string, required) — `"Card"` | `"ApplePay"` | `"EFT"`

The server:
1. Validates the dispute is not in a terminal state (Resolved or Referred)
2. Creates the transaction and links it to the dispute
3. Recalculates `totalAmount` as the sum of all transactions
4. Re-runs the triage engine with the full updated transaction list
5. Updates `priority`, `recommendation`, and `ruleTrace`

**Success response (200):**

Full updated dispute object (same shape as GET /api/disputes/:id response).

**Error responses:**

- 400 `DISPUTE_IN_TERMINAL_STATE` — the dispute is Resolved or Referred and cannot accept new transactions
- 400 — validation errors (missing or invalid fields, non-positive amount, invalid paymentType)
- 404 `DISPUTE_NOT_FOUND` — the dispute does not exist

**Example:**

Request: `POST /api/disputes/1/transactions`
```json
{
  "amount": 2300,
  "merchant": "Woolworths Eastgate",
  "timestamp": "2025-06-21T12:30:00.000Z",
  "paymentType": "ApplePay"
}
```

Response (200):
```json
{
  "id": 1,
  "customerId": 1,
  "customer": {
    "id": 1,
    "name": "Thabo Mokoena",
    "contactReference": "+27 82 345 6789",
    "accountIdentifier": "4532-XXXX-XXXX-8821"
  },
  "status": "Reported",
  "category": "Unauthorised/Fraudulent Charge",
  "totalAmount": 18800,
  "dateRaised": "2025-06-22T09:30:00.000Z",
  "priority": "P1",
  "recommendation": "Immediate Fraud Freeze + P1 High Priority Escalation",
  "ruleTrace": {
    "evaluatedAt": "2025-06-22T10:45:00.000Z",
    "inputs": {
      "youngestTransactionAge": "21 hours",
      "totalAmount": 18800
    },
    "rules": [
      {
        "rule": "R1",
        "condition": "Any transaction age < 48h",
        "result": true,
        "detail": "Transaction #4 age = 21h"
      },
      {
        "rule": "R2",
        "condition": "Total amount > R10,000",
        "result": true,
        "detail": "Total = R18,800"
      }
    ],
    "recommendation": "Immediate Fraud Freeze + P1 High Priority Escalation",
    "priority": "P1"
  },
  "resolutionOutcome": null,
  "transactions": [
    {
      "id": 1,
      "amount": 4500,
      "merchant": "Sportscene Sandton City",
      "timestamp": "2025-06-21T11:15:00.000Z",
      "paymentType": "ApplePay",
      "createdAt": "2025-06-22T09:30:00.000Z"
    },
    {
      "id": 2,
      "amount": 7200,
      "merchant": "iStore Gateway Mall",
      "timestamp": "2025-06-21T11:42:00.000Z",
      "paymentType": "ApplePay",
      "createdAt": "2025-06-22T09:30:00.000Z"
    },
    {
      "id": 3,
      "amount": 4800,
      "merchant": "Clicks Rosebank",
      "timestamp": "2025-06-21T12:05:00.000Z",
      "paymentType": "ApplePay",
      "createdAt": "2025-06-22T09:30:00.000Z"
    },
    {
      "id": 4,
      "amount": 2300,
      "merchant": "Woolworths Eastgate",
      "timestamp": "2025-06-21T12:30:00.000Z",
      "paymentType": "ApplePay",
      "createdAt": "2025-06-22T10:45:00.000Z"
    }
  ],
  "createdAt": "2025-06-22T09:30:00.000Z",
  "updatedAt": "2025-06-22T10:45:00.000Z"
}
```

Error (400 — terminal state):
```json
{
  "error": {
    "code": "DISPUTE_IN_TERMINAL_STATE",
    "message": "Cannot add transactions to a dispute in 'Resolved' state.",
    "status": 400,
    "timestamp": "2025-06-22T11:00:00.000Z"
  }
}
```

---

## Notes

### Currency

All monetary values are numbers representing ZAR. The API transmits raw numbers (e.g., `16500`). The frontend formats for display with the `R` prefix (e.g., `R16,500`).

### Timestamps

All timestamps are ISO 8601 strings in UTC (e.g., `"2025-06-22T09:30:00.000Z"`).

### Triage Re-evaluation

The triage engine runs automatically on:
1. Dispute creation (POST /api/disputes)
2. Transaction addition (POST /api/disputes/:id/transactions)

It is never triggered manually. The engine uses the dispute's original `dateRaised` as the fixed reference point for age calculations, regardless of when re-evaluation occurs.

### State Machine

Terminal states (`Resolved`, `Referred`) reject all modifications — both status transitions and transaction additions. The state machine is enforced server-side; the frontend should only present valid actions, but the API is the authoritative guard.
