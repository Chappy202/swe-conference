import { useCallback, useEffect, useState } from 'react';
import type { DisputeSummary, Priority, SortField, SortOrder, Status } from '../types';

/** All status values — used to decide whether the status param can be omitted. */
const ALL_STATUSES: Status[] = [
  'Reported',
  'UnderInvestigation',
  'Escalated',
  'Resolved',
  'Referred',
];

/** All priority values — used to decide whether the priority param can be omitted. */
const ALL_PRIORITIES: Priority[] = ['P1', 'P2', 'Standard'];

/** Parameters controlling the disputes query. */
export interface UseDisputesParams {
  status: Status[];
  priority: Priority[];
  sortBy: SortField;
  sortOrder: SortOrder;
}

/** Return shape of the useDisputes hook. */
export interface UseDisputesReturn {
  disputes: DisputeSummary[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

const ERROR_MESSAGE = 'Failed to load disputes. Please try again.';

/**
 * Builds the `/api/disputes` query string from filter and sort params.
 * Omits `status`/`priority` when every value is checked (the server returns all).
 */
export function buildDisputesUrl(params: UseDisputesParams): string {
  const query = new URLSearchParams();

  if (params.status.length > 0 && params.status.length < ALL_STATUSES.length) {
    query.set('status', params.status.join(','));
  }
  if (params.priority.length > 0 && params.priority.length < ALL_PRIORITIES.length) {
    query.set('priority', params.priority.join(','));
  }
  query.set('sortBy', params.sortBy);
  query.set('sortOrder', params.sortOrder);

  return `/api/disputes?${query.toString()}`;
}

/**
 * Fetches disputes from the API, re-fetching whenever filter/sort params change.
 * Exposes a `refetch` callback used by the error-state Retry button.
 */
export function useDisputes(params: UseDisputesParams): UseDisputesReturn {
  const [disputes, setDisputes] = useState<DisputeSummary[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [fetchTrigger, setFetchTrigger] = useState<number>(0);

  const refetch = useCallback(() => {
    setFetchTrigger((prev) => prev + 1);
  }, []);

  const url = buildDisputesUrl(params);

  useEffect(() => {
    let cancelled = false;

    const fetchDisputes = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(url);
        if (cancelled) return;

        if (!response.ok) {
          setError(ERROR_MESSAGE);
          setDisputes([]);
        } else {
          const data: DisputeSummary[] = await response.json();
          if (cancelled) return;
          setDisputes(data);
        }
      } catch {
        if (cancelled) return;
        setError(ERROR_MESSAGE);
        setDisputes([]);
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    fetchDisputes();

    return () => {
      cancelled = true;
    };
  }, [url, fetchTrigger]);

  return { disputes, isLoading, error, refetch };
}
