import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import DisputeDetailPage from '../../src/pages/DisputeDetail';
import { DisputeDetail } from '../../src/types/dispute';

const mockDispute: DisputeDetail = {
  id: 1,
  customerId: 1,
  customer: {
    id: 1,
    name: 'John Doe',
    contactReference: 'REF-001',
    accountIdentifier: 'ACC-12345',
  },
  status: 'UnderInvestigation',
  category: 'Unauthorised/Fraudulent Charge',
  totalAmount: 16500,
  dateRaised: '2024-01-15T10:30:00.000Z',
  priority: 'P1',
  recommendation: 'Immediate Fraud Freeze + P1 Escalation',
  ruleTrace: {
    evaluatedAt: '2024-01-15T10:30:00.000Z',
    inputs: {
      youngestTransactionAge: '12 hours',
      totalAmount: 16500,
    },
    rules: [
      {
        rule: 'Amount Threshold',
        condition: 'totalAmount > 10000',
        result: true,
        detail: 'R16,500 exceeds R10,000 threshold',
      },
      {
        rule: 'Transaction Age',
        condition: 'youngest transaction < 48 hours',
        result: true,
        detail: '12 hours is within 48 hour window',
      },
    ],
    recommendation: 'Immediate Fraud Freeze + P1 Escalation',
    priority: 'P1',
  },
  resolutionOutcome: null,
  transactions: [
    {
      id: 1,
      amount: 8500,
      merchant: 'Store A',
      timestamp: '2024-01-15T08:00:00.000Z',
      paymentType: 'ApplePay',
      createdAt: '2024-01-15T10:30:00.000Z',
    },
    {
      id: 2,
      amount: 8000,
      merchant: 'Store B',
      timestamp: '2024-01-15T09:00:00.000Z',
      paymentType: 'ApplePay',
      createdAt: '2024-01-15T10:30:00.000Z',
    },
  ],
  createdAt: '2024-01-15T10:30:00.000Z',
  updatedAt: '2024-01-15T10:30:00.000Z',
};

function renderPage(id = '1') {
  return render(
    <MemoryRouter initialEntries={[`/disputes/${id}`]}>
      <Routes>
        <Route path="/disputes/:id" element={<DisputeDetailPage />} />
        <Route path="/" element={<div data-testid="dashboard">Dashboard</div>} />
      </Routes>
    </MemoryRouter>
  );
}

