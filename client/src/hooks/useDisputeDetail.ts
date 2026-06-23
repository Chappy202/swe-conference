import { useState, useEffect, useCallback } from 'react';
import { DisputeDetail } from '../types/dispute';

interface UseDisputeDetailReturn {
  dispute: DisputeDetail | null;
  isLoading: boolean;
  error: string | null;
  notFound: boolean;
  refetch: () => void;
}

export function useDisputeDetail(id: number): UseDisputeDetailReturn {
  const [dispute, setDispute] = useState<DisputeDetail | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState<boolean>(false);
  const [fetchTrigger, setFetchTrigger] = useState<number>(0);

  const refetch = useCallback(() => {
    setFetchTrigger((prev) => prev + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;

    const fetchDispute = async () => {
      setIsLoading(true);
      setError(null);
      setNotFound(false);

      try {
        const response = await fetch(`/api/disputes/${id}`);

        if (cancelled) return;

        if (response.status === 404) {
          setNotFound(true);
          setDispute(null);
        } else if (!response.ok) {
          setError(`Server error: ${response.status}`);
          setDispute(null);
        } else {
          const data: DisputeDetail = await response.json();
          setDispute(data);
        }
      } catch (err: unknown) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'An unexpected error occurred');
        setDispute(null);
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    fetchDispute();

    return () => {
      cancelled = true;
    };
  }, [id, fetchTrigger]);

  return { dispute, isLoading, error, notFound, refetch };
}
