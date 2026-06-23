# Design Document: Dispute API

## Overview

This design specifies the REST API layer for the Dispute Triage System. It covers the Express route handlers, a service orchestration layer (`disputeService`), error handling infrastructure, and DTO transformations. Route handlers follow a thin-controller pattern — validate input, delegate to service, return response. The service layer composes Prisma database operations with domain logic (triage engine, lifecycle guard).

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Express App (port 3001)                 │
├─────────────────────────────────────────────────────────────┤
│  Middleware: cors, json parser, errorHandler                │
├─────────────────────────────────────────────────────────────┤
│  Route Handlers (server/src/routes/api.ts)                  │
│  ┌───────────┐ ┌──────────────┐ ┌────────────────────────┐ │
│  │ GET /api/* │ │ POST /api/*  │ │ PATCH /api/disputes/*  │ │
│  └─────┬─────┘ └──────┬───────┘ └───────────┬────────────┘ │
│        │               │                     │              │
│        ▼               ▼                     ▼              │
├─────────────────────────────────────────────────────────────┤
│  Service Layer (server/src/services/disputeService.ts)      │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ createDispute | getDisputeById | listDisputes        │   │
│  │ transitionStatus | addTransaction | listCustomers    │   │
│  └──────┬───────────────────┬───────────────────┬───────┘   │
│         │                   │                   │           │
│         ▼                   ▼                   ▼           │
│  ┌──────────────┐  ┌───────────────┐  ┌────────────────┐   │
│  │ Prisma Client│  │ Triage Engine │  │ Status Machine │   │
│  └──────────────┘  └───────────────┘  └────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

**Request flow:** Client → Route Handler (validate) → Service (orchestrate) → Prisma/Domain → Service (transform to DTO) → Route Handler (respond)

**Error flow:** Any layer throws `AppError` → Route Handler catches via try/catch → calls `next(error)` → `errorHandler` middleware formats envelope response.

## Components and Interfaces

### AppError Class

Extends the native `Error` with structured fields for the error envelope. Located in `server/src/middleware/errorHandler.ts`.

```typescript
export class AppError extends Error {
  public readonly code: string;
  public readonly status: number;
  public readonly timestamp: string;

  constructor(code: string, message: string, status: number) {
    super(message);
    this.code = code;
    this.status = status;
    this.timestamp = new Date().toISOString();
    this.name = 'AppError';
  }
}
```

### Route Handlers (server/src/routes/api.ts)

Thin handlers that validate input, call the service layer, and return the response. Each handler wraps its body in try/catch and calls `next(error)` on failure.

```typescript
// Pattern for all route handlers
apiRouter.get('/disputes/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);
    const dispute = await disputeService.getDisputeById(id);
    res.json(dispute);
  } catch (error) {
    next(error);
  }
});
```

**Endpoints:**

| Method | Path | Handler Responsibility |
|--------|------|----------------------|
| GET | `/api/customers` | Delegate to `listCustomers()`, return array |
| GET | `/api/disputes` | Parse query filters/sort, delegate to `listDisputes()` |
| GET | `/api/disputes/:id` | Parse ID, delegate to `getDisputeById()` |
| POST | `/api/disputes` | Validate body, delegate to `createDispute()`, return 201 |
| PATCH | `/api/disputes/:id/status` | Validate body, delegate to `transitionStatus()` |
| POST | `/api/disputes/:id/transactions` | Validate body, delegate to `addTransaction()` |

### Dispute Service (server/src/services/disputeService.ts)

Orchestration layer that composes Prisma operations with domain logic.

```typescript
export interface DisputeService {
  listCustomers(): Promise<Customer[]>;
  listDisputes(filters: ListDisputesParams): Promise<DisputeSummary[]>;
  getDisputeById(id: number): Promise<DisputeDetail>;
  createDispute(customerId: number, transactions: CreateTransactionInput[]): Promise<DisputeDetail>;
  transitionStatus(id: number, status: string, resolutionOutcome?: string): Promise<DisputeDetail>;
  addTransaction(id: number, transaction: CreateTransactionInput): Promise<DisputeDetail>;
}
```

**Function behaviors:**

- `listCustomers()` — Queries all customer records from Prisma.
- `listDisputes(filters)` — Queries disputes with optional `where` clause for status/priority, joins customer for `customerName`, applies sort. Priority sort uses custom ordering: `P1=1, P2=2, Standard=3`.
- `getDisputeById(id)` — Fetches dispute with `include: { customer, transactions }`, parses `ruleTrace` from JSON string to object. Throws `AppError('DISPUTE_NOT_FOUND', ..., 404)` if not found.
- `createDispute(customerId, transactions)` — Validates customer exists. Uses Prisma transaction for atomicity: creates dispute record with status `Reported`, nested creates transactions, calculates `totalAmount`, calls triage engine, stores `priority`, `recommendation`, `ruleTrace` (serialized). Returns full detail.
- `transitionStatus(id, status, resolutionOutcome?)` — Fetches dispute, validates via lifecycle guard, updates status (and resolutionOutcome if resolving). Throws appropriate `AppError` on violations.
- `addTransaction(id, transaction)` — Fetches dispute, validates not terminal. Creates transaction, recalculates `totalAmount` from all linked transactions, re-runs triage engine with full transaction list, updates dispute fields. Returns full detail.

### Error Handler Middleware (server/src/middleware/errorHandler.ts)

Already exists. Updated to handle both the `AppError` class and unknown errors:

```typescript
export const errorHandler = (err: Error, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof AppError) {
    console.error(`[${err.code}] ${err.message}`);
    res.status(err.status).json({
      error: {
        code: err.code,
        message: err.message,
        status: err.status,
        timestamp: err.timestamp,
      },
    });
  } else {
    console.error(`[INTERNAL_ERROR] ${err.message}`, err);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred.',
        status: 500,
        timestamp: new Date().toISOString(),
      },
    });
  }
};
```

### Validation Helpers

Input validation happens in route handlers before service delegation. Validation logic is extracted into helper functions for reuse across endpoints.

```typescript
/** Validates a single transaction input object. Throws AppError on first violation. */
function validateTransactionInput(txn: unknown): CreateTransactionInput;

