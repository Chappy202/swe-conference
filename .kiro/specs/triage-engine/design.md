# Design Document

## Overview

The triage engine is a deterministic, pure function that evaluates two business rules against dispute transaction data and produces a priority classification with a transparent rule trace. It sits in the Domain Layer of the 4-tier architecture, has no database access or side effects, and is invoked by the API Surface layer during dispute creation and transaction addition.

The function receives a `dateRaised` timestamp and an array of transactions, evaluates two independent rules (Age Rule R1 and Amount Rule R2), then applies a 2×2 decision matrix to determine priority and recommendation.

## Components and Interfaces

### Component: Triage Engine

**Location:** `server/src/services/triageEngine.ts`

**Responsibility:** Evaluate business rules against dispute data and produce a structured triage result with full transparency.

**Exported API:**

```typescript
import { evaluateTriage, AMOUNT_THRESHOLD, AGE_THRESHOLD_HOURS } from '../services/triageEngine.js';
```

### Function Interface

```typescript
/**
 * Evaluates triage rules against dispute data.
 * Pure function — deterministic for identical inputs (excluding evaluatedAt metadata).
 *
 * @param dateRaised - ISO 8601 timestamp of when the dispute was raised
 * @param transactions - Array of transactions linked to the dispute
 * @returns Structured triage result with priority, recommendation, and rule trace
 */
export function evaluateTriage(
  dateRaised: string,
  transactions: TransactionInput[]
): TriageResult;
```

### Internal Design

The function follows a three-phase pipeline:

```
┌─────────────┐     ┌──────────────────┐     ┌────────────────────┐
│  1. COMPUTE │     │  2. EVALUATE     │     │  3. CLASSIFY       │
│  Inputs     │ ──► │  Rules           │ ──► │  Priority          │
│             │     │                  │     │                    │
│ • totalAmt  │     │ • R1 (age < 48h) │     │ • Decision matrix  │
│ • youngest  │     │ • R2 (amt > 10k) │     │ • Recommendation   │
│   Age       │     │                  │     │ • Rule trace       │
└─────────────┘     └──────────────────┘     └────────────────────┘
```

**Phase 1 — Compute Inputs:**
- Calculate `totalAmount` as the arithmetic sum of all `transaction.amount` values.
- Calculate age for each transaction as `(dateRaised - transaction.timestamp)` in hours.
- Identify `youngestTransactionAge` as the minimum age across all transactions.

**Phase 2 — Evaluate Rules:**
- **R1 (Age Rule):** Fires (`true`) if any single transaction has age strictly less than `AGE_THRESHOLD_HOURS` (48).
- **R2 (Amount Rule):** Fires (`true`) if `totalAmount` is strictly greater than `AMOUNT_THRESHOLD` (10000).

**Phase 3 — Classify:**
- Apply the 2×2 decision matrix to determine priority and recommendation.
- Construct the rule trace array with both rule evaluations.
- Stamp `evaluatedAt` with the current ISO 8601 timestamp.

### Decision Matrix

| R1 (Age < 48h) | R2 (Amount > 10k) | Priority | Recommendation |
|:---:|:---:|:---:|---|
| true | true | P1 | `"Immediate Fraud Freeze + P1 High Priority Escalation"` |
| false | true | P1 | `"P1 High Priority Escalation"` |
| true | false | P2 | `"Immediate Fraud Freeze"` |
| false | false | Standard | `"Standard Investigation"` |

### Constants

```typescript
/** Monetary threshold in ZAR. R2 fires when total strictly exceeds this. */
export const AMOUNT_THRESHOLD = 10000;

/** Age threshold in hours. R1 fires when any transaction is strictly younger than this. */
export const AGE_THRESHOLD_HOURS = 48;
```

### Dependencies

None. The triage engine is a leaf module with zero imports beyond its own type definitions. This is by design — it guarantees testability and determinism.

## Data Models

### Input Types

```typescript
/** A single transaction submitted for triage evaluation. */
export interface TransactionInput {
  /** Unique transaction identifier. */
  id: number;
  /** Transaction amount in ZAR. */
  amount: number;
  /** Merchant name where the transaction occurred. */
  merchant: string;
  /** ISO 8601 timestamp of when the transaction took place. */
  timestamp: string;
  /** Payment method used for the transaction. */
  paymentType: string;
}
```

### Output Types

```typescript
/** Priority levels assigned by the triage engine. */
export type Priority = 'P1' | 'P2' | 'Standard';

/** The complete result of a triage evaluation. Flat structure (not nested). */
export interface TriageResult {
  /** Assigned priority level based on rule evaluation. */
  priority: Priority;
  /** Human-readable recommendation for the ops user. */
  recommendation: string;
  /** ISO 8601 timestamp of when this evaluation was performed. */
  evaluatedAt: string;
  /** Computed input values used during evaluation. */
  inputs: TriageInputs;
  /** Ordered rule evaluation trace (always exactly 2 entries). */
  rules: RuleEntry[];
}

/** Computed inputs recorded for transparency. */
export interface TriageInputs {
  /** Age of the youngest transaction relative to dateRaised (e.g., "22 hours"). */
  youngestTransactionAge: string;
  /** Sum of all transaction amounts in ZAR. */
  totalAmount: number;
}

/** A single rule evaluation entry in the trace. */
export interface RuleEntry {
  /** Rule identifier: "R1" or "R2". */
  rule: string;
  /** Human-readable condition description (references threshold). */
  condition: string;
  /** Whether this rule fired (true) or not (false). */
  result: boolean;
  /** Human-readable detail showing the specific evaluated values. */
  detail: string;
}
```

