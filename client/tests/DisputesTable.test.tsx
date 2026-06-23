import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { DisputesTable } from '../src/components/DisputesTable';
import type { DisputeSummary } from '../src/types';

const DISPUTES: DisputeSummary[] = [
  {
    id: 1,
    customerId: 1,
    customerName: 'John Doe',
    status: 'Reported',
    category: 'Unauthorised/Fraudulent Charge',
    totalAmount: 16500,
    dateRaised: '2025-06-22T07:30:00.000Z',
    priority: 'P1',
    recommendation: 'P1 High Priority Escalation',
    resolutionOutcome: null,
    createdAt: '2025-06-22T07:30:00.000Z',
    updatedAt: '2025-06-22T07:30:00.000Z',
  },
  {
    id: 2,
    customerId: 2,
    customerName: 'Jane Smith',
    status: 'Resolved',
    category: 'Unauthorised/Fraudulent Charge',
    totalAmount: 8200,
    dateRaised: '2025-06-21T09:00:00.000Z',
    priority: 'P2',
    recommendation: 'Immediate Fraud Freeze',
    resolutionOutcome: 'Refunded',
    createdAt: '2025-06-21T09:00:00.000Z',
    updatedAt: '2025-06-21T09:00:00.000Z',
  },
];

function renderTable(overrides: Partial<Parameters<typeof DisputesTable>[0]> = {}) {
  const props = {
    disputes: DISPUTES,
    isLoading: false,
    error: null as string | null,
    onRetry: vi.fn(),
    ...overrides,
  };
  render(
    <MemoryRouter>
      <DisputesTable {...props} />
    </MemoryRouter>
  );
  return props;
}

describe('DisputesTable', () => {
  describe('when loading', () => {
    it('should render a skeleton loading state with 5 placeholder rows', () => {
      renderTable({ isLoading: true });
      const loading = screen.getByTestId('loading-state');
      expect(loading).toBeInTheDocument();
      expect(loading.querySelectorAll('.animate-pulse').length).toBeGreaterThanOrEqual(5);
    });

    it('should use bg-slate-200 blocks in the skeleton', () => {
      renderTable({ isLoading: true });
      const loading = screen.getByTestId('loading-state');
      expect(loading.querySelector('.bg-slate-200')).toBeTruthy();
    });

    it('should not render the table while loading', () => {
      renderTable({ isLoading: true });
      expect(screen.queryByTestId('disputes-table')).not.toBeInTheDocument();
    });
  });

  describe('when an error occurs', () => {
    it('should render the error state with the expected message', () => {
      renderTable({ error: 'Failed to load disputes. Please try again.' });
      const errorState = screen.getByTestId('error-state');
      expect(errorState).toHaveTextContent('Failed to load disputes. Please try again.');
    });

    it('should render a Retry button that calls onRetry', () => {
      const { onRetry } = renderTable({ error: 'Failed to load disputes. Please try again.' });
      fireEvent.click(screen.getByTestId('retry-button'));
      expect(onRetry).toHaveBeenCalled();
    });

    it('should not render the table when an error occurs', () => {
      renderTable({ error: 'Failed to load disputes. Please try again.' });
      expect(screen.queryByTestId('disputes-table')).not.toBeInTheDocument();
    });
  });

  describe('when no disputes match', () => {
    it('should render the empty state message', () => {
      renderTable({ disputes: [] });
      expect(screen.getByTestId('empty-state')).toHaveTextContent(
        'No disputes found matching your filters.'
      );
    });

    it('should hide the table when empty', () => {
      renderTable({ disputes: [] });
      expect(screen.queryByTestId('disputes-table')).not.toBeInTheDocument();
    });
  });

  describe('when disputes are present', () => {
    it('should render the disputes table', () => {
      renderTable();
      expect(screen.getByTestId('disputes-table')).toBeInTheDocument();
    });

    it('should render column headers', () => {
      renderTable();
      const table = screen.getByTestId('disputes-table');
      const headers = within(table)
        .getAllByRole('columnheader')
        .map((th) => th.textContent);
      expect(headers).toEqual([
        'ID',
        'Customer',
        'Status',
        'Priority',
        'Total Amount',
        'Date Raised',
      ]);
    });

    it('should render a row per dispute', () => {
      renderTable();
      expect(screen.getByTestId('dispute-row-1')).toBeInTheDocument();
      expect(screen.getByTestId('dispute-row-2')).toBeInTheDocument();
    });

    it('should use semantic table elements', () => {
      renderTable();
      const table = screen.getByTestId('disputes-table');
      expect(table.tagName).toBe('TABLE');
      expect(table.querySelector('thead')).toBeTruthy();
      expect(table.querySelector('tbody')).toBeTruthy();
    });
  });
});
