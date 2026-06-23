import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { DisputeRow } from '../src/components/DisputeRow';
import type { DisputeSummary } from '../src/types';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

const DISPUTE: DisputeSummary = {
  id: 42,
  customerId: 7,
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
};

function renderRow(dispute: DisputeSummary = DISPUTE) {
  render(
    <MemoryRouter>
      <table>
        <tbody>
          <DisputeRow dispute={dispute} />
        </tbody>
      </table>
    </MemoryRouter>
  );
}

describe('DisputeRow', () => {
  beforeEach(() => {
    mockNavigate.mockReset();
  });

  it('should assign data-testid dispute-row-{id}', () => {
    renderRow();
    expect(screen.getByTestId('dispute-row-42')).toBeInTheDocument();
  });

  it('should display the numeric id', () => {
    renderRow();
    const row = screen.getByTestId('dispute-row-42');
    expect(row).toHaveTextContent('42');
  });

  it('should display the customer name', () => {
    renderRow();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });

  it('should display the total amount as ZAR currency', () => {
    renderRow();
    expect(screen.getByText('R16,500')).toBeInTheDocument();
  });

  it('should display the date raised in DD MMM YYYY HH:mm format', () => {
    renderRow();
    expect(screen.getByText('22 Jun 2025 07:30')).toBeInTheDocument();
  });

  it('should render status and priority badges', () => {
    renderRow();
    expect(screen.getByText('Reported')).toBeInTheDocument();
    expect(screen.getByText('P1')).toBeInTheDocument();
  });

  it('should apply a cursor-pointer style', () => {
    renderRow();
    expect(screen.getByTestId('dispute-row-42')).toHaveClass('cursor-pointer');
  });

  it('should navigate to /disputes/{id} when clicked', () => {
    renderRow();
    fireEvent.click(screen.getByTestId('dispute-row-42'));
    expect(mockNavigate).toHaveBeenCalledWith('/disputes/42');
  });
});
