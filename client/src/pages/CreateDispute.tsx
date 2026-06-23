import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCustomers } from '../hooks/useCustomers';
import { AppHeader } from '../components/AppHeader';
import { CustomerSelect } from '../components/CustomerSelect';
import { TransactionEntryGroup } from '../components/TransactionEntryGroup';
import { validateTransactionField, validateForm } from '../utils/validation';
import {
  CreateDisputePayload,
  CreateDisputeResponse,
  PaymentType,
  TransactionFieldErrors,
  TransactionFormState,
  createEmptyErrors,
  createEmptyTransaction,
} from '../types/dispute';

/** CreateDisputePage — page-level component at /disputes/new. */
function CreateDisputePage(): JSX.Element {
  const navigate = useNavigate();
  const { customers, isLoading: isLoadingCustomers, error: customerFetchError } = useCustomers();

  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
  const [transactions, setTransactions] = useState<TransactionFormState[]>([
    createEmptyTransaction(),
  ]);
  const [validationErrors, setValidationErrors] = useState<TransactionFieldErrors[]>([
    createEmptyErrors(),
  ]);
  const [customerError, setCustomerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleCustomerChange = (customerId: number | null): void => {
    setSelectedCustomerId(customerId);
    setCustomerError(customerId === null ? customerError : null);
  };

  const handleAddTransaction = (): void => {
    setTransactions((prev) => [...prev, createEmptyTransaction()]);
    setValidationErrors((prev) => [...prev, createEmptyErrors()]);
  };

  const handleRemoveTransaction = (index: number): void => {
    setTransactions((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== index) : prev));
    setValidationErrors((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== index) : prev));
  };

  const handleFieldChange = (
    index: number,
    field: keyof TransactionFormState,
    value: string
  ): void => {
    setTransactions((prev) =>
      prev.map((transaction, i) => (i === index ? { ...transaction, [field]: value } : transaction))
    );
    // Clear an existing error for this field as the user edits.
    setValidationErrors((prev) =>
      prev.map((errors, i) => (i === index ? { ...errors, [field]: null } : errors))
    );
  };

  const handleBlur = (index: number, field: keyof TransactionFormState): void => {
    const value = transactions[index][field];
    const error = validateTransactionField(field, value);
    setValidationErrors((prev) =>
      prev.map((errors, i) => (i === index ? { ...errors, [field]: error } : errors))
    );
  };

  const isFormValid = validateForm(selectedCustomerId, transactions).isValid;
  const isSubmitDisabled = !isFormValid || isSubmitting;

  const handleSubmit = async (): Promise<void> => {
    const result = validateForm(selectedCustomerId, transactions);
    if (!result.isValid) {
      setCustomerError(result.customerError);
      setValidationErrors(result.transactionErrors);
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    const parsedTransactions = transactions.map((transaction) => ({
      amount: parseFloat(transaction.amount),
      merchant: transaction.merchant,
      timestamp: transaction.timestamp,
      paymentType: transaction.paymentType as PaymentType,
    }));

    const payload: CreateDisputePayload = {
      customerId: selectedCustomerId as number,
      dateRaised: new Date().toISOString(),
      totalAmount: parsedTransactions.reduce((sum, transaction) => sum + transaction.amount, 0),
      transactions: parsedTransactions,
    };

    try {
      const response = await fetch('/api/disputes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        setSubmitError(data.error || `Server error: ${response.status}`);
        return;
      }

      const data: CreateDisputeResponse = await response.json();
      navigate(`/disputes/${data.id}`);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div data-testid="create-dispute-page" className="min-h-screen bg-slate-50">
      <AppHeader />

      <main className="mx-auto max-w-3xl px-6 py-8">
        <nav className="mb-4">
          <Link
            to="/"
            data-testid="back-to-dashboard"
            className="text-sm font-medium text-[#003366] hover:underline"
          >
            ← Back to Dashboard
          </Link>
        </nav>

        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Create New Dispute</h1>
          <p className="mt-1 text-sm text-slate-500">
            Capture the customer and the disputed transactions. Triage runs automatically on submit.
          </p>
        </div>

        {submitError && (
          <div
            data-testid="submit-error"
            role="alert"
            className="mb-6 flex items-start justify-between rounded-card border border-red-200 bg-red-50 p-3 text-sm text-red-700"
          >
            <span>Failed to create dispute: {submitError}. Please try again.</span>
            <button
              type="button"
              onClick={() => setSubmitError(null)}
              aria-label="Dismiss error"
              className="ml-4 font-medium text-red-700 hover:text-red-900"
            >
              ✕
            </button>
          </div>
        )}

        <div className="space-y-6 rounded-card border border-slate-200 bg-white p-6 shadow-sm">
          <CustomerSelect
            customers={customers}
            isLoading={isLoadingCustomers}
            error={customerFetchError}
            selectedCustomerId={selectedCustomerId}
            onChange={handleCustomerChange}
            validationError={customerError}
          />

          <div className="space-y-4 border-t border-slate-100 pt-6">
            <h2 className="text-lg font-semibold text-slate-800">Transactions</h2>
            {transactions.map((transaction, index) => (
              <TransactionEntryGroup
                key={index}
                index={index}
                transaction={transaction}
                onChange={handleFieldChange}
                onRemove={handleRemoveTransaction}
                showRemove={transactions.length > 1}
                errors={validationErrors[index]}
                onBlur={handleBlur}
              />
            ))}

            <button
              type="button"
              data-testid="add-transaction-button"
              onClick={handleAddTransaction}
              disabled={isSubmitting}
              className="rounded-button border border-[#003366] px-4 py-2 text-sm font-medium text-[#003366] hover:bg-brand-tint disabled:opacity-50"
            >
              + Add Transaction
            </button>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            data-testid="submit-dispute-button"
            onClick={handleSubmit}
            disabled={isSubmitDisabled}
            className="flex items-center gap-2 rounded-button bg-[#003366] px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#004d99] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting && (
              <span
                data-testid="submit-loading"
                className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"
              />
            )}
            {isSubmitting ? 'Submitting...' : 'Submit Dispute'}
          </button>
        </div>
      </main>
    </div>
  );
}

export default CreateDisputePage;
