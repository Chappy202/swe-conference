# Design Document: Create Dispute Form

## Overview

The Create Dispute Form is a page-level React component rendered at `/disputes/new` that enables ops users to raise new disputes. It collects a customer selection and one or more transaction entries, validates all fields client-side, and submits to the `POST /api/disputes` endpoint. On success, the user is redirected to the newly created dispute's detail page.

The design favours simple controlled components with inline validation logic (no form library). State is managed locally within the page component. The `useCustomers` hook encapsulates customer data fetching and is reusable across the app.

---

## Components and Interfaces

### Component Tree

```
CreateDisputePage (/disputes/new)
├── BackLink (→ /)
├── PageTitle ("Create New Dispute")
├── CustomerSelect (dropdown from API)
├── TransactionEntryList
│   └── TransactionEntryGroup × n
│       ├── Amount input (type="number", step="0.01")
│       ├── Merchant input (type="text")
│       ├── Timestamp input (type="datetime-local")
│       ├── PaymentType select (Card | Apple Pay | EFT)
│       └── RemoveButton (hidden when only 1 group)
├── AddTransactionButton
└── SubmitButton (disabled until valid)
```

### Component Interfaces

```typescript
/** Props for the CustomerSelect dropdown component. */
interface CustomerSelectProps {
  customers: Customer[];
  isLoading: boolean;
  error: string | null;
  selectedCustomerId: number | null;
  onChange: (customerId: number | null) => void;
  validationError: string | null;
}

/** Props for a single TransactionEntryGroup. */
interface TransactionEntryGroupProps {
  index: number;
  transaction: TransactionFormState;
  onChange: (index: number, field: keyof TransactionFormState, value: string) => void;
  onRemove: (index: number) => void;
  showRemove: boolean;
  errors: TransactionFieldErrors;
  onBlur: (index: number, field: keyof TransactionFormState) => void;
}

/** Props for the TransactionEntryList container. */
interface TransactionEntryListProps {
  transactions: TransactionFormState[];
  validationErrors: TransactionFieldErrors[];
  onChange: (index: number, field: keyof TransactionFormState, value: string) => void;
  onRemove: (index: number) => void;
  onBlur: (index: number, field: keyof TransactionFormState) => void;
}

/** Props for the SubmitButton. */
interface SubmitButtonProps {
  disabled: boolean;
  isSubmitting: boolean;
}
```

### Hook Interface

```typescript
/** Return type of the useCustomers hook. */
interface UseCustomersReturn {
  customers: Customer[];
  isLoading: boolean;
  error: string | null;
}

/** Hook to fetch customer list from GET /api/customers. */
function useCustomers(): UseCustomersReturn;
```

### Page Component

```typescript
/** CreateDisputePage — page-level component at /disputes/new. */
function CreateDisputePage(): JSX.Element;
```

The page component owns all form state and orchestrates validation, submission, and navigation.

---

## Data Models

### Client-Side Types

```typescript
/** Payment type enum matching API contract. */
type PaymentType = 'Card' | 'ApplePay' | 'EFT';

/** Customer as returned by GET /api/customers. */
interface Customer {
  id: number;
  name: string;
  contactReference: string;
  accountIdentifier: string;
  createdAt: string;
}

/** Form state for a single transaction entry (all values are strings for controlled inputs). */
interface TransactionFormState {
  amount: string;
  merchant: string;
  timestamp: string;
  paymentType: string;
}

/** Validation errors for a single transaction entry group. */
interface TransactionFieldErrors {
  amount: string | null;
  merchant: string | null;
  timestamp: string | null;
  paymentType: string | null;
}

/** Top-level form state managed by the page component. */
interface CreateDisputeFormState {
  selectedCustomerId: number | null;
  transactions: TransactionFormState[];
  validationErrors: TransactionFieldErrors[];
  customerError: string | null;
  isSubmitting: boolean;
  submitError: string | null;
}
```

### API Request/Response Types

```typescript
/** POST /api/disputes request body (matches OpenAPI CreateDisputeRequest). */
interface CreateDisputePayload {
  customerId: number;
  dateRaised: string;
  totalAmount: number;
  transactions: {
    amount: number;
    merchant: string;
    timestamp: string;
    paymentType: PaymentType;
  }[];
}

/** Minimal shape of the POST /api/disputes response needed for redirect. */
interface CreateDisputeResponse {
  id: number;
}
```

