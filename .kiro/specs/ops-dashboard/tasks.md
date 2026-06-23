# Implementation Plan: Ops Dashboard

## Overview

Build the Ops Dashboard as the root route (`/`) of the Dispute Triage System frontend. The dashboard displays a filterable, sortable table of disputes with server-side query integration, colour-coded badges, loading/error/empty states, and navigation to detail and creation views. Implementation uses React 18, Vite 5, Tailwind CSS 3, react-router-dom for routing, and Vitest + Testing Library for component tests. Follows strict TDD (red-green-refactor) per project conventions.

## Tasks

- [x] 1. Set up project foundation and shared types
  - [x] 1.1 Install react-router-dom and create shared type definitions
    - Install `react-router-dom` as a dependency in the client workspace
    - Create `client/src/types.ts` with `Status`, `Priority`, `SortField`, `SortOrder` types and `DisputeSummary` interface as defined in the design
    - _Requirements: 1.1, 2.1, 3.1, 4.1_

  - [x] 1.2 Implement formatting utilities with tests
    - Create `client/src/utils/formatters.ts` with `formatCurrency` and `formatDate` functions
    - `formatCurrency`: accepts a number, returns string with "R" prefix and thousands separator (e.g., `R16,500`)
    - `formatDate`: accepts an ISO string, returns "DD MMM YYYY HH:mm" format
    - Write unit tests in `client/tests/formatters.test.ts` following TDD
    - _Requirements: 1.4, 1.5_

  - [x]* 1.3 Write property tests for formatting utilities
    - **Property 3: Currency Formatting** — for any non-negative number, output starts with "R", uses comma thousands separator, represents correct value
    - **Property 4: Date Formatting** — for any valid ISO date, output matches `DD MMM YYYY HH:mm` pattern
    - Create `client/tests/formatters.property.test.ts` using fast-check
    - **Validates: Requirements 1.4, 1.5**

- [x] 2. Implement badge components
  - [x] 2.1 Implement StatusBadge component with tests
    - Create `client/src/components/StatusBadge.tsx` with `StatusBadgeProps` interface
    - Render a pill-shaped span with Tailwind classes per the STATUS_STYLES mapping (Reported: blue, UnderInvestigation: violet, Escalated: amber, Resolved: emerald, Referred: gray)
    - Display status name as visible text within the badge
    - Write unit tests in `client/tests/StatusBadge.test.tsx` verifying correct classes and text for each status
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 16.3_

  - [x] 2.2 Implement PriorityBadge component with tests
    - Create `client/src/components/PriorityBadge.tsx` with `PriorityBadgeProps` interface
    - Render a pill-shaped span with Tailwind classes per PRIORITY_STYLES mapping (P1: red, P2: amber, Standard: gray)
    - Display priority level as visible text within the badge
    - Write unit tests in `client/tests/PriorityBadge.test.tsx` verifying correct classes and text for each priority
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 16.3_

  - [x]* 2.3 Write property tests for badge components
    - **Property 6: Priority Badge Correctness** — for any valid priority value, PriorityBadge renders with deterministic CSS classes from PRIORITY_STYLES and displays the priority as text
    - **Property 7: Status Badge Correctness** — for any valid status value, StatusBadge renders with deterministic CSS classes from STATUS_STYLES and displays the status name as text
    - Create `client/tests/badges.property.test.tsx` using fast-check
    - **Validates: Requirements 7.1–7.4, 8.1–8.6**

- [x] 3. Implement filter and sort controls
  - [x] 3.1 Implement FilterBar component with tests
    - Create `client/src/components/FilterBar.tsx` with `FilterBarProps` interface
    - Render a status checkbox group (Reported, Under Investigation, Escalated, Resolved, Referred) — all checked by default
    - Render a priority checkbox group (P1, P2, Standard) — all checked by default
    - Each checkbox has an associated `<label>` element for accessibility
    - Assign `data-testid="filter-status-{value}"` and `data-testid="filter-priority-{value}"` to checkboxes
    - Call `onStatusChange`/`onPriorityChange` callbacks when checkboxes are toggled
    - Write unit tests in `client/tests/FilterBar.test.tsx` verifying initial state, toggle behaviour, and callbacks
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 3.1, 3.2, 3.3, 3.4, 3.5, 16.4_

  - [x] 3.2 Implement SortControls component with tests
    - Create `client/src/components/SortControls.tsx` with `SortControlsProps` interface
    - Render a dropdown (`data-testid="sort-field"`) with options: Date Raised, Total Amount, Priority
    - Render a toggle button (`data-testid="sort-direction"`) for Ascending/Descending with ARIA label
    - Call `onSortByChange`/`onSortOrderChange` callbacks on user interaction
    - Write unit tests in `client/tests/SortControls.test.tsx` verifying dropdown options, direction toggle, and callbacks
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 16.2, 16.4_

