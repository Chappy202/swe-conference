import type { Priority } from '../types';

/** Props for the PriorityBadge component. */
export interface PriorityBadgeProps {
  /** The triage priority to display. */
  priority: Priority;
}

/** Tailwind colour classes per priority, per the design's PRIORITY_STYLES mapping. */
export const PRIORITY_STYLES: Record<Priority, string> = {
  P1: 'bg-red-100 text-red-700',
  P2: 'bg-amber-100 text-amber-700',
  Standard: 'bg-gray-100 text-gray-700',
};

/** A colour-coded pill indicating a dispute's triage priority. */
export function PriorityBadge({ priority }: PriorityBadgeProps) {
  return (
    <span
      className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${PRIORITY_STYLES[priority]}`}
    >
      {priority}
    </span>
  );
}