### Default/Initial Values

```typescript
/** Factory for an empty transaction form state. */
function createEmptyTransaction(): TransactionFormState {
  return {
    amount: '',
    merchant: '',
    timestamp: '',
    paymentType: '',
  };
}

/** Factory for empty field errors. */
function createEmptyErrors(): TransactionFieldErrors {
  return {
    amount: null,
    merchant: null,
    timestamp: null,
    paymentType: null,
  };
}
```

---

## State Management

State is local to `CreateDisputePage` using `useState`. No global state library is needed.

| State | Type | Initial Value | Purpose |
|-------|------|---------------|---------|
| `selectedCustomerId` | `number \| null` | `null` | Tracks customer dropdown selection |
| `transactions` | `TransactionFormState[]` | `[createEmptyTransaction()]` | Array of transaction form field values |
| `validationErrors` | `TransactionFieldErrors[]` | `[createEmptyErrors()]` | Per-field errors for each transaction group |
| `customerError` | `string \| null` | `null` | Validation error for customer dropdown |
| `isSubmitting` | `boolean` | `false` | Tracks POST request in-flight state |
| `submitError` | `string \| null` | `null` | API error message on submission failure |

---

## Validation Logic

### Field-Level Validation (on blur)

```typescript
/** Validates a single transaction field. Returns error message or null. */
function validateTransactionField(
  field: keyof TransactionFormState,
  value: string
): string | null {
  switch (field) {
    case 'amount': {
      const num = parseFloat(value);
      if (!value || isNaN(num) || num <= 0) return 'Amount must be greater than zero';
      return null;
    }
    case 'merchant':
      return value.trim() === '' ? 'Merchant name is required' : null;
    case 'timestamp':
      return value === '' ? 'Transaction date is required' : null;
    case 'paymentType':
      return value === '' ? 'Please select a payment type' : null;
  }
}
```

### Form-Level Validation (on submit)

```typescript
/** Returns true if the entire form is valid. Side-effect: populates all validation errors. */
function validateForm(
  selectedCustomerId: number | null,
  transactions: TransactionFormState[]
): { isValid: boolean; customerError: string | null; transactionErrors: TransactionFieldErrors[] };
```

### Submit Button Enabled Condition

The submit button is enabled when:
1. `selectedCustomerId !== null`
2. Every transaction in `transactions` passes all field validations (amount > 0, merchant non-empty, timestamp non-empty, paymentType selected)
3. `isSubmitting === false`

---

## API Integration

### Customer Fetching (useCustomers hook)

```typescript
function useCustomers(): UseCustomersReturn {
  // 1. On mount: fetch GET /api/customers
  // 2. Set customers[] on success
  // 3. Set error message on failure
  // 4. Track isLoading state
}
```

### Form Submission

```typescript
async function handleSubmit(): Promise<void> {
  // 1. Run full form validation — abort if invalid
  // 2. Set isSubmitting = true
  // 3. Build CreateDisputePayload:
  //    - customerId from selectedCustomerId
  //    - dateRaised = new Date().toISOString()
  //    - totalAmount = sum of all transaction amounts
  //    - transactions = mapped from form state (parse amount to number)
  // 4. POST /api/disputes with payload
  // 5. On success: navigate to /disputes/{response.id}
  // 6. On failure: set submitError with message from response
  // 7. Set isSubmitting = false
}
```

---

## Error Handling

| Scenario | Handling | UI Feedback |
|----------|----------|-------------|
| Customer fetch fails | `useCustomers` sets error state | Inline alert: "Failed to load customers. Please refresh the page." (`data-testid="customer-error"`) |
| Field validation on blur | `validateTransactionField` returns error | Red border (`border-red-500`) + inline error text (`text-red-600 text-sm`) |
| Submit with invalid form | `validateForm` populates all errors | All invalid fields highlighted, submit prevented |
| POST /api/disputes fails | Response error message captured | Alert: "Failed to create dispute: {msg}. Please try again." (`data-testid="submit-error"`) with dismiss |
| Network error on submit | Caught in try/catch | Alert with generic network error message |

---

## Transaction Management Operations

### Add Transaction

```typescript
function handleAddTransaction(): void {
  // Append createEmptyTransaction() to transactions array
  // Append createEmptyErrors() to validationErrors array
}
```

### Remove Transaction

