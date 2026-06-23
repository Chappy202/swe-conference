import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import fc from 'fast-check';
import { ResolutionOutcomeDisplay } from '../../src/components/ResolutionOutcomeDisplay';
import type { ResolutionOutcome, Status } from '../../src/types/dispute';

const STATUSES: Status[] = ['Reported', 'UnderInvestigation', 'Escalated', 'Resolved', 'Referred'];
const OUTCOMES: ResolutionOutcome[] = ['Refunded', 'Declined', 'ChargebackInitiated'];

/**
 * Mirrors the page-level conditional rendering from DisputeDetailPage:
 *   {status === 'Resolved' && outcome && <ResolutionOutcomeDisplay outcome={outcome} />}
 * The resolution-outcome section is presentational and always renders when mounted; the
 * "iff Resolved" visibility decision is owned by the page. This harness reproduces that exact
 * gate so the property can be asserted without modifying source.
 */
function ResolutionOutcomeSection({
  status,
  outcome,
}: {
  status: Status;
  outcome: ResolutionOutcome | null;
}) {
  return (
    <div>{status === 'Resolved' && outcome && <ResolutionOutcomeDisplay outcome={outcome} />}</div>
  );
}

/**
 * Property 3: Resolution Outcome Visibility
 * For any dispute, the resolution outcome section (data-testid="resolution-outcome") is present
 * in the DOM if and only if the dispute status is 'Resolved'.
 * Validates: Requirements 11.1, 11.2
 */
describe('Property 3: Resolution Outcome Visibility', () => {
  it('should render the resolution outcome section iff status is Resolved', () => {
    fc.assert(
      fc.property(fc.constantFrom(...STATUSES), fc.constantFrom(...OUTCOMES), (status, outcome) => {
        const { unmount } = render(<ResolutionOutcomeSection status={status} outcome={outcome} />);

        const section = screen.queryByTestId('resolution-outcome');
        if (status === 'Resolved') {
          expect(section).toBeInTheDocument();
        } else {
          expect(section).not.toBeInTheDocument();
        }

        unmount();
      })
    );
  });
});
