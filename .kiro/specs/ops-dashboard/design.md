# Design Document: Ops Dashboard

## Overview

The Ops Dashboard is the root route (`/`) of the Dispute Triage System frontend. It renders a filterable, sortable table of all disputes, enabling ops users to triage cases and navigate to detail views or create new disputes. All filtering and sorting is server-side via query parameters to `GET /api/disputes`.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  Browser (React 18 + Vite 5)                                │
│                                                             │
│  App.tsx (BrowserRouter)                                    │
│    └── DashboardPage (route: /)                             │
│          ├── AppHeader                                      │
│          ├── PageTitleRow (h1 + NewDisputeButton)           │
│          ├── FilterBar                                      │
│          │     ├── StatusFilterGroup                        │
│          │     └── PriorityFilterGroup                      │
│          ├── SortControls                                   │
│          └── DisputesTable                                  │
│                ├── LoadingState                              │
│                ├── ErrorState                                │
│                ├── EmptyState                                │
│                └── DisputeRow[] (StatusBadge, PriorityBadge)│
└──────────────────────────┬──────────────────────────────────┘
                           │ GET /api/disputes?status=...&priority=...&sortBy=...&sortOrder=...
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  Express Server (port 3001)                                 │
│    /api/disputes → disputeService.list(filters, sort)       │
│      → Prisma query (SQLite)                                │
└─────────────────────────────────────────────────────────────┘
```

**Data Flow:**
1. `DashboardPage` owns filter and sort state via `useState`.
2. `useDisputes` hook accepts filter/sort params and manages the fetch lifecycle.
3. When filter or sort state changes, `useDisputes` re-fetches with updated query params.
4. The API returns a filtered, sorted array of `DisputeSummary` objects.
5. `DisputesTable` renders rows from the response or shows loading/error/empty states.

## Components and Interfaces

### Type Definitions

```typescript
// client/src/types.ts

type Status = 'Reported' | 'UnderInvestigation' | 'Escalated' | 'Resolved' | 'Referred';
type Priority = 'P1' | 'P2' | 'Standard';
type SortField = 'dateRaised' | 'totalAmount' | 'priority';
type SortOrder = 'asc' | 'desc';