- [x] 4. Implement data hook and table components
  - [x] 4.1 Implement useDisputes custom hook with tests
    - Create `client/src/hooks/useDisputes.ts` with `UseDisputesParams` and `UseDisputesReturn` interfaces
    - Construct query string from params: `status` and `priority` as comma-separated values, `sortBy` and `sortOrder` as literals
    - Omit `status`/`priority` params when all values are checked (default)
    - Use `useEffect` to trigger fetch on param change; manage `isLoading`, `error`, `disputes` state
    - Expose `refetch()` function to re-issue the request (resets error state)
    - Write unit tests in `client/tests/useDisputes.test.ts` using `vi.fn()` to mock fetch, verifying query construction and lifecycle states
    - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5, 12.3_

  - [x]* 4.2 Write property test for API query parameter serialization
    - **Property 8: API Query Parameter Serialization** — for any combination of checked statuses, priorities, sort field, and sort order, the hook constructs the correct fetch URL with properly formatted query params (comma-joined values, omitted when all checked)
    - Create `client/tests/useDisputes.property.test.ts` using fast-check
    - **Validates: Requirements 14.1, 14.2, 14.3, 14.4, 14.5**

  - [x] 4.3 Implement DisputeRow component with tests
    - Create `client/src/components/DisputeRow.tsx` with `DisputeRowProps` interface
    - Render a table row (`<tr>`) with columns: ID, Customer Name, Status (StatusBadge), Priority (PriorityBadge), Total Amount (formatCurrency), Date Raised (formatDate)
    - Assign `data-testid="dispute-row-{id}"` to the row element
    - Apply `cursor-pointer` style; navigate to `/disputes/{id}` on click using `useNavigate`
    - Write unit tests in `client/tests/DisputeRow.test.tsx` verifying column content, data-testid, click navigation
    - _Requirements: 1.2, 1.3, 1.4, 1.5, 1.6, 6.1, 6.2_

  - [x]* 4.4 Write property test for row data integrity
    - **Property 5: Row Data Integrity** — for any dispute, DisputeRow displays the numeric ID, customer name, and has data-testid equal to `"dispute-row-{id}"`
    - **Property 9: Navigation Correctness** — clicking any DisputeRow navigates to `/disputes/{id}` with the correct dispute ID
    - Add to `client/tests/DisputeRow.property.test.tsx` using fast-check
    - **Validates: Requirements 1.2, 1.3, 1.6, 6.1**

- [x] 5. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Implement table container and dashboard page
  - [x] 6.1 Implement DisputesTable component with tests
    - Create `client/src/components/DisputesTable.tsx` with `DisputesTableProps` interface
    - Render a semantic HTML table (`<table>`, `<thead>`, `<tbody>`) with `data-testid="disputes-table"` when disputes are present
    - Render LoadingState: 5 skeleton rows with `animate-pulse` and `bg-slate-200` blocks, `data-testid="loading-state"`
    - Render ErrorState: red alert with "Failed to load disputes. Please try again." message, `data-testid="error-state"`, and Retry button `data-testid="retry-button"`
    - Render EmptyState: centred "No disputes found matching your filters." message, `data-testid="empty-state"`, hide table header
    - Write unit tests in `client/tests/DisputesTable.test.tsx` verifying all four states (data, loading, error, empty)
    - _Requirements: 1.1, 10.1, 10.2, 10.3, 11.1, 11.2, 12.1, 12.2, 16.1_

  - [x] 6.2 Implement Dashboard page component with tests
    - Create `client/src/pages/Dashboard.tsx` as root page component (no props)
    - Render AppHeader: `data-testid="app-header"`, `h-16`, `bg-[#003366]`, white text, "Dispute Triage"
    - Render page title "All Disputes" as `<h1>` below header
    - Render "New Dispute" button (`data-testid="new-dispute-button"`) aligned right, navigates to `/disputes/new` on click
    - Compose FilterBar, SortControls, and DisputesTable components
    - Own filter/sort state with defaults: all statuses checked, all priorities checked, sortBy `priority`, sortOrder `desc`
    - Pass state and handlers to child components; use `useDisputes` hook for data fetching
    - Write unit tests in `client/tests/Dashboard.test.tsx` verifying composition, header, title, button, and state wiring
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 9.1, 9.2, 13.1, 13.2, 15.1–15.9, 17.1, 17.2_

  - [x]* 6.3 Write property tests for filter accuracy and sort correctness
    - **Property 1: Filter Accuracy** — for any combination of filter states and dispute lists, only matching disputes are shown and none are omitted
    - **Property 2: Sort Correctness** — for any dispute list and sort config, rows are ordered correctly with dateRaised desc as tiebreaker
    - Create `client/tests/dashboard.property.test.ts` using fast-check
    - **Validates: Requirements 2.3, 2.4, 3.3, 3.4, 4.3, 4.4, 5.3, 5.4**

- [x] 7. Wire routing and final integration
  - [x] 7.1 Update App.tsx with react-router-dom routing
    - NOTE: The `Dashboard` page and its tests are complete (`client/src/pages/Dashboard.tsx`,
      default export). The actual `App.tsx` route-wiring is intentionally left to the
      orchestrator to avoid conflicts — App.tsx and App.test.tsx were not modified by this spec.
    - Modify `client/src/App.tsx` to wrap the app in `BrowserRouter`
    - Add route `/` rendering the Dashboard page
    - Add placeholder route `/disputes/:id` for future detail page
    - Add placeholder route `/disputes/new` for future creation page
    - Update `client/tests/App.test.tsx` to account for routing
    - _Requirements: 6.1, 9.2_

- [x] 8. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- All components use Tailwind CSS utility classes exclusively (Requirement 17.1)
- All interactive elements include `data-testid` attributes (Requirement 15)
- Strict TDD applies: write failing tests first, then implement minimum code to pass
- The `useDisputes` hook fetches from `/api/disputes` — the Vite dev proxy handles routing to Express on port 3001
- Install `fast-check` as a dev dependency when implementing property tests

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["1.2", "2.1", "2.2"] },
    { "id": 2, "tasks": ["1.3", "2.3", "3.1", "3.2", "4.1"] },
    { "id": 3, "tasks": ["4.2", "4.3"] },
    { "id": 4, "tasks": ["4.4", "6.1"] },
    { "id": 5, "tasks": ["6.2"] },
    { "id": 6, "tasks": ["6.3", "7.1"] }
  ]
}
```
