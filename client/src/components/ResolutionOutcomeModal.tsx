import { useState } from 'react';
import { ResolutionOutcome } from '../types/dispute';

/** Props for the ResolutionOutcomeModal component. */
interface ResolutionOutcomeModalProps {
  isOpen: boolean;
  disputeId: number;
  onClose: () => void;
  onResolved: () => void;
}

interface OutcomeOption {
  label: string;
  value: ResolutionOutcome;
  testId: string;
}

const OUTCOME_OPTIONS: OutcomeOption[] = [
  { label: 'Refunded', value: 'Refunded', testId: 'outcome-refunded' },
  { label: 'Declined', value: 'Declined', testId: 'outcome-declined' },
  { label: 'Chargeback Initiated', value: 'ChargebackInitiated', testId: 'outcome-chargeback' },
];

function ResolutionOutcomeModal({
  isOpen,
  disputeId,
  onClose,
  onResolved,
}: ResolutionOutcomeModalProps): JSX.Element | null {
  const [selectedOutcome, setSelectedOutcome] = useState<ResolutionOutcome | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) {
    return null;
  }

  const handleConfirm = async (): Promise<void> => {
    if (!selectedOutcome) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/disputes/${disputeId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Resolved', resolutionOutcome: selectedOutcome }),
      });

      if (!response.ok) {
        setError('Failed to resolve dispute. Please try again.');
        setIsSubmitting(false);
        return;
      }

      onResolved();
    } catch {
      setError('Failed to resolve dispute. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div
        data-testid="resolution-modal-overlay"
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onClose}
      />
      <div
        data-testid="resolution-modal"
        className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
      >
        <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md pointer-events-auto">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Resolve Dispute</h2>
            <button
              data-testid="modal-close"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
              aria-label="Close"
            >
              ✕
            </button>
          </div>

          <p className="text-sm text-gray-600 mb-4">
            Select a resolution outcome for this dispute:
          </p>

          <div className="space-y-2 mb-4">
            {OUTCOME_OPTIONS.map((option) => (
              <label
                key={option.value}
                className="flex items-center gap-2 p-2 rounded hover:bg-gray-50 cursor-pointer"
              >
                <input
                  type="radio"
                  name="resolution-outcome"
                  data-testid={option.testId}
                  value={option.value}
                  checked={selectedOutcome === option.value}
                  disabled={isSubmitting}
                  onChange={() => setSelectedOutcome(option.value)}
                  className="text-indigo-600"
                />
                <span className="text-sm">{option.label}</span>
              </label>
            ))}
          </div>

          {error && (
            <p className="text-sm text-red-600 mb-4">{error}</p>
          )}

          <div className="flex justify-end gap-2">
            <button
              data-testid="modal-cancel"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded hover:bg-gray-200 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              data-testid="modal-confirm"
              onClick={handleConfirm}
              disabled={!selectedOutcome || isSubmitting}
              className="px-4 py-2 text-sm text-white bg-green-600 rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Resolving...' : 'Confirm Resolve'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export { ResolutionOutcomeModal };
export type { ResolutionOutcomeModalProps };
