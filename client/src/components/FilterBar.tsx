import type { Status, Priority } from '../types';

/** Props for the FilterBar component. */
export interface FilterBarProps {
  /** Currently checked statuses. */
  statuses: Status[];
  /** Currently checked priorities. */
  priorities: Priority[];
  /** Called with the next set of checked statuses when a status checkbox toggles. */
  onStatusChange: (statuses: Status[]) => void;
  /** Called with the next set of checked priorities when a priority checkbox toggles. */
  onPriorityChange: (priorities: Priority[]) => void;
}

/** Status options in their canonical display order with human-readable labels. */
const STATUS_OPTIONS: Array<{ value: Status; label: string }> = [
  { value: 'Reported', label: 'Reported' },
  { value: 'UnderInvestigation', label: 'Under Investigation' },
  { value: 'Escalated', label: 'Escalated' },
  { value: 'Resolved', label: 'Resolved' },
  { value: 'Referred', label: 'Referred' },
];

/** Priority options in their canonical display order. */
const PRIORITY_OPTIONS: Array<{ value: Priority; label: string }> = [
  { value: 'P1', label: 'P1' },
  { value: 'P2', label: 'P2' },
  { value: 'Standard', label: 'Standard' },
];

/**
 * Toggles a value within a list while preserving the canonical option order.
 */
function toggle<T>(current: T[], value: T, order: T[]): T[] {
  const next = current.includes(value)
    ? current.filter((item) => item !== value)
    : [...current, value];
  return order.filter((item) => next.includes(item));
}

/** Props for a single chip-style filter toggle. */
interface FilterChipProps {
  id: string;
  label: string;
  checked: boolean;
  onToggle: () => void;
}

/**
 * A pill-shaped toggle backed by a real (visually hidden) checkbox so the
 * control stays keyboard- and screen-reader-accessible. Selected chips fill
 * with the brand navy; unselected chips read as quiet outlines.
 */
function FilterChip({ id, label, checked, onToggle }: FilterChipProps) {
  return (
    <label
      htmlFor={id}
      className={`cursor-pointer select-none rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
        checked
          ? 'border-[#003366] bg-[#003366] text-white'
          : 'border-slate-300 bg-white text-slate-600 hover:border-slate-400 hover:text-slate-800'
      }`}
    >
      <input
        id={id}
        type="checkbox"
        data-testid={id}
        checked={checked}
        onChange={onToggle}
        className="sr-only"
      />
      {label}
    </label>
  );
}

/** Filter controls with status and priority chip groups. */
export function FilterBar({
  statuses,
  priorities,
  onStatusChange,
  onPriorityChange,
}: FilterBarProps) {
  const statusOrder = STATUS_OPTIONS.map((option) => option.value);
  const priorityOrder = PRIORITY_OPTIONS.map((option) => option.value);

  return (
    <div className="flex flex-col gap-5 sm:flex-row sm:gap-12">
      <fieldset>
        <legend className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
          Status
        </legend>
        <div className="flex flex-wrap gap-2">
          {STATUS_OPTIONS.map(({ value, label }) => (
            <FilterChip
              key={value}
              id={`filter-status-${value.toLowerCase()}`}
              label={label}
              checked={statuses.includes(value)}
              onToggle={() => onStatusChange(toggle(statuses, value, statusOrder))}
            />
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
          Priority
        </legend>
        <div className="flex flex-wrap gap-2">
          {PRIORITY_OPTIONS.map(({ value, label }) => (
            <FilterChip
              key={value}
              id={`filter-priority-${value.toLowerCase()}`}
              label={label}
              checked={priorities.includes(value)}
              onToggle={() => onPriorityChange(toggle(priorities, value, priorityOrder))}
            />
          ))}
        </div>
      </fieldset>
    </div>
  );
}
