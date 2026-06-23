# Requirements Document

## Introduction

This specification defines the REST API layer for the Dispute Triage System. The API exposes endpoints for managing customers, disputes, and transactions through an Express.js backend. It includes a service orchestration layer (disputeService) that composes triage engine evaluation, lifecycle state machine guards, and Prisma database operations. Route handlers follow a thin-controller pattern: validate input, delegate to service, return response.

## Glossary

- **API**: The Express.js REST API served under `/api` on port 3001
- **Dispute_Service**: The orchestration layer (`server/src/services/disputeService.ts`) responsible for composing business logic with database operations
- **Route_Handler**: A thin Express route handler that validates input, delegates to Dispute_Service, and returns a response
- **Triage_Engine**: The deterministic rule-based engine that evaluates dispute priority and recommendation
- **Lifecycle_Guard**: The finite state machine validator that enforces valid status transitions
- **AppError**: A structured error class with code, message, status, and timestamp fields
- **Error_Envelope**: The standard JSON response structure for all API errors: `{ error: { code, message, status, timestamp } }`
- **Terminal_State**: A dispute status of `Resolved` or `Referred` from which no further transitions or modifications are permitted
- **DTO**: Data Transfer Object defining the shape of API request and response payloads
- **Rule_Trace**: A structured JSON object recording triage evaluation inputs, rule results, and final recommendation

## Requirements

### Requirement 1: List Customers Endpoint

**User Story:** As an ops user, I want to retrieve all pre-seeded customers via the API, so that I can populate the customer selection dropdown when creating a dispute.

#### Acceptance Criteria

1. WHEN a GET request is received at `/api/customers`, THE API SHALL return HTTP 200 with a JSON array of all customer records including id, name, contactReference, accountIdentifier, and createdAt fields.
2. WHEN no customers exist in the database, THE API SHALL return HTTP 200 with an empty JSON array.

### Requirement 2: List Disputes Endpoint

**User Story:** As an ops user, I want to retrieve disputes with filtering and sorting options, so that I can view and prioritize cases on the dashboard.

#### Acceptance Criteria

1. WHEN a GET request is received at `/api/disputes`, THE API SHALL return HTTP 200 with a JSON array of dispute summary objects including id, customerId, customerName, status, category, totalAmount, dateRaised, priority, recommendation, resolutionOutcome, createdAt, and updatedAt fields.
2. WHEN the `status` query parameter is provided as a comma-separated list, THE API SHALL return only disputes whose status matches one of the provided values.
3. WHEN the `priority` query parameter is provided as a comma-separated list, THE API SHALL return only disputes whose priority matches one of the provided values.
4. WHEN the `sortBy` query parameter is provided with a value of `dateRaised`, `totalAmount`, or `priority`, THE API SHALL sort the results by the specified field.
5. WHEN the `sortOrder` query parameter is provided with a value of `asc` or `desc`, THE API SHALL order the results in the specified direction.
6. WHEN no `sortBy` parameter is provided, THE API SHALL default to sorting by priority descending (P1 first), then dateRaised descending (newest first).
7. THE API SHALL include a denormalized `customerName` field in each dispute summary object by joining with the customer record.

### Requirement 3: Get Dispute Detail Endpoint

**User Story:** As an ops user, I want to retrieve the full detail of a specific dispute, so that I can review customer information, transactions, and triage results.

#### Acceptance Criteria

1. WHEN a GET request is received at `/api/disputes/:id` referencing an existing dispute, THE API SHALL return HTTP 200 with the full dispute detail including nested customer object, transactions array, and parsed ruleTrace object.
2. THE API SHALL return the ruleTrace field as a parsed JSON object containing evaluatedAt, inputs, rules, recommendation, and priority fields.
3. THE API SHALL return the customer field as a nested object containing id, name, contactReference, and accountIdentifier.
4. THE API SHALL return the transactions field as an array of objects each containing id, amount, merchant, timestamp, paymentType, and createdAt.
5. IF a GET request to `/api/disputes/:id` references a non-existent dispute, THEN THE API SHALL return HTTP 404 with error code `DISPUTE_NOT_FOUND` in the standard error envelope.

### Requirement 4: Create Dispute Endpoint

**User Story:** As an ops user, I want to create a new dispute with associated transactions via the API, so that the system can automatically run triage and assign priority.

#### Acceptance Criteria

