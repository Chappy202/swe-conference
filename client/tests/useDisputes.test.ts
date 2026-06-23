import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useDisputes } from '../src/hooks/useDisputes';
import type { Status, Priority } from '../src/types';

const ALL_STATUSES: Status[] = [
  'Reported',
  'UnderInvestigation',
  'Escalated',
  'Resolved',
  'Referred',
];
const ALL_PRIORITIES: Priority[] = ['P1', 'P2', 'Standard'];

const SAMPLE_DISPUTES = [
  {
    id: 1,
    customerId: 1,
    customerName: 'John Doe',
    status: 'Reported',
    category: 'Unauthorised/Fraudulent Charge',
    totalAmount: 16500,
    dateRaised: '2025-06-22T07:30:00.000Z',
    priority: 'P1',
    recommendation: 'P1 High Priority Escalation',
    resolutionOutcome: null,
    createdAt: '2025-06-22T07:30:00.000Z',
    updatedAt: '2025-06-22T07:30:00.000Z',
  },
];

function mockFetchOk(data: unknown) {
  return vi.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve(data) } as Response));
}

function lastFetchUrl(fetchMock: ReturnType<typeof vi.fn>): string {
  return fetchMock.mock.calls[fetchMock.mock.calls.length - 1][0] as string;
}

function defaultParams() {
  return {
    status: ALL_STATUSES,
    priority: ALL_PRIORITIES,
    sortBy: 'priority' as const,
    sortOrder: 'desc' as const,
  };
}

describe('useDisputes', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('query parameter construction', () => {
    beforeEach(() => {
      vi.stubGlobal('fetch', mockFetchOk(SAMPLE_DISPUTES));
    });

    it('should omit status and priority when all are checked', async () => {
      renderHook(() => useDisputes(defaultParams()));
      await waitFor(() => expect(fetch).toHaveBeenCalled());
      const url = lastFetchUrl(fetch as ReturnType<typeof vi.fn>);
      expect(url).not.toContain('status=');
      expect(url).not.toContain('priority=');
    });

    it('should always include sortBy and sortOrder', async () => {
      renderHook(() => useDisputes(defaultParams()));
      await waitFor(() => expect(fetch).toHaveBeenCalled());
      const url = lastFetchUrl(fetch as ReturnType<typeof vi.fn>);
      expect(url).toContain('sortBy=priority');
      expect(url).toContain('sortOrder=desc');
    });

    it('should pass a comma-separated status param when a subset is checked', async () => {
      renderHook(() => useDisputes({ ...defaultParams(), status: ['Reported', 'Escalated'] }));
      await waitFor(() => expect(fetch).toHaveBeenCalled());
      const url = lastFetchUrl(fetch as ReturnType<typeof vi.fn>);
      expect(url).toContain('status=Reported%2CEscalated');
    });

    it('should pass a comma-separated priority param when a subset is checked', async () => {
      renderHook(() => useDisputes({ ...defaultParams(), priority: ['P1', 'P2'] }));
      await waitFor(() => expect(fetch).toHaveBeenCalled());
      const url = lastFetchUrl(fetch as ReturnType<typeof vi.fn>);
      expect(url).toContain('priority=P1%2CP2');
    });
  });

  describe('fetch lifecycle', () => {
    it('should expose disputes once the request resolves', async () => {
      vi.stubGlobal('fetch', mockFetchOk(SAMPLE_DISPUTES));
      const { result } = renderHook(() => useDisputes(defaultParams()));
      await waitFor(() => expect(result.current.isLoading).toBe(false));
      expect(result.current.disputes).toEqual(SAMPLE_DISPUTES);
      expect(result.current.error).toBeNull();
    });

    it('should surface an error string when the request fails', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn(() => Promise.reject(new Error('network down')))
      );
      const { result } = renderHook(() => useDisputes(defaultParams()));
      await waitFor(() => expect(result.current.isLoading).toBe(false));
      expect(result.current.error).toBe('Failed to load disputes. Please try again.');
      expect(result.current.disputes).toEqual([]);
    });

    it('should surface an error when the response is not ok', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn(() => Promise.resolve({ ok: false, status: 500 } as Response))
      );
      const { result } = renderHook(() => useDisputes(defaultParams()));
      await waitFor(() => expect(result.current.isLoading).toBe(false));
      expect(result.current.error).toBe('Failed to load disputes. Please try again.');
    });
  });

  describe('refetch', () => {
    it('should re-issue the request when refetch is called', async () => {
      const fetchMock = mockFetchOk(SAMPLE_DISPUTES);
      vi.stubGlobal('fetch', fetchMock);
      const { result } = renderHook(() => useDisputes(defaultParams()));
      await waitFor(() => expect(result.current.isLoading).toBe(false));
      const callsBefore = fetchMock.mock.calls.length;

      act(() => {
        result.current.refetch();
      });

      await waitFor(() => expect(fetchMock.mock.calls.length).toBeGreaterThan(callsBefore));
    });
  });
});
