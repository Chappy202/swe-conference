import { useState, useEffect } from 'react';
import { Customer } from '../types/dispute';

/** Return type of the useCustomers hook. */
export interface UseCustomersReturn {
  customers: Customer[];
  isLoading: boolean;
  error: string | null;
}

const CUSTOMER_FETCH_ERROR = 'Failed to load customers. Please refresh the page.';

/** Hook to fetch the customer list from GET /api/customers. */
export function useCustomers(): UseCustomersReturn {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const fetchCustomers = async (): Promise<void> => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/customers');

        if (cancelled) return;

        if (!response.ok) {
          setError(CUSTOMER_FETCH_ERROR);
          setCustomers([]);
        } else {
          const data: Customer[] = await response.json();
          if (!cancelled) {
            setCustomers(data);
          }
        }
      } catch {
        if (!cancelled) {
          setError(CUSTOMER_FETCH_ERROR);
          setCustomers([]);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    fetchCustomers();

    return () => {
      cancelled = true;
    };
  }, []);

  return { customers, isLoading, error };
}