1. WHEN a POST request is received at `/api/disputes` with a valid body containing customerId and a transactions array with at least one entry, THE API SHALL create the dispute with status `Reported`, set dateRaised to the current server timestamp, calculate totalAmount as the sum of all transaction amounts, execute the Triage_Engine, store the resulting priority, recommendation, and ruleTrace, and return HTTP 201 with the full dispute detail.
2. IF a POST request to `/api/disputes` is missing the customerId field, THEN THE API SHALL return HTTP 400 with error code `VALIDATION_ERROR`.
3. IF a POST request to `/api/disputes` contains an empty transactions array, THEN THE API SHALL return HTTP 400 with error code `VALIDATION_ERROR` and a message indicating at least one transaction is required.
4. IF a POST request to `/api/disputes` contains a transaction with a non-positive amount, THEN THE API SHALL return HTTP 400 with error code `VALIDATION_ERROR`.
5. IF a POST request to `/api/disputes` contains a transaction with an empty merchant field, THEN THE API SHALL return HTTP 400 with error code `VALIDATION_ERROR`.
6. IF a POST request to `/api/disputes` contains a transaction with an invalid ISO 8601 timestamp, THEN THE API SHALL return HTTP 400 with error code `VALIDATION_ERROR`.
7. IF a POST request to `/api/disputes` contains a transaction with a paymentType not in the set [Card, ApplePay, EFT], THEN THE API SHALL return HTTP 400 with error code `VALIDATION_ERROR`.
8. IF a POST request to `/api/disputes` references a customerId that does not exist, THEN THE API SHALL return HTTP 400 with error code `VALIDATION_ERROR`.

### Requirement 5: Transition Dispute Status Endpoint

**User Story:** As an ops user, I want to progress a dispute through its lifecycle via the API, so that I can move cases from reported through investigation to resolution.

#### Acceptance Criteria

1. WHEN a PATCH request is received at `/api/disputes/:id/status` with a valid status transition, THE API SHALL update the dispute status and return HTTP 200 with the full updated dispute detail.
2. IF a PATCH request to `/api/disputes/:id/status` requests a transition that violates the state machine rules (Reported to UnderInvestigation, UnderInvestigation to Escalated/Resolved/Referred, Escalated to Resolved), THEN THE API SHALL return HTTP 400 with error code `INVALID_STATUS_TRANSITION` and a message describing the violation.
3. IF a PATCH request to `/api/disputes/:id/status` transitions to `Resolved` without providing a resolutionOutcome value, THEN THE API SHALL return HTTP 400 with error code `MISSING_RESOLUTION_OUTCOME`.
4. WHEN a PATCH request transitions a dispute to `Resolved` with a valid resolutionOutcome (Refunded, Declined, or ChargebackInitiated), THE API SHALL store the resolutionOutcome on the dispute record.
5. IF a PATCH request to `/api/disputes/:id/status` references a non-existent dispute, THEN THE API SHALL return HTTP 404 with error code `DISPUTE_NOT_FOUND`.
6. IF a PATCH request to `/api/disputes/:id/status` is missing the status field, THEN THE API SHALL return HTTP 400 with error code `VALIDATION_ERROR`.

### Requirement 6: Add Transaction Endpoint

**User Story:** As an ops user, I want to add a transaction to an existing dispute via the API, so that the system recalculates totals and re-runs triage with updated data.

#### Acceptance Criteria

1. WHEN a POST request is received at `/api/disputes/:id/transactions` with valid transaction data (amount > 0, non-empty merchant, valid ISO 8601 timestamp, paymentType in [Card, ApplePay, EFT]), THE API SHALL create the transaction, recalculate totalAmount as the sum of all linked transactions, re-execute the Triage_Engine, update priority, recommendation, and ruleTrace, and return HTTP 200 with the full updated dispute detail.
2. IF a POST request to `/api/disputes/:id/transactions` targets a dispute in a Terminal_State (Resolved or Referred), THEN THE API SHALL return HTTP 400 with error code `DISPUTE_IN_TERMINAL_STATE`.
3. IF a POST request to `/api/disputes/:id/transactions` contains a non-positive amount, THEN THE API SHALL return HTTP 400 with error code `VALIDATION_ERROR`.
4. IF a POST request to `/api/disputes/:id/transactions` contains an empty merchant field, THEN THE API SHALL return HTTP 400 with error code `VALIDATION_ERROR`.
5. IF a POST request to `/api/disputes/:id/transactions` contains an invalid timestamp, THEN THE API SHALL return HTTP 400 with error code `VALIDATION_ERROR`.
6. IF a POST request to `/api/disputes/:id/transactions` contains a paymentType not in the set [Card, ApplePay, EFT], THEN THE API SHALL return HTTP 400 with error code `VALIDATION_ERROR`.
7. IF a POST request to `/api/disputes/:id/transactions` references a non-existent dispute, THEN THE API SHALL return HTTP 404 with error code `DISPUTE_NOT_FOUND`.

