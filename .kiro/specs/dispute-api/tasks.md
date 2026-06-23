# Implementation Plan: Dispute API

## Overview

Implement the REST API layer for the Dispute Triage System. This includes the `AppError` class, a service orchestration layer (`disputeService`), validation helpers, and six route handlers following the thin-controller pattern. The implementation uses strict TDD (red-green-refactor) and builds incrementally from error infrastructure → service layer → route handlers → integration wiring.

## Tasks

- [x] 1. Error handling infrastructure
  - [x] 1.1 Implement AppError class and update errorHandler middleware
    - Replace the existing `AppError` interface with a proper class extending `Error` in `server/src/middleware/errorHandler.ts`
    - Add `code`, `status`, and `timestamp` fields to the class
    - Update the `errorHandler` middleware to use `instanceof AppError` for structured errors and fall back to `INTERNAL_ERROR` for unknown errors
    - Log all errors to console with error code and message before responding
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 10.2, 10.3_

- [x] 2. Service layer — read operations
  - [x] 2.1 Implement `listCustomers` service function
    - Create `server/src/services/disputeService.ts` with TypeScript interfaces (Customer, DisputeSummary, DisputeDetail, ListDisputesParams, CreateTransactionInput, etc.)
    - Implement `listCustomers()` that queries all customer records from Prisma
    - Write unit tests in `server/tests/disputeService.test.ts` with mocked Prisma client
    - _Requirements: 1.1, 1.2, 8.6_

  - [x] 2.2 Implement `getDisputeById` service function
    - Fetch dispute with `include: { customer, transactions }`
    - Parse `ruleTrace` from JSON string to object
    - Throw `AppError('DISPUTE_NOT_FOUND', ..., 404)` if not found
    - Return full `DisputeDetail` DTO with nested customer, transactions, and parsed ruleTrace
    - Write unit tests covering found and not-found cases
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 8.2_

  - [x] 2.3 Implement `listDisputes` service function
    - Accept optional filter (status[], priority[]) and sort (sortBy, sortOrder) parameters
    - Join customer for denormalized `customerName`
    - Apply priority sort mapping (P1=1, P2=2, Standard=3) for custom ordering
    - Default sort: priority descending then dateRaised descending
    - Write unit tests covering filters, sort, and defaults
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 8.3_

- [x] 3. Service layer — write operations
  - [x] 3.1 Implement `createDispute` service function
    - Validate customer exists (throw AppError if not)
    - Use Prisma transaction for atomicity: create dispute with status `Reported`, nested create transactions, calculate `totalAmount`
    - Call triage engine (`evaluateTriage`) with dispute data and store `priority`, `recommendation`, `ruleTrace` (serialized JSON)
    - Return full `DisputeDetail`
    - Write unit tests with mocked Prisma and triage engine
    - _Requirements: 4.1, 4.8, 8.1, 8.7_

  - [x] 3.2 Implement `transitionStatus` service function
    - Fetch dispute, validate transition via lifecycle guard (`validateStatusTransition`)
    - Throw `AppError('DISPUTE_NOT_FOUND', ..., 404)` if dispute not found
    - Throw `AppError('INVALID_STATUS_TRANSITION', ..., 400)` if FSM violation
    - Throw `AppError('MISSING_RESOLUTION_OUTCOME', ..., 400)` if resolving without outcome
    - Update status and resolutionOutcome, return updated `DisputeDetail`
    - Write unit tests for valid transitions, invalid transitions, missing outcome, and not found
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 8.4, 8.7_

  - [x] 3.3 Implement `addTransaction` service function
    - Fetch dispute, validate not in terminal state (Resolved/Referred)
    - Throw `AppError('DISPUTE_IN_TERMINAL_STATE', ..., 400)` if terminal
    - Throw `AppError('DISPUTE_NOT_FOUND', ..., 404)` if not found
    - Create transaction, recalculate `totalAmount` from all linked transactions
    - Re-run triage engine with full transaction list, update dispute fields
    - Return full `DisputeDetail`
    - Write unit tests covering success, terminal state rejection, and not found
    - _Requirements: 6.1, 6.2, 6.7, 8.5, 8.7_

- [x] 4. Checkpoint — Service layer validation
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Validation helpers and route handlers
  - [x] 5.1 Implement validation helper functions
    - Create `validateTransactionInput(txn)` — validates amount > 0, non-empty merchant, valid ISO 8601 timestamp, paymentType in [Card, ApplePay, EFT]
    - Create `validateCreateDisputeBody(body)` — validates customerId present and is number, transactions is non-empty array, each transaction valid
    - Create `validateStatusTransitionBody(body)` — validates status is present and recognized
    - Each validator throws `AppError('VALIDATION_ERROR', ..., 400)` with descriptive message on failure
    - Place in `server/src/routes/api.ts` or extract to a validation module
    - _Requirements: 9.1, 9.2, 9.3, 9.4_

  - [x] 5.2 Implement GET `/api/customers` route handler
    - Delegate to `disputeService.listCustomers()`, return JSON array
    - Wrap in try/catch, call `next(error)` on failure
    - _Requirements: 1.1, 1.2, 10.1_

  - [x] 5.3 Implement GET `/api/disputes` route handler
    - Parse `status`, `priority` query params as comma-separated lists
    - Parse `sortBy` and `sortOrder` query params
    - Delegate to `disputeService.listDisputes(filters)`, return JSON array
    - Wrap in try/catch, call `next(error)` on failure
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 10.1_

  - [x] 5.4 Implement GET `/api/disputes/:id` route handler
    - Parse ID from params, delegate to `disputeService.getDisputeById(id)`
    - Return JSON response, wrap in try/catch
    - _Requirements: 3.1, 3.5, 10.1_

  - [x] 5.5 Implement POST `/api/disputes` route handler
    - Validate body with `validateCreateDisputeBody`, delegate to `disputeService.createDispute()`
    - Return HTTP 201 with full dispute detail
    - Wrap in try/catch, call `next(error)` on failure
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 9.1, 10.1_

  - [x] 5.6 Implement PATCH `/api/disputes/:id/status` route handler
    - Validate body with `validateStatusTransitionBody`, delegate to `disputeService.transitionStatus()`
    - Return HTTP 200 with updated dispute detail
    - Wrap in try/catch, call `next(error)` on failure
    - _Requirements: 5.1, 5.2, 5.3, 5.6, 9.3, 10.1_

  - [x] 5.7 Implement POST `/api/disputes/:id/transactions` route handler
    - Validate body with `validateTransactionInput`, delegate to `disputeService.addTransaction()`
    - Return HTTP 200 with updated dispute detail
    - Wrap in try/catch, call `next(error)` on failure
    - _Requirements: 6.1, 6.3, 6.4, 6.5, 6.6, 9.2, 10.1_

