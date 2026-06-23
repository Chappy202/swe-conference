import { TransactionFormState, TransactionFieldErrors, createEmptyErrors } from '../types/dispute';

/** Result of running full form-level validation. */
export interface ValidateFormResult {
  isValid: boolean;
  customerError: string | null;
  transactionErrors: TransactionFieldErrors[];
}

/** Validates a single transaction field. Returns an error message or null. */
export function validateTransactionField(
  field: keyof TransactionFormState,
  value: string
): string | null {
  switch (field) {
    case 'amount': {
      const num = parseFloat(value);
      if (!value || isNaN(num) || num <= 0) {
        return 'Amount must be greater than zero';
      }
      return null;
    }
    case 'merchant':
      return value.trim() === '' ? 'Merchant name is required' : null;
    case 'timestamp':
      return value === '' ? 'Transaction date is required' : null;
    case 'paymentType':
      return value === '' ? 'Please select a payment type' : null;
  }
}

/**
 * Validates the entire form. Returns whether it is valid, the customer-level
 * error, and a per-field error object for each transaction group.
 */
export function validateForm(
  selectedCustomerId: number | null,
  transactions: TransactionFormState[]
): ValidateFormResult {
  const customerError = selectedCustomerId === null ? 'Please select a customer' : null;

  const transactionErrors: TransactionFieldErrors[] = transactions.map((transaction) => {
    const errors = createEmptyErrors();
    errors.amount = validateTransactionField('amount', transaction.amount);
    errors.merchant = validateTransactionField('merchant', transaction.merchant);
    errors.timestamp = validateTransactionField('timestamp', transaction.timestamp);
    errors.paymentType = validateTransactionField('paymentType', transaction.paymentType);
    return errors;
  });

  const allTransactionsValid =
    transactions.length > 0 &&
    transactionErrors.every(
      (errors) =>
        errors.amount === null &&
        errors.merchant === null &&
        errors.timestamp === null &&
        errors.paymentType === null
    );

  const isValid = customerError === null && allTransactionsValid;

  return { isValid, customerError, transactionErrors };
}