/** Validates the create dispute request body. */
function validateCreateDisputeBody(body: unknown): { customerId: number; transactions: CreateTransactionInput[] };

/** Validates the status transition request body. */
function validateStatusTransitionBody(body: unknown): { status: string; resolutionOutcome?: string };
```

## Data Models

### Prisma Schema (target)

```prisma
model Customer {
  id                Int       @id @default(autoincrement())
  name              String
  contactReference  String
  accountIdentifier String
  createdAt         DateTime  @default(now())
  disputes          Dispute[]
}

model Dispute {
  id                 Int           @id @default(autoincrement())
  customerId         Int
  customer           Customer      @relation(fields: [customerId], references: [id])
  status             String        @default("Reported")
  category           String        @default("Unauthorised/Fraudulent Charge")
  totalAmount        Float         @default(0)
  dateRaised         DateTime      @default(now())
  priority           String?
  recommendation     String?
  ruleTrace          String?       // JSON string — parsed to RuleTrace object in DTO
  resolutionOutcome  String?
  transactions       Transaction[]
  createdAt          DateTime      @default(now())
  updatedAt          DateTime      @updatedAt
}

model Transaction {
  id          Int      @id @default(autoincrement())
  disputeId   Int
  dispute     Dispute  @relation(fields: [disputeId], references: [id])
  amount      Float
  merchant    String
  timestamp   DateTime
  paymentType String
  createdAt   DateTime @default(now())
}
```

### TypeScript Types (server/src/services/disputeService.ts)

```typescript
/** Customer as returned by the API. */
export interface Customer {
  id: number;
  name: string;
  contactReference: string;
  accountIdentifier: string;
  createdAt: string; // ISO 8601
}

/** Nested customer object in dispute detail. */
export interface CustomerNested {
  id: number;
  name: string;
  contactReference: string;
  accountIdentifier: string;
}

/** Transaction as returned by the API. */
export interface TransactionDto {
  id: number;
  amount: number;
  merchant: string;
  timestamp: string; // ISO 8601
  paymentType: string;
  createdAt: string; // ISO 8601
}

