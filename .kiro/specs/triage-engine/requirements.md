# Requirements Document

## Introduction

A deterministic, pure-function triage engine that evaluates two business rules (transaction age and total dispute amount) against dispute data. The engine produces a priority classification (P1, P2, or Standard), a recommendation string, and a structured rule trace that provides full transparency into how the decision was reached. The function is side-effect free, operates without database access, and is invoked during dispute creation and when transactions are added to an existing dispute.

## Glossary

- **Triage_Engine**: The pure function `evaluateTriage` located at `server/src/services/triageEngine.ts` that classifies dispute priority based on business rules.
- **Transaction_Age**: The elapsed time in hours between `dateRaised` and a transaction's `timestamp`, calculated as `dateRaised - transaction.timestamp`.
- **Total_Dispute_Amount**: The arithmetic sum of all transaction `amount` values linked to a dispute, expressed in ZAR.
- **Age_Rule (R1)**: The business rule that fires when any transaction has an age strictly less than 48 hours.
- **Amount_Rule (R2)**: The business rule that fires when the Total_Dispute_Amount exceeds R10,000.
- **Rule_Trace**: A structured array of objects recording each rule's name, condition description, boolean result, and a human-readable detail string.
- **Triage_Result**: The flat return structure containing `priority`, `recommendation`, `evaluatedAt`, `inputs`, and `rules`.
- **TransactionInput**: The input type representing a single transaction with fields: `id` (number), `amount` (number), `merchant` (string), `timestamp` (string, ISO 8601), `paymentType` (string).
- **AGE_THRESHOLD_HOURS**: The constant value 48, representing the age boundary in hours for the Age_Rule.
- **AMOUNT_THRESHOLD**: The constant value 10000, representing the monetary boundary in ZAR for the Amount_Rule.

## Requirements

### Requirement 1: Pure Function Signature

**User Story:** As a developer, I want the triage engine to be a pure function with a well-defined signature, so that it is deterministic, testable, and free of side effects.

#### Acceptance Criteria

1. THE Triage_Engine SHALL expose a function `evaluateTriage(dateRaised: string, transactions: TransactionInput[])` that returns a Triage_Result.
2. THE Triage_Engine SHALL produce identical output for identical inputs regardless of external state or invocation time.
3. THE Triage_Engine SHALL perform no database access, network calls, or mutation of external state.

### Requirement 2: Transaction Age Calculation

**User Story:** As an ops user, I want transaction age calculated relative to the dispute's `dateRaised` timestamp, so that triage results remain stable after creation.

#### Acceptance Criteria

1. WHEN calculating Transaction_Age, THE Triage_Engine SHALL compute the difference as `dateRaised - transaction.timestamp` expressed in hours.
2. THE Triage_Engine SHALL use the `dateRaised` parameter for age calculation, not the current system time.
3. THE Triage_Engine SHALL record the youngest Transaction_Age (minimum age across all transactions) in the `inputs.youngestTransactionAge` field of the Triage_Result.

### Requirement 3: Age Rule (R1) Evaluation

**User Story:** As an ops user, I want the system to detect recent transactions so that time-sensitive fraud cases are escalated promptly.

#### Acceptance Criteria

1. WHEN any single transaction has a Transaction_Age strictly less than AGE_THRESHOLD_HOURS (48), THE Triage_Engine SHALL set the Age_Rule result to `true`.
2. WHEN all transactions have a Transaction_Age greater than or equal to AGE_THRESHOLD_HOURS (48), THE Triage_Engine SHALL set the Age_Rule result to `false`.
3. THE Triage_Engine SHALL evaluate the Age_Rule independently for each transaction and fire if at least one qualifies.

### Requirement 4: Amount Rule (R2) Evaluation

**User Story:** As an ops user, I want the system to flag high-value disputes so that significant financial exposure is prioritised.

#### Acceptance Criteria

1. WHEN the Total_Dispute_Amount is strictly greater than AMOUNT_THRESHOLD (10000), THE Triage_Engine SHALL set the Amount_Rule result to `true`.
2. WHEN the Total_Dispute_Amount is less than or equal to AMOUNT_THRESHOLD (10000), THE Triage_Engine SHALL set the Amount_Rule result to `false`.
3. THE Triage_Engine SHALL calculate Total_Dispute_Amount as the arithmetic sum of all transaction `amount` values and record it in `inputs.totalAmount`.

### Requirement 5: Priority Classification and Recommendation

**User Story:** As an ops user, I want the system to produce a clear priority and recommendation based on rule outcomes, so that I can act decisively on each dispute.

#### Acceptance Criteria

1. WHEN both Age_Rule and Amount_Rule fire, THE Triage_Engine SHALL assign priority `P1` and recommendation `"Immediate Fraud Freeze + P1 High Priority Escalation"`.
2. WHEN only Amount_Rule fires, THE Triage_Engine SHALL assign priority `P1` and recommendation `"P1 High Priority Escalation"`.
3. WHEN only Age_Rule fires, THE Triage_Engine SHALL assign priority `P2` and recommendation `"Immediate Fraud Freeze"`.
4. WHEN neither Age_Rule nor Amount_Rule fires, THE Triage_Engine SHALL assign priority `Standard` and recommendation `"Standard Investigation"`.

### Requirement 6: Structured Rule Trace

**User Story:** As an ops user, I want a transparent trace of every rule evaluation, so that I can understand and justify the triage outcome.

#### Acceptance Criteria

1. THE Triage_Engine SHALL include a `rules` array in the Triage_Result containing exactly two entries: one for the Age_Rule (named `"R1"`) and one for the Amount_Rule (named `"R2"`).
2. THE Triage_Engine SHALL include for each rule entry the fields: `rule` (string identifier), `condition` (human-readable condition description), `result` (boolean), and `detail` (human-readable explanation of the evaluated values).
3. THE Triage_Engine SHALL include a `condition` field for R1 that references the threshold of 48 hours.
4. THE Triage_Engine SHALL include a `condition` field for R2 that references the threshold of 10000.

### Requirement 7: Evaluation Timestamp

**User Story:** As an ops user, I want to know exactly when triage was evaluated, so that I can correlate results with the dispute timeline.

#### Acceptance Criteria

1. THE Triage_Engine SHALL include an `evaluatedAt` field in the Triage_Result containing the current time as an ISO 8601 string in the format `YYYY-MM-DDTHH:mm:ss.sssZ`.
2. THE Triage_Engine SHALL generate the `evaluatedAt` timestamp at the moment of function execution.

### Requirement 8: Triage Execution Triggers

**User Story:** As a system integrator, I want triage to re-run when dispute data changes, so that the priority reflects the latest transaction set.

#### Acceptance Criteria

1. WHEN a dispute is created, THE Triage_Engine SHALL be invoked with the dispute's `dateRaised` and linked transactions.
2. WHEN transactions are added to an existing dispute, THE Triage_Engine SHALL be re-invoked with the updated transaction set.
