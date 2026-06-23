import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { validateTransactionField, validateForm } from '../../src/utils/validation';
import { TransactionFormState, createEmptyTransaction } from '../../src/types/dispute';

describe('validateTransactionField', () => {
  describe('amount field', () => {
    it('should return null for a positive numeric amount', () => {
      expect(validateTransactionField('amount', '100')).toBeNull();
      expect(validateTransactionField('amount', '0.01')).toBeNull();
    });

    it('should return an error for an empty amount', () => {
      expect(validateTransactionField('amount', '')).toBe('Amount must be greater than zero');
    });

    it('should return an error for a zero amount', () => {
      expect(validateTransactionField('amount', '0')).toBe('Amount must be greater than zero');
    });

    it('should return an error for a negative amount', () => {
      expect(validateTransactionField('amount', '-5')).toBe('Amount must be greater than zero');
    });

    it('should return an error for a non-numeric amount', () => {
      expect(validateTransactionField('amount', 'abc')).toBe('Amount must be greater than zero');
    });
  });

  describe('merchant field', () => {
    it('should return null for a non-empty merchant', () => {
      expect(validateTransactionField('merchant', 'Store A')).toBeNull();
    });

    it('should return an error for an empty merchant', () => {
      expect(validateTransactionField('merchant', '')).toBe('Merchant name is required');
    });

    it('should return an error for a whitespace-only merchant', () => {
      expect(validateTransactionField('merchant', '   ')).toBe('Merchant name is required');
    });
  });

  describe('timestamp field', () => {
    it('should return null for a filled timestamp', () => {
      expect(validateTransactionField('timestamp', '2024-01-15T10:30')).toBeNull();
    });

    it('should return an error for an empty timestamp', () => {
      expect(validateTransactionField('timestamp', '')).toBe('Transaction date is required');
    });
  });

  describe('paymentType field', () => {
    it('should return null for a selected payment type', () => {
      expect(validateTransactionField('paymentType', 'Card')).toBeNull();
    });

    it('should return an error for an unselected payment type', () => {
      expect(validateTransactionField('paymentType', '')).toBe('Please select a payment type');
    });
  });

  // Task 1.4 — Property 6: Invalid amount validation
  describe('Property 6: invalid amount validation', () => {
    it('should return "Amount must be greater than zero" for any non-positive or non-numeric amount', () => {
      const nonPositiveNumbers = fc
        .float({ min: Math.fround(-1e6), max: 0, noNaN: true })
        .map((n) => String(n));
      const nonNumericStrings = fc
        .string()
        .filter((s) => s.trim() === '' || isNaN(parseFloat(s)) || parseFloat(s) <= 0);

      fc.assert(
        fc.property(fc.oneof(nonPositiveNumbers, nonNumericStrings), (value) => {
          expect(validateTransactionField('amount', value)).toBe(
            'Amount must be greater than zero'
          );
        })
      );
    });

    it('should return null for any strictly positive numeric amount', () => {
      fc.assert(
        fc.property(
          fc.float({ min: Math.fround(0.01), max: Math.fround(1e6), noNaN: true }),
          (n) => {
            expect(validateTransactionField('amount', String(n))).toBeNull();
          }
        )
      );
    });
  });
});

describe('validateForm', () => {
  const validTransaction: TransactionFormState = {
    amount: '100',
    merchant: 'Store A',
    timestamp: '2024-01-15T10:30',
    paymentType: 'Card',
  };

  describe('when the form is fully valid', () => {
    it('should return isValid true with no errors', () => {
      const result = validateForm(1, [validTransaction]);
      expect(result.isValid).toBe(true);
      expect(result.customerError).toBeNull();
      expect(result.transactionErrors[0]).toEqual({
        amount: null,
        merchant: null,
        timestamp: null,
        paymentType: null,
      });
    });
  });

  describe('when no customer is selected', () => {
    it('should return isValid false and a customer error', () => {
      const result = validateForm(null, [validTransaction]);
      expect(result.isValid).toBe(false);
      expect(result.customerError).toBe('Please select a customer');
    });
  });

  describe('when a transaction is partially invalid', () => {
    it('should populate per-field errors for the invalid fields', () => {
      const result = validateForm(1, [createEmptyTransaction()]);
      expect(result.isValid).toBe(false);
      expect(result.transactionErrors[0]).toEqual({
        amount: 'Amount must be greater than zero',
        merchant: 'Merchant name is required',
        timestamp: 'Transaction date is required',
        paymentType: 'Please select a payment type',
      });
    });
  });

  describe('when there are zero transactions', () => {
    it('should return isValid false', () => {
      const result = validateForm(1, []);
      expect(result.isValid).toBe(false);
    });
  });
});
