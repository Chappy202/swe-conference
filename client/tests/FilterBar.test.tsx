import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FilterBar } from '../src/components/FilterBar';
import type { Status, Priority } from '../src/types';

const ALL_STATUSES: Status[] = [
  'Reported',
  'UnderInvestigation',
  'Escalated',
  'Resolved',
  'Referred',
];
const ALL_PRIORITIES: Priority[] = ['P1', 'P2', 'Standard'];

function renderBar(overrides: Partial<Parameters<typeof FilterBar>[0]> = {}) {
  const props = {
    statuses: ALL_STATUSES,
    priorities: ALL_PRIORITIES,
    onStatusChange: vi.fn(),
    onPriorityChange: vi.fn(),
    ...overrides,
  };
  render(<FilterBar {...props} />);
  return props;
}

describe('FilterBar', () => {
  describe('when all filters are selected (default)', () => {
    it('should render every status checkbox checked', () => {
      renderBar();
      ALL_STATUSES.forEach((status) => {
        const checkbox = screen.getByTestId(`filter-status-${status.toLowerCase()}`);
        expect(checkbox).toBeChecked();
      });
    });

    it('should render every priority checkbox checked', () => {
      renderBar();
      ALL_PRIORITIES.forEach((priority) => {
        const checkbox = screen.getByTestId(`filter-priority-${priority.toLowerCase()}`);
        expect(checkbox).toBeChecked();
      });
    });

    it('should render an accessible label for each status checkbox', () => {
      renderBar();
      expect(screen.getByLabelText('Under Investigation')).toBeInTheDocument();
      expect(screen.getByLabelText('Reported')).toBeInTheDocument();
    });
  });

  describe('when a checked status checkbox is unchecked', () => {
    it('should call onStatusChange without that status', () => {
      const { onStatusChange } = renderBar();
      fireEvent.click(screen.getByTestId('filter-status-resolved'));
      expect(onStatusChange).toHaveBeenCalledWith([
        'Reported',
        'UnderInvestigation',
        'Escalated',
        'Referred',
      ]);
    });
  });

  describe('when an unchecked status checkbox is re-checked', () => {
    it('should call onStatusChange including that status', () => {
      const { onStatusChange } = renderBar({ statuses: ['Reported', 'Escalated'] });
      fireEvent.click(screen.getByTestId('filter-status-resolved'));
      expect(onStatusChange).toHaveBeenCalledWith(['Reported', 'Escalated', 'Resolved']);
    });
  });

  describe('when a priority checkbox is toggled', () => {
    it('should call onPriorityChange without that priority', () => {
      const { onPriorityChange } = renderBar();
      fireEvent.click(screen.getByTestId('filter-priority-p1'));
      expect(onPriorityChange).toHaveBeenCalledWith(['P2', 'Standard']);
    });
  });
});
