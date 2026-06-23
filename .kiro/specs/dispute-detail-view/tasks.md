# Implementation Plan: Dispute Detail View

## Overview

Build the `/disputes/:id` detail page following TDD. The page fetches a single dispute from the API and renders it across focused components: customer info, summary, triage recommendation, rule trace, transactions, status actions, and modals for resolution and adding transactions. A utility module handles status transition logic. All components are wired into a page component that manages modal state and delegates data via a custom hook.

## Tasks

- [x] 1. Set up types, utilities, and routing foundation
  - [x] 1.1 Create shared DisputeDetail types
    - Create `client/src/types/dispute.ts` with all interfaces: `Status`, `Priority`, `PaymentType`, `ResolutionOutcome`, `Customer`, `Transaction`, `RuleTraceEntry`, `RuleTrace`, `DisputeDetail`, `StatusTransitionRequest`, `AddTransactionRequest`
    - Export type unions and interfaces matching the design data models
    - _Requirements: 3.1, 7.1, 9.5, 10.6_

  - [x] 1.2 Implement statusTransitions utility with tests
    - Write tests first in `client/tests/utils/statusTransitions.test.ts` for `VALID_TRANSITIONS` map, `isTerminalStatus`, and `getAvailableActions`
    - Implement `client/src/utils/statusTransitions.ts` with `ActionConfig` interface, `VALID_TRANSITIONS` map, `isTerminalStatus()`, and `getAvailableActions()`
    - Verify correct action configs for each of the 5 status values, empty arrays for terminal statuses
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 12.1_

  - [x]* 1.3 Write property tests for statusTransitions
    - **Property 1: Action Button Accuracy** — For any valid status, `getAvailableActions` returns entries matching `VALID_TRANSITIONS[status]` exactly
    - **Property 2: Terminal State Immutability** — For any terminal status, `getAvailableActions` returns an empty array
    - **Validates: Requirements 7.1, 7.2, 7.3, 7.4, 10.1, 10.2**

  - [x] 1.4 Wire routing in App.tsx
    - Install `react-router-dom` if not present, add `BrowserRouter`, define routes: `/` for dashboard, `/disputes/:id` for `DisputeDetailPage`
    - Ensure existing App content renders at `/`
    - _Requirements: 1.1_

- [x] 2. Implement useDisputeDetail hook
  - [x] 2.1 Write tests and implement useDisputeDetail hook
    - Write tests first in `client/tests/hooks/useDisputeDetail.test.ts` covering: loading state on mount, successful fetch populates dispute, 404 response sets notFound, network error sets error string, refetch re-fetches data
    - Implement `client/src/hooks/useDisputeDetail.ts` — calls `GET /api/disputes/:id`, manages `isLoading`, `error`, `notFound`, `dispute`, exposes `refetch()`
    - _Requirements: 1.1, 1.4, 1.5, 1.6_

- [x] 3. Implement display components
  - [x] 3.1 Write tests and implement CustomerInfoCard
    - Write tests in `client/tests/components/CustomerInfoCard.test.tsx` verifying it renders customer name, contact reference, and account identifier within `data-testid="customer-info-card"`
    - Implement `client/src/components/CustomerInfoCard.tsx`
    - _Requirements: 2.1_

  - [x] 3.2 Write tests and implement DisputeSummaryCard
    - Write tests in `client/tests/components/DisputeSummaryCard.test.tsx` verifying: renders status badge, priority badge with correct colour (P1 red, P2 amber, Standard grey), category, total amount as ZAR (R16,500), date formatted as `DD MMM YYYY HH:mm`, all within `data-testid="dispute-summary-card"`
    - Implement `client/src/components/DisputeSummaryCard.tsx` using reusable StatusBadge/PriorityBadge components and formatters
    - _Requirements: 3.1, 3.2, 3.3_

  - [x]* 3.3 Write property test for priority colour mapping
    - **Property 4: Priority Colour Mapping Consistency** — For any priority value, the badge colour and triage border colour match `PRIORITY_COLOURS` mapping
    - **Validates: Requirements 3.2, 4.2**

  - [x] 3.4 Write tests and implement TriageRecommendationCard
    - Write tests in `client/tests/components/TriageRecommendationCard.test.tsx` verifying: renders recommendation text in bold, applies 4px left border coloured by priority (red P1, amber P2, grey Standard), within `data-testid="triage-recommendation"`
    - Implement `client/src/components/TriageRecommendationCard.tsx`
    - _Requirements: 4.1, 4.2_

  - [x] 3.5 Write tests and implement RuleTraceSection
    - Write tests in `client/tests/components/RuleTraceSection.test.tsx` verifying: renders collapsible section with `data-testid="rule-trace-section"`, toggle button with `data-testid="rule-trace-toggle"`, expands/collapses on click, shows evaluation timestamp, inputs, rules with condition/result, and final recommendation
    - Implement `client/src/components/RuleTraceSection.tsx`
    - _Requirements: 5.1, 5.2, 5.3_

  - [x] 3.6 Write tests and implement ResolutionOutcomeDisplay
    - Write tests in `client/tests/components/ResolutionOutcomeDisplay.test.tsx` verifying: renders outcome labelled field with `data-testid="resolution-outcome"` when status is Resolved, not rendered otherwise
    - Implement `client/src/components/ResolutionOutcomeDisplay.tsx`
    - _Requirements: 11.1, 11.2_

  - [x]* 3.7 Write property test for resolution outcome visibility
    - **Property 3: Resolution Outcome Visibility** — For any dispute, the resolution outcome section is present in the DOM iff status is `Resolved`
    - **Validates: Requirements 11.1, 11.2**

