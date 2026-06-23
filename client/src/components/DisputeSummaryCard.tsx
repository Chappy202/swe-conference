import { Status, Priority } from '../types/dispute';
import { formatZAR, formatDateTime } from '../utils/formatters';

/** Props for the DisputeSummaryCard component. */
export interface DisputeSummaryCardProps {
  /** Current dispute status. */
  status: Status;
  /** Triage priority level. */
  priority: Priority;
  /** Dispute category (e.g. "Unauthorised/Fraudulent Charge"). */
  category: string;
  /** Total dispute amount in ZAR cents-free (e.g. 16500 means R16,500). */
  totalAmount: number;
  /** ISO date string of when the dispute was raised. */
  dateRaised: string;
}

const STATUS_COLOURS: Record<Status, string> = {
  Reported: 'bg-indigo-100 text-indigo-700',
  UnderInvestigation: 'bg-blue-100 text-blue-700',
  Escalated: 'bg-red-100 text-red-700',
  Resolved: 'bg-green-100 text-green-700',
  Referred: 'bg-purple-100 text-purple-700',
};

const STATUS_LABELS: Record<Status, string> = {
  Reported: 'Reported',
  UnderInvestigation: 'Under Investigation',
  Escalated: 'Escalated',
  Resolved: 'Resolved',
  Referred: 'Referred',
};

const PRIORITY_COLOURS: Record<Priority, string> = {
  P1: 'bg-red-100 text-red-700',
  P2: 'bg-amber-100 text-amber-700',
  Standard: 'bg-gray-100 text-gray-700',
};

/** Inline badge component for status display. */
function StatusBadge({ status }: { status: Status }) {
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLOURS[status]}`}>
      {STATUS_LABELS[status]}
    </span>
  );
}

/** Inline badge component for priority display. */
function PriorityBadge({ priority }: { priority: Priority }) {
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${PRIORITY_COLOURS[priority]}`}>
      {priority}
    </span>
  );
}

/** Displays dispute status, priority, category, amount, and date raised. */
export function DisputeSummaryCard({
  status,
  priority,
  category,
  totalAmount,
  dateRaised,
}: DisputeSummaryCardProps) {
  return (
    <div
      data-testid="dispute-summary-card"
      className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
    >
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
        Dispute Summary
      </h2>
      <div className="space-y-2 text-sm">
        <div className="flex items-center gap-2">
          <StatusBadge status={status} />
          <PriorityBadge priority={priority} />
        </div>
        <dl className="space-y-2">
          <div>
            <dt className="text-gray-500">Category</dt>
            <dd className="font-medium text-gray-900">{category}</dd>
          </div>
          <div>
            <dt className="text-gray-500">Total Amount</dt>
            <dd className="font-medium text-gray-900">{formatZAR(totalAmount)}</dd>
          </div>
          <div>
            <dt className="text-gray-500">Date Raised</dt>
            <dd className="font-medium text-gray-900">{formatDateTime(dateRaised)}</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
