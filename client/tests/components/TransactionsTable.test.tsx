import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { TransactionsTable } from '../../src/components/TransactionsTable';
import { Transaction } from '../../src/types/dispute';

describe('TransactionsTable', () => {
  const transactions: Transaction[] = [
    {
      id: 1,
      amount: 5000,
      merchant: 'Store A',
      timestamp: '2024-03-15T10:30:00.000Z',
      paymentType: 'Card',
      createdAt: '2024-03-15T10:30:00.000Z',
    },
    {
      id: 2,
      amount: 11500.5,
      merchant: 'Store B',
      timestamp: '2024-03-16T14:45:00.000Z',
      paymentType: 'ApplePay',
      createdAt: '2024-03-16T14:45:00.000Z',
    },
  ];

  describe('table structure', () => {
    it('renders with data-testid="transactions-table"', () => {
      render(
        <TransactionsTable transactions={transactions} status="Reported" />
      );
      expect(screen.getByTestId('transactions-table')).toBeInTheDocument();
    });

    it('renders columns: Amount (ZAR), Merchant, Timestamp, Payment Type', () => {
      render(
        <TransactionsTable transactions={transactions} status="Reported" />
      );
      expect(screen.getByText('Amount (ZAR)')).toBeInTheDocument();
      expect(screen.getByText('Merchant')).toBeInTheDocument();
      expect(screen.getByText('Timestamp')).toBeInTheDocument();
      expect(screen.getByText('Payment Type')).toBeInTheDocument();
    });
  });

  describe('row rendering', () => {
    it('renders N rows for N transactions', () => {
      render(
        <TransactionsTable transactions={transactions} status="Reported" />
      );
      const table = screen.getByTestId('transactions-table');
      const rows = table.querySelectorAll('tbody tr');
      expect(rows).toHaveLength(2);
    });

    it('formats amounts as ZAR', () => {
      render(
        <TransactionsTable transactions={transactions} status="Reported" />
      );
      expect(screen.getByText('R5,000')).toBeInTheDocument();
      expect(screen.getByText('R11,500.50')).toBeInTheDocument();
    });

    it('formats timestamps as DD MMM YYYY HH:mm', () => {
      render(
        <TransactionsTable transactions={transactions} status="Reported" />
      );
      expect(screen.getByText('15 Mar 2024 10:30')).toBeInTheDocument();
      expect(screen.getByText('16 Mar 2024 14:45')).toBeInTheDocument();
    });

    it('displays merchant names', () => {
      render(
        <TransactionsTable transactions={transactions} status="Reported" />
      );
      expect(screen.getByText('Store A')).toBeInTheDocument();
      expect(screen.getByText('Store B')).toBeInTheDocument();
    });

    it('displays payment types', () => {
      render(
        <TransactionsTable transactions={transactions} status="Reported" />
      );
      expect(screen.getByText('Card')).toBeInTheDocument();
      expect(screen.getByText('ApplePay')).toBeInTheDocument();
    });
  });

  describe('Add Transaction button', () => {
    it('shows "Add Transaction" button when status is non-terminal (Reported)', () => {
      render(
        <TransactionsTable transactions={transactions} status="Reported" />
      );
      expect(screen.getByTestId('add-transaction-button')).toBeInTheDocument();
    });

    it('shows "Add Transaction" button when status is non-terminal (UnderInvestigation)', () => {
      render(
        <TransactionsTable transactions={transactions} status="UnderInvestigation" />
      );
      expect(screen.getByTestId('add-transaction-button')).toBeInTheDocument();
    });

    it('shows "Add Transaction" button when status is non-terminal (Escalated)', () => {
      render(
        <TransactionsTable transactions={transactions} status="Escalated" />
      );
      expect(screen.getByTestId('add-transaction-button')).toBeInTheDocument();
    });

    it('hides "Add Transaction" button when status is terminal (Resolved)', () => {
      render(
        <TransactionsTable transactions={transactions} status="Resolved" />
      );
      expect(screen.queryByTestId('add-transaction-button')).not.toBeInTheDocument();
    });

    it('hides "Add Transaction" button when status is terminal (Referred)', () => {
      render(
        <TransactionsTable transactions={transactions} status="Referred" />
      );
      expect(screen.queryByTestId('add-transaction-button')).not.toBeInTheDocument();
    });

    it('calls onAddTransaction when "Add Transaction" button is clicked', () => {
      const onAddTransaction = vi.fn();
      render(
        <TransactionsTable
          transactions={transactions}
          status="Reported"
          onAddTransaction={onAddTransaction}
        />
      );
      screen.getByTestId('add-transaction-button').click();
      expect(onAddTransaction).toHaveBeenCalledOnce();
    });
  });
});
