import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Priority, SortField, SortOrder, Status } from '../types';
import { useDisputes } from '../hooks/useDisputes';
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
      <header
        data-testid="app-header"
        className="flex h-16 items-center bg-[#003366] px-6 text-white"
      >
        <span className="text-lg font-semibold">Dispute Triage</span>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">All Disputes</h1>
          <button
            type="button"
            data-testid="new-dispute-button"
            onClick={() => navigate('/disputes/new')}
            className="rounded-button bg-[#003366] px-4 py-2 text-sm font-medium text-white hover:bg-[#004d99]"
          >
            New Dispute
          </button>
        </div>

        <div className="mb-6">
          <FilterBar
            statuses={statuses}
            priorities={priorities}
            onStatusChange={setStatuses}
            onPriorityChange={setPriorities}
          />
        </div>

        <div className="mb-6">
          <SortControls
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSortByChange={setSortBy}
            onSortOrderChange={setSortOrder}
          />
        </div>

        <DisputesTable disputes={disputes} isLoading={isLoading} error={error} onRetry={refetch} />
      </main>
    </div>
  );
}
