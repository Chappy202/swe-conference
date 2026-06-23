import type { SortField, SortOrder } from '../types';

/** Props for the SortControls component. */
export interface SortControlsProps {
  /** Currently selected sort field. */
  sortBy: SortField;
  /** Currently selected sort direction. */
  sortOrder: SortOrder;
  /** Called when the user selects a different sort field. */
  onSortByChange: (field: SortField) => void;
  /** Called when the user toggles the sort direction. */
  onSortOrderChange: (order: SortOrder) => void;
}

/** Sort field options in display order. */
const SORT_FIELD_OPTIONS: Array<{ value: SortField; label: string }> = [
  { value: 'dateRaised', label: 'Date Raised' },
  { value: 'totalAmount', label: 'Total Amount' },
  { value: 'priority', label: 'Priority' },
];

/** Controls for choosing the disputes table sort field and direction. */
export function SortControls({
  sortBy,
  sortOrder,
  onSortByChange,
  onSortOrderChange,
}: SortControlsProps) {
  const nextOrder: SortOrder = sortOrder === 'asc' ? 'desc' : 'asc';
  const directionLabel = sortOrder === 'asc' ? 'Ascending' : 'Descending';

  return (
    <section className="flex items-center gap-3">
      <label htmlFor="sort-field" className="text-sm font-medium text-slate-600">
        Sort by
      </label>
      <select
        id="sort-field"
        data-testid="sort-field"
        value={sortBy}
        onChange={(event) => onSortByChange(event.target.value as SortField)}
        className="h-10 rounded-input border border-slate-300 bg-white px-3 text-sm text-slate-800 focus:border-[#003366] focus:outline-none focus:ring-1 focus:ring-[#003366]"
      >
        {SORT_FIELD_OPTIONS.map(({ value, label }) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>

      <button
        type="button"
        data-testid="sort-direction"
        aria-label={`Sort direction: ${directionLabel}. Click to toggle.`}
        onClick={() => onSortOrderChange(nextOrder)}
        className="flex h-10 items-center gap-1.5 rounded-button border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
      >
        <span aria-hidden="true" className="text-slate-400">
          {sortOrder === 'asc' ? '↑' : '↓'}
        </span>
        {directionLabel}
      </button>
    </section>
  );
}
