# Implementation Plan: Triage Engine

## Overview

Implement the `evaluateTriage` pure function following the TDD green phase — 8 failing tests already exist in `server/tests/triageEngine.test.ts`. The implementation creates a single TypeScript module with type definitions, constants, and the three-phase evaluation pipeline (compute inputs → evaluate rules → classify priority). Property-based tests then verify universal invariants using `fast-check`.

## Tasks

- [x] 1. Implement the triage engine module
  - [x] 1.1 Create `server/src/services/triageEngine.ts` with types, constants, and `evaluateTriage` function
    - Define and export `TransactionInput`, `TriageResult`, `TriageInputs`, `RuleEntry`, and `Priority` types
    - Export constants `AMOUNT_THRESHOLD = 10000` and `AGE_THRESHOLD_HOURS = 48`
    - Implement Phase 1: compute `totalAmount` (sum of all transaction amounts) and `youngestTransactionAge` (minimum age across transactions relative to `dateRaised`)
    - Implement Phase 2: evaluate R1 (any transaction age < 48h → true) and R2 (totalAmount > 10000 → true)
    - Implement Phase 3: apply 2×2 decision matrix to determine priority and recommendation, construct rule trace array, stamp `evaluatedAt` with current ISO 8601 timestamp
    - Return flat `TriageResult` structure with `priority`, `recommendation`, `evaluatedAt`, `inputs`, and `rules`
    - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.2, 2.3, 3.1, 3.2, 3.3, 4.1, 4.2, 4.3, 5.1, 5.2, 5.3, 5.4, 6.1, 6.2, 6.3, 6.4, 7.1, 7.2_

  - [x] 1.2 Run existing tests to confirm all 8 pass (GREEN phase)
    - Execute `npm run test --workspace=server -- tests/triageEngine.test.ts`
    - All tests in TC-001 through TC-006 plus result structure tests must pass
    - Fix any failures until all 8 tests are green
    - _Requirements: 1.1, 1.2, 3.1, 4.1, 5.1, 5.2, 5.3, 5.4, 6.1, 6.2_

- [x] 2. Checkpoint - Ensure all existing tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 3. Property-based tests for universal invariants
  - [x] 3.1 Write property test for determinism
    - **Property 1: Determinism**
    - Create `server/tests/triageEngine.property.test.ts` using `fast-check` with Vitest
    - Implement generators: `arbitraryISODate()` for random ISO 8601 dates, `arbitraryTransaction(dateRaised)` for random transactions with configurable age
    - Assert that calling `evaluateTriage` twice with identical inputs produces identical `priority`, `recommendation`, `inputs`, and `rules`
    - **Validates: Requirements 1.2, 2.2**

  - [x] 3.2 Write property test for rule trace completeness
    - **Property 2: Rule Trace Completeness**
    - Assert that for any valid inputs, `rules` array contains exactly 2 entries: one with `rule === "R1"` and one with `rule === "R2"`, each with string `condition`, string `detail`, and boolean `result`
    - **Validates: Requirements 6.1, 6.2**

  - [x] 3.3 Write property test for decision matrix exhaustiveness
    - **Property 3: Decision Matrix Exhaustiveness**
    - Assert that for any valid inputs, the combination of R1.result and R2.result maps to exactly one priority/recommendation pair per the decision matrix
    - **Validates: Requirements 5.1, 5.2, 5.3, 5.4**

  - [x] 3.4 Write property test for age monotonicity
    - **Property 4: Age Monotonicity**
    - Assert that if R1 fires for a transaction set, adding a transaction younger than the youngest existing transaction also results in R1 firing
    - **Validates: Requirements 3.1, 3.3**

  - [x] 3.5 Write property test for amount monotonicity
    - **Property 5: Amount Monotonicity**
    - Assert that if R2 fires for a transaction set (total > 10,000), adding a transaction with positive amount also results in R2 firing
    - **Validates: Requirements 4.1, 4.3**

  - [x] 3.6 Write property test for total amount consistency
    - **Property 6: Total Amount Consistency**
    - Assert that `inputs.totalAmount` always equals the arithmetic sum of all `transaction.amount` values
    - **Validates: Requirements 4.3**

- [x] 4. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- The TDD RED phase is already complete — 8 failing tests exist in `server/tests/triageEngine.test.ts`
- Task 1.1 is the GREEN phase: write minimum implementation to make tests pass
- Property tests use `fast-check` (already available or to be installed in server workspace)
- The triage engine is a pure function with zero external dependencies — no mocking required
- `evaluatedAt` is the only non-deterministic field; property tests for determinism should exclude or handle it appropriately
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["1.2"] },
    { "id": 2, "tasks": ["3.1", "3.2", "3.3", "3.4", "3.5", "3.6"] }
  ]
}
```
