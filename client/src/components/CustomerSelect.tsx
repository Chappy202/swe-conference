import { Customer } from '../types/dispute';

/** Props for the CustomerSelect dropdown component. */
export interface CustomerSelectProps {
  customers: Customer[];
  isLoading: boolean;
  error: string | null;
  selectedCustomerId: number | null;
  onChange: (customerId: number | null) => void;
  validationError: string | null;
}

/** Dropdown for selecting a pre-seeded customer when creating a dispute. */
export function CustomerSelect({
  customers,
  isLoading,
  error,
  selectedCustomerId,
  onChange,
  validationError,
}: CustomerSelectProps): JSX.Element {
  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>): void => {
    const { value } = event.target;
    onChange(value === '' ? null : Number(value));
  };

  const borderClass = validationError ? 'border-red-500' : 'border-gray-300';

  return (
    <div>
      <label htmlFor="customer-select" className="block text-sm font-medium text-gray-700 mb-1">
        Customer <span className="text-red-600">*</span>
      </label>

      {error && (
        <div
          data-testid="customer-error"
          role="alert"
          className="mb-2 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      <div className="flex items-center gap-2">
        <select
          id="customer-select"
          data-testid="customer-select"
          value={selectedCustomerId === null ? '' : String(selectedCustomerId)}
          onChange={handleChange}
          disabled={isLoading}
          className={`w-full rounded border ${borderClass} px-3 py-2 text-sm disabled:bg-gray-100`}
        >
          {isLoading ? (
            <option value="" disabled>
              Loading customers...
            </option>
          ) : (
            <>
              <option value="">Select a customer</option>
              {customers.map((customer) => (
                <option key={customer.id} value={String(customer.id)}>
                  {customer.name} — {customer.accountIdentifier}
                </option>
              ))}
            </>
          )}
        </select>

        {isLoading && (
          <span
            data-testid="customer-loading"
            className="h-4 w-4 animate-spin rounded-full border-2 border-[#003366] border-t-transparent"
          />
        )}
      </div>

      {validationError && <p className="mt-1 text-sm text-red-600">{validationError}</p>}
    </div>
  );
}
