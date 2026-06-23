# Requirements Document

## Introduction

The Dispute Detail View is a page-level feature at route `/disputes/:id` that displays complete dispute information for an internal ops user. It surfaces customer info, dispute metadata, triage recommendation with rule trace, linked transactions, status lifecycle actions, add-transaction capability, and resolution outcome handling. This view is the primary workspace for an ops user investigating and progressing a dispute case.

## Glossary

- **Detail_Page**: The React page component rendered at route `/disputes/:id` that displays all dispute information and provides lifecycle actions.
- **Ops_User**: An internal banking operations user who triages and manages disputes.
- **Terminal_Status**: A dispute status of `Resolved` or `Referred` from which no further transitions are possible.
- **Non_Terminal_Status**: A dispute status of `Reported`, `UnderInvestigation`, or `Escalated` from which transitions are still available.
- **Status_Transition**: A valid change from one dispute status to another as defined by the lifecycle rules.
- **Resolution_Outcome**: One of `Refunded`, `Declined`, or `Chargeback Initiated`, required when resolving a dispute.
- **Triage_Recommendation**: The priority and recommendation text produced by the rule-based triage engine.
- **Rule_Trace**: A structured record of triage evaluation showing inputs, rules evaluated, results, and final recommendation.
- **Transaction**: A financial transaction linked to a dispute with amount, merchant, timestamp, and payment type.

## Requirements

### Requirement 1: Page Navigation and Layout

**User Story:** As an ops user, I want to navigate to a dispute detail page and see a structured layout, so that I can review all case information in one place.

#### Acceptance Criteria

1. WHEN the Ops_User navigates to `/disputes/:id`, THE Detail_Page SHALL fetch dispute data from `GET /api/disputes/:id` and render the page.
2. THE Detail_Page SHALL display a back link labelled "Back to Dashboard" with `data-testid="back-to-dashboard"` that navigates to `/`.
3. THE Detail_Page SHALL display a page title as an `<h1>` element with text "Dispute #{id}" with `data-testid="dispute-title"`.
4. WHILE the Detail_Page is fetching dispute data, THE Detail_Page SHALL display a loading skeleton state with `data-testid="loading-state"`.
5. IF the API returns HTTP 404 for the requested dispute, THEN THE Detail_Page SHALL display a "Dispute not found." message with a "Back to Dashboard" link, identified by `data-testid="not-found-state"`.
6. IF the API request fails due to a network or server error, THEN THE Detail_Page SHALL display an error alert with text "Failed to load dispute details. Please try again." and a "Retry" button, identified by `data-testid="error-state"`.

### Requirement 2: Customer Information Display

**User Story:** As an ops user, I want to see the customer's details on the dispute page, so that I know who raised the dispute.

#### Acceptance Criteria

1. THE Detail_Page SHALL display a customer info card with `data-testid="customer-info-card"` containing the customer name, contact reference, and account identifier.

### Requirement 3: Dispute Summary Display

**User Story:** As an ops user, I want to see dispute metadata at a glance, so that I can quickly assess the case severity and status.

#### Acceptance Criteria

1. THE Detail_Page SHALL display a dispute summary card with `data-testid="dispute-summary-card"` containing: status badge, priority badge, category, total amount formatted as ZAR (e.g. R16,500), and date raised formatted as `DD MMM YYYY HH:mm`.
2. THE Detail_Page SHALL display priority badges with distinct colours: P1 as red, P2 as amber, Standard as grey.
3. THE Detail_Page SHALL display status badges with distinct colours per status value.

### Requirement 4: Triage Recommendation Display

**User Story:** As an ops user, I want to see the triage recommendation prominently, so that I can quickly understand the system's assessment of the case.

#### Acceptance Criteria

1. THE Detail_Page SHALL display a triage recommendation card with `data-testid="triage-recommendation"` containing the recommendation text in bold.
2. THE Detail_Page SHALL style the triage recommendation card with a 4px solid left border coloured by priority: red for P1, amber for P2, grey for Standard.

### Requirement 5: Rule Trace Display

