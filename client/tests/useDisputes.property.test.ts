import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { buildDisputesUrl } from '../src/hooks/useDisputes';
import type { Status, Priority, SortField, SortOrder } from '../src/types';

const ALL_STATUSES: Status[] = [
  'Reported',
  'UnderInvestigation',
  'Escalated',
  'Resolved',
  'Referred',
];
const ALL_PRIORITIES: Priority[] = ['P1', 'P2', 'Standard'];
const SORT_FIELDS: SortField[] = ['dateRaised', 'totalAmount', 'priority'];
const SORT_ORDERS: SortOrder[] = ['asc', 'desc'];

/** Generates a non-empty subset of an array preserving the source order. */
function subsetArb<T>(source: T[]): fc.Arbitrary<T[]> {
  return fc
    .subarray(source, { minLength: 1, maxLength: source.length })
    .map((items) => source.filter((item) => items.includes(item)));
}

/**
 * Property 8: API Query Parameter Serialization
 * For any combination of checked statuses/priorities and sort config, buildDisputesUrl
 * constructs the correct query: comma-joined values, omitted when all checked, and
 * sortBy/sortOrder always present.
 */
describe('Property 8: API Query Parameter Serialization', () => {
  it('should serialize any filter/sort combination correctly', () => {
    fc.assert(
      fc.property(
        subsetArb(ALL_STATUSES),
        subsetArb(ALL_PRIORITIES),
        fc.constantFrom(...SORT_FIELDS),
        fc.constantFrom(...SORT_ORDERS),
        (status, priority, sortBy, sortOrder) => {
          const url = buildDisputesUrl({ status, priority, sortBy, sortOrder });
          const query = new URLSearchParams(url.split('?')[1]);

          // sortBy / sortOrder always present and exact.
          expect(query.get('sortBy')).toBe(sortBy);
          expect(query.get('sortOrder')).toBe(sortOrder);

          // status param: omitted iff all checked, else comma-joined.
          if (status.length === ALL_STATUSES.length) {
            expect(query.has('status')).toBe(false);
          } else {
            expect(query.get('status')).toBe(status.join(','));
          }

          // priority param: omitted iff all checked, else comma-joined.
          if (priority.length === ALL_PRIORITIES.length) {
            expect(query.has('priority')).toBe(false);
          } else {
            expect(query.get('priority')).toBe(priority.join(','));
          }
        }
      )
    );
  });
});