### Requirement 7: Error Envelope Format

**User Story:** As an API consumer, I want all errors to follow a consistent format, so that I can implement uniform error handling on the client.

#### Acceptance Criteria

1. IF any API request results in an error, THEN THE API SHALL return a JSON response body with the structure `{ "error": { "code": "<ERROR_CODE>", "message": "<description>", "status": <httpStatus>, "timestamp": "<ISO8601>" } }`.
2. THE API SHALL include a machine-readable error code from the set: DISPUTE_NOT_FOUND, INVALID_STATUS_TRANSITION, MISSING_RESOLUTION_OUTCOME, DISPUTE_IN_TERMINAL_STATE, VALIDATION_ERROR, INTERNAL_ERROR.
3. THE API SHALL include a human-readable message describing the specific error condition.
4. THE API SHALL set the HTTP response status code to match the `status` field in the error envelope.

### Requirement 8: Service Layer Orchestration

**User Story:** As a developer, I want business logic separated into a service layer, so that route handlers remain thin and testable.

#### Acceptance Criteria

1. THE Dispute_Service SHALL expose a `createDispute` function that accepts customerId and a transactions array, orchestrates Prisma record creation, Triage_Engine execution, and returns the full dispute detail.
2. THE Dispute_Service SHALL expose a `getDisputeById` function that accepts a dispute id and returns the dispute with nested customer, transactions, and parsed ruleTrace.
3. THE Dispute_Service SHALL expose a `listDisputes` function that accepts optional filter and sort parameters and returns an array of dispute summaries with denormalized customerName.
4. THE Dispute_Service SHALL expose a `transitionStatus` function that accepts a dispute id, target status, and optional resolutionOutcome, validates the transition via Lifecycle_Guard, and returns the updated dispute detail.
5. THE Dispute_Service SHALL expose an `addTransaction` function that accepts a dispute id and transaction data, validates the dispute is not in a Terminal_State, creates the transaction, recalculates totalAmount, re-executes the Triage_Engine, and returns the updated dispute detail.
6. THE Dispute_Service SHALL expose a `listCustomers` function that returns all customer records.
7. THE Dispute_Service SHALL throw an AppError with the appropriate error code when a business rule violation occurs.

### Requirement 9: Request Validation

**User Story:** As a developer, I want input validation applied before service delegation, so that invalid data is rejected early with clear error messages.

#### Acceptance Criteria

1. WHEN a POST request to `/api/disputes` is received, THE Route_Handler SHALL validate that customerId is present and is a number, and that transactions is a non-empty array, before delegating to Dispute_Service.
2. WHEN a POST request to `/api/disputes` or `/api/disputes/:id/transactions` is received, THE Route_Handler SHALL validate each transaction entry for: amount is a positive number, merchant is a non-empty string, timestamp is a valid ISO 8601 string, and paymentType is one of Card, ApplePay, or EFT.
3. WHEN a PATCH request to `/api/disputes/:id/status` is received, THE Route_Handler SHALL validate that the status field is present and is a recognized status value.
4. IF validation fails for any request, THEN THE Route_Handler SHALL call next with an AppError containing error code `VALIDATION_ERROR`, HTTP status 400, and a descriptive message identifying the invalid field.

### Requirement 10: Async Error Handling

**User Story:** As a developer, I want all route handlers to propagate errors consistently, so that unhandled exceptions are caught and returned in the standard error envelope.

#### Acceptance Criteria

1. THE Route_Handler SHALL wrap all async operations in try/catch blocks and call `next(error)` for any caught exceptions.
2. IF an unhandled error occurs without a specific error code, THEN THE API SHALL return HTTP 500 with error code `INTERNAL_ERROR`.
3. THE API SHALL log all errors to the server console with the error code and message before returning the response.
