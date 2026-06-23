import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useCustomers } from '../../src/hooks/useCustomers';
import { Customer } from '../../src/types/dispute';

const mockCustomers: Customer[] = [
  { id: 1, name: 'Jane Doe', contactReference: 'REF-001', accountIdentifier: 'ACC-123' },
  { id: 2, name: 'John Smith', contactReference: 'REF-002', accountIdentifier: 'ACC-456' },
];

describe('useCustomers', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('when mounted', () => {
    it('should initially return isLoading true and an empty customers array', () => {
      vi.stubGlobal(
        'fetch',
        vi.fn(() => new Promise(() => {})) // never resolves
      );

      const { result } = renderHook(() => useCustomers());

      expect(result.current.isLoading).toBe(true);
      expect(result.current.customers).toEqual([]);
      expect(result.current.error).toBeNull();
    });

    it('should fetch from GET /api/customers', () => {
      const fetchMock = vi.fn(() => new Promise(() => {}));
      vi.stubGlobal('fetch', fetchMock);

      renderHook(() => useCustomers());

      expect(fetchMock).toHaveBeenCalledWith('/api/customers');
    });
  });

  describe('when fetch succeeds', () => {
    it('should populate customers and set isLoading false', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn(() =>
          Promise.resolve({
            ok: true,
            status: 200,
            json: () => Promise.resolve(mockCustomers),
          } as Response)
        )
      );

      const { result } = renderHook(() => useCustomers());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.customers).toEqual(mockCustomers);
      expect(result.current.error).toBeNull();
    });
  });

  describe('when the response is not ok', () => {
    it('should set the error message and isLoading false', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn(() =>
          Promise.resolve({
            ok: false,
            status: 500,
            json: () => Promise.resolve({ error: 'SERVER_ERROR' }),
          } as Response)
        )
      );

      const { result } = renderHook(() => useCustomers());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBe('Failed to load customers. Please refresh the page.');
      expect(result.current.customers).toEqual([]);
    });
  });

  describe('when a network error occurs', () => {
    it('should set the error message and isLoading false', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn(() => Promise.reject(new Error('Network failure')))
      );

      const { result } = renderHook(() => useCustomers());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBe('Failed to load customers. Please refresh the page.');
      expect(result.current.customers).toEqual([]);
    });
  });
});
