import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import fc from 'fast-check';
import { DisputeRow } from '../src/components/DisputeRow';
import type { DisputeSummary, Status, Priority } from '../src/types';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

const STATUSES: Status[] = ['Reported', 'UnderInvestigation', 'Escalated', 'Resolved', 'Referred'];
const PRIORITIES: Priority[] = ['P1', 'P2', 'Standard'];

const disputeArb: fc.Arbitrary<DisputeSummary> = fc.record({
  id: fc.integer({ min: 1, max: 1_000_000 }),
  customerId: fc.integer({ min: 1, max: 10_000 }),
  customerName: fc.string({ minLength: 1, maxLength: 30 }).filter((s) => s.trim().length > 0),
  status: fc.constantFrom(...STATUSES),
  category: fc.constant('Unauthorised/Fraudulent Charge'),
  totalAmount: fc.integer({ min: 0, max: 5_000_000 }),
  dateRaised: fc.constant('2025-06-22T07:30:00.000Z'),
  priority: fc.constantFrom(...PRIORITIES),
  recommendation: fc.constant('Standard Investigation'),
  resolutionOutcome: fc.constant(null),
  createdAt: fc.constant('2025-06-22T07:30:00.000Z'),
  updatedAt: fc.constant('2025-06-22T07:30:00.000Z'),
});

function renderRow(dispute: DisputeSummary) {
  return render(
    <MemoryRouter>
      <table>
        <tbody>
          <DisputeRow dispute={dispute} />
        </tbody>
      </table>
    </MemoryRouter>
  );
}

describe('DisputeRow properties', () => {
  beforeEach(() => {
    mockNavigate.mockReset();
  });

  /**
   * Property 5: Row Data Integrity
   * For any dispute, the row displays the numeric id, the customer name, and has
   * data-testid="dispute-row-{id}".
   */
  it('Property 5: should display id, customer name and correct data-testid for any dispute', () => {
    fc.assert(
      fc.property(disputeArb, (dispute) => {
        renderRow(dispute);
        const row = screen.getByTestId(`dispute-row-${dispute.id}`);
        expect(row).toHaveTextContent(String(dispute.id));
        expect(row).toHaveTextContent(dispute.customerName);
        cleanup();
      })
    );
  });

  /**
   * Property 9: Navigation Correctness
   * For any dispute, clicking the row navigates to /disputes/{id}.
   */
  it('Property 9: should navigate to /disputes/{id} when any row is clicked', () => {
    fc.assert(
      fc.property(disputeArb, (dispute) => {
        mockNavigate.mockReset();
        renderRow(dispute);
        fireEvent.click(screen.getByTestId(`dispute-row-${dispute.id}`));
        expect(mockNavigate).toHaveBeenCalledWith(`/disputes/${dispute.id}`);
        cleanup();
      })
    );
  });
});
