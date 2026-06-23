import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import fc from 'fast-check';
import { PriorityBadge, PRIORITY_STYLES } from '../src/components/PriorityBadge';
import { StatusBadge, STATUS_STYLES, STATUS_LABELS } from '../src/components/StatusBadge';
import type { Priority, Status } from '../src/types';

const PRIORITIES: Priority[] = ['P1', 'P2', 'Standard'];
const STATUSES: Status[] = ['Reported', 'UnderInvestigation', 'Escalated', 'Resolved', 'Referred'];

/**
 * Property 6: Priority Badge Correctness
 * For any valid priority, PriorityBadge renders exactly the PRIORITY_STYLES classes
 * and displays the priority value as text.
 */
describe('Property 6: Priority Badge Correctness', () => {
  it('should render deterministic classes and text for any priority', () => {
    fc.assert(
      fc.property(fc.constantFrom(...PRIORITIES), (priority) => {
        const { unmount } = render(<PriorityBadge priority={priority} />);
        const badge = screen.getByText(priority);
        PRIORITY_STYLES[priority].split(' ').forEach((cls) => expect(badge).toHaveClass(cls));
        unmount();
      })
    );
  });
});

/**
 * Property 7: Status Badge Correctness
 * For any valid status, StatusBadge renders exactly the STATUS_STYLES classes
 * and displays the status name as text.
 */
describe('Property 7: Status Badge Correctness', () => {
  it('should render deterministic classes and text for any status', () => {
    fc.assert(
      fc.property(fc.constantFrom(...STATUSES), (status) => {
        const { unmount } = render(<StatusBadge status={status} />);
        const badge = screen.getByText(STATUS_LABELS[status]);
        STATUS_STYLES[status].split(' ').forEach((cls) => expect(badge).toHaveClass(cls));
        unmount();
      })
    );
  });
});