**User Story:** As an ops user, I want to view the full rule trace, so that I understand why the triage engine made its recommendation.

#### Acceptance Criteria

1. THE Detail_Page SHALL display a collapsible rule trace section with `data-testid="rule-trace-section"` and a toggle element with `data-testid="rule-trace-toggle"`.
2. WHEN the Ops_User toggles the rule trace section, THE Detail_Page SHALL expand or collapse the rule trace detail view.
3. THE Detail_Page SHALL display within the rule trace: evaluation timestamp, computed input values, each rule with its condition and result indicator, and the final recommendation.

### Requirement 6: Transactions Table

**User Story:** As an ops user, I want to see all linked transactions, so that I can review the disputed financial activity.

#### Acceptance Criteria

1. THE Detail_Page SHALL display a transactions table with `data-testid="transactions-table"` with columns: Amount (ZAR formatted), Merchant, Timestamp (formatted as `DD MMM YYYY HH:mm`), and Payment Type.
2. THE Detail_Page SHALL display all transactions linked to the dispute in the transactions table.

### Requirement 7: Status Action Buttons

**User Story:** As an ops user, I want to see available status actions, so that I can progress the dispute through its lifecycle.

#### Acceptance Criteria

1. WHILE the dispute status is `Reported`, THE Detail_Page SHALL display a "Begin Investigation" button with `data-testid="action-investigate"` styled as primary (navy).
2. WHILE the dispute status is `UnderInvestigation`, THE Detail_Page SHALL display: an "Escalate" button with `data-testid="action-escalate"` styled amber, a "Resolve" button with `data-testid="action-resolve"` styled green, and a "Refer" button with `data-testid="action-refer"` styled grey.
3. WHILE the dispute status is `Escalated`, THE Detail_Page SHALL display a "Resolve" button with `data-testid="action-resolve"` styled green.
4. WHILE the dispute is in a Terminal_Status, THE Detail_Page SHALL display no status action buttons.
5. THE Detail_Page SHALL display status action buttons right-aligned in the title row.

### Requirement 8: Status Transition Execution

**User Story:** As an ops user, I want to execute status transitions, so that I can move a dispute through its lifecycle.

#### Acceptance Criteria

1. WHEN the Ops_User clicks "Begin Investigation", THE Detail_Page SHALL send a `PATCH /api/disputes/:id/status` request with `{ status: "UnderInvestigation" }` and refresh the page with the updated status.
2. WHEN the Ops_User clicks "Escalate", THE Detail_Page SHALL send a `PATCH /api/disputes/:id/status` request with `{ status: "Escalated" }` and refresh the page with the updated status.
3. WHEN the Ops_User clicks "Refer", THE Detail_Page SHALL send a `PATCH /api/disputes/:id/status` request with `{ status: "Referred" }` and refresh the page with the updated status, removing all action buttons.
4. WHILE a status transition request is in progress, THE Detail_Page SHALL display a spinner on the clicked button and disable all action buttons, identified by `data-testid="action-loading"`.
5. IF a status transition request fails, THEN THE Detail_Page SHALL display a toast notification with text "Failed to update status: {error}." with dismiss capability, identified by `data-testid="action-error"`.

### Requirement 9: Resolution Outcome Modal

**User Story:** As an ops user, I want to select a resolution outcome when resolving a dispute, so that the case closure is properly categorised.

#### Acceptance Criteria

