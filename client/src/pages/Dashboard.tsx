import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Priority, SortField, SortOrder, Status } from '../types';
import { useDisputes } from '../hooks/useDisputes';
import { AppHeader } from '../components/AppHeader';
import { FilterBar } from '../components/FilterBar';
import { SortControls } from '../components/SortControls';
import { DisputesTable } from '../components/DisputesTable';

/** All statuses, checked by default. */
const DEFAULT_STATUSES: Status[] = [
  'Reported',
  'UnderInvestigation',
  'Escalated',
  'Resolved',
  'Referred',
];

/** All priorities, checked by default. */
const DEFAULT_PRIORITIES: Priority[] = ['P1', 'P2', 'Standard'];

/**
 * Ops Dashboard — root page (`/`). Owns filter and sort state, fetches disputes via
 * the useDisputes hook, and composes the filter bar, sort controls and disputes table.
 */
export default function Dashboard() {
  const navigate = useNavigate();

  const [statuses, setStatuses] = useState<Status[]>(DEFAULT_STATUSES);
  const [priorities, setPriorities] = useState<Priority[]>(DEFAULT_PRIORITIES);
  const [sortBy, setSortBy] = useState<SortField>('priority');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  const { disputes, isLoading, error, refetch } = useDisputes({
    status: statuses,
    priority: priorities,
    sortBy,
    sortOrder,
  });

  return (
    <div className="min-h-screen bg-slate-50">
      <AppHeader />

      <main className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">All Disputes</h1>
            <p className="mt-1 text-sm text-slate-500">
              Review, filter and triage open customer disputes.
            </p>
          </div>
          <button
            type="button"
            data-testid="new-dispute-button"
            onClick={() => navigate('/disputes/new')}
            className="rounded-button bg-[#003366] px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#004d99]"
          >
            New Dispute
          </button>
        </div>

        <section
          aria-label="Filters and sorting"
          className="mb-6 rounded-card border border-slate-200 bg-white p-5 shadow-sm"
        >
          <FilterBar
            statuses={statuses}
            priorities={priorities}
            onStatusChange={setStatuses}
            onPriorityChange={setPriorities}
          />
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
            <p data-testid="results-count" className="text-sm text-slate-500" aria-live="polite">
              {isLoading
                ? 'Loading disputes…'
                : error
                  ? ''
                  : `${disputes.length} ${disputes.length === 1 ? 'dispute' : 'disputes'}`}
            </p>
            <SortControls
              sortBy={sortBy}
              sortOrder={sortOrder}
              onSortByChange={setSortBy}
              onSortOrderChange={setSortOrder}
            />
          </div>
        </section>

        <DisputesTable disputes={disputes} isLoading={isLoading} error={error} onRetry={refetch} />
      </main>
    </div>
  );
}
