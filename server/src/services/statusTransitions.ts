export type DisputeStatus = 'Reported' | 'UnderInvestigation' | 'Escalated' | 'Resolved' | 'Referred';
export type ResolutionOutcome = 'Refunded' | 'Declined' | 'ChargebackInitiated';

export interface TransitionRequest {
  currentStatus: DisputeStatus;
  targetStatus: DisputeStatus;
  resolutionOutcome?: ResolutionOutcome;
}

export interface TransitionResult {
  valid: boolean;
  errorCode?: 'INVALID_STATUS_TRANSITION' | 'MISSING_RESOLUTION_OUTCOME';
  errorMessage?: string;
}

const VALID_TRANSITIONS: Record<DisputeStatus, DisputeStatus[]> = {
  Reported: ['UnderInvestigation'],
  UnderInvestigation: ['Escalated', 'Resolved', 'Referred'],
  Escalated: ['Resolved'],
  Resolved: [],
  Referred: [],
};

const TERMINAL_STATES: DisputeStatus[] = ['Resolved', 'Referred'];

export function isTerminalState(status: DisputeStatus): boolean {
  return TERMINAL_STATES.includes(status);
}

export function getValidTransitions(status: DisputeStatus): DisputeStatus[] {
  return VALID_TRANSITIONS[status] ?? [];
}

export function validateStatusTransition(request: TransitionRequest): TransitionResult {
  const { currentStatus, targetStatus, resolutionOutcome } = request;

  // 1. Resolution outcome guard FIRST
  if (targetStatus === 'Resolved' && !resolutionOutcome) {
    return {
      valid: false,
      errorCode: 'MISSING_RESOLUTION_OUTCOME',
      errorMessage: 'Resolution outcome is required when transitioning to Resolved',
    };
  }

  // 2. FSM lookup SECOND
  const allowed = getValidTransitions(currentStatus);
  if (!allowed.includes(targetStatus)) {
    return {
      valid: false,
      errorCode: 'INVALID_STATUS_TRANSITION',
      errorMessage: `Cannot transition from ${currentStatus} to ${targetStatus}`,
    };
  }

  return { valid: true };
}
