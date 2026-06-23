import { describe, it, expect } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import fc from 'fast-check';
import { DisputeSummaryCard } from '../../src/components/DisputeSummaryCard';
import { TriageRecommendationCard } from '../../src/components/TriageRecommendationCard';
import type { Priority } from '../../src/types/dispute';

const PRIORITIES: Priority[] = ['P1', 'P2', 'Standard'];

/**
 * The canonical priority colour mapping from the design document.
 * Both the summary-card priority badge and the triage-card left border must derive
 * their colours from this single source of truth.
 */
const PRIORITY_COLOURS: Record<Priority, { badge: string; border: string }> = {
  P1: { badge: 'bg-red-100 text-red-700', border: 'border-l-red-600' },
  P2: { badge: 'bg-amber-100 text-amber-700', border: 'border-l-amber-500' },
  Standard: { badge: 'bg-gray-100 text-gray-700', border: 'border-l-gray-400' },
};

/**
 * Property 4: Priority Colour Mapping Consistency
 * For any priority value, both the priority badge in the summary card and the left border of
 * the triage recommendation card use the colour defined in PRIORITY_COLOURS for that priority.
 * Validates: Requirements 3.2, 4.2
 */
describe('Property 4: Priority Colour Mapping Consistency', () => {
  it('should colour the summary-card priority badge per PRIORITY_COLOURS for any priority', () => {
    fc.assert(
      fc.property(fc.constantFrom(...PRIORITIES), (priority) => {
        const { unmount } = render(
          <DisputeSummaryCard
            status="Reported"
            priority={priority}
            category="Unauthorised/Fraudulent Charge"
            totalAmount={16500}
            dateRaised="2025-01-01T00:00:00.000Z"
          />
        );

        const card = screen.getByTestId('dispute-summary-card');
        const badge = within(card).getByText(priority);
        PRIORITY_COLOURS[priority].badge
          .split(' ')
          .forEach((cls) => expect(badge).toHaveClass(cls));

        unmount();
      })
    );
  });

  it('should colour the triage-card left border per PRIORITY_COLOURS for any priority', () => {
    fc.assert(
      fc.property(fc.constantFrom(...PRIORITIES), (priority) => {
        const { unmount } = render(
          <TriageRecommendationCard recommendation="Standard Investigation" priority={priority} />
        );

        const card = screen.getByTestId('triage-recommendation');
        expect(card).toHaveClass('border-l-4');
        expect(card).toHaveClass(PRIORITY_COLOURS[priority].border);

        unmount();
      })
    );
  });
});
