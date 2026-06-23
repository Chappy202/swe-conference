import { ResolutionOutcome } from '../types/dispute';

/** Props for the ResolutionOutcomeDisplay component. */
export interface ResolutionOutcomeDisplayProps {
  /** The resolution outcome to display. */
  outcome: ResolutionOutcome;
}

const OUTCOME_LABELS: Record<ResolutionOutcome, string> = {
  Refunded: 'Refunded',
  Declined: 'Declined',
  ChargebackInitiated: 'Chargeback Initiated',
};

/** Displays the resolution outcome as a labelled field. */
export function ResolutionOutcomeDisplay({ outcome }: ResolutionOutcomeDisplayProps) {
  return (
    <div data-testid="resolution-outcome" className="mt-4 rounded-lg bg-green-50 p-4">
      <span className="text-sm font-medium text-gray-600">Resolution Outcome: </span>
      <span className="font-semibold text-green-800">{OUTCOME_LABELS[outcome]}</span>
    </div>
  );
}