### Key Constraints

- `TriageResult.rules` always contains exactly 2 entries — one for R1, one for R2.
- `inputs.totalAmount` is always the arithmetic sum of all `transaction.amount` values.
- `inputs.youngestTransactionAge` is derived from the minimum `(dateRaised - tx.timestamp)` value.
- `evaluatedAt` is the only non-deterministic field — it captures `Date.now()` at invocation time.
- Age comparison uses strict less-than (`<`) for the 48-hour threshold.
- Amount comparison uses strict greater-than (`>`) for the 10,000 threshold.

## Error Handling

The triage engine is a pure function operating on pre-validated data. Error handling is minimal by design:

1. **Invalid date strings:** If `dateRaised` or `transaction.timestamp` cannot be parsed as valid dates, the resulting `NaN` propagates through calculations. The API layer is responsible for validating ISO 8601 format before calling the engine.

2. **Empty transactions array:** The function should handle this gracefully. With no transactions, `totalAmount` is 0 (R2 does not fire), and there is no youngest transaction age. The implementation should report a sensible default (e.g., no qualifying transactions).

3. **Negative amounts:** The engine sums amounts as-is. Business validation (e.g., amounts must be positive) is the responsibility of the API layer.

4. **Boundary:** The triage engine trusts its inputs. All validation (type checking, format validation, business constraints) occurs in the Application/API Surface layer before the engine is invoked.

## Testing Strategy

### Existing Test Coverage

The file `server/tests/triageEngine.test.ts` already contains 8 example-based tests covering:
- TC-001: Both rules fire (P1, combined recommendation)
- TC-002: Only amount rule fires (P1, escalation only)
- TC-003: Only age rule fires (P2, fraud freeze only)
- TC-004: Neither rule fires (Standard)
- TC-005: Age calculation uses dateRaised, not current time
- TC-006: Any single transaction qualifies for age rule
- Result structure: evaluatedAt format and rule entry fields

### Property-Based Testing

Property-based tests will supplement the existing example tests by verifying universal invariants across thousands of random inputs. These tests use `fast-check` with Vitest.

**Test file:** `server/tests/triageEngine.property.test.ts`

**Generators needed:**
- `arbitraryISODate()` — Random ISO 8601 date strings within a reasonable range
- `arbitraryTransaction(dateRaised)` — Random transactions with configurable age relative to dateRaised
- `arbitraryTransactions(dateRaised, opts)` — Array of transactions with control over age/amount distribution

**Configuration:**
- Minimum 100 iterations per property (fast-check default)
- Properties tagged with feature and property number for traceability

### Unit Testing Balance

- **Example-based tests** (existing): Cover the 4 matrix cells, boundary conditions, and structural assertions
- **Property-based tests** (new): Cover universal invariants — determinism, completeness, monotonicity, and matrix correctness across all possible inputs
- Avoid duplicating what example tests already cover; property tests focus on invariants that hold universally

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Determinism

*For any* valid `dateRaised` string and `transactions` array, calling `evaluateTriage` twice with identical arguments SHALL produce identical `priority`, `recommendation`, `inputs`, and `rules` fields.

**Validates: Requirements 1.2, 2.2**

### Property 2: Rule Trace Completeness

*For any* valid inputs to `evaluateTriage`, the returned `rules` array SHALL contain exactly 2 entries: one with `rule === "R1"` and one with `rule === "R2"`, each having string-typed `condition` and `detail` fields, and a boolean-typed `result` field.

**Validates: Requirements 6.1, 6.2**

### Property 3: Decision Matrix Exhaustiveness

*For any* valid inputs, the combination of `R1.result` and `R2.result` SHALL map to exactly one priority/recommendation pair according to the decision matrix:
- `(true, true)` → `P1` / `"Immediate Fraud Freeze + P1 High Priority Escalation"`
- `(false, true)` → `P1` / `"P1 High Priority Escalation"`
- `(true, false)` → `P2` / `"Immediate Fraud Freeze"`
- `(false, false)` → `Standard` / `"Standard Investigation"`

**Validates: Requirements 5.1, 5.2, 5.3, 5.4**

### Property 4: Age Monotonicity

*For any* transaction set where R1 fires (at least one transaction < 48h), adding an additional transaction that is younger than the youngest existing transaction SHALL also result in R1 firing.

**Validates: Requirements 3.1, 3.3**

### Property 5: Amount Monotonicity

*For any* transaction set where R2 fires (total > 10,000), adding a transaction with a positive amount SHALL also result in R2 firing.

**Validates: Requirements 4.1, 4.3**

### Property 6: Total Amount Consistency

*For any* set of transactions, `inputs.totalAmount` in the result SHALL equal the arithmetic sum of all `transaction.amount` values in the input array.

**Validates: Requirements 4.3**