/** Input for creating a transaction (from request body). */
export interface CreateTransactionInput {
  amount: number;
  merchant: string;
  timestamp: string; // ISO 8601
  paymentType: 'Card' | 'ApplePay' | 'EFT';
}

/** Rule trace entry from triage engine. */
export interface RuleTraceEntry {
  rule: string;
  condition: string;
  result: boolean;
  detail: string;
}

/** Full rule trace object. */
export interface RuleTrace {
  evaluatedAt: string;
  inputs: {
    youngestTransactionAge: string;
    totalAmount: number;
  };
  rules: RuleTraceEntry[];
  recommendation: string;
  priority: string;
}

/** Dispute summary for list endpoint. */
export interface DisputeSummary {
  id: number;
  customerId: number;
  customerName: string;
  status: string;
  category: string;
  totalAmount: number;
  dateRaised: string;
  priority: string;
  recommendation: string;
  resolutionOutcome: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Full dispute detail for single-resource endpoints. */
export interface DisputeDetail {
  id: number;
  customerId: number;
  customer: CustomerNested;
  status: string;
  category: string;
  totalAmount: number;
  dateRaised: string;
  priority: string;
  recommendation: string;
  ruleTrace: RuleTrace;
  resolutionOutcome: string | null;
  transactions: TransactionDto[];
  createdAt: string;
  updatedAt: string;
}

/** Parameters for listing disputes with filters and sorting. */
export interface ListDisputesParams {
  status?: string[];
  priority?: string[];
  sortBy?: 'dateRaised' | 'totalAmount' | 'priority';
  sortOrder?: 'asc' | 'desc';
}
```

### DTO Transformations

**DB Dispute → DisputeSummary:**
- Join customer to get `customerName`
- Map DateTime fields to ISO strings
- Omit `ruleTrace`, `transactions`, `customer` nested object

**DB Dispute (with relations) → DisputeDetail:**
- Include nested `customer` object (omit `createdAt` from customer)
- Include `transactions` array mapped to `TransactionDto`
- Parse `ruleTrace` from JSON string to `RuleTrace` object: `JSON.parse(dispute.ruleTrace)`
- Map all DateTime fields to ISO strings

### Error Codes

| Code | HTTP Status | Trigger Condition |
|------|-------------|-------------------|
| `VALIDATION_ERROR` | 400 | Invalid input (missing fields, bad types, invalid enums) |
| `INVALID_STATUS_TRANSITION` | 400 | FSM violation (e.g., Reported → Resolved) |
| `MISSING_RESOLUTION_OUTCOME` | 400 | Transitioning to Resolved without outcome |
| `DISPUTE_IN_TERMINAL_STATE` | 400 | Modifying a Resolved or Referred dispute |
| `DISPUTE_NOT_FOUND` | 404 | ID does not exist in database |
| `INTERNAL_ERROR` | 500 | Unexpected/unhandled server error |

### Priority Sort Mapping

For `sortBy=priority`, a custom numeric ordering is applied:

```typescript
const PRIORITY_ORDER: Record<string, number> = {
  P1: 1,
  P2: 2,
  Standard: 3,
};
```

Sorting by priority descending (default) means P1 first (lowest number first in desc logical priority, but highest urgency). The implementation uses `orderBy` with a raw expression or fetches all and sorts in-memory using the mapping.

## Testing Strategy

### Unit Tests (Vitest)

**Service layer tests** (`server/tests/disputeService.test.ts`):
- Mock Prisma client to test orchestration logic in isolation
- Test each service function with valid inputs and expected outputs
- Test error cases: not found, terminal state, invalid transitions
- Test DTO transformation: ruleTrace parsing, customerName denormalization

**Validation tests** (`server/tests/validation.test.ts`):
- Test each validation function with valid and invalid inputs
- Cover boundary cases: zero amounts, empty strings, invalid timestamps, unknown enums

**Route handler integration tests** (`server/tests/api.test.ts`):
- Use supertest to test full request/response cycle
- Test success paths for each endpoint
- Test all error conditions with expected HTTP status and error codes
- Test filter and sort combinations

### Property-Based Tests (Vitest + fast-check)

Property tests validate universal invariants that must hold across all valid inputs. They complement example-based tests by exercising the system with randomized data.

**Key properties to test:**
1. Total amount consistency across create and add-transaction mutations
2. Triage determinism: same inputs always produce same outputs
3. State machine integrity: only valid FSM transitions succeed
4. Terminal state immutability: no modifications after Resolved/Referred
5. Error envelope conformance: all errors match the schema
6. Filter correctness: filtered results only contain matching records
7. Transaction validation: invalid data always rejected

### E2E Tests (Playwright)

- Full dispute lifecycle: create → investigate → resolve
- Dashboard filtering and sorting behavior
- Error state display (creating with invalid data)

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Total Amount Consistency

*For any* dispute, after any mutation (creation or transaction addition), the dispute's `totalAmount` field SHALL equal the arithmetic sum of all linked transaction `amount` values.

**Validates: Requirements 4.1, 6.1**

### Property 2: Triage Determinism (Create Round-Trip)

*For any* valid dispute creation request, creating the dispute and immediately fetching it by ID SHALL return identical values for `priority`, `recommendation`, and `ruleTrace` fields.

**Validates: Requirements 3.1, 3.2, 4.1**

### Property 3: Status Machine Integrity

*For any* dispute in a non-terminal state, the API SHALL accept a status transition if and only if the (currentStatus, targetStatus) pair exists in the valid transitions set: {(Reported, UnderInvestigation), (UnderInvestigation, Escalated), (UnderInvestigation, Resolved), (UnderInvestigation, Referred), (Escalated, Resolved)}.

**Validates: Requirements 5.1, 5.2**

### Property 4: Terminal State Immutability

*For any* dispute in a terminal state (Resolved or Referred), the API SHALL reject both status transition attempts (with `INVALID_STATUS_TRANSITION` or `DISPUTE_IN_TERMINAL_STATE`) and transaction addition attempts (with `DISPUTE_IN_TERMINAL_STATE`).

**Validates: Requirements 5.2, 6.2**

### Property 5: Error Envelope Conformance

*For any* API request that produces an error, the response body SHALL contain an `error` object with fields `code` (string from the valid set), `message` (non-empty string), `status` (integer matching HTTP status code), and `timestamp` (valid ISO 8601 string).

**Validates: Requirements 7.1, 7.2, 7.3, 7.4**

### Property 6: Transaction Validation Rejection

*For any* transaction input where `amount <= 0`, OR `merchant` is empty, OR `timestamp` is not a valid ISO 8601 string, OR `paymentType` is not in {Card, ApplePay, EFT}, the API SHALL reject the request with HTTP 400 and error code `VALIDATION_ERROR`, regardless of whether the transaction is part of a dispute creation or an add-transaction request.

**Validates: Requirements 4.4, 4.5, 4.6, 4.7, 6.3, 6.4, 6.5, 6.6, 9.2**

### Property 7: Filter Correctness

*For any* set of disputes in the database and any combination of `status` and `priority` filter parameters, all disputes returned by the list endpoint SHALL have their `status` contained in the status filter set (if provided) AND their `priority` contained in the priority filter set (if provided).

**Validates: Requirements 2.2, 2.3**

### Property 8: Sort Ordering

*For any* set of disputes and any valid `sortBy` field (`dateRaised`, `totalAmount`, or `priority`) with a specified `sortOrder` (`asc` or `desc`), consecutive elements in the response array SHALL satisfy the ordering constraint for the specified field and direction.

**Validates: Requirements 2.4, 2.5**

### Property 9: Non-Existent Resource Returns 404

*For any* dispute ID that does not exist in the database, GET `/api/disputes/:id`, PATCH `/api/disputes/:id/status`, and POST `/api/disputes/:id/transactions` SHALL all return HTTP 404 with error code `DISPUTE_NOT_FOUND`.

**Validates: Requirements 3.5, 5.5, 6.7**

### Property 10: Resolution Outcome Enforcement

*For any* dispute eligible to transition to `Resolved`, the transition SHALL succeed if and only if a valid `resolutionOutcome` (one of Refunded, Declined, ChargebackInitiated) is provided. Omitting it SHALL produce `MISSING_RESOLUTION_OUTCOME`.

**Validates: Requirements 5.3, 5.4**
