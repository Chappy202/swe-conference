import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Dashboard from '../src/pages/Dashboard';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

const SAMPLE = [
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
];

function mockFetchOk(data: unknown) {
  return vi.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve(data) } as Response));
}

function renderDashboard() {
  render(
    <MemoryRouter>
      <Dashboard />
    </MemoryRouter>
  );
}

describe('Dashboard', () => {
  beforeEach(() => {
    mockNavigate.mockReset();
    vi.stubGlobal('fetch', mockFetchOk(SAMPLE));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('header and title', () => {
    it('should render the app header with the system title', async () => {
      renderDashboard();
      const header = screen.getByTestId('app-header');
      expect(header).toHaveTextContent('Dispute Triage');
      expect(header).toHaveClass('h-16');
      expect(header).toHaveClass('bg-[#003366]');
      await waitFor(() => expect(screen.getByTestId('disputes-table')).toBeInTheDocument());
    });

    it('should render the page title "All Disputes" as an h1', async () => {
      renderDashboard();
      const heading = screen.getByRole('heading', { name: 'All Disputes', level: 1 });
      expect(heading).toBeInTheDocument();
      await waitFor(() => expect(screen.getByTestId('disputes-table')).toBeInTheDocument());
    });
  });

  describe('new dispute button', () => {
    it('should render the new dispute button', async () => {
      renderDashboard();
      expect(screen.getByTestId('new-dispute-button')).toBeInTheDocument();
      await waitFor(() => expect(screen.getByTestId('disputes-table')).toBeInTheDocument());
    });

    it('should navigate to /disputes/new when clicked', async () => {
      renderDashboard();
      fireEvent.click(screen.getByTestId('new-dispute-button'));
      expect(mockNavigate).toHaveBeenCalledWith('/disputes/new');
      await waitFor(() => expect(screen.getByTestId('disputes-table')).toBeInTheDocument());
    });
  });

  describe('default state wiring', () => {
    it('should render filter controls with all checkboxes checked', async () => {
      renderDashboard();
      await waitFor(() => expect(screen.getByTestId('disputes-table')).toBeInTheDocument());
      expect(screen.getByTestId('filter-status-reported')).toBeChecked();
      expect(screen.getByTestId('filter-priority-p1')).toBeChecked();
    });

    it('should default the sort field to priority and direction to descending', async () => {
      renderDashboard();
      await waitFor(() => expect(screen.getByTestId('disputes-table')).toBeInTheDocument());
      expect((screen.getByTestId('sort-field') as HTMLSelectElement).value).toBe('priority');
      const url = (fetch as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
      expect(url).toContain('sortBy=priority');
      expect(url).toContain('sortOrder=desc');
    });

    it('should render the disputes returned by the API', async () => {
      renderDashboard();
      await waitFor(() => expect(screen.getByTestId('dispute-row-1')).toBeInTheDocument());
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });
  });

  describe('filtering', () => {
    it('should re-fetch with a status param when a status is unchecked', async () => {
      renderDashboard();
      await waitFor(() => expect(screen.getByTestId('disputes-table')).toBeInTheDocument());
      fireEvent.click(screen.getByTestId('filter-status-resolved'));
      await waitFor(() => {
        const calls = (fetch as ReturnType<typeof vi.fn>).mock.calls;
        const last = calls[calls.length - 1][0] as string;
        expect(last).toContain('status=');
      });
    });
  });
});