```typescript
function handleRemoveTransaction(index: number): void {
  // Remove transaction at index from transactions array
  // Remove corresponding entry from validationErrors array
  // Only allowed when transactions.length > 1
}
```

### Index Stability

After removal, `data-testid` attributes use the new array index. The `{index}` in `data-testid="transaction-amount-{index}"` always reflects the current position in the array (0-based).

---

## Testing Strategy

### Unit Tests (Vitest + Testing Library)

- **Validation functions**: Test `validateTransactionField` and `validateForm` with various inputs.
- **useCustomers hook**: Mock fetch, verify loading/success/error states.
- **CreateDisputePage component**: Render with mocked fetch, verify initial state, interactions, validation display, and submission flow.
- **TransactionEntryGroup component**: Verify field rendering, blur validation, remove button visibility.

### Property-Based Tests (fast-check + Vitest)

Property-based tests target the pure logic layers:
- Validation function behaviour across generated inputs
- Payload construction correctness
- Transaction array management invariants

### E2E Tests (Playwright)

One complete user journey:
- Navigate to `/disputes/new`
- Select customer, fill transaction fields
- Add/remove transactions
- Submit and verify redirect

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Customer dropdown format consistency

*For any* customer object with a `name` and `accountIdentifier`, the rendered dropdown option text SHALL be exactly `"{name} — {accountIdentifier}"`.

**Validates: Requirements 2.2**

### Property 2: Transaction group field completeness

*For any* transaction entry group at index `i` (where `0 ≤ i < N` and `N` is the total number of groups), the group SHALL contain an amount input with `data-testid="transaction-amount-{i}"`, a merchant input with `data-testid="transaction-merchant-{i}"`, a timestamp input with `data-testid="transaction-timestamp-{i}"`, and a payment type select with `data-testid="transaction-payment-type-{i}"`.

**Validates: Requirements 3.2, 3.3, 3.4, 3.5**

### Property 3: Adding a transaction grows the list

*For any* form state with `N` transaction groups (where `N ≥ 1`), clicking the Add Transaction button SHALL result in exactly `N + 1` transaction groups.

**Validates: Requirements 3.6**

### Property 4: Transaction count minimum invariant

*For any* form state, the number of transaction groups SHALL always be ≥ 1. The remove button SHALL be hidden when exactly 1 group exists and visible when more than 1 group exists. Removing a group from `N` groups (where `N > 1`) SHALL result in exactly `N - 1` groups.

**Validates: Requirements 3.8, 3.9, 3.10**

### Property 5: Submit enabled if and only if form is valid

*For any* form state, the submit button SHALL be enabled if and only if: (a) a customer is selected (`selectedCustomerId !== null`), AND (b) every transaction group has all fields passing validation (amount > 0, merchant non-empty, timestamp non-empty, paymentType selected), AND (c) the form is not currently submitting.

**Validates: Requirements 4.1, 4.2**

### Property 6: Invalid amount validation

*For any* amount value that is empty, zero, negative, or non-numeric, the validation function SHALL return the error message "Amount must be greater than zero".

**Validates: Requirements 4.4**

### Property 7: Blur triggers validation feedback

*For any* form field with an invalid value, when that field loses focus, the form SHALL display a red border on the field and inline error text below it.

**Validates: Requirements 4.9**

### Property 8: Submission payload shape correctness

*For any* valid form state (customer selected, all transactions valid), the POST request body SHALL contain `customerId` matching the selected customer, a `transactions` array where each entry has numeric `amount`, string `merchant`, ISO string `timestamp`, and valid `paymentType`, plus `dateRaised` as an ISO timestamp and `totalAmount` as a number.

**Validates: Requirements 5.1, 5.6**

### Property 9: Total amount equals sum of transactions

*For any* set of valid transaction amounts `[a₁, a₂, ..., aₙ]`, the `totalAmount` field in the submission payload SHALL equal `a₁ + a₂ + ... + aₙ`.

**Validates: Requirements 5.7**

### Property 10: Success redirects to created dispute

*For any* successful POST /api/disputes response containing an `id` field with value `N`, the application SHALL navigate to the route `/disputes/N`.

**Validates: Requirements 5.4**

### Property 11: Error message propagation

*For any* error message `msg` returned from a failed POST /api/disputes response, the form SHALL display an alert containing the text `"Failed to create dispute: {msg}. Please try again."`.

**Validates: Requirements 5.5**