- [x] 4. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Implement TransactionsTable and StatusActionButtons
  - [x] 5.1 Write tests and implement TransactionsTable
    - Write tests in `client/tests/components/TransactionsTable.test.tsx` verifying: renders `data-testid="transactions-table"` with columns Amount (ZAR), Merchant, Timestamp (formatted), Payment Type; renders N rows for N transactions; shows "Add Transaction" button with `data-testid="add-transaction-button"` when non-terminal, hides when terminal
    - Implement `client/src/components/TransactionsTable.tsx` (or reuse shared TransactionsTable if it exists, adding the add-transaction button)
    - _Requirements: 6.1, 6.2, 10.1, 10.2_

  - [x]* 5.2 Write property test for transaction table rendering
    - **Property 5: Transaction Table Rendering Fidelity** — For any list of N transactions, the table renders exactly N data rows with ZAR-formatted amounts and correctly formatted timestamps
    - **Validates: Requirements 6.1, 6.2**

  - [x] 5.3 Write tests and implement StatusActionButtons
    - Write tests in `client/tests/components/StatusActionButtons.test.tsx` verifying: renders correct buttons per status (Reported → Begin Investigation; UnderInvestigation → Escalate, Resolve, Refer; Escalated → Resolve; terminal → none), calls onActionComplete for direct transitions, calls onResolveClick for Resolve, shows spinner and disables buttons during loading
    - Implement `client/src/components/StatusActionButtons.tsx` using `getAvailableActions()` utility
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 8.1, 8.2, 8.3, 8.4, 8.5_

- [x] 6. Implement modals
  - [x] 6.1 Write tests and implement ResolutionOutcomeModal
    - Write tests in `client/tests/components/ResolutionOutcomeModal.test.tsx` verifying: renders modal with `data-testid="resolution-modal"` when open, shows overlay, close button, cancel button, confirm button, three radio options (Refunded, Declined, Chargeback Initiated) with correct test IDs, confirm disabled until selection, submits PATCH with `{ status: "Resolved", resolutionOutcome: selected }`, closes on cancel/close/overlay click without API call, shows spinner "Resolving..." during submission, shows inline error on failure
    - Implement `client/src/components/ResolutionOutcomeModal.tsx`
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7, 9.8, 9.9_

  - [x]* 6.2 Write property test for modal dismiss safety
    - **Property 6: Modal Dismiss Safety** — For any dismissal method (Cancel, close button, overlay), the modal closes without making an API request
    - **Validates: Requirements 9.7**

  - [x]* 6.3 Write property test for resolution payload correctness
    - **Property 7: Resolution Payload Correctness** — For any resolution outcome selection, the PATCH payload contains exactly `{ status: "Resolved", resolutionOutcome: selected_value }`
    - **Validates: Requirements 9.5**

  - [x] 6.4 Write tests and implement AddTransactionModal
    - Write tests in `client/tests/components/AddTransactionModal.test.tsx` verifying: renders modal with amount, merchant, timestamp, payment type fields with correct test IDs, cancel and submit buttons, submit disabled until all fields valid (amount > 0, all populated), submits POST with transaction data, closes on success and calls onAdded, shows spinner "Adding..." during submission, shows inline error on failure, closes on cancel
    - Implement `client/src/components/AddTransactionModal.tsx`
    - _Requirements: 10.3, 10.4, 10.5, 10.6, 10.7, 10.8, 10.9, 10.10_

  - [x]* 6.5 Write property test for add transaction validation gate
    - **Property 8: Add Transaction Validation Gate** — For any combination of form values, the submit button is enabled iff amount > 0, merchant non-empty, timestamp non-empty, and payment type selected
    - **Validates: Requirements 10.5**

- [x] 7. Compose DisputeDetailPage
  - [x] 7.1 Write tests and implement DisputeDetailPage
    - Write tests in `client/tests/pages/DisputeDetail.test.tsx` verifying: shows loading skeleton with `data-testid="loading-state"` while fetching, renders back link with `data-testid="back-to-dashboard"`, renders title `<h1>` "Dispute #{id}" with `data-testid="dispute-title"`, shows not-found state with `data-testid="not-found-state"` on 404, shows error state with `data-testid="error-state"` and retry button on failure, renders all child components with correct data, handles modal open/close state, passes refetch to child components for refresh after mutations, shows resolution outcome when status is Resolved
    - Implement `client/src/pages/DisputeDetail.tsx` composing all components, managing modal state, wiring callbacks
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 11.1, 11.2, 12.2, 12.3_

- [x] 8. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- Follow strict TDD: write failing test → implement → refactor
- Reuse existing StatusBadge, PriorityBadge, and formatter utilities from ops-dashboard if available; create them if not
- The `useDisputeDetail` hook is the single source of state for the page — components receive data as props
- Both modals are controlled by state in the page component

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.4"] },
    { "id": 1, "tasks": ["1.2", "2.1"] },
    { "id": 2, "tasks": ["1.3", "3.1", "3.4", "3.5", "3.6"] },
    { "id": 3, "tasks": ["3.2", "3.3", "3.7"] },
    { "id": 4, "tasks": ["5.1", "5.3"] },
    { "id": 5, "tasks": ["5.2", "6.1", "6.4"] },
    { "id": 6, "tasks": ["6.2", "6.3", "6.5"] },
    { "id": 7, "tasks": ["7.1"] }
  ]
}
```
