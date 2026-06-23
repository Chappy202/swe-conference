# Design Document: Lifecycle Guard

## Overview

The Lifecycle Guard is a pure-function validation module that enforces dispute status transitions against a static finite state machine (FSM). It lives at `server/src/services/statusTransitions.ts` within the Domain Layer and has zero external dependencies — no database, no network, no side effects.

The module exports three functions:
- `validateStatusTransition(request)` — the primary validation entry point
- `isTerminalState(status)` — checks whether a status is terminal
- `getValidTransitions(status)` — returns allowed next statuses

---

## Components and Interfaces

### Module: `statusTransitions.ts`

A single-file module exporting three pure functions. No classes, no instantiation, no state.

```typescript
// server/src/services/statusTransitions.ts

export function validateStatusTransition(request: TransitionRequest): TransitionResult;
export function isTerminalState(status: DisputeStatus): boolean;
export function getValidTransitions(status: DisputeStatus): DisputeStatus[];
```

### Internal Constants

```typescript
const VALID_TRANSITIONS: Record<DisputeStatus, DisputeStatus[]> = {
  Reported: ['UnderInvestigation'],
  UnderInvestigation: ['Escalated', 'Resolved', 'Referred'],
  Escalated: ['Resolved'],
  Resolved: [],
  Referred: [],
};

const TERMINAL_STATES: DisputeStatus[] = ['Resolved', 'Referred'];
```

### Validation Algorithm

`validateStatusTransition` applies checks in strict order:

1. **Resolution outcome guard** — If `targetStatus` is `'Resolved'` and `resolutionOutcome` is missing → return `{ valid: false, errorCode: 'MISSING_RESOLUTION_OUTCOME', errorMessage: '...' }`
2. **FSM lookup** — Retrieve `VALID_TRANSITIONS[currentStatus]`
3. **Membership check** — If `targetStatus` is in the allowed array → return `{ valid: true }`
4. **Rejection** — Otherwise → return `{ valid: false, errorCode: 'INVALID_STATUS_TRANSITION', errorMessage: '...' }` where the message includes both `currentStatus` and `targetStatus`

This ordering means the resolution outcome check fires before the FSM check. A request for `Reported → Resolved` without an outcome gets `MISSING_RESOLUTION_OUTCOME`, not `INVALID_STATUS_TRANSITION`.

### Helper Functions

```typescript
function isTerminalState(status: DisputeStatus): boolean {
  return TERMINAL_STATES.includes(status);
}

function getValidTransitions(status: DisputeStatus): DisputeStatus[] {
  return VALID_TRANSITIONS[status] ?? [];
}
```

---

## Data Models

### Types

```typescript
type DisputeStatus = 'Reported' | 'UnderInvestigation' | 'Escalated' | 'Resolved' | 'Referred';

type ResolutionOutcome = 'Refunded' | 'Declined' | 'ChargebackInitiated';

interface TransitionRequest {
  currentStatus: DisputeStatus;
  targetStatus: DisputeStatus;
  resolutionOutcome?: ResolutionOutcome;
}

interface TransitionResult {
  valid: boolean;
  errorCode?: string;
  errorMessage?: string;
}
```

### Error Codes

| Code | Meaning |
|------|---------|
| `INVALID_STATUS_TRANSITION` | The `(currentStatus, targetStatus)` pair is not in the FSM adjacency list |
| `MISSING_RESOLUTION_OUTCOME` | `targetStatus` is `Resolved` but `resolutionOutcome` is undefined |

### FSM Graph

```
Reported ──────────────────────► UnderInvestigation
                                  │
                    ┌─────────────┼─────────────┐
                    ▼             ▼             ▼
                Escalated     Resolved      Referred
                    │          (terminal)    (terminal)
                    ▼
                 Resolved
                (terminal)
```

Terminal states (`Resolved`, `Referred`) have empty adjacency lists — no outbound transitions permitted.

---

## Error Handling

The module uses structured error returns, not exceptions:

