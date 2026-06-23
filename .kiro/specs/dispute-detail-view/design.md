# Design Document: Dispute Detail View

## Overview

The Dispute Detail View is a client-side page at route `/disputes/:id` that renders complete dispute information and provides lifecycle management actions. It fetches a single `DisputeDetail` payload from the API and distributes data across a set of focused, single-responsibility components. User interactions (status transitions, resolution, adding transactions) are handled via modal workflows that PATCH/POST to the API and refetch dispute state on success.

The page is purely presentational with a custom hook (`useDisputeDetail`) managing data fetching, loading, and error states. All business logic (valid transitions, triage rules) lives server-side — the frontend derives UI state from the API response.

---

## Components and Interfaces

### Page Component

```typescript
// client/src/pages/DisputeDetail.tsx
// Route: /disputes/:id

interface DisputeDetailPageProps {
  // No props — reads :id from route params via react-router-dom
}
```

The page component orchestrates layout and delegates rendering to child components. It owns no business logic beyond reading the route param and calling the hook.

### Custom Hook

```typescript
// client/src/hooks/useDisputeDetail.ts

interface UseDisputeDetailReturn {
  dispute: DisputeDetail | null;
  isLoading: boolean;
  error: string | null;
  notFound: boolean;
  refetch: () => void;
}

function useDisputeDetail(id: number): UseDisputeDetailReturn;
```

Responsibilities:
- Calls `GET /api/disputes/:id` on mount and when `id` changes
- Manages loading/error/notFound states from response
- Exposes `refetch()` for child components to trigger data refresh after mutations

### Component Tree

```
DisputeDetailPage
├── BackLink                        (static "← Back to Dashboard")
├── TitleRow
│   ├── <h1> "Dispute #{id}"
│   └── StatusActionButtons         (derived from dispute.status)
├── CustomerInfoCard                (dispute.customer)
├── DisputeSummaryCard              (status, priority, category, amount, date)
├── TriageRecommendationCard        (recommendation text, priority border)
├── RuleTraceSection                (collapsible, dispute.ruleTrace)
├── TransactionsTable               (dispute.transactions)
│   └── AddTransactionButton        (hidden if terminal)
├── ResolutionOutcomeDisplay        (shown iff status = Resolved)
├── ResolutionOutcomeModal          (opened by Resolve action)
└── AddTransactionModal             (opened by Add Transaction button)
```

### Component Interfaces

```typescript
// client/src/components/CustomerInfoCard.tsx
interface CustomerInfoCardProps {
  customer: {
    name: string;
    contactReference: string;
    accountIdentifier: string;
  };
}

// client/src/components/DisputeSummaryCard.tsx
interface DisputeSummaryCardProps {
  status: Status;
  priority: Priority;
  category: string;
  totalAmount: number;
  dateRaised: string;
}

// client/src/components/TriageRecommendationCard.tsx
interface TriageRecommendationCardProps {
  recommendation: string;
  priority: Priority;
}

// client/src/components/RuleTraceSection.tsx
interface RuleTraceSectionProps {
  ruleTrace: RuleTrace;
}

// client/src/components/TransactionsTable.tsx
interface TransactionsTableProps {
  transactions: Transaction[];
}

// client/src/components/StatusActionButtons.tsx
interface StatusActionButtonsProps {
  status: Status;
  disputeId: number;
  onActionComplete: () => void;
  onResolveClick: () => void;
}

// client/src/components/ResolutionOutcomeModal.tsx
interface ResolutionOutcomeModalProps {
  isOpen: boolean;
  disputeId: number;
  onClose: () => void;
  onResolved: () => void;
}

// client/src/components/AddTransactionModal.tsx
interface AddTransactionModalProps {
  isOpen: boolean;
  disputeId: number;
  onClose: () => void;
  onAdded: () => void;
}

// client/src/components/ResolutionOutcomeDisplay.tsx
interface ResolutionOutcomeDisplayProps {
  outcome: ResolutionOutcome;
}
```

### Status-to-Actions Mapping

The frontend uses a static map to derive which buttons to render. No server call is needed — the map mirrors the server-side lifecycle guard:

```typescript
// client/src/utils/statusTransitions.ts

type Status = 'Reported' | 'UnderInvestigation' | 'Escalated' | 'Resolved' | 'Referred';

interface ActionConfig {
  label: string;
  targetStatus: Status;
  testId: string;
  style: 'primary' | 'amber' | 'green' | 'grey';
  opensModal?: boolean;
}

const VALID_TRANSITIONS: Record<Status, ActionConfig[]> = {
  Reported: [
    { label: 'Begin Investigation', targetStatus: 'UnderInvestigation', testId: 'action-investigate', style: 'primary' },
  ],
  UnderInvestigation: [
    { label: 'Escalate', targetStatus: 'Escalated', testId: 'action-escalate', style: 'amber' },
    { label: 'Resolve', targetStatus: 'Resolved', testId: 'action-resolve', style: 'green', opensModal: true },
    { label: 'Refer', targetStatus: 'Referred', testId: 'action-refer', style: 'grey' },
  ],
  Escalated: [
    { label: 'Resolve', targetStatus: 'Resolved', testId: 'action-resolve', style: 'green', opensModal: true },
  ],
  Resolved: [],
  Referred: [],
};

const TERMINAL_STATUSES: Status[] = ['Resolved', 'Referred'];

function isTerminalStatus(status: Status): boolean {
  return TERMINAL_STATUSES.includes(status);
}

function getAvailableActions(status: Status): ActionConfig[] {
  return VALID_TRANSITIONS[status] ?? [];
}
```

### Formatting Utilities

```typescript
// client/src/utils/formatters.ts

/** Format a number as ZAR currency: R16,500 */
function formatZAR(amount: number): string;

/** Format an ISO date string as "DD MMM YYYY HH:mm" */
function formatDateTime(isoString: string): string;
```

### Modal State Management

Both modals are controlled components. The page owns `isResolutionModalOpen` and `isAddTransactionModalOpen` state:

```typescript
// Inside DisputeDetailPage
const [isResolutionModalOpen, setIsResolutionModalOpen] = useState(false);
const [isAddTransactionModalOpen, setIsAddTransactionModalOpen] = useState(false);
```

The `StatusActionButtons` component calls `onResolveClick` instead of making a direct API call when the "Resolve" button is clicked — this propagates to the page which opens the modal.

### Error Handling Pattern

```typescript
// Shared error handling for API mutations
interface MutationState {
  isSubmitting: boolean;
  error: string | null;
}
```

- **Status transitions:** Error displayed via a dismissible toast (`data-testid="action-error"`)
- **Resolution modal:** Error displayed inline below radio group
- **Add transaction modal:** Error displayed inline as alert

---

## Data Models

### API Response Types (client-side)

```typescript
// client/src/types/dispute.ts

type Status = 'Reported' | 'UnderInvestigation' | 'Escalated' | 'Resolved' | 'Referred';
type Priority = 'P1' | 'P2' | 'Standard';
type PaymentType = 'Card' | 'ApplePay' | 'EFT';
type ResolutionOutcome = 'Refunded' | 'Declined' | 'ChargebackInitiated';

interface Customer {
  id: number;
  name: string;
  contactReference: string;
  accountIdentifier: string;
}

interface Transaction {
  id: number;
  amount: number;
  merchant: string;
  timestamp: string;
  paymentType: PaymentType;
  createdAt: string;
}

interface RuleTraceEntry {
  rule: string;
  condition: string;
  result: boolean;
  detail: string;
}

interface RuleTrace {
  evaluatedAt: string;
  inputs: {
    youngestTransactionAge: string;
    totalAmount: number;
  };
  rules: RuleTraceEntry[];
  recommendation: string;
  priority: Priority;
}

interface DisputeDetail {
  id: number;
  customerId: number;
  customer: Customer;
  status: Status;
  category: string;
  totalAmount: number;
  dateRaised: string;
  priority: Priority;
  recommendation: string;
  ruleTrace: RuleTrace;
  resolutionOutcome: ResolutionOutcome | null;
  transactions: Transaction[];
  createdAt: string;
  updatedAt: string;
}
```

### Request Payloads

```typescript
// Status transition
interface StatusTransitionRequest {
  status: Status;
  resolutionOutcome?: ResolutionOutcome;
}

// Add transaction
interface AddTransactionRequest {
  amount: number;
  merchant: string;
  timestamp: string;
  paymentType: PaymentType;
}
```

### Priority Colour Mapping

```typescript
const PRIORITY_COLOURS: Record<Priority, { badge: string; border: string }> = {
  P1: { badge: 'bg-red-100 text-red-700', border: 'border-l-red-600' },
  P2: { badge: 'bg-amber-100 text-amber-700', border: 'border-l-amber-500' },
  Standard: { badge: 'bg-gray-100 text-gray-700', border: 'border-l-gray-400' },
};
```

### Status Colour Mapping

```typescript
const STATUS_COLOURS: Record<Status, string> = {
  Reported: 'bg-indigo-100 text-indigo-700',
  UnderInvestigation: 'bg-blue-100 text-blue-700',
  Escalated: 'bg-red-100 text-red-700',
  Resolved: 'bg-green-100 text-green-700',
  Referred: 'bg-purple-100 text-purple-700',
};
```

---

## Error Handling

### Page-Level Errors

| Scenario | API Response | UI Behaviour |
|----------|-------------|--------------|
| Dispute not found | 404 `DISPUTE_NOT_FOUND` | Show `data-testid="not-found-state"`: "Dispute not found." + back link |
| Network/server error | 5xx or network failure | Show `data-testid="error-state"`: alert + "Retry" button calling `refetch()` |