describe('DisputeDetailPage', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('when loading', () => {
    it('should show loading skeleton with data-testid="loading-state"', () => {
      vi.stubGlobal(
        'fetch',
        vi.fn(() => new Promise(() => {}))
      );

      renderPage();

      expect(screen.getByTestId('loading-state')).toBeInTheDocument();
    });
  });

  describe('when data loads successfully', () => {
    beforeEach(() => {
      vi.stubGlobal(
        'fetch',
        vi.fn(() =>
          Promise.resolve({
            ok: true,
            status: 200,
            json: () => Promise.resolve(mockDispute),
          } as Response)
        )
      );
    });

    it('should render back link with data-testid="back-to-dashboard"', async () => {
      renderPage();

      const backLink = await screen.findByTestId('back-to-dashboard');
      expect(backLink).toBeInTheDocument();
      expect(backLink).toHaveAttribute('href', '/');
    });

    it('should render title <h1> "Dispute #1" with data-testid="dispute-title"', async () => {
      renderPage();

      const title = await screen.findByTestId('dispute-title');
      expect(title).toBeInTheDocument();
      expect(title.tagName).toBe('H1');
      expect(title).toHaveTextContent('Dispute #1');
    });

    it('should render customer info card', async () => {
      renderPage();

      await screen.findByTestId('dispute-title');
      expect(screen.getByTestId('customer-info-card')).toBeInTheDocument();
    });

    it('should render dispute summary card', async () => {
      renderPage();

      await screen.findByTestId('dispute-title');
      expect(screen.getByTestId('dispute-summary-card')).toBeInTheDocument();
    });

    it('should render triage recommendation card', async () => {
      renderPage();

      await screen.findByTestId('dispute-title');
      expect(screen.getByTestId('triage-recommendation')).toBeInTheDocument();
    });

    it('should render rule trace section', async () => {
      renderPage();

      await screen.findByTestId('dispute-title');
      expect(screen.getByTestId('rule-trace-section')).toBeInTheDocument();
    });

    it('should render transactions table', async () => {
      renderPage();

      await screen.findByTestId('dispute-title');
      expect(screen.getByTestId('transactions-table')).toBeInTheDocument();
    });

    it('should not render resolution outcome for non-resolved dispute', async () => {
      renderPage();

      await screen.findByTestId('dispute-title');
      expect(screen.queryByTestId('resolution-outcome')).not.toBeInTheDocument();
    });
  });

  describe('when API returns 404', () => {
    it('should show not-found state with data-testid="not-found-state"', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn(() =>
          Promise.resolve({
            ok: false,
            status: 404,
            json: () => Promise.resolve({ error: 'DISPUTE_NOT_FOUND' }),
          } as Response)
        )
      );

      renderPage();

      const notFound = await screen.findByTestId('not-found-state');
      expect(notFound).toBeInTheDocument();
      expect(notFound).toHaveTextContent('Dispute not found.');
    });
  });

  describe('when API request fails', () => {
    it('should show error state with data-testid="error-state" and retry button', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn(() =>
          Promise.resolve({
            ok: false,
            status: 500,
            json: () => Promise.resolve({ error: 'Internal Server Error' }),
          } as Response)
        )
      );

      renderPage();

      const errorState = await screen.findByTestId('error-state');
      expect(errorState).toBeInTheDocument();
      expect(errorState).toHaveTextContent(
        'Failed to load dispute details. Please try again.'
      );
      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
    });

    it('should retry fetching when retry button is clicked', async () => {
      const fetchMock = vi
        .fn()
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          json: () => Promise.resolve({ error: 'Internal Server Error' }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: () => Promise.resolve(mockDispute),
        } as Response);

      vi.stubGlobal('fetch', fetchMock);

      renderPage();

      const retryButton = await screen.findByRole('button', { name: /retry/i });
      fireEvent.click(retryButton);

      await screen.findByTestId('dispute-title');
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });
  });

  describe('when dispute is resolved', () => {
    it('should show resolution outcome display', async () => {
      const resolvedDispute: DisputeDetail = {
        ...mockDispute,
        status: 'Resolved',
        resolutionOutcome: 'Refunded',
      };

      vi.stubGlobal(
        'fetch',
        vi.fn(() =>
          Promise.resolve({
            ok: true,
            status: 200,
            json: () => Promise.resolve(resolvedDispute),
          } as Response)
        )
      );

      renderPage();

      await screen.findByTestId('dispute-title');
      expect(screen.getByTestId('resolution-outcome')).toBeInTheDocument();
    });
  });

  describe('modal state management', () => {
    beforeEach(() => {
      vi.stubGlobal(
        'fetch',
        vi.fn(() =>
          Promise.resolve({
            ok: true,
            status: 200,
            json: () => Promise.resolve(mockDispute),
          } as Response)
        )
      );
    });

    it('should open resolution modal when resolve button is clicked', async () => {
      renderPage();

      await screen.findByTestId('dispute-title');
      const resolveButton = screen.getByTestId('action-resolve');
      fireEvent.click(resolveButton);

      await waitFor(() => {
        expect(screen.getByTestId('resolution-modal')).toBeInTheDocument();
      });
    });

    it('should open add transaction modal when add transaction button is clicked', async () => {
      renderPage();

      await screen.findByTestId('dispute-title');
      const addButton = screen.getByTestId('add-transaction-button');
      fireEvent.click(addButton);

      await waitFor(() => {
        expect(screen.getByTestId('add-txn-amount')).toBeInTheDocument();
      });
    });

    it('should close resolution modal when cancel is clicked', async () => {
      renderPage();

      await screen.findByTestId('dispute-title');
      const resolveButton = screen.getByTestId('action-resolve');
      fireEvent.click(resolveButton);

      await screen.findByTestId('resolution-modal');
      const cancelButton = screen.getByTestId('modal-cancel');
      fireEvent.click(cancelButton);

      await waitFor(() => {
        expect(screen.queryByTestId('resolution-modal')).not.toBeInTheDocument();
      });
    });
  });
});
