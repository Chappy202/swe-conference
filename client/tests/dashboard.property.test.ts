import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { filterDisputes, sortDisputes } from '../src/utils/disputeQuery';
import type { DisputeSummary, Priority, SortField, SortOrder, Status } from '../src/types';

const STATUSES: Status[] = ['Reported', 'UnderInvestigation', 'Escalated', 'Resolved', 'Referred'];
const PRIORITIES: Priority[] = ['P1', 'P2', 'Standard'];
const PRIORITY_RANK: Record<Priority, number> = { P1: 3, P2: 2, Standard: 1 };

const disputeArb: fc.Arbitrary<DisputeSummary> = fc.record({
  id: fc.integer({ min: 1, max: 1_000_000 }),
  customerId: fc.integer({ min: 1, max: 10_000 }),
  customerName: fc.string({ minLength: 1, maxLength: 20 }),
  status: fc.constantFrom(...STATUSES),
  category: fc.constant('Unauthorised/Fraudulent Charge'),
  totalAmount: fc.integer({ min: 0, max: 1_000_000 }),
  // Distinct timestamps across a wide range so tiebreaker behaviour is exercised.
  dateRaised: fc
    .integer({ min: 0, max: 100 })
    .map((days) => new Date(2025, 0, 1 + days).toISOString()),
  priority: fc.constantFrom(...PRIORITIES),
  recommendation: fc.constant('Standard Investigation'),
  resolutionOutcome: fc.constant(null),
  createdAt: fc.constant('2025-01-01T00:00:00.000Z'),
  updatedAt: fc.constant('2025-01-01T00:00:00.000Z'),
});

function subsetArb<T>(source: T[]): fc.Arbitrary<T[]> {
  return fc.subarray(source, { minLength: 1, maxLength: source.length });
}

/**
 * Property 1: Filter Accuracy
 * Every displayed dispute matches the checked statuses AND priorities, and no matching
 * dispute is omitted.
 */
describe('Property 1: Filter Accuracy', () => {
  it('should display exactly the disputes that match both filters', () => {
    fc.assert(
      fc.property(
        fc.array(disputeArb, { maxLength: 40 }),
        subsetArb(STATUSES),
        subsetArb(PRIORITIES),
        (disputes, statuses, priorities) => {
          const result = filterDisputes(disputes, statuses, priorities);

          // Soundness: every shown dispute matches the filters.
          result.forEach((dispute) => {
            expect(statuses).toContain(dispute.status);
            expect(priorities).toContain(dispute.priority);
          });

          // Completeness: every matching dispute is shown.
          const expectedCount = disputes.filter(
            (d) => statuses.includes(d.status) && priorities.includes(d.priority)
          ).length;
          expect(result).toHaveLength(expectedCount);
        }
      )
    );
  });
});

/**
 * Property 2: Sort Correctness
 * Rows are ordered by the chosen field/direction, with dateRaised desc as the tiebreaker.
 */
describe('Property 2: Sort Correctness', () => {
  const fieldValue = (dispute: DisputeSummary, sortBy: SortField): number => {
    if (sortBy === 'totalAmount') return dispute.totalAmount;
    if (sortBy === 'priority') return PRIORITY_RANK[dispute.priority];
    return new Date(dispute.dateRaised).getTime();
  };

  it('should order every adjacent pair correctly with dateRaised desc tiebreaker', () => {
    fc.assert(
      fc.property(
        fc.array(disputeArb, { maxLength: 40 }),
        fc.constantFrom<SortField>('dateRaised', 'totalAmount', 'priority'),
        fc.constantFrom<SortOrder>('asc', 'desc'),
        (disputes, sortBy, sortOrder) => {
          const sorted = sortDisputes(disputes, sortBy, sortOrder);

          for (let i = 0; i < sorted.length - 1; i += 1) {
            const a = sorted[i];
            const b = sorted[i + 1];
            const va = fieldValue(a, sortBy);
            const vb = fieldValue(b, sortBy);

            if (va !== vb) {
              if (sortOrder === 'asc') {
                expect(va).toBeLessThanOrEqual(vb);
              } else {
                expect(va).toBeGreaterThanOrEqual(vb);
              }
            } else {
              // Tie: newer dateRaised must come first.
              const da = new Date(a.dateRaised).getTime();
              const db = new Date(b.dateRaised).getTime();
              expect(da).toBeGreaterThanOrEqual(db);
            }
          }
        }
      )
    );
  });

  it('should place P1 before P2 before Standard under default sort (priority desc)', () => {
    fc.assert(
      fc.property(fc.array(disputeArb, { maxLength: 40 }), (disputes) => {
        const sorted = sortDisputes(disputes, 'priority', 'desc');
        const ranks = sorted.map((d) => PRIORITY_RANK[d.priority]);
        for (let i = 0; i < ranks.length - 1; i += 1) {
          expect(ranks[i]).toBeGreaterThanOrEqual(ranks[i + 1]);
        }
      })
    );
  });
});