### Action Errors (Status Transitions)

| Scenario | API Response | UI Behaviour |
|----------|-------------|--------------|
| Invalid transition | 400 `INVALID_STATUS_TRANSITION` | Toast with error message, auto-dismiss after 5s |
| Other failure | 5xx or network failure | Toast: "Failed to update status: {error}." |

### Resolution Modal Errors

| Scenario | API Response | UI Behaviour |
|----------|-------------|--------------|
| Missing outcome | 400 `MISSING_RESOLUTION_OUTCOME` | Inline error below radio group |
| Other failure | 5xx or network failure | Inline error: "Failed to resolve dispute. Please try again." |

### Add Transaction Modal Errors

| Scenario | API Response | UI Behaviour |
|----------|-------------|--------------|
| Terminal state | 400 `DISPUTE_IN_TERMINAL_STATE` | Inline alert with error message |
| Validation error | 400 `VALIDATION_ERROR` | Inline alert with server message |
| Other failure | 5xx or network failure | Inline alert: "Failed to add transaction: {error}." |

All mutation errors keep the modal open so the user can retry or correct input.

---

## Testing Strategy

### Unit Tests (Vitest + Testing Library)

Focus on component rendering logic and utility functions:

| Test Target | What to Verify |
|-------------|---------------|
| `useDisputeDetail` hook | Loading → success, loading → error, loading → 404, refetch triggers re-fetch |
| `StatusActionButtons` | Renders correct buttons per status, calls handlers |
| `ResolutionOutcomeModal` | Radio selection enables confirm, dismiss methods close modal |
| `AddTransactionModal` | Validation gate (all fields + amount > 0), submit payload |
| `formatZAR` | Currency formatting for various amounts |
| `formatDateTime` | Date formatting for various ISO strings |
| `getAvailableActions` | Returns correct action configs per status |
| `isTerminalStatus` | Correct classification for all 5 statuses |

### Property-Based Tests (Vitest + fast-check)

Higher-value tests that validate universal properties across generated inputs. See Correctness Properties section below.

### Integration Tests (Component + API mock)

Full page renders with mocked fetch responses verifying end-to-end data flow from API response to rendered DOM.

### E2E Tests (Playwright)

One user flow covering the complete dispute lifecycle: navigate to detail → verify content → transition status → resolve with outcome → verify terminal state.

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Action Button Accuracy

*For any* dispute status value, the set of action buttons rendered by `StatusActionButtons` SHALL match exactly the entries in the `VALID_TRANSITIONS` map for that status — no extra buttons, no missing buttons, and each button's label and testId correspond to its map entry.

**Validates: Requirements 7.1, 7.2, 7.3, 7.4**

### Property 2: Terminal State Immutability

*For any* dispute in a terminal status (`Resolved` or `Referred`), the page SHALL render zero action buttons AND the "Add Transaction" button SHALL be absent from the DOM.

**Validates: Requirements 7.4, 10.1, 10.2**

### Property 3: Resolution Outcome Visibility

*For any* dispute, the resolution outcome section (`data-testid="resolution-outcome"`) SHALL be present in the DOM if and only if the dispute status is `Resolved`.

**Validates: Requirements 11.1, 11.2**

### Property 4: Priority Colour Mapping Consistency

*For any* priority value (`P1`, `P2`, `Standard`), both the priority badge in the summary card and the left border of the triage recommendation card SHALL use the colour defined in the `PRIORITY_COLOURS` mapping for that priority.

**Validates: Requirements 3.2, 4.2**

### Property 5: Transaction Table Rendering Fidelity

*For any* list of N transactions (N ≥ 1), the transactions table SHALL render exactly N data rows, and each row's amount SHALL be formatted as ZAR (`R` prefix with thousands separator) and timestamp SHALL be formatted as `DD MMM YYYY HH:mm`.

**Validates: Requirements 6.1, 6.2**

### Property 6: Modal Dismiss Safety

*For any* dismissal method (clicking Cancel, clicking the close button, or clicking the overlay) on the Resolution Outcome Modal, the modal SHALL close AND no API request SHALL be made AND the dispute data SHALL remain unchanged.

**Validates: Requirements 9.7**

### Property 7: Resolution Payload Correctness

*For any* resolution outcome selection (Refunded, Declined, or ChargebackInitiated), when the user confirms resolution, the PATCH request payload SHALL contain `{ status: "Resolved", resolutionOutcome: <selected_value> }` matching exactly the user's radio selection.

**Validates: Requirements 9.5**

### Property 8: Add Transaction Validation Gate

*For any* combination of form field values in the Add Transaction modal, the submit button SHALL be enabled if and only if: amount is a number greater than zero, merchant is non-empty, timestamp is non-empty, and payment type is selected.

**Validates: Requirements 10.5**
