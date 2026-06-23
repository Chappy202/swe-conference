import type { DisputeSummary } from '../types';
import { DisputeRow } from './DisputeRow';

/** Props for the DisputesTable component. */
export interface DisputesTableProps {
  /** Disputes to render as rows (already filtered/sorted by the API). */
  disputes: DisputeSummary[];
  /** Whether the disputes request is in flight. */
  isLoading: boolean;
  /** Error message to display, or null when there is no error. */
  error: string | null;
  /** Called when the user clicks the error-state Retry button. */
  onRetry: () => void;
}

const COLUMN_HEADERS = ['ID', 'Customer', 'Status', 'Priority', 'Total Amount', 'Date Raised'];

const SKELETON_ROW_COUNT = 5;

/** Skeleton placeholder shown while disputes are loading. */
function LoadingState() {
  return (
    <div
      data-testid="loading-state"
      className="space-y-3 rounded-card border border-slate-200 bg-white p-4"
    >
      {Array.from({ length: SKELETON_ROW_COUNT }).map((_, index) => (
        <div key={index} className="flex animate-pulse items-center gap-4">
          <div className="h-4 w-8 rounded bg-slate-200" />
          <div className="h-4 w-40 rounded bg-slate-200" />
          <div className="h-4 w-24 rounded bg-slate-200" />
          <div className="h-4 w-16 rounded bg-slate-200" />
          <div className="h-4 w-24 rounded bg-slate-200" />
          <div className="h-4 w-32 rounded bg-slate-200" />
        </div>
      ))}
    </div>
  );
}

/** Error alert with a Retry action shown when the disputes request fails. */
function ErrorState({ error, onRetry }: { error: string; onRetry: () => void }) {
  return (
    <div
      data-testid="error-state"
      role="alert"
      className="rounded-card border border-red-300 bg-red-50 p-6 text-red-700"
    >
      <p className="font-medium">{error}</p>
      <button
        type="button"
        data-testid="retry-button"
        onClick={onRetry}
        className="mt-4 rounded-button bg-[#003366] px-4 py-2 text-sm font-medium text-white hover:bg-[#004d99]"
      >
        Retry
      </button>
    </div>
  );
}

/** Centred message shown when no disputes match the active filters. */
function EmptyState() {
  return (
    <div
      data-testid="empty-state"
      className="rounded-card border border-slate-200 bg-white p-12 text-center text-slate-500"
    >
      No disputes found matching your filters.
    </div>
  );
}

/** Renders the disputes table or its loading / error / empty states. */
export function DisputesTable({ disputes, isLoading, error, onRetry }: DisputesTableProps) {
  if (isLoading) {
    return <LoadingState />;
  }

  if (error) {
    return <ErrorState error={error} onRetry={onRetry} />;
  }

  if (disputes.length === 0) {
    return <EmptyState />;
  }

  return (
    <table
      data-testid="disputes-table"
      className="w-full overflow-hidden rounded-card border border-slate-200 bg-white text-left"
    >
      <thead className="bg-gray-50 text-sm font-semibold text-slate-700">
        <tr>
          {COLUMN_HEADERS.map((header) => (
            <th key={header} className="px-4 py-3">
              {header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {disputes.map((dispute) => (
          <DisputeRow key={dispute.id} dispute={dispute} />
        ))}
      </tbody>
    </table>
  );
}
