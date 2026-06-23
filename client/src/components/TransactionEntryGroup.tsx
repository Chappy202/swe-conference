import { PaymentType, TransactionFormState, TransactionFieldErrors } from '../types/dispute';

/** Props for a single TransactionEntryGroup. */
export interface TransactionEntryGroupProps {
  index: number;
  transaction: TransactionFormState;
  onChange: (index: number, field: keyof TransactionFormState, value: string) => void;
  onRemove: (index: number) => void;
  showRemove: boolean;
  errors: TransactionFieldErrors;
  onBlur: (index: number, field: keyof TransactionFormState) => void;
}

interface PaymentTypeOption {
  value: PaymentType;
  label: string;
}

const PAYMENT_TYPE_OPTIONS: PaymentTypeOption[] = [
  { value: 'Card', label: 'Card' },
  { value: 'ApplePay', label: 'Apple Pay' },
  { value: 'EFT', label: 'EFT' },
];

const BASE_FIELD_CLASS = 'w-full rounded border px-3 py-2 text-sm disabled:bg-gray-100';

function borderClass(error: string | null): string {
  return error ? 'border-red-500' : 'border-gray-300';
}

/** A repeatable fieldset capturing one transaction's amount, merchant, timestamp and payment type. */
export function TransactionEntryGroup({
  index,
  transaction,
  onChange,
  onRemove,
  showRemove,
  errors,
  onBlur,
}: TransactionEntryGroupProps): JSX.Element {
  return (
    <fieldset className="rounded border border-gray-200 p-4">
      <div className="mb-3 flex items-center justify-between">
        <legend className="text-sm font-semibold text-gray-800">Transaction {index + 1}</legend>
        {showRemove && (
          <button
            type="button"
            data-testid={`remove-transaction-${index}`}
            onClick={() => onRemove(index)}
            className="text-sm font-medium text-red-600 hover:underline"
          >
            Remove
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label
            htmlFor={`transaction-amount-${index}`}
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Amount (ZAR) <span className="text-red-600">*</span>
          </label>
          <input
            id={`transaction-amount-${index}`}
            data-testid={`transaction-amount-${index}`}
            type="number"
            step="0.01"
            value={transaction.amount}
            onChange={(e) => onChange(index, 'amount', e.target.value)}
            onBlur={() => onBlur(index, 'amount')}
            className={`${BASE_FIELD_CLASS} ${borderClass(errors.amount)}`}
            placeholder="0.00"
          />
          {errors.amount && <p className="mt-1 text-sm text-red-600">{errors.amount}</p>}
        </div>

        <div>
          <label
            htmlFor={`transaction-merchant-${index}`}
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Merchant <span className="text-red-600">*</span>
          </label>
          <input
            id={`transaction-merchant-${index}`}
            data-testid={`transaction-merchant-${index}`}
            type="text"
            value={transaction.merchant}
            onChange={(e) => onChange(index, 'merchant', e.target.value)}
            onBlur={() => onBlur(index, 'merchant')}
            className={`${BASE_FIELD_CLASS} ${borderClass(errors.merchant)}`}
            placeholder="Merchant name"
          />
          {errors.merchant && <p className="mt-1 text-sm text-red-600">{errors.merchant}</p>}
        </div>

        <div>
          <label
            htmlFor={`transaction-timestamp-${index}`}
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Timestamp <span className="text-red-600">*</span>
          </label>
          <input
            id={`transaction-timestamp-${index}`}
            data-testid={`transaction-timestamp-${index}`}
            type="datetime-local"
            value={transaction.timestamp}
            onChange={(e) => onChange(index, 'timestamp', e.target.value)}
            onBlur={() => onBlur(index, 'timestamp')}
            className={`${BASE_FIELD_CLASS} ${borderClass(errors.timestamp)}`}
          />
          {errors.timestamp && <p className="mt-1 text-sm text-red-600">{errors.timestamp}</p>}
        </div>

        <div>
          <label
            htmlFor={`transaction-payment-type-${index}`}
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Payment Type <span className="text-red-600">*</span>
          </label>
          <select
            id={`transaction-payment-type-${index}`}
            data-testid={`transaction-payment-type-${index}`}
            value={transaction.paymentType}
            onChange={(e) => onChange(index, 'paymentType', e.target.value)}
            onBlur={() => onBlur(index, 'paymentType')}
            className={`${BASE_FIELD_CLASS} ${borderClass(errors.paymentType)}`}
          >
            <option value="">Select payment type</option>
            {PAYMENT_TYPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {errors.paymentType && <p className="mt-1 text-sm text-red-600">{errors.paymentType}</p>}
        </div>
      </div>
    </fieldset>
  );
}
