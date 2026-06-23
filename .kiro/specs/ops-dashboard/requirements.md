# Requirements Document

## Introduction

The Ops Dashboard is the primary landing page of the Dispute Triage System, served at route `/`. It provides operations users with a filterable, sortable overview of all disputes, enabling quick triage and navigation to individual case details or the creation of new disputes.

## Glossary

- **Dashboard**: The main page component rendered at route `/` displaying all disputes in a table format
- **FilterBar**: A UI section containing checkbox groups that allow the user to include or exclude disputes by status and priority
- **SortControls**: A UI section containing a field dropdown and direction toggle that control table ordering
- **DisputesTable**: The full-width HTML table displaying dispute records as rows
- **DisputeRow**: A single clickable row in the DisputesTable representing one dispute
- **StatusBadge**: A coloured pill-shaped label indicating a dispute's current lifecycle status
- **PriorityBadge**: A coloured pill-shaped label indicating a dispute's triage priority level
- **EmptyState**: The UI displayed when no disputes match the active filters
- **LoadingState**: A skeleton placeholder UI displayed while dispute data is being fetched
- **ErrorState**: An alert UI displayed when the API request to fetch disputes fails
- **API**: The Express backend serving dispute data at `GET /api/disputes`

## Requirements

### Requirement 1: Disputes Table Display

**User Story:** As an ops user, I want to see all disputes in a structured table, so that I can quickly scan and assess the current caseload.

#### Acceptance Criteria

1. THE Dashboard SHALL render a full-width table with columns: ID, Customer Name, Status, Priority, Total Amount, and Date Raised. (`data-testid="disputes-table"`)
2. THE DisputesTable SHALL display the ID column as an integer value sourced from the dispute record.
3. THE DisputesTable SHALL display the Customer Name column as a string sourced from the dispute's associated customer name.
4. THE DisputesTable SHALL display the Total Amount column formatted as ZAR currency with an "R" prefix and thousands separator (e.g., R16,500).
5. THE DisputesTable SHALL display the Date Raised column formatted as "DD MMM YYYY HH:mm".
6. THE DisputesTable SHALL assign `data-testid="dispute-row-{id}"` to each row, where `{id}` is the dispute's numeric identifier.

### Requirement 2: Status Filtering

**User Story:** As an ops user, I want to filter disputes by status, so that I can focus on cases in a specific lifecycle stage.

#### Acceptance Criteria

1. THE FilterBar SHALL display a group of checkboxes for statuses: Reported, Under Investigation, Escalated, Resolved, and Referred.
2. WHEN the Dashboard loads, THE FilterBar SHALL render all status checkboxes in a checked state.
3. WHEN the ops user unchecks a status checkbox, THE DisputesTable SHALL display only disputes whose status matches the remaining checked statuses.
4. WHEN the ops user re-checks a previously unchecked status checkbox, THE DisputesTable SHALL include disputes of that status in the displayed results.
5. THE FilterBar SHALL assign `data-testid="filter-status-{value}"` to each status checkbox, where `{value}` is the lowercase status identifier.

### Requirement 3: Priority Filtering

**User Story:** As an ops user, I want to filter disputes by priority, so that I can focus on high-urgency cases.

#### Acceptance Criteria

1. THE FilterBar SHALL display a group of checkboxes for priorities: P1, P2, and Standard.
2. WHEN the Dashboard loads, THE FilterBar SHALL render all priority checkboxes in a checked state.
3. WHEN the ops user unchecks a priority checkbox, THE DisputesTable SHALL display only disputes whose priority matches the remaining checked priorities.
4. WHEN the ops user re-checks a previously unchecked priority checkbox, THE DisputesTable SHALL include disputes of that priority in the displayed results.
5. THE FilterBar SHALL assign `data-testid="filter-priority-{value}"` to each priority checkbox, where `{value}` is the lowercase priority identifier.

### Requirement 4: Sorting

**User Story:** As an ops user, I want to sort disputes by different fields, so that I can prioritise my review order.

#### Acceptance Criteria

