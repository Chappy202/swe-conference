import { describe, it, expect } from 'vitest';
import {
  validateTransactionInput,
  validateCreateDisputeBody,
  validateStatusTransitionBody,
} from '../src/routes/validation.js';

const validTxn = {
  amount: 100,
  merchant: 'Woolworths',
  timestamp: '2024-03-14T10:00:00.000Z',
  paymentType: 'Card',
};

describe('validation helpers', () => {
  describe('validateTransactionInput', () => {
    describe('when input is valid', () => {
      it('should return the typed transaction', () => {
        expect(validateTransactionInput(validTxn)).toEqual(validTxn);
      });
    });

    describe('when amount is non-positive', () => {
      it('should throw VALIDATION_ERROR for zero', () => {
        expect(() => validateTransactionInput({ ...validTxn, amount: 0 })).toThrowError(
          expect.objectContaining({ code: 'VALIDATION_ERROR', status: 400 })
        );
      });

      it('should throw VALIDATION_ERROR for negative', () => {
        expect(() => validateTransactionInput({ ...validTxn, amount: -5 })).toThrowError(
          expect.objectContaining({ code: 'VALIDATION_ERROR' })
        );
      });
    });

    describe('when merchant is empty', () => {
      it('should throw VALIDATION_ERROR', () => {
        expect(() => validateTransactionInput({ ...validTxn, merchant: '  ' })).toThrowError(
          expect.objectContaining({ code: 'VALIDATION_ERROR' })
        );
      });
    });

    describe('when timestamp is invalid', () => {
      it('should throw VALIDATION_ERROR', () => {
        expect(() =>
          validateTransactionInput({ ...validTxn, timestamp: 'not-a-date' })
        ).toThrowError(expect.objectContaining({ code: 'VALIDATION_ERROR' }));
      });
    });

    describe('when paymentType is invalid', () => {
      it('should throw VALIDATION_ERROR', () => {
        expect(() => validateTransactionInput({ ...validTxn, paymentType: 'Cash' })).toThrowError(
          expect.objectContaining({ code: 'VALIDATION_ERROR' })
        );
      });
    });
  });

  describe('validateCreateDisputeBody', () => {
    describe('when body is valid', () => {
      it('should return customerId and transactions', () => {
        const result = validateCreateDisputeBody({ customerId: 1, transactions: [validTxn] });
        expect(result.customerId).toBe(1);
        expect(result.transactions).toHaveLength(1);
      });
    });

    describe('when customerId is missing', () => {
      it('should throw VALIDATION_ERROR', () => {
        expect(() => validateCreateDisputeBody({ transactions: [validTxn] })).toThrowError(
          expect.objectContaining({ code: 'VALIDATION_ERROR' })
        );
      });
    });

    describe('when transactions is empty', () => {
      it('should throw VALIDATION_ERROR', () => {
        expect(() => validateCreateDisputeBody({ customerId: 1, transactions: [] })).toThrowError(
          expect.objectContaining({ code: 'VALIDATION_ERROR' })
        );
      });
    });

    describe('when a transaction is invalid', () => {
      it('should throw VALIDATION_ERROR', () => {
        expect(() =>
          validateCreateDisputeBody({ customerId: 1, transactions: [{ ...validTxn, amount: 0 }] })
        ).toThrowError(expect.objectContaining({ code: 'VALIDATION_ERROR' }));
      });
    });
  });

  describe('validateStatusTransitionBody', () => {
    describe('when status is valid', () => {
      it('should return the status and optional outcome', () => {
        const result = validateStatusTransitionBody({
          status: 'Resolved',
          resolutionOutcome: 'Refunded',
        });
        expect(result.status).toBe('Resolved');
        expect(result.resolutionOutcome).toBe('Refunded');
      });
    });

    describe('when status is missing', () => {
      it('should throw VALIDATION_ERROR', () => {
        expect(() => validateStatusTransitionBody({})).toThrowError(
          expect.objectContaining({ code: 'VALIDATION_ERROR' })
        );
      });
    });

    describe('when status is not recognized', () => {
      it('should throw VALIDATION_ERROR', () => {
        expect(() => validateStatusTransitionBody({ status: 'Bogus' })).toThrowError(
          expect.objectContaining({ code: 'VALIDATION_ERROR' })
        );
      });
    });
  });
});
