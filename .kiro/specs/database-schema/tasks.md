# Implementation Plan: Database Schema

## Overview

Replace the placeholder User model in the Prisma schema with domain entities (Customer, Dispute, Transaction), then implement a comprehensive seed script using TDD. The seed script populates development data exercising all four triage rule combinations. TypeScript is the implementation language throughout.

## Tasks

- [x] 1. Set up Prisma schema with domain models
  - [x] 1.1 Replace User model with Customer, Dispute, and Transaction models
    - Remove the existing `User` model from `server/prisma/schema.prisma`
    - Define the `Customer` model with fields: `id` (Int, autoincrement PK), `name` (String), `contactReference` (String), `accountIdentifier` (String), `createdAt` (DateTime, default now), and a one-to-many relation to Dispute
    - Define the `Dispute` model with fields: `id` (Int, autoincrement PK), `customerId` (Int, FK to Customer), `status` (String), `category` (String), `totalAmount` (Float), `dateRaised` (DateTime), `priority` (String), `recommendation` (String), `ruleTrace` (String), `resolutionOutcome` (String, nullable), `createdAt` (DateTime, default now), `updatedAt` (DateTime, @updatedAt), and a one-to-many relation to Transaction
    - Define the `Transaction` model with fields: `id` (Int, autoincrement PK), `disputeId` (Int, FK to Dispute), `amount` (Float), `merchant` (String), `timestamp` (DateTime), `paymentType` (String), `createdAt` (DateTime, default now)
    - Keep the existing generator and datasource configuration unchanged
    - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.2, 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8, 4.9, 4.10, 4.11, 4.12, 4.13, 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7_

  - [x] 1.2 Add prisma.seed configuration to server/package.json
    - Add a `"prisma"` key with `"seed": "tsx prisma/seed.ts"` to `server/package.json`
    - This enables `npx prisma db seed` from the server directory
    - _Requirements: Design — Package Configuration_

- [x] 2. Run database migration and generate Prisma client
  - [x] 2.1 Apply migration and generate typed Prisma client
    - Run `npm run db:migrate --workspace=server` to create and apply the migration (removing User, adding Customer/Dispute/Transaction)
    - Run `npm run db:generate --workspace=server` to regenerate the typed Prisma client
    - Verify the generated types include `Customer`, `Dispute`, and `Transaction` models
    - _Requirements: 2.2_

- [x] 3. Checkpoint - Verify schema migration
  - Ensure migration applied cleanly and Prisma client generates without errors, ask the user if questions arise.

