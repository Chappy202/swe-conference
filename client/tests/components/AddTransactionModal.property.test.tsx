import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import fc from 'fast-check';
import { AddTransactionModal } from '../../src/components/AddTransactionModal';

const PAYMENT_TYPE_OPTIONS = ['', 'Card', 'ApplePay', 'EFT'];

/**
 * Generates a wide spread of field combinations covering valid and invalid cases:
 * - amounts: empty, zero, negative, positive, non-numeric
 * - merchants: empty, whitespace-only, populated
 * - timestamps: empty or a datetime-local value
 * - payment types: unselected ('') or a real type
 */
const fieldComboArb = fc.record({
  amount: fc.constantFrom('', '0', '-5', '100', '0.5', 'abc', '  '),
  merchant: fc.constantFrom('', '   ', 'Store'),
  timestamp: fc.constantFrom('', '2024-01-15T10:30'),
  paymentType: fc.constantFrom(...PAYMENT_TYPE_OPTIONS),
});

/** Mirrors the component's validity contract from the design / Property 8 definition. */
function isExpectedEnabled(combo: {
  amount: string;
  merchant: string;
  timestamp: string;
  paymentType: string;
}): boolean {
  const parsed = parseFloat(combo.amount);
  return (
    !Number.isNaN(parsed) &&
    parsed > 0 &&
    combo.merchant.trim() !== '' &&
    combo.timestamp !== '' &&
    combo.paymentType !== ''
  );
}

describe('Property 8: Add Transaction Validation Gate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve({ id: 1 }) } as Response))
    );
  });

  it('should enable submit iff amount>0, merchant non-empty, timestamp set, and payment type selected', () => {
    fc.assert(
      fc.property(fieldComboArb, (combo) => {
        render(<AddTransactionModal isOpen disputeId={42} onClose={vi.fn()} onAdded={vi.fn()} />);

        fireEvent.change(screen.getByTestId('add-txn-amount'), {
          target: { value: combo.amount },
        });
        fireEvent.change(screen.getByTestId('add-txn-merchant'), {
          target: { value: combo.merchant },
        });
        fireEvent.change(screen.getByTestId('add-txn-timestamp'), {
          target: { value: combo.timestamp },
        });
        fireEvent.change(screen.getByTestId('add-txn-payment-type'), {
          target: { value: combo.paymentType },
        });

        const submit = screen.getByTestId('add-txn-submit');
        if (isExpectedEnabled(combo)) {
          expect(submit).toBeEnabled();
        } else {
          expect(submit).toBeDisabled();
        }

        cleanup();
      })
    );
  });
});
