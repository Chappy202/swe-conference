import { describe, it, expect } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import fc from 'fast-check';
import { TransactionsTable } from '../../src/components/TransactionsTable';
import { formatZAR, formatDateTime } from '../../src/utils/formatters';
import type { PaymentType, Transaction } from '../../src/types/dispute';

const PAYMENT_TYPES: PaymentType[] = ['Card', 'ApplePay', 'EFT'];

// Transaction without an id — ids are assigned uniquely per list below so that React keys
// never collide (collisions would let React drop/duplicate rows and mask the row-count check).
const transactionBodyArb = fc.record({
  amount: fc.integer({ min: 1, max: 10_000_000 }),
  merchant: fc.string({ minLength: 1, maxLength: 24 }),
  // Distinct, deterministic ISO timestamps within a safe range.
  timestamp: fc
    .integer({ min: 0, max: 100_000 })
    .map((minutes) => new Date(Date.UTC(2024, 0, 1) + minutes * 60_000).toISOString()),
  paymentType: fc.constantFrom(...PAYMENT_TYPES),
  createdAt: fc.constant('2024-01-01T00:00:00.000Z'),
});

const transactionListArb: fc.Arbitrary<Transaction[]> = fc
  .array(transactionBodyArb, { minLength: 1, maxLength: 15 })
  .map((bodies) => bodies.map((body, index) => ({ ...body, id: index + 1 })));

/**
 * Property 5: Transaction Table Rendering Fidelity
 * For any list of N transactions (N >= 1), the table renders exactly N data rows, and within
 * each row the amount is the ZAR-formatted amount and the timestamp is formatted as
 * DD MMM YYYY HH:mm.
 * Validates: Requirements 6.1, 6.2
 */
describe('Property 5: Transaction Table Rendering Fidelity', () => {
  it('should render exactly N rows with ZAR amounts and formatted timestamps', () => {
    fc.assert(
      fc.property(transactionListArb, (transactions) => {
        const { unmount } = render(
          <TransactionsTable transactions={transactions} status="Reported" />
        );

        const table = screen.getByTestId('transactions-table');
        const rows = table.querySelectorAll('tbody tr');

        // Exactly N data rows.
        expect(rows).toHaveLength(transactions.length);

        // Each row, in order, shows the ZAR-formatted amount and formatted timestamp.
        transactions.forEach((txn, index) => {
          const row = rows[index];
          const utils = within(row as HTMLElement);
          expect(utils.getByText(formatZAR(txn.amount))).toBeInTheDocument();
          expect(utils.getByText(formatDateTime(txn.timestamp))).toBeInTheDocument();
        });

        unmount();
      })
    );
  });
});
