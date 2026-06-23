# Requirements Document

## Introduction

The Create Dispute Form provides an internal ops interface at route `/disputes/new` where users can raise a new dispute. The form allows selecting a pre-seeded customer, adding one or more transaction entries with validation, and submitting to create a dispute with automatic triage evaluation. On success the user is redirected to the newly created dispute's detail page.

## Glossary

- **Create_Dispute_Form**: The page-level React component rendered at `/disputes/new` that collects customer and transaction data for dispute creation.
- **Customer_Dropdown**: A `<select>` element populated from the GET /api/customers endpoint, displaying customers in "{name} — {accountIdentifier}" format.
- **Transaction_Entry_Group**: A repeatable fieldset containing amount, merchant, timestamp, and payment type inputs for a single transaction.
- **Submit_Button**: The primary action button that triggers form submission via POST /api/disputes.
- **Add_Transaction_Button**: A secondary button that appends a new empty Transaction_Entry_Group to the form.
- **Remove_Button**: A button within each Transaction_Entry_Group that removes that group from the form.
- **Ops_User**: An internal banking operations user who creates and manages disputes.

## Requirements

### Requirement 1: Navigation to Create Dispute Form

**User Story:** As an ops user, I want to navigate to the Create Dispute page from the dashboard, so that I can raise a new dispute.

#### Acceptance Criteria

1. WHEN the Ops_User clicks the "New Dispute" link on the dashboard, THE Create_Dispute_Form SHALL navigate to the `/disputes/new` route.
2. THE Create_Dispute_Form SHALL display a back link with text "← Back to Dashboard" that navigates to `/` with `data-testid="back-to-dashboard"`.
3. THE Create_Dispute_Form SHALL display a page title "Create New Dispute" as an `<h1>` element.

### Requirement 2: Customer Selection

**User Story:** As an ops user, I want to select a customer from a dropdown of pre-seeded customers, so that I can associate the dispute with the correct account holder.

#### Acceptance Criteria

1. WHEN the Create_Dispute_Form mounts, THE Customer_Dropdown SHALL fetch the customer list from GET /api/customers.
2. THE Customer_Dropdown SHALL display each customer option in the format "{name} — {accountIdentifier}" with `data-testid="customer-select"`.
3. THE Customer_Dropdown SHALL display "Select a customer" as the default placeholder option.
4. WHILE the customer list is loading, THE Customer_Dropdown SHALL display "Loading customers..." as a disabled option and show a loading indicator with `data-testid="customer-loading"`.
5. IF the GET /api/customers request fails, THEN THE Create_Dispute_Form SHALL display an inline alert with text "Failed to load customers. Please refresh the page." with `data-testid="customer-error"`.

### Requirement 3: Transaction Entry Management

**User Story:** As an ops user, I want to add one or more transactions to a dispute, so that I can capture all fraudulent charges from a single event.

#### Acceptance Criteria

1. WHEN the Create_Dispute_Form loads, THE Create_Dispute_Form SHALL render one empty Transaction_Entry_Group.
2. THE Transaction_Entry_Group SHALL contain an amount input (`type="number"`, step="0.01") with `data-testid="transaction-amount-{index}"`.
3. THE Transaction_Entry_Group SHALL contain a merchant input (`type="text"`) with `data-testid="transaction-merchant-{index}"`.
4. THE Transaction_Entry_Group SHALL contain a timestamp input (`type="datetime-local"`) with `data-testid="transaction-timestamp-{index}"`.
5. THE Transaction_Entry_Group SHALL contain a payment type select with options Card, Apple Pay, and EFT with `data-testid="transaction-payment-type-{index}"`.
6. WHEN the Ops_User clicks the Add_Transaction_Button, THE Create_Dispute_Form SHALL append a new empty Transaction_Entry_Group below the existing groups.
7. THE Add_Transaction_Button SHALL have `data-testid="add-transaction-button"`.
8. WHEN more than one Transaction_Entry_Group exists, THE Remove_Button SHALL be visible on each group with `data-testid="remove-transaction-{index}"`.
9. WHILE only one Transaction_Entry_Group exists, THE Remove_Button SHALL be hidden.
10. WHEN the Ops_User clicks the Remove_Button on a Transaction_Entry_Group, THE Create_Dispute_Form SHALL remove that group from the form.

### Requirement 4: Form Validation

**User Story:** As an ops user, I want the form to validate all fields before submission, so that I cannot create incomplete or invalid disputes.

#### Acceptance Criteria

1. WHILE no customer is selected, THE Submit_Button SHALL remain disabled.
2. WHILE any Transaction_Entry_Group has invalid or missing fields, THE Submit_Button SHALL remain disabled.
3. IF the Ops_User leaves the customer field empty and attempts submission, THEN THE Create_Dispute_Form SHALL display "Please select a customer" as a validation error.
4. IF the Ops_User leaves the amount field empty or enters a value less than or equal to zero, THEN THE Create_Dispute_Form SHALL display "Amount must be greater than zero" below the amount field.
5. IF the Ops_User leaves the merchant field empty, THEN THE Create_Dispute_Form SHALL display "Merchant name is required" below the merchant field.
6. IF the Ops_User leaves the timestamp field empty, THEN THE Create_Dispute_Form SHALL display "Transaction date is required" below the timestamp field.
7. IF the Ops_User does not select a payment type, THEN THE Create_Dispute_Form SHALL display "Please select a payment type" below the payment type field.
8. IF the form contains zero Transaction_Entry_Groups, THEN THE Create_Dispute_Form SHALL display "At least one transaction is required".
9. WHEN a field loses focus with an invalid value, THE Create_Dispute_Form SHALL display a red border on the invalid field with inline error text.

### Requirement 5: Form Submission

**User Story:** As an ops user, I want to submit the dispute form and have the system automatically triage it, so that the dispute is created with the correct priority and recommendation.

#### Acceptance Criteria

1. WHEN the Ops_User clicks the Submit_Button with a valid form, THE Create_Dispute_Form SHALL send a POST request to /api/disputes with the selected customerId and an array of transactions.
2. WHILE the POST /api/disputes request is in progress, THE Create_Dispute_Form SHALL disable all form fields, display a spinner on the Submit_Button with text "Submitting...", and show a loading indicator with `data-testid="submit-loading"`.
3. THE Submit_Button SHALL have `data-testid="submit-dispute-button"`.
4. WHEN the POST /api/disputes request succeeds, THE Create_Dispute_Form SHALL redirect the Ops_User to `/disputes/:id` where `:id` is the newly created dispute identifier.
5. IF the POST /api/disputes request fails, THEN THE Create_Dispute_Form SHALL display an alert with text "Failed to create dispute: {error message}. Please try again." with a dismiss action and `data-testid="submit-error"`.
6. THE Create_Dispute_Form SHALL include `dateRaised` as the current timestamp in the submission payload.
7. THE Create_Dispute_Form SHALL calculate `totalAmount` as the sum of all transaction amounts in the submission payload.
