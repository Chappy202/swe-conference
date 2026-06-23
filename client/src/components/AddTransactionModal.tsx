import { useState } from 'react';
import { PaymentType } from '../types/dispute';

/** Props for the AddTransactionModal component. */
export interface AddTransactionModalProps {
  isOpen: boolean;
  disputeId: number;
  onClose: () => void;
  onAdded: () => void;
}

const PAYMENT_TYPES: PaymentType[] = ['Card', 'ApplePay', 'EFT'];

/** Modal for adding a new transaction to a dispute. */
export function AddTransactionModal({
  isOpen,
  disputeId,
  onClose,
  onAdded,
}: AddTransactionModalProps): JSX.Element | null {
  const [amount, setAmount] = useState('');
  const [merchant, setMerchant] = useState('');
  const [timestamp, setTimestamp] = useState('');
  const [paymentType, setPaymentType] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) {
    return null;
  }

  const parsedAmount = parseFloat(amount);
  const isValid =
    !isNaN(parsedAmount) &&
    parsedAmount > 0 &&
    merchant.trim() !== '' &&
    timestamp !== '' &&
    paymentType !== '';

  async function handleSubmit(): Promise<void> {
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/disputes/${disputeId}/transactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parsedAmount,
          merchant,
          timestamp,
          paymentType,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || 'Unknown error');
        return;
      }

      onAdded();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
        <h2 className="text-lg font-semibold mb-4">Add Transaction</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Amount (ZAR)</label>
            <input
              type="number"
              data-testid="add-txn-amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              disabled={isSubmitting}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm disabled:bg-gray-100"
              placeholder="0.00"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Merchant</label>
            <input
              type="text"
              data-testid="add-txn-merchant"
              value={merchant}
              onChange={(e) => setMerchant(e.target.value)}
              disabled={isSubmitting}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm disabled:bg-gray-100"
              placeholder="Merchant name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Timestamp</label>
            <input
              type="datetime-local"
              data-testid="add-txn-timestamp"
              value={timestamp}
              onChange={(e) => setTimestamp(e.target.value)}
              disabled={isSubmitting}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm disabled:bg-gray-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Payment Type</label>
            <select
              data-testid="add-txn-payment-type"
              value={paymentType}
              onChange={(e) => setPaymentType(e.target.value)}
              disabled={isSubmitting}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm disabled:bg-gray-100"
            >
              <option value="">Select payment type</option>
              {PAYMENT_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded">
            Failed to add transaction: {error}.
          </div>
        )}

        <div className="mt-6 flex justify-end gap-3">
          <button
            data-testid="add-txn-cancel"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            data-testid="add-txn-submit"
            onClick={handleSubmit}
            disabled={!isValid || isSubmitting}
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-700 hover:bg-indigo-800 rounded disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSubmitting && (
              <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
            )}
            {isSubmitting ? 'Adding...' : 'Add Transaction'}
          </button>
        </div>
      </div>
    </div>
  );
}
