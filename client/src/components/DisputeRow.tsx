import { useNavigate } from 'react-router-dom';
import type { DisputeSummary } from '../types';
import { formatZAR, formatDateTime } from '../utils/formatters';
import { StatusBadge } from './StatusBadge';
import { PriorityBadge } from './PriorityBadge';

/** Props for the DisputeRow component. */
export interface DisputeRowProps {
  /** The dispute summary to display in this row. */
  dispute: DisputeSummary;
}

/** A single clickable disputes-table row that navigates to the dispute detail page. */
export function DisputeRow({ dispute }: DisputeRowProps) {
  const navigate = useNavigate();

  return (
    <tr
      data-testid={`dispute-row-${dispute.id}`}
      onClick={() => navigate(`/disputes/${dispute.id}`)}
      className="cursor-pointer border-b border-slate-100 hover:bg-slate-50"
    >
      <td className="px-4 py-3 text-sm text-slate-500 tabular-nums">{dispute.id}</td>
      <td className="px-4 py-3 text-sm font-semibold text-slate-800">{dispute.customerName}</td>
      <td className="px-4 py-3">
        <StatusBadge status={dispute.status} />
      </td>
      <td className="px-4 py-3">
        <PriorityBadge priority={dispute.priority} />
      </td>
      <td className="px-4 py-3 text-right text-sm text-slate-800 tabular-nums">
        {formatZAR(dispute.totalAmount)}
      </td>
      <td className="px-4 py-3 text-sm text-slate-600 tabular-nums">
        {formatDateTime(dispute.dateRaised)}
      </td>
    </tr>
  );
}