1. THE SortControls SHALL display a dropdown with sort field options: Date Raised, Total Amount, and Priority. (`data-testid="sort-field"`)
2. THE SortControls SHALL display a toggle button for sort direction: Ascending and Descending. (`data-testid="sort-direction"`)
3. WHEN the ops user selects a different sort field, THE DisputesTable SHALL re-order rows by the selected field while preserving the current sort direction.
4. WHEN the ops user toggles the sort direction, THE DisputesTable SHALL re-order rows in the opposite direction while preserving the current sort field.

### Requirement 5: Default Sort Order

**User Story:** As an ops user, I want the dashboard to display disputes in priority order by default, so that the most urgent cases appear first without manual sorting.

#### Acceptance Criteria

1. WHEN the Dashboard loads, THE SortControls SHALL default the sort field to Priority.
2. WHEN the Dashboard loads, THE SortControls SHALL default the sort direction to Descending.
3. WHEN the Dashboard loads with default sort, THE DisputesTable SHALL display P1 disputes before P2 disputes, and P2 disputes before Standard disputes.
4. WHILE disputes share the same priority, THE DisputesTable SHALL order those disputes by Date Raised in descending order (newest first).

### Requirement 6: Row Navigation

**User Story:** As an ops user, I want to click a dispute row to view its details, so that I can investigate and manage individual cases.

#### Acceptance Criteria

1. WHEN the ops user clicks a DisputeRow, THE Dashboard SHALL navigate to route `/disputes/{id}` where `{id}` is the dispute's numeric identifier.
2. THE DisputeRow SHALL visually indicate that it is clickable by applying a cursor pointer style.

### Requirement 7: Priority Badges

**User Story:** As an ops user, I want to see colour-coded priority badges, so that I can visually distinguish urgency levels at a glance.

#### Acceptance Criteria

1. WHEN a dispute has priority P1, THE PriorityBadge SHALL render with background class `bg-red-100` and text class `text-red-700`.
2. WHEN a dispute has priority P2, THE PriorityBadge SHALL render with background class `bg-amber-100` and text class `text-amber-700`.
3. WHEN a dispute has priority Standard, THE PriorityBadge SHALL render with background class `bg-gray-100` and text class `text-gray-700`.
4. THE PriorityBadge SHALL display the priority level as text within the badge (P1, P2, or Standard).

### Requirement 8: Status Badges

**User Story:** As an ops user, I want to see colour-coded status badges, so that I can quickly identify dispute lifecycle stages.

#### Acceptance Criteria

1. WHEN a dispute has status Reported, THE StatusBadge SHALL render with background class `bg-blue-100` and text class `text-blue-700`.
2. WHEN a dispute has status Under Investigation, THE StatusBadge SHALL render with background class `bg-violet-100` and text class `text-violet-700`.
3. WHEN a dispute has status Escalated, THE StatusBadge SHALL render with background class `bg-amber-100` and text class `text-amber-700`.
4. WHEN a dispute has status Resolved, THE StatusBadge SHALL render with background class `bg-emerald-100` and text class `text-emerald-700`.
5. WHEN a dispute has status Referred, THE StatusBadge SHALL render with background class `bg-gray-100` and text class `text-gray-700`.
6. THE StatusBadge SHALL display the status name as text within the badge.

### Requirement 9: New Dispute Navigation

**User Story:** As an ops user, I want a button to create a new dispute, so that I can quickly raise new cases from the dashboard.

#### Acceptance Criteria

1. THE Dashboard SHALL display a "New Dispute" button aligned to the right of the page title. (`data-testid="new-dispute-button"`)
2. WHEN the ops user clicks the "New Dispute" button, THE Dashboard SHALL navigate to route `/disputes/new`.

### Requirement 10: Loading State

**User Story:** As an ops user, I want to see a loading indicator while data is being fetched, so that I know the system is working.

#### Acceptance Criteria

1. WHILE the API request to fetch disputes is in progress, THE Dashboard SHALL display a skeleton loading state with 5 rows of animated placeholder bars. (`data-testid="loading-state"`)
2. WHILE the loading state is displayed, THE Dashboard SHALL apply Tailwind class `animate-pulse` with `bg-slate-200` blocks to the skeleton rows.
3. WHEN the API request completes successfully, THE Dashboard SHALL replace the loading state with the populated DisputesTable.

### Requirement 11: Empty State

