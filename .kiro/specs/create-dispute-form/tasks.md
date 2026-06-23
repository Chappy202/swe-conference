# Implementation Plan: Create Dispute Form

## Overview

Implement the Create Dispute Form page at `/disputes/new` using TypeScript, React, and Tailwind CSS. The form uses simple controlled components with `useState` (no form library), pure validation functions, and a reusable `TransactionEntryGroup` component. The `useCustomers` hook fetches customer data, and React Router handles navigation. All code follows strict TDD methodology.

## Tasks

- [ ] 1. Core types and validation utilities
  - [ ] 1.1 Create shared type definitions for the dispute form
    - Create `client/src/types/dispute.ts` with all interfaces: `PaymentType`, `Customer`, `TransactionFormState`, `TransactionFieldErrors`, `CreateDisputeFormState`, `CreateDisputePayload`, `CreateDisputeResponse`
    - Include factory functions `createEmptyTransaction()` and `createEmptyErrors()`
    - _Requirements: 3.2, 3.3, 3.4, 3.5, 5.1_

  - [ ] 1.2 Implement pure validation functions
    - Create `client/src/utils/validation.ts` with `validateTransactionField(field, value)` and `validateForm(selectedCustomerId, transactions)`
    - `validateTransactionField` returns error message or null per field
    - `validateForm` returns `{ isValid, customerError, transactionErrors }` object
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8_

  - [ ]* 1.3 Write unit tests for validation functions
    - Create `client/tests/utils/validation.test.ts`
    - Test each field type: valid/invalid amounts, empty/non-empty merchant, empty/filled timestamp, selected/unselected paymentType
    - Test `validateForm` with fully valid, partially invalid, and empty states
    - _Requirements: 4.4, 4.5, 4.6, 4.7_

  - [ ]* 1.4 Write property test for invalid amount validation
    - **Property 6: Invalid amount validation**
    - For any amount value that is empty, zero, negative, or non-numeric, `validateTransactionField('amount', value)` returns "Amount must be greater than zero"
    - Use fast-check to generate edge-case amount strings
    - **Validates: Requirements 4.4**

- [ ] 2. Customer data hook
  - [ ] 2.1 Implement useCustomers hook
    - Create `client/src/hooks/useCustomers.ts`
    - Fetch `GET /api/customers` on mount
    - Return `{ customers, isLoading, error }` matching `UseCustomersReturn` interface
    - Handle loading state, success state, and error state
    - _Requirements: 2.1, 2.4, 2.5_

  - [ ]* 2.2 Write unit tests for useCustomers hook
    - Create `client/tests/hooks/useCustomers.test.ts`
    - Mock global `fetch`; test loading → success and loading → error flows
    - Verify customers array is populated on success
    - Verify error message is set on failure
    - _Requirements: 2.1, 2.4, 2.5_

- [ ] 3. Presentational components
  - [ ] 3.1 Create CustomerSelect component
    - Create `client/src/components/CustomerSelect.tsx`
    - Props: `CustomerSelectProps` from design (customers, isLoading, error, selectedCustomerId, onChange, validationError)
    - Render `<select>` with `data-testid="customer-select"`, placeholder "Select a customer"
    - Display loading state with `data-testid="customer-loading"`
    - Display error alert with `data-testid="customer-error"`
    - Format options as "{name} — {accountIdentifier}"
    - _Requirements: 2.2, 2.3, 2.4, 2.5_

  - [ ] 3.2 Create TransactionEntryGroup component
    - Create `client/src/components/TransactionEntryGroup.tsx`
    - Props: `TransactionEntryGroupProps` from design (index, transaction, onChange, onRemove, showRemove, errors, onBlur)
    - Render amount (`type="number"`, step="0.01"), merchant (`type="text"`), timestamp (`type="datetime-local"`), paymentType (`<select>` with Card/Apple Pay/EFT)
    - Apply `data-testid="transaction-amount-{index}"`, `data-testid="transaction-merchant-{index}"`, `data-testid="transaction-timestamp-{index}"`, `data-testid="transaction-payment-type-{index}"`
    - Show/hide remove button with `data-testid="remove-transaction-{index}"` based on `showRemove` prop
    - Display red border (`border-red-500`) and inline error text (`text-red-600 text-sm`) for invalid fields
    - _Requirements: 3.2, 3.3, 3.4, 3.5, 3.8, 3.9, 4.9_

  - [ ]* 3.3 Write property test for customer dropdown format consistency
    - **Property 1: Customer dropdown format consistency**
    - For any customer object with `name` and `accountIdentifier`, the rendered option text is exactly `"{name} — {accountIdentifier}"`
    - Use fast-check to generate arbitrary name/accountIdentifier strings
    - **Validates: Requirements 2.2**

  - [ ]* 3.4 Write property test for transaction group field completeness
    - **Property 2: Transaction group field completeness**
    - For any index `i` (0 ≤ i < N), the group contains inputs with correct `data-testid` attributes for all four fields
    - Use fast-check to generate valid indices, render component, assert test IDs present
    - **Validates: Requirements 3.2, 3.3, 3.4, 3.5**