- **Valid transition** → `{ valid: true }` — no `errorCode` or `errorMessage` fields
- **Missing resolution outcome** → `{ valid: false, errorCode: 'MISSING_RESOLUTION_OUTCOME', errorMessage: 'Resolution outcome is required when transitioning to Resolved' }`
- **Invalid transition** → `{ valid: false, errorCode: 'INVALID_STATUS_TRANSITION', errorMessage: 'Cannot transition from <current> to <target>' }`

The error message for `INVALID_STATUS_TRANSITION` always contains both the `currentStatus` and `targetStatus` values for debuggability.

No exceptions are thrown. The function always returns a well-formed `TransitionResult`.

---

## Testing Strategy

### Unit Tests (Example-Based)

Located at `server/tests/statusTransitions.test.ts`. Cover each explicit acceptance criterion from Requirements 1.1–1.5 with concrete examples:

- Each valid FSM edge (5 pairs) → asserts `valid: true`, no error fields
- Each named invalid scenario (backward, skip, terminal) → asserts correct error code
- Resolution outcome missing/present combinations → asserts correct error code priority

### Property-Based Tests

Located alongside unit tests (or in a dedicated property test file). Use `fast-check` with Vitest. Minimum 100 iterations per property. Properties validate universal invariants that hold across all generated inputs.

**Generator Strategy:**
- `arbitraryDisputeStatus` — uniform choice from the 5 status values
- `arbitraryResolutionOutcome` — uniform choice from the 3 outcome values
- `arbitraryTransitionRequest` — combines status pair with optional outcome
- `arbitraryInvalidPair` — generates pairs NOT in the adjacency list
- `arbitraryValidPair` — generates pairs that ARE in the adjacency list

### Integration Considerations

This module has no external dependencies. It does not need integration tests. The route layer that calls `validateStatusTransition` will have its own integration tests verifying the HTTP contract.

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Reflexivity Forbidden

*For any* DisputeStatus `s`, calling `validateStatusTransition({ currentStatus: s, targetStatus: s })` SHALL return `{ valid: false }` — no status may transition to itself.

**Validates: Requirements 2.1**

### Property 2: No Backward Transitions

*For any* pair of statuses `(A, B)` where `validateStatusTransition({ currentStatus: A, targetStatus: B, ... })` returns `valid: true`, calling `validateStatusTransition({ currentStatus: B, targetStatus: A })` SHALL return `valid: false` — if a forward edge exists, the reverse edge never does.

**Validates: Requirements 2.3**

### Property 3: Terminal Completeness

*For any* terminal status `s` (where `isTerminalState(s)` returns `true`) and *for any* DisputeStatus `t`, calling `validateStatusTransition({ currentStatus: s, targetStatus: t })` SHALL return `{ valid: false, errorCode: 'INVALID_STATUS_TRANSITION' }`. Conversely, *for any* non-terminal status `s`, `getValidTransitions(s)` SHALL return a non-empty array.

**Validates: Requirements 3.1, 3.2, 3.3**

### Property 4: Invalid Transition Error Content

*For any* TransitionRequest that produces `valid: false` with `errorCode: 'INVALID_STATUS_TRANSITION'`, the `errorMessage` field SHALL be defined and SHALL contain both the `currentStatus` and `targetStatus` string values.

**Validates: Requirements 2.1, 2.2**

### Property 5: Resolution Outcome Guard

*For any* DisputeStatus `s` as `currentStatus` and `targetStatus` set to `'Resolved'` with `resolutionOutcome` undefined, calling `validateStatusTransition` SHALL return `{ valid: false, errorCode: 'MISSING_RESOLUTION_OUTCOME' }` with a defined `errorMessage`.

**Validates: Requirements 4.1, 4.2**

### Property 6: Outcome Does Not Override FSM

*For any* `(currentStatus, targetStatus)` pair that is NOT in the FSM adjacency list, and *for any* valid `ResolutionOutcome` value provided, calling `validateStatusTransition` SHALL still return `valid: false` — providing an outcome cannot make an otherwise-invalid transition valid.

**Validates: Requirements 4.3**

### Property 7: Determinism

*For any* TransitionRequest `r`, calling `validateStatusTransition(r)` twice SHALL produce identical `TransitionResult` values (same `valid`, same `errorCode`, same `errorMessage`).

**Validates: Requirements 5.1**
