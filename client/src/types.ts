/**
 * Shared type definitions for the Ops Dashboard.
 *
 * The lifecycle/priority unions are owned by `./types/dispute` and re-exported here
 * so the dashboard depends on a single source of truth for those domain types.
 */
export type { Status, Priority } from './types/dispute';

/** Field by which the disputes table can be sorted. */
export type SortField = 'dateRaised' | 'totalAmount' | 'priority';

/** Sort direction for the disputes table. */
export type SortOrder = 'asc' | 'desc';

import type { Status, Priority } from './types/dispute';

/** A dispute as summarised in the dashboard list (from `GET /api/disputes`). */
export interface DisputeSummary {
  id: number;
  customerId: number;
  customerName: string;
  status: Status;
  category: string;
  totalAmount: number;
  dateRaised: string;
  priority: Priority;
  recommendation: string;
  resolutionOutcome: string | null;
  createdAt: string;
  updatedAt: string;
}
