import { Transaction, Status } from '../types/dispute';
import { formatZAR, formatDateTime } from '../utils/formatters';
import { isTerminalStatus } from '../utils/statusTransitions';

/** Props for the TransactionsTable component. */
export interface TransactionsTableProps {
  /** List of transactions to display. */
  transactions: Transaction[];
  /** Current dispute status — determines Add Transaction button visibility. */
  status: Status;
  /** Called when the user clicks "Add Transaction". */
  onAddTransaction?: () => void;
}

export function TransactionsTable({ transactions, status, onAddTransaction }: TransactionsTableProps) {
  return (
    <div data-testid="transactions-table">
      <table className="w-full text-sm text-left">
        <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
          <tr>
            <th className="px-4 py-3">Amount (ZAR)</th>
            <th className="px-4 py-3">Merchant</th>
            <th className="px-4 py-3">Timestamp</th>
            <th className="px-4 py-3">Payment Type</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {transactions.map((txn) => (
            <tr key={txn.id}>
              <td className="px-4 py-3">{formatZAR(txn.amount)}</td>
              <td className="px-4 py-3">{txn.merchant}</td>
              <td className="px-4 py-3">{formatDateTime(txn.timestamp)}</td>
              <td className="px-4 py-3">{txn.paymentType}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {!isTerminalStatus(status) && (
        <button
          data-testid="add-transaction-button"
          onClick={onAddTransaction}
          className="mt-4 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded hover:bg-indigo-700"
        >
          Add Transaction
        </button>
      )}
    </div>
  );
}
