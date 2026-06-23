# Implementation Plan: Lifecycle Guard

## Overview

Implement the dispute status transition validation module at `server/src/services/statusTransitions.ts`. The existing unit tests (RED phase) are already written at `server/tests/statusTransitions.test.ts`. This plan follows TDD GREEN phase: implement the minimum code to make all failing tests pass, then add property-based tests for universal correctness guarantees.

## Tasks

- [x] 1. Implement the status transitions module
  - [x] 1.1 Create `server/src/services/statusTransitions.ts` with types, constants, and exported functions
    - Define `DisputeStatus` type union: `'Reported' | 'UnderInvestigation' | 'Escalated' | 'Resolved' | 'Referred'`
    - Define `ResolutionOutcome` type union: `'Refunded' | 'Declined' | 'ChargebackInitiated'`
    - Define `TransitionRequest` interface with `currentStatus`, `targetStatus`, and optional `resolutionOutcome`
    - Define `TransitionResult` interface with `valid`, optional `errorCode`, and optional `errorMessage`
    - Define `VALID_TRANSITIONS` constant as `Record<DisputeStatus, DisputeStatus[]>` with the FSM adjacency list
    - Define `TERMINAL_STATES` constant array containing `'Resolved'` and `'Referred'`
    - Implement `validateStatusTransition(request: TransitionRequest): TransitionResult` with validation order: resolution outcome check first, then FSM lookup
    - Implement `isTerminalState(status: DisputeStatus): boolean`
    - Implement `getValidTransitions(status: DisputeStatus): DisputeStatus[]`
    - Export all three functions and all types
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 2.2, 2.3, 2.4, 3.1, 3.2, 3.3, 4.1, 4.2, 4.3, 5.1, 5.2, 5.3, 5.4_

- [x] 2. Checkpoint — Verify GREEN phase
  - Ensure all tests pass (`npm run test --workspace=server -- tests/statusTransitions.test.ts`), ask the user if questions arise.

- [x] 3. Add property-based tests
  - [x] 3.1 Set up fast-check and create property test file with generators
    - Install `fast-check` as a dev dependency in the server workspace
    - Create `server/tests/statusTransitions.property.test.ts`
    - Implement arbitraries: `arbitraryDisputeStatus`, `arbitraryResolutionOutcome`, `arbitraryTransitionRequest`, `arbitraryValidPair`, `arbitraryInvalidPair`
    - _Requirements: 5.1_

  - [x]* 3.2 Write property test: Reflexivity Forbidden
    - **Property 1: Reflexivity Forbidden**
    - For any DisputeStatus `s`, `validateStatusTransition({ currentStatus: s, targetStatus: s })` returns `valid: false`
    - **Validates: Requirements 2.1**

  - [x]* 3.3 Write property test: No Backward Transitions
    - **Property 2: No Backward Transitions**
    - For any valid forward edge `(A, B)`, the reverse `(B, A)` is always invalid
    - **Validates: Requirements 2.3**

  - [x]* 3.4 Write property test: Terminal Completeness
    - **Property 3: Terminal Completeness**
    - All terminal states reject all transitions; all non-terminal states have at least one valid transition
    - **Validates: Requirements 3.1, 3.2, 3.3**

  - [x]* 3.5 Write property test: Invalid Transition Error Content
    - **Property 4: Invalid Transition Error Content**
    - Any result with `errorCode: 'INVALID_STATUS_TRANSITION'` has an `errorMessage` containing both status values
    - **Validates: Requirements 2.1, 2.2**

  - [x]* 3.6 Write property test: Resolution Outcome Guard
    - **Property 5: Resolution Outcome Guard**
    - For any `currentStatus` with `targetStatus: 'Resolved'` and no `resolutionOutcome`, result is `MISSING_RESOLUTION_OUTCOME`
    - **Validates: Requirements 4.1, 4.2**

  - [x]* 3.7 Write property test: Outcome Does Not Override FSM
    - **Property 6: Outcome Does Not Override FSM**
    - Providing a `resolutionOutcome` cannot make an otherwise-invalid FSM transition valid
    - **Validates: Requirements 4.3**

  - [x]* 3.8 Write property test: Determinism
    - **Property 7: Determinism**
    - Calling `validateStatusTransition` twice with the same input produces identical results
    - **Validates: Requirements 5.1**

- [x] 4. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass (`npm run test --workspace=server`), ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- The existing unit tests define the RED phase — task 1.1 is the GREEN phase implementation
- Property tests use `fast-check` with Vitest (minimum 100 iterations per property)
- Validation order is critical: resolution outcome check fires before FSM lookup
- The module is a single file with zero external dependencies (pure functions only)

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["3.1"] },
    { "id": 2, "tasks": ["3.2", "3.3", "3.4", "3.5", "3.6", "3.7", "3.8"] }
  ]
}
```