interface DisputeSummary {
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
```

### Custom Hook

```typescript
// client/src/hooks/useDisputes.ts

interface UseDisputesParams {
  status: Status[];
  priority: Priority[];
  sortBy: SortField;
  sortOrder: SortOrder;
}

interface UseDisputesReturn {
  disputes: DisputeSummary[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

function useDisputes(params: UseDisputesParams): UseDisputesReturn;
```

**Behaviour:**
- Constructs query string from params: `status` and `priority` as comma-separated values, `sortBy` and `sortOrder` as literal values.
- When all statuses/priorities are checked (the default), omits the corresponding query parameter (server returns all).
- Uses `useEffect` to trigger fetch on param change.
- Exposes `refetch()` to re-issue the same request (used by Retry button).
- Manages `isLoading`, `error`, and `disputes` state internally.

### Component Interfaces

```typescript
// client/src/pages/Dashboard.tsx
// No props — root page component. Owns filter/sort state.

// client/src/components/FilterBar.tsx
interface FilterBarProps {
  statuses: Status[];
  priorities: Priority[];
  onStatusChange: (statuses: Status[]) => void;
  onPriorityChange: (priorities: Priority[]) => void;
}

// client/src/components/SortControls.tsx
interface SortControlsProps {
  sortBy: SortField;
  sortOrder: SortOrder;
  onSortByChange: (field: SortField) => void;
  onSortOrderChange: (order: SortOrder) => void;
}

// client/src/components/DisputesTable.tsx
interface DisputesTableProps {
  disputes: DisputeSummary[];
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
}

// client/src/components/DisputeRow.tsx
interface DisputeRowProps {
  dispute: DisputeSummary;
}

// client/src/components/StatusBadge.tsx
interface StatusBadgeProps {
  status: Status;
}

// client/src/components/PriorityBadge.tsx
interface PriorityBadgeProps {
  priority: Priority;
}
```

### Badge Colour Mappings

```typescript
// client/src/components/StatusBadge.tsx

const STATUS_STYLES: Record<Status, string> = {
  Reported: 'bg-blue-100 text-blue-700',
  UnderInvestigation: 'bg-violet-100 text-violet-700',
  Escalated: 'bg-amber-100 text-amber-700',
  Resolved: 'bg-emerald-100 text-emerald-700',
  Referred: 'bg-gray-100 text-gray-700',
};

// client/src/components/PriorityBadge.tsx

const PRIORITY_STYLES: Record<Priority, string> = {
  P1: 'bg-red-100 text-red-700',
  P2: 'bg-amber-100 text-amber-700',
  Standard: 'bg-gray-100 text-gray-700',
};
```

### Formatting Utilities

```typescript
// client/src/utils/formatters.ts

/**
 * Formats a numeric amount as ZAR currency: "R16,500"
 */
function formatCurrency(amount: number): string;

/**
 * Formats an ISO date string as "DD MMM YYYY HH:mm"
 * e.g., "22 Jun 2025 07:30"
 */
function formatDate(isoString: string): string;
```

## Data Models

### API Response Shape (from `GET /api/disputes`)

The dashboard consumes the `DisputeSummary` schema from the API:

| Field | Type | Description |
|-------|------|-------------|
| id | number | Dispute identifier |
| customerId | number | Foreign key to customer |
| customerName | string | Denormalized customer name |
| status | Status | Current lifecycle status |
| category | string | Always "Unauthorised/Fraudulent Charge" |
| totalAmount | number | Sum of transactions in ZAR |
| dateRaised | string | ISO 8601 timestamp |
| priority | Priority | Triage priority level |
| recommendation | string | Triage recommendation text |
| resolutionOutcome | string \| null | Resolution if resolved |
| createdAt | string | Record creation timestamp |
| updatedAt | string | Last update timestamp |

### Client State Model

```typescript
// Managed in DashboardPage component

interface DashboardState {
  // Filter state
  checkedStatuses: Status[];     // Default: all 5 statuses
  checkedPriorities: Priority[]; // Default: all 3 priorities

  // Sort state
  sortBy: SortField;             // Default: 'priority'
  sortOrder: SortOrder;          // Default: 'desc'
}
```

### Query Parameter Serialization

| UI State | Query Param | Format | Example |
|----------|-------------|--------|---------|
| checkedStatuses | `status` | Comma-separated | `Reported,Escalated` |
| checkedPriorities | `priority` | Comma-separated | `P1,P2` |
| sortBy | `sortBy` | Literal value | `totalAmount` |
| sortOrder | `sortOrder` | `asc` or `desc` | `desc` |

When all values are checked (default state), the parameter is omitted from the request.

## Error Handling

| Scenario | User Experience | Recovery |
|----------|----------------|----------|
| API request in-flight | 5 skeleton rows with `animate-pulse` + `bg-slate-200` | Automatic — resolves on response |
| API returns empty array | Centered "No disputes found matching your filters." | User adjusts filters |
| API request fails (network/5xx) | Red alert: "Failed to load disputes. Please try again." + Retry button | Click Retry re-issues request with current params |
| API returns invalid JSON | Treated as fetch error — same ErrorState | Click Retry |

**Error state includes `data-testid="error-state"` and `data-testid="retry-button"`.**

The `useDisputes` hook catches all fetch errors and surfaces them as a string `error` value. The `refetch()` function resets error state and re-issues the request.

## Testing Strategy

### Unit Tests (Vitest + Testing Library)

Unit tests target pure functions and component rendering in isolation:

- **Formatting utilities** (`formatCurrency`, `formatDate`) — verify output for representative inputs.
- **Badge components** — verify correct CSS classes and text for each status/priority value.
- **FilterBar** — verify initial checked state, callback invocation on checkbox toggle.
- **SortControls** — verify dropdown options, callback invocation on change.
- **DisputesTable** — verify rendering of rows, loading state, error state, empty state.
- **DisputeRow** — verify column content, navigation on click, data-testid assignment.
- **useDisputes hook** — verify query param construction, fetch lifecycle states, refetch behaviour.

### Property-Based Tests (Vitest + fast-check)

Property tests validate universal invariants across generated inputs:

- Filter accuracy: generated dispute lists + filter combinations → only matching disputes shown.
- Sort correctness: generated dispute lists + sort configs → output is correctly ordered.
- Formatting functions: random amounts/dates → output matches expected pattern.
- Badge mappings: random status/priority values → deterministic CSS class output.
- API serialization: random filter/sort states → correct query string construction.

### E2E Tests (Playwright)

One user journey per key workflow:

- Load dashboard, verify table renders with data.
- Toggle filters, verify table updates.
- Change sort, verify row order changes.
- Click a row, verify navigation to detail page.
- Simulate API error, verify error state and retry.

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Filter Accuracy

*For any* combination of checked status filters and checked priority filters, and *for any* list of disputes returned by the API, every dispute displayed in the table SHALL have a status contained in the checked statuses set AND a priority contained in the checked priorities set. Furthermore, no dispute matching the active filters shall be omitted from the display.

**Validates: Requirements 2.3, 2.4, 3.3, 3.4**

### Property 2: Sort Correctness

*For any* list of disputes and *for any* selected sort field (dateRaised, totalAmount, priority) with a selected sort direction (asc, desc), the rows in the DisputesTable SHALL be ordered such that for every adjacent pair of rows (row_i, row_i+1), the sort field value of row_i compares correctly to row_i+1 per the chosen direction. When two disputes share the same sort field value, they SHALL be sub-sorted by dateRaised in descending order.

**Validates: Requirements 4.3, 4.4, 5.3, 5.4**

### Property 3: Currency Formatting

*For any* non-negative numeric amount, the `formatCurrency` function SHALL produce a string that starts with "R", uses comma as the thousands separator, and represents the same numeric value as the input (truncated to whole ZAR).

**Validates: Requirements 1.4**

### Property 4: Date Formatting

*For any* valid ISO 8601 date string, the `formatDate` function SHALL produce a string matching the pattern `DD MMM YYYY HH:mm` where DD is a zero-padded day, MMM is a 3-letter month abbreviation, YYYY is a 4-digit year, and HH:mm is 24-hour time.

**Validates: Requirements 1.5**

### Property 5: Row Data Integrity

*For any* dispute in the API response, the corresponding DisputeRow SHALL display the dispute's numeric ID, the customer name string, and SHALL have `data-testid` equal to `"dispute-row-{id}"` where `{id}` is the dispute's numeric identifier.

**Validates: Requirements 1.2, 1.3, 1.6**

### Property 6: Priority Badge Correctness

*For any* valid priority value (P1, P2, Standard), the PriorityBadge component SHALL render with exactly the CSS classes defined in the PRIORITY_STYLES mapping for that value, AND SHALL display the priority value as visible text within the badge.

**Validates: Requirements 7.1, 7.2, 7.3, 7.4**

### Property 7: Status Badge Correctness

*For any* valid status value (Reported, UnderInvestigation, Escalated, Resolved, Referred), the StatusBadge component SHALL render with exactly the CSS classes defined in the STATUS_STYLES mapping for that value, AND SHALL display the status name as visible text within the badge.

**Validates: Requirements 8.1, 8.2, 8.3, 8.4, 8.5, 8.6**

### Property 8: API Query Parameter Serialization

*For any* combination of checked statuses, checked priorities, sort field, and sort order in the UI state, the `useDisputes` hook SHALL construct a fetch URL where: the `status` query parameter equals the comma-joined checked statuses (or is omitted when all are checked), the `priority` query parameter equals the comma-joined checked priorities (or is omitted when all are checked), `sortBy` equals the selected sort field, and `sortOrder` equals "asc" or "desc" matching the selected direction.

**Validates: Requirements 14.1, 14.2, 14.3, 14.4, 14.5**

### Property 9: Navigation Correctness

*For any* dispute displayed in the table, clicking its DisputeRow SHALL trigger navigation to the route `/disputes/{id}` where `{id}` is that dispute's numeric identifier.

**Validates: Requirements 6.1**
