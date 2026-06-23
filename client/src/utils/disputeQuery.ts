import type { DisputeSummary, Priority, SortField, SortOrder } from '../types';

/** Priority rank for ordering: higher rank = more urgent (P1 > P2 > Standard). */
const PRIORITY_RANK: Record<Priority, number> = {
  P1: 3,
  P2: 2,
  Standard: 1,
};

/**
 * Filters disputes to those whose status is in `statuses` AND whose priority is in
 * `priorities`. Mirrors the server-side filtering contract the dashboard depends on.
 */
export function filterDisputes(
  disputes: DisputeSummary[],
  statuses: DisputeSummary['status'][],
  priorities: Priority[]
): DisputeSummary[] {
  return disputes.filter(
    (dispute) => statuses.includes(dispute.status) && priorities.includes(dispute.priority)
  );
}

/** Compares two disputes by the chosen sort field (ascending). */
function compareByField(a: DisputeSummary, b: DisputeSummary, sortBy: SortField): number {
  switch (sortBy) {
    case 'totalAmount':
      return a.totalAmount - b.totalAmount;
    case 'priority':
      return PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
    case 'dateRaised':
    default:
      return new Date(a.dateRaised).getTime() - new Date(b.dateRaised).getTime();
  }
}

/**
 * Sorts disputes by the chosen field and direction. Ties are broken by dateRaised
 * descending (newest first), per Requirement 5.4. Returns a new array.
 */
export function sortDisputes(
  disputes: DisputeSummary[],
  sortBy: SortField,
  sortOrder: SortOrder
): DisputeSummary[] {
  const directionFactor = sortOrder === 'asc' ? 1 : -1;
  return [...disputes].sort((a, b) => {
    const primary = compareByField(a, b, sortBy) * directionFactor;
    if (primary !== 0) {
      return primary;
    }
    // Tiebreaker: dateRaised descending (newest first).
    return new Date(b.dateRaised).getTime() - new Date(a.dateRaised).getTime();
  });
}
