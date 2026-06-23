import type { Status } from '../types';

/** Props for the StatusBadge component. */
export interface StatusBadgeProps {
  /** The dispute lifecycle status to display. */
  status: Status;
}

/** Tailwind colour classes per status, per the design's STATUS_STYLES mapping. */
export const STATUS_STYLES: Record<Status, string> = {
  Reported: 'bg-blue-100 text-blue-700',
  UnderInvestigation: 'bg-violet-100 text-violet-700',
  Escalated: 'bg-amber-100 text-amber-700',
  Resolved: 'bg-emerald-100 text-emerald-700',
  Referred: 'bg-gray-100 text-gray-700',
};

/** Human-readable label per status (status names are otherwise PascalCase). */
export const STATUS_LABELS: Record<Status, string> = {
  Reported: 'Reported',
  UnderInvestigation: 'Under Investigation',
  Escalated: 'Escalated',
  Resolved: 'Resolved',
  Referred: 'Referred',
};

/** A colour-coded pill indicating a dispute's lifecycle status. */
export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span
      className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[status]}`}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}