1. WHEN the Ops_User clicks "Resolve", THE Detail_Page SHALL open a Resolution Outcome Modal with `data-testid="resolution-modal"`.
2. THE Detail_Page SHALL display the modal with a semi-transparent overlay with `data-testid="resolution-modal-overlay"`, a close button with `data-testid="modal-close"`, a cancel button with `data-testid="modal-cancel"`, and a confirm button with `data-testid="modal-confirm"`.
3. THE Detail_Page SHALL display a radio group with three options: "Refunded" with `data-testid="outcome-refunded"`, "Declined" with `data-testid="outcome-declined"`, and "Chargeback Initiated" with `data-testid="outcome-chargeback"`.
4. THE Detail_Page SHALL disable the "Confirm Resolve" button until the Ops_User selects a resolution outcome.
5. WHEN the Ops_User selects a resolution outcome and clicks "Confirm Resolve", THE Detail_Page SHALL send a `PATCH /api/disputes/:id/status` request with `{ status: "Resolved", resolutionOutcome: "<selected>" }` and close the modal.
6. WHEN the resolution transition succeeds, THE Detail_Page SHALL refresh the page displaying the Resolved status and the resolution outcome.
7. WHEN the Ops_User clicks "Cancel", the close button, or the modal overlay, THE Detail_Page SHALL close the modal without making any status change.
8. WHILE the resolution request is submitting, THE Detail_Page SHALL display a spinner on the confirm button with text "Resolving..." and disable radio options and Cancel button.
9. IF the resolution request fails, THEN THE Detail_Page SHALL display an inline error message "Failed to resolve dispute. Please try again." below the radio group and keep the modal open.

### Requirement 10: Add Transaction

**User Story:** As an ops user, I want to add a transaction to an existing dispute, so that newly discovered fraudulent transactions are captured and triage is re-evaluated.

#### Acceptance Criteria

1. WHILE the dispute is in a Non_Terminal_Status, THE Detail_Page SHALL display an "Add Transaction" button with `data-testid="add-transaction-button"` below the transactions table.
2. WHILE the dispute is in a Terminal_Status, THE Detail_Page SHALL hide the "Add Transaction" button.
3. WHEN the Ops_User clicks "Add Transaction", THE Detail_Page SHALL open an Add Transaction modal with fields: amount input with `data-testid="add-txn-amount"`, merchant input with `data-testid="add-txn-merchant"`, timestamp input with `data-testid="add-txn-timestamp"`, and payment type select with `data-testid="add-txn-payment-type"`.
4. THE Detail_Page SHALL display a cancel button with `data-testid="add-txn-cancel"` and an add button with `data-testid="add-txn-submit"` in the Add Transaction modal.
5. THE Detail_Page SHALL disable the "Add Transaction" submit button until all fields contain valid values (amount greater than zero, all fields populated).
6. WHEN the Ops_User fills all fields and clicks "Add Transaction", THE Detail_Page SHALL send a `POST /api/disputes/:id/transactions` request with the transaction data.
7. WHEN the add transaction request succeeds, THE Detail_Page SHALL close the modal, refresh the transactions table, and update the triage recommendation and rule trace with the new values.
8. WHEN the Ops_User clicks "Cancel" in the Add Transaction modal, THE Detail_Page SHALL close the modal without changes.
9. WHILE the add transaction request is submitting, THE Detail_Page SHALL display a spinner on the submit button with text "Adding..." and disable all form fields.
10. IF the add transaction request fails, THEN THE Detail_Page SHALL display an inline alert "Failed to add transaction: {error}." and keep the modal open.

### Requirement 11: Resolution Outcome Display

**User Story:** As an ops user, I want to see the resolution outcome on resolved disputes, so that I can confirm how the case was closed.

#### Acceptance Criteria

1. WHILE the dispute status is `Resolved`, THE Detail_Page SHALL display the resolution outcome as a labelled field with `data-testid="resolution-outcome"`.
2. WHILE the dispute status is not `Resolved`, THE Detail_Page SHALL not display the resolution outcome section.

### Requirement 12: Data Integrity Constraints

**User Story:** As an ops user, I want the system to prevent invalid actions, so that dispute data integrity is maintained.

#### Acceptance Criteria

1. THE Detail_Page SHALL not permit editing or deletion of existing dispute or transaction records.
2. IF the API rejects a status transition with error code `INVALID_STATUS_TRANSITION`, THEN THE Detail_Page SHALL display the error message to the Ops_User via the action error notification.
3. IF the API rejects a resolution with error code `MISSING_RESOLUTION_OUTCOME`, THEN THE Detail_Page SHALL display the error in the Resolution Outcome Modal.