**User Story:** As an ops user, I want to see a clear message when no disputes match my filters, so that I understand the table is not broken.

#### Acceptance Criteria

1. WHEN the API returns zero disputes matching the active filters, THE Dashboard SHALL display a centred message: "No disputes found matching your filters." (`data-testid="empty-state"`)
2. WHEN the empty state is displayed, THE Dashboard SHALL hide the table header and rows.

### Requirement 12: Error State with Retry

**User Story:** As an ops user, I want to see an error message with a retry option when data fails to load, so that I can recover without refreshing the page.

#### Acceptance Criteria

1. IF the API request to fetch disputes fails, THEN THE Dashboard SHALL display an error alert with the message: "Failed to load disputes. Please try again." (`data-testid="error-state"`)
2. THE ErrorState SHALL display a "Retry" button that allows the ops user to re-attempt the data fetch. (`data-testid="retry-button"`)
3. WHEN the ops user clicks the "Retry" button, THE Dashboard SHALL re-issue the API request with the current filter and sort parameters.

### Requirement 13: Application Header

**User Story:** As an ops user, I want a consistent header across the application, so that I always know which system I am using.

#### Acceptance Criteria

1. THE Dashboard SHALL render a header with the text "Dispute Triage", a height of `h-16`, background colour `bg-[#003366]`, and white text. (`data-testid="app-header"`)
2. THE Dashboard SHALL render the page title "All Disputes" as an `h1` element below the header.

### Requirement 14: API Integration

**User Story:** As an ops user, I want the table to reflect server-side filtering and sorting, so that results are accurate and performant.

#### Acceptance Criteria

1. WHEN filter or sort parameters change, THE Dashboard SHALL issue a GET request to `/api/disputes` with query parameters: `status`, `priority`, `sortBy`, and `sortOrder`.
2. THE Dashboard SHALL pass checked status values as a comma-separated `status` query parameter.
3. THE Dashboard SHALL pass checked priority values as a comma-separated `priority` query parameter.
4. THE Dashboard SHALL pass the selected sort field as the `sortBy` query parameter.
5. THE Dashboard SHALL pass the selected sort direction as the `sortOrder` query parameter with value `asc` or `desc`.

### Requirement 15: Test Identifiers

**User Story:** As a developer, I want all interactive elements to have data-testid attributes, so that automated tests can reliably target them.

#### Acceptance Criteria

1. THE Dashboard SHALL assign `data-testid="app-header"` to the application header element.
2. THE Dashboard SHALL assign `data-testid="new-dispute-button"` to the new dispute button.
3. THE Dashboard SHALL assign `data-testid="sort-field"` to the sort field dropdown.
4. THE Dashboard SHALL assign `data-testid="sort-direction"` to the sort direction toggle.
5. THE Dashboard SHALL assign `data-testid="disputes-table"` to the disputes table element.
6. THE Dashboard SHALL assign `data-testid="empty-state"` to the empty state container.
7. THE Dashboard SHALL assign `data-testid="loading-state"` to the loading state container.
8. THE Dashboard SHALL assign `data-testid="error-state"` to the error state container.
9. THE Dashboard SHALL assign `data-testid="retry-button"` to the retry button.

### Requirement 16: Accessibility

**User Story:** As an ops user, I want the dashboard to be accessible, so that it can be used with assistive technologies.

#### Acceptance Criteria

1. THE Dashboard SHALL use semantic HTML elements (table, thead, tbody, tr, th, td) for the disputes table.
2. THE Dashboard SHALL provide ARIA labels on all icon-only buttons.
3. THE Dashboard SHALL ensure that colour is not the sole indicator of meaning — badges include text labels alongside colour.
4. THE Dashboard SHALL ensure all form inputs (checkboxes, dropdowns) have associated label elements.

### Requirement 17: Styling Constraints

**User Story:** As a developer, I want styling to use only Tailwind CSS utilities, so that the codebase remains consistent and maintainable.

#### Acceptance Criteria

1. THE Dashboard SHALL use Tailwind CSS utility classes exclusively for all styling.
2. THE Dashboard SHALL target a minimum viewport width of 1024px (desktop-first layout).
3. THE Dashboard SHALL support evergreen browsers (latest Chrome, Firefox, Safari, Edge).
