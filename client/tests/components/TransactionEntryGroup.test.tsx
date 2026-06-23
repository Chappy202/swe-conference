import { render, screen, fireEvent, within } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import fc from 'fast-check';
import { TransactionEntryGroup } from '../../src/components/TransactionEntryGroup';
import { createEmptyTransaction, createEmptyErrors } from '../../src/types/dispute';

const defaultProps = {
  index: 0,
  transaction: createEmptyTransaction(),
  onChange: vi.fn(),
  onRemove: vi.fn(),
  showRemove: false,
  errors: createEmptyErrors(),
  onBlur: vi.fn(),
};

describe('TransactionEntryGroup', () => {
  describe('field rendering', () => {
    it('should render an amount input of type number with step 0.01', () => {
      render(<TransactionEntryGroup {...defaultProps} />);
      const amount = screen.getByTestId('transaction-amount-0');
      expect(amount).toHaveAttribute('type', 'number');
      expect(amount).toHaveAttribute('step', '0.01');
    });

    it('should render a merchant text input', () => {
      render(<TransactionEntryGroup {...defaultProps} />);
      expect(screen.getByTestId('transaction-merchant-0')).toHaveAttribute('type', 'text');
    });

    it('should render a datetime-local timestamp input', () => {
      render(<TransactionEntryGroup {...defaultProps} />);
      expect(screen.getByTestId('transaction-timestamp-0')).toHaveAttribute(
        'type',
        'datetime-local'
      );
    });

    it('should render a payment type select with Card, ApplePay and EFT options', () => {
      render(<TransactionEntryGroup {...defaultProps} />);
      const select = screen.getByTestId('transaction-payment-type-0');
      expect(within(select).getByRole('option', { name: 'Card' })).toHaveValue('Card');
      expect(within(select).getByRole('option', { name: 'Apple Pay' })).toHaveValue('ApplePay');
      expect(within(select).getByRole('option', { name: 'EFT' })).toHaveValue('EFT');
    });
  });

  describe('remove button visibility', () => {
    it('should hide the remove button when showRemove is false', () => {
      render(<TransactionEntryGroup {...defaultProps} showRemove={false} />);
      expect(screen.queryByTestId('remove-transaction-0')).not.toBeInTheDocument();
    });

    it('should show the remove button when showRemove is true', () => {
      render(<TransactionEntryGroup {...defaultProps} showRemove={true} />);
      expect(screen.getByTestId('remove-transaction-0')).toBeInTheDocument();
    });

    it('should call onRemove with the index when clicked', () => {
      const onRemove = vi.fn();
      render(<TransactionEntryGroup {...defaultProps} index={2} showRemove onRemove={onRemove} />);
      fireEvent.click(screen.getByTestId('remove-transaction-2'));
      expect(onRemove).toHaveBeenCalledWith(2);
    });
  });

  describe('change handling', () => {
    it('should call onChange with index, field and value when amount changes', () => {
      const onChange = vi.fn();
      render(<TransactionEntryGroup {...defaultProps} onChange={onChange} />);
      fireEvent.change(screen.getByTestId('transaction-amount-0'), { target: { value: '50' } });
      expect(onChange).toHaveBeenCalledWith(0, 'amount', '50');
    });
  });

  describe('blur handling', () => {
    it('should call onBlur with index and field when a field loses focus', () => {
      const onBlur = vi.fn();
      render(<TransactionEntryGroup {...defaultProps} onBlur={onBlur} />);
      fireEvent.blur(screen.getByTestId('transaction-merchant-0'));
      expect(onBlur).toHaveBeenCalledWith(0, 'merchant');
    });
  });

  describe('validation feedback', () => {
    it('should apply a red border and inline error text for an invalid field', () => {
      render(
        <TransactionEntryGroup
          {...defaultProps}
          errors={{ ...createEmptyErrors(), amount: 'Amount must be greater than zero' }}
        />
      );
      expect(screen.getByTestId('transaction-amount-0').className).toContain('border-red-500');
      expect(screen.getByText('Amount must be greater than zero')).toBeInTheDocument();
    });
  });

  // Task 3.4 — Property 2: Transaction group field completeness
  describe('Property 2: transaction group field completeness', () => {
    it('should render all four field test ids for any index i', () => {
      fc.assert(
        fc.property(fc.integer({ min: 0, max: 50 }), (index) => {
          const { unmount } = render(<TransactionEntryGroup {...defaultProps} index={index} />);
          expect(screen.getByTestId(`transaction-amount-${index}`)).toBeInTheDocument();
          expect(screen.getByTestId(`transaction-merchant-${index}`)).toBeInTheDocument();
          expect(screen.getByTestId(`transaction-timestamp-${index}`)).toBeInTheDocument();
          expect(screen.getByTestId(`transaction-payment-type-${index}`)).toBeInTheDocument();
          unmount();
        })
      );
    });
  });
});
