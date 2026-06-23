import { renderHook, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useDisputeDetail } from '../../src/hooks/useDisputeDetail';
import { DisputeDetail } from '../../src/types/dispute';

const mockDispute: DisputeDetail = {
  id: 1,
  customerId: 10,
  customer: {
    id: 10,
    name: 'Jane Doe',
    contactReference: 'REF-001',
    accountIdentifier: 'ACC-123',
  },
  status: 'Reported',
  category: 'Unauthorised/Fraudulent Charge',
  totalAmount: 16500,
  dateRaised: '2024-06-01T10:00:00Z',
  priority: 'P1',
  recommendation: 'Immediate Fraud Freeze + P1 Escalation',
  ruleTrace: {
    evaluatedAt: '2024-06-01T10:00:00Z',
    inputs: { youngestTransactionAge: '2 hours', totalAmount: 16500 },
    rules: [
      { rule: 'Amount Threshold', condition: 'totalAmount > 10000', result: true, detail: 'R16,500 exceeds R10,000' },
      { rule: 'Age Threshold', condition: 'age < 48h', result: true, detail: '2 hours is within 48h' },
    ],
    recommendation: 'Immediate Fraud Freeze + P1 Escalation',
    priority: 'P1',
  },
  resolutionOutcome: null,
  transactions: [
    {
      id: 1,
      amount: 8500,
      merchant: 'Store A',
      timestamp: '2024-06-01T08:00:00Z',
      paymentType: 'ApplePay',
      createdAt: '2024-06-01T10:00:00Z',
    },
  ],
  createdAt: '2024-06-01T10:00:00Z',
  updatedAt: '2024-06-01T10:00:00Z',
};

describe('useDisputeDetail', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('when mounted', () => {
    it('should initially return isLoading true and dispute null', () => {
      vi.stubGlobal(
        'fetch',
        vi.fn(() => new Promise(() => {})) // never resolves
      );

      const { result } = renderHook(() => useDisputeDetail(1));

      expect(result.current.isLoading).toBe(true);
      expect(result.current.dispute).toBeNull();
      expect(result.current.error).toBeNull();
      expect(result.current.notFound).toBe(false);
    });
  });

  describe('when fetch succeeds', () => {
    it('should set dispute data and isLoading to false', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn(() =>
          Promise.resolve({
            ok: true,
            status: 200,
            json: () => Promise.resolve(mockDispute),
          } as Response)
        )
      );

      const { result } = renderHook(() => useDisputeDetail(1));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.dispute).toEqual(mockDispute);
      expect(result.current.error).toBeNull();
      expect(result.current.notFound).toBe(false);
    });
  });

  describe('when API returns 404', () => {
    it('should set notFound to true and isLoading to false', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn(() =>
          Promise.resolve({
            ok: false,
            status: 404,
            json: () => Promise.resolve({ error: 'DISPUTE_NOT_FOUND' }),
          } as Response)
        )
      );

      const { result } = renderHook(() => useDisputeDetail(99));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.notFound).toBe(true);
      expect(result.current.dispute).toBeNull();
      expect(result.current.error).toBeNull();
    });
  });

  describe('when a network error occurs', () => {
    it('should set error to a string message and isLoading to false', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn(() => Promise.reject(new Error('Network failure')))
      );

      const { result } = renderHook(() => useDisputeDetail(1));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBe('Network failure');
      expect(result.current.dispute).toBeNull();
      expect(result.current.notFound).toBe(false);
    });
  });

  describe('when refetch is called', () => {
    it('should trigger a new fetch', async () => {
      const fetchMock = vi.fn(() =>
        Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve(mockDispute),
        } as Response)
      );
      vi.stubGlobal('fetch', fetchMock);

      const { result } = renderHook(() => useDisputeDetail(1));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(fetchMock).toHaveBeenCalledTimes(1);

      // Trigger refetch
      act(() => {
        result.current.refetch();
      });

      await waitFor(() => {
        expect(fetchMock).toHaveBeenCalledTimes(2);
      });
    });
  });
});
