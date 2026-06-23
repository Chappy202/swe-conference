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

/** Filter section with status and priority checkbox groups. */
export function FilterBar({
  statuses,
  priorities,
  onStatusChange,
  onPriorityChange,
}: FilterBarProps) {
  const statusOrder = STATUS_OPTIONS.map((option) => option.value);
  const priorityOrder = PRIORITY_OPTIONS.map((option) => option.value);

  return (
    <section className="flex gap-12 rounded-card border border-slate-200 bg-white p-5">
      <fieldset>
        <legend className="mb-2 text-sm font-semibold text-slate-700">Status</legend>
        <div className="flex flex-col gap-2">
          {STATUS_OPTIONS.map(({ value, label }) => {
            const id = `filter-status-${value.toLowerCase()}`;
            return (
              <label
                key={value}
                htmlFor={id}
                className="flex items-center gap-2 text-sm text-slate-700"
              >
                <input
                  id={id}
                  type="checkbox"
                  data-testid={id}
                  checked={statuses.includes(value)}
                  onChange={() => onStatusChange(toggle(statuses, value, statusOrder))}
                  className="h-4 w-4"
                />
                {label}
              </label>
            );
          })}
        </div>
      </fieldset>

      <fieldset>
        <legend className="mb-2 text-sm font-semibold text-slate-700">Priority</legend>
        <div className="flex flex-col gap-2">
          {PRIORITY_OPTIONS.map(({ value, label }) => {
            const id = `filter-priority-${value.toLowerCase()}`;
            return (
              <label
                key={value}
                htmlFor={id}
                className="flex items-center gap-2 text-sm text-slate-700"
              >
                <input
                  id={id}
                  type="checkbox"
                  data-testid={id}
                  checked={priorities.includes(value)}
                  onChange={() => onPriorityChange(toggle(priorities, value, priorityOrder))}
                  className="h-4 w-4"
                />
                {label}
              </label>
            );
          })}
        </div>
      </fieldset>
    </section>
  );
}
