# Requirements Document

## Introduction

The Lifecycle Guard is a pure-function module that validates dispute status transitions according to a finite state machine (FSM). It enforces the allowed transition paths between dispute statuses, prevents transitions from terminal states, and ensures resolution outcome requirements are met. The guard operates without side effects, database access, or external dependencies, making it deterministic and trivially testable.

## Glossary

- **Lifecycle_Guard**: A pure-function service module located at `server/src/services/statusTransitions.ts` that validates dispute status transitions against a static FSM adjacency list.
- **DisputeStatus**: An enumerated type representing the current phase of a dispute. Valid values: `Reported`, `UnderInvestigation`, `Escalated`, `Resolved`, `Referred`.
- **TransitionRequest**: An object containing `currentStatus` (DisputeStatus), `targetStatus` (DisputeStatus), and an optional `resolutionOutcome` (ResolutionOutcome).
- **TransitionResult**: An object containing `valid` (boolean), and optional `errorCode` (string) and `errorMessage` (string) fields returned by the validation function.
- **ResolutionOutcome**: An enumerated type representing the closure reason for a resolved dispute. Valid values: `Refunded`, `Declined`, `ChargebackInitiated`.
- **Terminal_State**: A dispute status from which no outbound transitions are permitted. Terminal states are `Resolved` and `Referred`.
- **FSM_Adjacency_List**: A static lookup structure (`Record<DisputeStatus, DisputeStatus[]>`) defining all permitted outbound transitions for each status.

## Requirements

### Requirement 1: Valid Forward Transitions

**User Story:** As an ops user, I want the system to permit only valid status transitions, so that disputes follow the correct lifecycle path.

#### Acceptance Criteria

1. WHEN a TransitionRequest contains currentStatus `Reported` and targetStatus `UnderInvestigation`, THE Lifecycle_Guard SHALL return a TransitionResult with `valid` set to `true` and no `errorCode` or `errorMessage`.
2. WHEN a TransitionRequest contains currentStatus `UnderInvestigation` and targetStatus `Escalated`, THE Lifecycle_Guard SHALL return a TransitionResult with `valid` set to `true` and no `errorCode` or `errorMessage`.
3. WHEN a TransitionRequest contains currentStatus `UnderInvestigation` and targetStatus `Referred`, THE Lifecycle_Guard SHALL return a TransitionResult with `valid` set to `true` and no `errorCode` or `errorMessage`.
4. WHEN a TransitionRequest contains currentStatus `UnderInvestigation`, targetStatus `Resolved`, and a valid `resolutionOutcome`, THE Lifecycle_Guard SHALL return a TransitionResult with `valid` set to `true` and no `errorCode` or `errorMessage`.
5. WHEN a TransitionRequest contains currentStatus `Escalated`, targetStatus `Resolved`, and a valid `resolutionOutcome`, THE Lifecycle_Guard SHALL return a TransitionResult with `valid` set to `true` and no `errorCode` or `errorMessage`.

### Requirement 2: Invalid Transition Rejection

**User Story:** As an ops user, I want the system to reject invalid status transitions, so that disputes cannot skip required lifecycle steps or move backward.

#### Acceptance Criteria

1. WHEN a TransitionRequest contains a currentStatus and targetStatus pair that does not exist in the FSM_Adjacency_List, THE Lifecycle_Guard SHALL return a TransitionResult with `valid` set to `false` and `errorCode` set to `INVALID_STATUS_TRANSITION`.
2. WHEN a TransitionRequest contains an invalid transition, THE Lifecycle_Guard SHALL include an `errorMessage` that contains both the currentStatus and targetStatus values.
3. WHEN a TransitionRequest specifies a backward transition (e.g., `Escalated` to `UnderInvestigation`), THE Lifecycle_Guard SHALL return a TransitionResult with `valid` set to `false` and `errorCode` set to `INVALID_STATUS_TRANSITION`.
4. WHEN a TransitionRequest specifies a transition that skips required steps (e.g., `Reported` to `Resolved`), THE Lifecycle_Guard SHALL return a TransitionResult with `valid` set to `false` and `errorCode` set to `INVALID_STATUS_TRANSITION`.

### Requirement 3: Terminal State Enforcement

**User Story:** As an ops user, I want the system to prevent any transitions from terminal states, so that closed disputes remain immutable.

#### Acceptance Criteria

1. WHEN a TransitionRequest contains currentStatus `Resolved` and any targetStatus, THE Lifecycle_Guard SHALL return a TransitionResult with `valid` set to `false` and `errorCode` set to `INVALID_STATUS_TRANSITION`.
2. WHEN a TransitionRequest contains currentStatus `Referred` and any targetStatus, THE Lifecycle_Guard SHALL return a TransitionResult with `valid` set to `false` and `errorCode` set to `INVALID_STATUS_TRANSITION`.
3. THE Lifecycle_Guard SHALL define `Resolved` and `Referred` as the only terminal states with an empty adjacency list (no outbound transitions).

### Requirement 4: Resolution Outcome Validation

**User Story:** As an ops user, I want the system to require a resolution outcome when resolving a dispute, so that every closure has a documented reason.

#### Acceptance Criteria

1. WHEN a TransitionRequest contains targetStatus `Resolved` and `resolutionOutcome` is undefined or not provided, THE Lifecycle_Guard SHALL return a TransitionResult with `valid` set to `false` and `errorCode` set to `MISSING_RESOLUTION_OUTCOME`.
2. WHEN a TransitionRequest contains targetStatus `Resolved` and `resolutionOutcome` is undefined, THE Lifecycle_Guard SHALL include a defined `errorMessage` describing the missing outcome requirement.
3. WHEN a TransitionRequest contains targetStatus `Resolved` and a valid `resolutionOutcome` value (`Refunded`, `Declined`, or `ChargebackInitiated`), THE Lifecycle_Guard SHALL proceed with standard transition validation against the FSM_Adjacency_List.

### Requirement 5: Pure Function Contract

**User Story:** As a developer, I want the lifecycle guard to be a pure function with no side effects, so that it is deterministic, testable, and safe to call from any context.

#### Acceptance Criteria

1. THE Lifecycle_Guard SHALL produce identical TransitionResult output for identical TransitionRequest input on every invocation.
2. THE Lifecycle_Guard SHALL not perform database queries, network requests, file system operations, or mutation of external state.
3. THE Lifecycle_Guard SHALL use a static FSM_Adjacency_List defined as a constant within the module.
4. THE Lifecycle_Guard SHALL export a `validateStatusTransition` function that accepts a TransitionRequest and returns a TransitionResult.