- [x] 4. Implement seed script with TDD
  - [x] 4.1 Write failing tests for seed data correctness (RED phase)
    - Create `server/tests/seed.test.ts`
    - Write tests using Vitest and Prisma Client that:
      - Verify 3-5 Customer records are created with South African names
      - Verify each dispute's `totalAmount` equals the sum of its transaction amounts
      - Verify all disputes have `category` set to "Unauthorised/Fraudulent Charge"
      - Verify each dispute's `ruleTrace` is valid JSON with required keys (`evaluatedAt`, `inputs`, `rules`, `recommendation`, `priority`)
      - Verify the dataset covers all 4 triage rule combinations (P1 both, P1 amount-only, P2 age-only, Standard neither)
      - Verify disputes with status "Resolved" have a non-null `resolutionOutcome`
      - Verify timestamps are relative (not hardcoded absolute dates)
      - Verify at least one dispute has multiple transactions (anchor story)
    - Run tests to confirm they fail (no seed data yet)
    - _Requirements: 6.1, 6.2, 6.3, 7.1, 7.2, 7.3, 7.4, 7.5, 8.1, 8.2, 8.3, 9.1, 9.2, 9.3, 9.4, 9.5_

  - [x] 4.2 Implement seed script to pass tests (GREEN phase)
    - Create `server/prisma/seed.ts`
    - Implement idempotent cleanup: delete Transactions → Disputes → Customers (respecting FK order)
    - Create 3-5 Customer records with South African names, realistic contactReference and accountIdentifier values
    - Create Case A dispute: transaction < 48h + total > R10,000 → P1, recommendation "Immediate Fraud Freeze + P1 High Priority Escalation"
    - Create Case B dispute: transaction >= 48h + total > R10,000 → P1, recommendation "P1 High Priority Escalation"
    - Create Case C dispute: transaction < 48h + total <= R10,000 → P2, recommendation "Immediate Fraud Freeze"
    - Create Case D dispute: transaction >= 48h + total <= R10,000 → Standard, recommendation "Standard Investigation"
    - Create Case E dispute: multi-transaction anchor story
    - Use relative timestamps (`Date.now() - offset`) for all date fields
    - Include varied statuses (at least Reported, UnderInvestigation, Resolved) across disputes
    - Set `resolutionOutcome` on any dispute with status "Resolved"
    - Populate `ruleTrace` as valid JSON matching the `RuleTrace` interface for each dispute
    - Ensure `totalAmount` equals sum of linked transaction amounts for each dispute
    - Set `category` to "Unauthorised/Fraudulent Charge" for all disputes
    - Run tests to confirm they pass
    - _Requirements: 6.1, 6.2, 6.3, 7.1, 7.2, 7.3, 7.4, 7.5, 8.1, 8.2, 8.3, 9.1, 9.2, 9.3, 9.4, 9.5_

  - [ ]* 4.3 Write property test for Total Amount Integrity
    - **Property 1: Total Amount Integrity**
    - For every seeded dispute, assert `totalAmount === sum(transactions.amount)`
    - **Validates: Requirements 9.1**

  - [ ]* 4.4 Write property test for Category Consistency
    - **Property 2: Category Consistency**
    - For every seeded dispute, assert `category === "Unauthorised/Fraudulent Charge"`
    - **Validates: Requirements 9.2**

  - [ ]* 4.5 Write property test for Rule Trace Validity
    - **Property 3: Rule Trace Validity**
    - For every seeded dispute, assert `JSON.parse(ruleTrace)` succeeds and the result contains keys: `evaluatedAt`, `inputs`, `rules`, `recommendation`, `priority`
    - **Validates: Requirements 9.3**

  - [ ]* 4.6 Write property test for Priority-Recommendation Alignment
    - **Property 4: Priority-Recommendation Alignment**
    - For every seeded dispute, assert the `recommendation` matches the expected text from the triage matrix given the dispute's `priority` and rule trace
    - **Validates: Requirements 9.4, 7.1, 7.2, 7.3, 7.4**

  - [ ]* 4.7 Write property test for Resolution Outcome Completeness
    - **Property 5: Resolution Outcome Completeness**
    - For every seeded dispute where `status === "Resolved"`, assert `resolutionOutcome` is one of: "Refunded", "Declined", "ChargebackInitiated"
    - **Validates: Requirements 8.3**

  - [ ]* 4.8 Write property test for Triage Rule Coverage
    - **Property 6: Triage Rule Coverage**
    - Assert the seeded dataset contains at least one dispute for each of the four triage combinations, verified by checking transaction timestamps relative to `dateRaised` and total amounts against R10,000
    - **Validates: Requirements 7.1, 7.2, 7.3, 7.4**

- [x] 5. Final checkpoint - Ensure all tests pass
  - Run `npm run test --workspace=server` to verify all seed tests pass
  - Run `npx tsc --noEmit --project server/tsconfig.json` to verify type safety
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- The TDD approach (RED → GREEN → REFACTOR) is followed: tests are written before implementation
- The seed script uses `tsx` for execution (already a dev dependency)
- All timestamps use relative offsets from `Date.now()` to keep data fresh across runs

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2"] },
    { "id": 1, "tasks": ["2.1"] },
    { "id": 2, "tasks": ["4.1"] },
    { "id": 3, "tasks": ["4.2"] },
    { "id": 4, "tasks": ["4.3", "4.4", "4.5", "4.6", "4.7", "4.8"] }
  ]
}
```