- [ ] 4. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 5. CreateDisputePage — form assembly and state management
  - [ ] 5.1 Implement CreateDisputePage with rendering and state management
    - Create `client/src/pages/CreateDispute.tsx`
    - Manage form state with `useState`: `selectedCustomerId`, `transactions`, `validationErrors`, `customerError`, `isSubmitting`, `submitError`
    - Render back link (`data-testid="back-to-dashboard"`), page title "Create New Dispute", CustomerSelect, TransactionEntryList, Add Transaction button (`data-testid="add-transaction-button"`), Submit button (`data-testid="submit-dispute-button"`)
    - Implement `handleAddTransaction` (append empty transaction) and `handleRemoveTransaction` (remove at index, only when length > 1)
    - Implement `handleFieldChange` and `handleBlur` (field-level validation on blur)
    - Submit button disabled logic: no customer OR any field invalid OR isSubmitting
    - _Requirements: 1.2, 1.3, 3.1, 3.6, 3.7, 3.10, 4.1, 4.2, 4.9_

  - [ ] 5.2 Implement form submission, API call, and navigation
    - In `CreateDisputePage`, implement `handleSubmit`:
      - Run full form validation, abort if invalid
      - Set `isSubmitting = true`, disable fields, show spinner with "Submitting..." and `data-testid="submit-loading"`
      - Build `CreateDisputePayload`: `customerId`, `dateRaised` (ISO now), `totalAmount` (sum of amounts), `transactions` (parsed)
      - POST to `/api/disputes`
      - On success: `useNavigate()` to `/disputes/{response.id}`
      - On failure: set `submitError` with message, show alert with `data-testid="submit-error"` and dismiss action
      - Set `isSubmitting = false`
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7_

  - [ ]* 5.3 Write property test for adding transaction grows list
    - **Property 3: Adding a transaction grows the list**
    - For any form state with N ≥ 1 groups, clicking Add Transaction results in N + 1 groups
    - **Validates: Requirements 3.6**

  - [ ]* 5.4 Write property test for transaction count minimum invariant
    - **Property 4: Transaction count minimum invariant**
    - The number of groups is always ≥ 1; remove button hidden when exactly 1, visible when > 1; removing from N > 1 results in N - 1
    - **Validates: Requirements 3.8, 3.9, 3.10**

  - [ ]* 5.5 Write property test for submit enabled iff form valid
    - **Property 5: Submit enabled if and only if form is valid**
    - Submit enabled iff: customer selected AND all fields valid AND not submitting
    - Use fast-check to generate combinations of valid/invalid form states
    - **Validates: Requirements 4.1, 4.2**

  - [ ]* 5.6 Write property test for blur triggers validation feedback
    - **Property 7: Blur triggers validation feedback**
    - For any field with an invalid value, on blur the field displays red border and inline error text
    - **Validates: Requirements 4.9**

  - [ ]* 5.7 Write property test for submission payload shape
    - **Property 8: Submission payload shape correctness**
    - For any valid form state, the POST body contains correct `customerId`, `transactions` array with numeric amounts, string merchants, ISO timestamps, valid paymentTypes, plus `dateRaised` and `totalAmount`
    - **Validates: Requirements 5.1, 5.6**

  - [ ]* 5.8 Write property test for total amount equals sum
    - **Property 9: Total amount equals sum of transactions**
    - For any set of valid transaction amounts [a₁, a₂, ..., aₙ], `totalAmount` equals their sum
    - Use fast-check to generate arrays of positive floats
    - **Validates: Requirements 5.7**

  - [ ]* 5.9 Write property test for success redirect
    - **Property 10: Success redirects to created dispute**
    - For any successful response with `id = N`, the app navigates to `/disputes/N`
    - **Validates: Requirements 5.4**

  - [ ]* 5.10 Write property test for error message propagation
    - **Property 11: Error message propagation**
    - For any error message `msg` from a failed POST response, the form displays "Failed to create dispute: {msg}. Please try again."
    - **Validates: Requirements 5.5**

- [ ] 6. Route integration
  - [ ] 6.1 Wire CreateDisputePage into App.tsx routing
    - Add `<Route path="/disputes/new" element={<CreateDisputePage />} />` to the existing BrowserRouter in `client/src/App.tsx`
    - Import CreateDisputePage from pages directory
    - _Requirements: 1.1_

- [ ] 7. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- Validation functions are pure and testable in isolation — no component rendering needed
- `TransactionEntryGroup` is designed to be reusable (will also be used in dispute-detail-view add transaction modal)
- No new dependencies required — react-router-dom already available from ops-dashboard
- TDD methodology: when executing tasks, write the failing test first, then the minimum implementation

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["1.2", "2.1", "3.1"] },
    { "id": 2, "tasks": ["1.3", "1.4", "2.2", "3.2", "3.3"] },
    { "id": 3, "tasks": ["3.4", "5.1"] },
    { "id": 4, "tasks": ["5.2", "5.3", "5.4", "5.5", "5.6"] },
    { "id": 5, "tasks": ["5.7", "5.8", "5.9", "5.10", "6.1"] }
  ]
}
```
