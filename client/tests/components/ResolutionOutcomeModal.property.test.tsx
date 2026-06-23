import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import fc from 'fast-check';
import { ResolutionOutcomeModal } from '../../src/components/ResolutionOutcomeModal';
import type { ResolutionOutcome } from '../../src/types/dispute';

const DISMISS_TESTIDS = ['modal-cancel', 'modal-close', 'resolution-modal-overlay'] as const;

const OUTCOME_SELECTIONS: { testId: string; value: ResolutionOutcome }[] = [
  { testId: 'outcome-refunded', value: 'Refunded' },
  { testId: 'outcome-declined', value: 'Declined' },
  { testId: 'outcome-chargeback', value: 'ChargebackInitiated' },
];

describe('ResolutionOutcomeModal properties', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  /**
   * Property 6: Modal Dismiss Safety
   * For any dismissal method (Cancel, close button, overlay), the modal closes (onClose called)
   * AND no API request is made.
   * Validates: Requirements 9.7
   */
  describe('Property 6: Modal Dismiss Safety', () => {
    it('should close without any API request for any dismissal method', () => {
      fc.assert(
        fc.property(fc.constantFrom(...DISMISS_TESTIDS), (dismissTestId) => {
          const fetchMock = vi.fn();
          vi.stubGlobal('fetch', fetchMock);
          const onClose = vi.fn();
          const onResolved = vi.fn();

          render(
            <ResolutionOutcomeModal
              isOpen
              disputeId={42}
              onClose={onClose}
              onResolved={onResolved}
            />
          );

          fireEvent.click(screen.getByTestId(dismissTestId));

          expect(onClose).toHaveBeenCalledTimes(1);
          expect(fetchMock).not.toHaveBeenCalled();
          expect(onResolved).not.toHaveBeenCalled();

          cleanup();
        })
      );
    });
  });

  /**
   * Property 7: Resolution Payload Correctness
   * For any resolution outcome selection, confirming resolution sends a PATCH whose body is
   * exactly { status: "Resolved", resolutionOutcome: <selected_value> }.
   * Validates: Requirements 9.5
   */
  describe('Property 7: Resolution Payload Correctness', () => {
    it('should PATCH the selected outcome exactly for any selection', async () => {
      await fc.assert(
        fc.asyncProperty(fc.constantFrom(...OUTCOME_SELECTIONS), async (selection) => {
          const fetchMock = vi.fn(() =>
            Promise.resolve({ ok: true, json: () => Promise.resolve({}) } as Response)
          );
          vi.stubGlobal('fetch', fetchMock);

          render(
            <ResolutionOutcomeModal isOpen disputeId={42} onClose={vi.fn()} onResolved={vi.fn()} />
          );

          fireEvent.click(screen.getByTestId(selection.testId));
          fireEvent.click(screen.getByTestId('modal-confirm'));

          await waitFor(() => {
            expect(fetchMock).toHaveBeenCalledWith('/api/disputes/42/status', {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ status: 'Resolved', resolutionOutcome: selection.value }),
            });
          });

          // Exactly one request — no duplicate or stray calls.
          expect(fetchMock).toHaveBeenCalledTimes(1);

          cleanup();
        })
      );
    });
  });
});
