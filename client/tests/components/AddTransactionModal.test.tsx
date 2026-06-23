import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AddTransactionModal } from '../../src/components/AddTransactionModal';

describe('AddTransactionModal', () => {
  const defaultProps = {
    isOpen: true,
    disputeId: 42,
    onClose: vi.fn(),
    onAdded: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ id: 1 }),
        } as Response)
      )
    );
  });

  describe('when isOpen is false', () => {
    it('should not render modal content', () => {
      render(<AddTransactionModal {...defaultProps} isOpen={false} />);
      expect(screen.queryByTestId('add-txn-amount')).not.toBeInTheDocument();
      expect(screen.queryByTestId('add-txn-submit')).not.toBeInTheDocument();
    });
  });

  describe('when isOpen is true', () => {
    it('should render amount input with correct test ID', () => {
      render(<AddTransactionModal {...defaultProps} />);
      expect(screen.getByTestId('add-txn-amount')).toBeInTheDocument();
    });

    it('should render merchant input with correct test ID', () => {
      render(<AddTransactionModal {...defaultProps} />);
      expect(screen.getByTestId('add-txn-merchant')).toBeInTheDocument();
    });

    it('should render timestamp input with correct test ID', () => {
      render(<AddTransactionModal {...defaultProps} />);
      expect(screen.getByTestId('add-txn-timestamp')).toBeInTheDocument();
    });

    it('should render payment type select with correct test ID', () => {
      render(<AddTransactionModal {...defaultProps} />);
      expect(screen.getByTestId('add-txn-payment-type')).toBeInTheDocument();
    });

    it('should render cancel button with correct test ID', () => {
      render(<AddTransactionModal {...defaultProps} />);
      expect(screen.getByTestId('add-txn-cancel')).toBeInTheDocument();
    });

    it('should render submit button with correct test ID', () => {
      render(<AddTransactionModal {...defaultProps} />);
      expect(screen.getByTestId('add-txn-submit')).toBeInTheDocument();
    });
  });

  describe('submit button validation', () => {
    it('should disable submit button when all fields are empty', () => {
      render(<AddTransactionModal {...defaultProps} />);
      expect(screen.getByTestId('add-txn-submit')).toBeDisabled();
    });

    it('should disable submit button when amount is zero', () => {
      render(<AddTransactionModal {...defaultProps} />);
      fireEvent.change(screen.getByTestId('add-txn-amount'), { target: { value: '0' } });
      fireEvent.change(screen.getByTestId('add-txn-merchant'), { target: { value: 'Store' } });
      fireEvent.change(screen.getByTestId('add-txn-timestamp'), {
        target: { value: '2024-01-15T10:30' },
      });
      fireEvent.change(screen.getByTestId('add-txn-payment-type'), {
        target: { value: 'Card' },
      });
      expect(screen.getByTestId('add-txn-submit')).toBeDisabled();
    });

    it('should disable submit button when merchant is empty', () => {
      render(<AddTransactionModal {...defaultProps} />);
      fireEvent.change(screen.getByTestId('add-txn-amount'), { target: { value: '100' } });
      fireEvent.change(screen.getByTestId('add-txn-timestamp'), {
        target: { value: '2024-01-15T10:30' },
      });
      fireEvent.change(screen.getByTestId('add-txn-payment-type'), {
        target: { value: 'Card' },
      });
      expect(screen.getByTestId('add-txn-submit')).toBeDisabled();
    });

    it('should disable submit button when timestamp is empty', () => {
      render(<AddTransactionModal {...defaultProps} />);
      fireEvent.change(screen.getByTestId('add-txn-amount'), { target: { value: '100' } });
      fireEvent.change(screen.getByTestId('add-txn-merchant'), { target: { value: 'Store' } });
      fireEvent.change(screen.getByTestId('add-txn-payment-type'), {
        target: { value: 'Card' },
      });
      expect(screen.getByTestId('add-txn-submit')).toBeDisabled();
    });

    it('should disable submit button when payment type is not selected', () => {
      render(<AddTransactionModal {...defaultProps} />);
      fireEvent.change(screen.getByTestId('add-txn-amount'), { target: { value: '100' } });
      fireEvent.change(screen.getByTestId('add-txn-merchant'), { target: { value: 'Store' } });
      fireEvent.change(screen.getByTestId('add-txn-timestamp'), {
        target: { value: '2024-01-15T10:30' },
      });
      expect(screen.getByTestId('add-txn-submit')).toBeDisabled();
    });

    it('should enable submit button when all fields are valid', () => {
      render(<AddTransactionModal {...defaultProps} />);
      fireEvent.change(screen.getByTestId('add-txn-amount'), { target: { value: '100' } });
      fireEvent.change(screen.getByTestId('add-txn-merchant'), { target: { value: 'Store' } });
      fireEvent.change(screen.getByTestId('add-txn-timestamp'), {
        target: { value: '2024-01-15T10:30' },
      });
      fireEvent.change(screen.getByTestId('add-txn-payment-type'), {
        target: { value: 'Card' },
      });
      expect(screen.getByTestId('add-txn-submit')).not.toBeDisabled();
    });
  });

  describe('when submit is clicked with valid data', () => {
    it('should POST transaction data to the correct endpoint', async () => {
      render(<AddTransactionModal {...defaultProps} />);
      fireEvent.change(screen.getByTestId('add-txn-amount'), { target: { value: '250' } });
      fireEvent.change(screen.getByTestId('add-txn-merchant'), {
        target: { value: 'Test Merchant' },
      });
      fireEvent.change(screen.getByTestId('add-txn-timestamp'), {
        target: { value: '2024-01-15T10:30' },
      });
      fireEvent.change(screen.getByTestId('add-txn-payment-type'), {
        target: { value: 'ApplePay' },
      });

      fireEvent.click(screen.getByTestId('add-txn-submit'));

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/disputes/42/transactions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: 250,
            merchant: 'Test Merchant',
            timestamp: '2024-01-15T10:30',
            paymentType: 'ApplePay',
          }),
        });
      });
    });

    it('should call onAdded and onClose on success', async () => {
      const onAdded = vi.fn();
      const onClose = vi.fn();
      render(<AddTransactionModal {...defaultProps} onAdded={onAdded} onClose={onClose} />);

      fireEvent.change(screen.getByTestId('add-txn-amount'), { target: { value: '100' } });
      fireEvent.change(screen.getByTestId('add-txn-merchant'), { target: { value: 'Store' } });
      fireEvent.change(screen.getByTestId('add-txn-timestamp'), {
        target: { value: '2024-01-15T10:30' },
      });
      fireEvent.change(screen.getByTestId('add-txn-payment-type'), {
        target: { value: 'Card' },
      });

      fireEvent.click(screen.getByTestId('add-txn-submit'));

      await waitFor(() => {
        expect(onAdded).toHaveBeenCalled();
      });
      expect(onClose).toHaveBeenCalled();
    });
  });

  describe('when submission is in progress', () => {
    it('should show spinner with text "Adding..." on submit button', async () => {
      vi.stubGlobal('fetch', vi.fn(() => new Promise(() => {})));

      render(<AddTransactionModal {...defaultProps} />);
      fireEvent.change(screen.getByTestId('add-txn-amount'), { target: { value: '100' } });
      fireEvent.change(screen.getByTestId('add-txn-merchant'), { target: { value: 'Store' } });
      fireEvent.change(screen.getByTestId('add-txn-timestamp'), {
        target: { value: '2024-01-15T10:30' },
      });
      fireEvent.change(screen.getByTestId('add-txn-payment-type'), {
        target: { value: 'Card' },
      });

      fireEvent.click(screen.getByTestId('add-txn-submit'));

      await waitFor(() => {
        expect(screen.getByTestId('add-txn-submit')).toHaveTextContent('Adding...');
      });
    });

    it('should disable all form fields during submission', async () => {
      vi.stubGlobal('fetch', vi.fn(() => new Promise(() => {})));

      render(<AddTransactionModal {...defaultProps} />);
      fireEvent.change(screen.getByTestId('add-txn-amount'), { target: { value: '100' } });
      fireEvent.change(screen.getByTestId('add-txn-merchant'), { target: { value: 'Store' } });
      fireEvent.change(screen.getByTestId('add-txn-timestamp'), {
        target: { value: '2024-01-15T10:30' },
      });
      fireEvent.change(screen.getByTestId('add-txn-payment-type'), {
        target: { value: 'Card' },
      });

      fireEvent.click(screen.getByTestId('add-txn-submit'));

      await waitFor(() => {
        expect(screen.getByTestId('add-txn-amount')).toBeDisabled();
        expect(screen.getByTestId('add-txn-merchant')).toBeDisabled();
        expect(screen.getByTestId('add-txn-timestamp')).toBeDisabled();
        expect(screen.getByTestId('add-txn-payment-type')).toBeDisabled();
      });
    });
  });

  describe('when submission fails', () => {
    it('should show inline error message and keep modal open', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn(() =>
          Promise.resolve({
            ok: false,
            json: () => Promise.resolve({ error: 'VALIDATION_ERROR' }),
          } as unknown as Response)
        )
      );

      render(<AddTransactionModal {...defaultProps} />);
      fireEvent.change(screen.getByTestId('add-txn-amount'), { target: { value: '100' } });
      fireEvent.change(screen.getByTestId('add-txn-merchant'), { target: { value: 'Store' } });
      fireEvent.change(screen.getByTestId('add-txn-timestamp'), {
        target: { value: '2024-01-15T10:30' },
      });
      fireEvent.change(screen.getByTestId('add-txn-payment-type'), {
        target: { value: 'Card' },
      });

      fireEvent.click(screen.getByTestId('add-txn-submit'));

      await waitFor(() => {
        expect(screen.getByText('Failed to add transaction: VALIDATION_ERROR.')).toBeInTheDocument();
      });
      // Modal remains open — fields still visible
      expect(screen.getByTestId('add-txn-amount')).toBeInTheDocument();
    });
  });

  describe('when cancel is clicked', () => {
    it('should call onClose without making any API request', () => {
      const onClose = vi.fn();
      render(<AddTransactionModal {...defaultProps} onClose={onClose} />);

      fireEvent.click(screen.getByTestId('add-txn-cancel'));

      expect(onClose).toHaveBeenCalled();
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });
});