- [x] 6. Checkpoint — Route handlers validation
  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Integration tests
  - [x] 7.1 Expand integration tests in `server/tests/api.test.ts`
    - Verify existing test structure, add missing coverage for:
    - GET `/api/customers` — success with customers, empty database
    - GET `/api/disputes` — filter by status, filter by priority, sort by dateRaised, sort by totalAmount, sort by priority, default sort order
    - POST `/api/disputes` — missing customerId, invalid transaction amount, empty merchant, invalid timestamp, invalid paymentType
    - PATCH `/api/disputes/:id/status` — all valid transitions, invalid transition (e.g., Reported → Resolved), missing status field, resolving without resolutionOutcome, non-existent dispute
    - POST `/api/disputes/:id/transactions` — non-existent dispute, invalid transaction fields
    - Use supertest against the Express app
    - _Requirements: 1.1, 1.2, 2.2, 2.3, 2.4, 2.5, 3.5, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 5.2, 5.3, 5.5, 5.6, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7_

  - [x]* 7.2 Write property test: Total Amount Consistency
    - **Property 1: Total Amount Consistency**
    - Generate random valid transaction arrays, create disputes, verify `totalAmount` equals sum of transaction amounts after creation and after adding transactions
    - Use fast-check for property generation
    - **Validates: Requirements 4.1, 6.1**

  - [x]* 7.3 Write property test: Status Machine Integrity
    - **Property 3: Status Machine Integrity**
    - Generate random (currentStatus, targetStatus) pairs, verify the API accepts transitions if and only if they are in the valid set: {(Reported, UnderInvestigation), (UnderInvestigation, Escalated), (UnderInvestigation, Resolved), (UnderInvestigation, Referred), (Escalated, Resolved)}
    - **Validates: Requirements 5.1, 5.2**

  - [x]* 7.4 Write property test: Terminal State Immutability
    - **Property 4: Terminal State Immutability**
    - For disputes in Resolved or Referred state, verify both status transitions and transaction additions are rejected with appropriate error codes
    - **Validates: Requirements 5.2, 6.2**

  - [x]* 7.5 Write property test: Error Envelope Conformance
    - **Property 5: Error Envelope Conformance**
    - Generate various invalid requests (bad IDs, invalid bodies, FSM violations), verify all error responses contain `error.code` (string from valid set), `error.message` (non-empty), `error.status` (matches HTTP status), `error.timestamp` (valid ISO 8601)
    - **Validates: Requirements 7.1, 7.2, 7.3, 7.4**

  - [x]* 7.6 Write property test: Transaction Validation Rejection
    - **Property 6: Transaction Validation Rejection**
    - Generate transaction inputs with amount ≤ 0, empty merchant, invalid timestamp, or invalid paymentType — verify all are rejected with HTTP 400 and `VALIDATION_ERROR` code regardless of endpoint (create dispute or add transaction)
    - **Validates: Requirements 4.4, 4.5, 4.6, 4.7, 6.3, 6.4, 6.5, 6.6, 9.2**

  - [x]* 7.7 Write property test: Filter Correctness
    - **Property 7: Filter Correctness**
    - Seed multiple disputes with various statuses and priorities, apply random filter combinations, verify all returned results match the filter criteria
    - **Validates: Requirements 2.2, 2.3**

- [x] 8. Final checkpoint — Full integration validation
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- The service layer depends on `evaluateTriage` (from triage-engine spec) and `validateStatusTransition` (from lifecycle-guard spec) — import these from their respective modules
- Prisma client is mocked in service unit tests; integration tests use the real SQLite database
- The existing `server/tests/api.test.ts` already has substantial test coverage — task 7.1 expands it to cover gaps

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["2.1"] },
    { "id": 2, "tasks": ["2.2", "2.3"] },
    { "id": 3, "tasks": ["3.1", "3.2", "3.3"] },
    { "id": 4, "tasks": ["5.1"] },
    { "id": 5, "tasks": ["5.2", "5.3", "5.4", "5.5", "5.6", "5.7"] },
    { "id": 6, "tasks": ["7.1"] },
    { "id": 7, "tasks": ["7.2", "7.3", "7.4", "7.5", "7.6", "7.7"] }
  ]
}
```
