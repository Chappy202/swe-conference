import { useState } from 'react';
import { Status } from '../types/dispute';
import { ActionConfig, getAvailableActions } from '../utils/statusTransitions';

/** Props for the StatusActionButtons component. */
export interface StatusActionButtonsProps {
  status: Status;
  disputeId: number;
  onActionComplete: () => void;
  onResolveClick: () => void;
}

const STYLE_CLASSES: Record<ActionConfig['style'], string> = {
  primary: 'bg-indigo-700 hover:bg-indigo-800 text-white',
  amber: 'bg-amber-500 hover:bg-amber-600 text-white',
  green: 'bg-green-600 hover:bg-green-700 text-white',
  grey: 'bg-gray-500 hover:bg-gray-600 text-white',
};

/** Renders status transition action buttons based on current dispute status. */
export function StatusActionButtons({
  status,
  disputeId,
  onActionComplete,
  onResolveClick,
}: StatusActionButtonsProps): JSX.Element {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const actions = getAvailableActions(status);

  async function handleAction(action: ActionConfig): Promise<void> {
    if (action.opensModal) {
      onResolveClick();
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/disputes/${disputeId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: action.targetStatus }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || 'Unknown error');
        return;
      }

      onActionComplete();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }

  if (actions.length === 0) {
    return <></>;
  }

  return (
    <div className="flex items-center gap-2">
      {isLoading && (
        <div data-testid="action-loading" className="animate-spin h-5 w-5 border-2 border-current border-t-transparent rounded-full" />
      )}
      {actions.map((action) => (
        <button
          key={action.testId}
          data-testid={action.testId}
          disabled={isLoading}
          onClick={() => handleAction(action)}
          className={`px-4 py-2 rounded font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed ${STYLE_CLASSES[action.style]}`}
        >
          {action.label}
        </button>
      ))}
      {error && (
        <div
          data-testid="action-error"
          className="ml-2 px-3 py-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded"
        >
          Failed to update status: {error}.
        </div>
      )}
    </div>
  );
}
