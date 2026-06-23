# UI/UX Screen Specifications — Dispute Triage System

> Internal banking operations prototype. Desktop-first (≥ 1024px). Standard Bank corporate branding — deep blue primary (`#003366`), clean professional aesthetic.
>
> Reference: [`docs/requirements.md`](./requirements.md), [`docs/architecture.md`](./architecture.md).

---

## Design Tokens

| Token | Value | Usage |
|-------|-------|-------|
| Primary | `#003366` (deep blue) | Headers, primary buttons, active states |
| Primary Light | `#004d99` | Hover states, secondary accents |
| Surface | `#ffffff` | Cards, table rows |
| Background | `#f8fafc` | Page background (Tailwind `slate-50`) |
| Text Primary | `#1e293b` | Body text (Tailwind `slate-800`) |
| Text Secondary | `#64748b` | Labels, metadata (Tailwind `slate-500`) |
| Border | `#e2e8f0` | Card borders, dividers (Tailwind `slate-200`) |
| P1 Red | `#dc2626` | Priority P1 badge (Tailwind `red-600`) |
| P2 Amber | `#d97706` | Priority P2 badge (Tailwind `amber-600`) |
| Standard Grey | `#6b7280` | Priority Standard badge (Tailwind `gray-500`) |
| Status Reported | `#3b82f6` | Blue badge (Tailwind `blue-500`) |
| Status Under Investigation | `#8b5cf6` | Purple badge (Tailwind `violet-500`) |
| Status Escalated | `#f59e0b` | Amber badge (Tailwind `amber-500`) |
| Status Resolved | `#10b981` | Green badge (Tailwind `emerald-500`) |
| Status Referred | `#6b7280` | Grey badge (Tailwind `gray-500`) |

---

## Global Layout Shell

**Structure:**

```
┌──────────────────────────────────────────────────────────┐
│  HEADER (h-16, bg-[#003366], text-white)                 │
│  ┌─ System title: "Dispute Triage" (left-aligned)        │
│  └─ (no nav — single-page app with routing)              │
├──────────────────────────────────────────────────────────┤
│  MAIN CONTENT (max-w-7xl mx-auto px-6 py-8)             │
│  ┌──────────────────────────────────────────────────┐    │
│  │  Page-specific content                           │    │
│  └──────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────┘
```

**Technical notes:**
- All interactive elements include `data-testid` attributes.
- Tailwind CSS utility classes only — no custom CSS.
- Semantic HTML with ARIA labels on icon-only buttons.
- React 18 with TypeScript. Components use named prop interfaces.

---

## Screen: Ops Dashboard

**Route:** `/`

**Purpose:** The ops user views all disputes at a glance, filters and sorts to find cases requiring attention, and navigates to individual disputes or creates new ones.

**Layout:**

```
┌──────────────────────────────────────────────────────────┐
│  Header: "Dispute Triage"                                │
├──────────────────────────────────────────────────────────┤
│  Page Title: "All Disputes"          [+ New Dispute btn] │
├──────────────────────────────────────────────────────────┤
│  FILTER BAR                                              │
│  ┌────────────────────────────┬────────────────────────┐ │
│  │ Status:                    │ Priority:              │ │
│  │ ☑ Reported                 │ ☑ P1                   │ │
│  │ ☑ Under Investigation      │ ☑ P2                   │ │
│  │ ☑ Escalated               │ ☑ Standard             │ │
│  │ ☑ Resolved                │                        │ │
│  │ ☑ Referred                │                        │ │
│  └────────────────────────────┴────────────────────────┘ │
├──────────────────────────────────────────────────────────┤
│  SORT CONTROLS                                           │
│  Sort by: [Date Raised ▾]  Direction: [Desc ↕]          │
├──────────────────────────────────────────────────────────┤
│  DISPUTES TABLE                                          │
│  ┌────┬──────────────┬────────────┬──────┬────────┬────┐│
│  │ ID │ Customer     │ Status     │ Pri  │ Amount │Date││
│  ├────┼──────────────┼────────────┼──────┼────────┼────┤│
│  │ 1  │ John Doe     │ [Reported] │ [P1] │R16,500 │22… ││
│  │ 2  │ Jane Smith   │ [Inv…]     │ [P2] │ R8,200 │21… ││
│  │ …  │              │            │      │        │    ││
│  └────┴──────────────┴────────────┴──────┴────────┴────┘│
└──────────────────────────────────────────────────────────┘
```

**Components:**

- **Header** — Fixed height (`h-16`), deep blue background (`bg-[#003366]`), white text. System title "Dispute Triage" left-aligned. `data-testid="app-header"`.
- **Page title row** — `<h1>` "All Disputes" left-aligned. "New Dispute" primary button right-aligned. `data-testid="new-dispute-button"`.
- **Filter bar** — Horizontal section with two groups of checkboxes. Status group: Reported, Under Investigation, Escalated, Resolved, Referred. Priority group: P1, P2, Standard. All checked by default. `data-testid="filter-status-{value}"`, `data-testid="filter-priority-{value}"`.
- **Sort controls** — Dropdown for sort field (Date Raised, Total Amount, Priority) and a toggle button for direction (Ascending/Descending). `data-testid="sort-field"`, `data-testid="sort-direction"`.
- **Disputes table** — Full-width table with columns: ID, Customer Name, Status (badge), Priority (badge), Total Amount (ZAR), Date Raised. `data-testid="disputes-table"`. Each row: `data-testid="dispute-row-{id}"`.

**Data displayed:**

| Column | Format | Source |
|--------|--------|--------|
| ID | Integer | `dispute.id` |
| Customer | String | `dispute.customer.name` |
| Status | Coloured badge | `dispute.status` — mapped to status colour token |
| Priority | Coloured badge | `dispute.priority` — P1 red, P2 amber, Standard grey |
| Total Amount | `R{n,nnn}` (ZAR with thousands separator) | `dispute.totalAmount` |
| Date Raised | `DD MMM YYYY HH:mm` | `dispute.dateRaised` |

**Interactions:**

| User Action | System Response |
|-------------|-----------------|
| Unchecks a status filter | Table immediately filters to show only disputes matching remaining checked statuses. API call: `GET /api/disputes?status=...&priority=...&sortBy=...&sortOrder=...` |
| Unchecks a priority filter | Table filters to matching priorities only |
| Changes sort field | Table re-sorts by selected field. Persists direction. |
| Toggles sort direction | Table re-sorts in opposite order |
| Clicks a dispute row | Navigates to `/disputes/:id` (dispute detail page) |
| Clicks "New Dispute" button | Navigates to `/disputes/new` (create dispute page) |

**States:**

- **Empty (no disputes match filters):** Table body replaced with centered message: "No disputes found matching your filters." with a muted icon (clipboard or search icon). `data-testid="empty-state"`.
- **Loading:** Table skeleton — 5 rows of animated placeholder bars (Tailwind `animate-pulse` with `bg-slate-200` blocks). `data-testid="loading-state"`.
- **Error:** Red-bordered alert box above the table: "Failed to load disputes. Please try again." with a "Retry" button. `data-testid="error-state"`, `data-testid="retry-button"`.

**Default state:**
- All status filters checked.
- All priority filters checked.
- Sort: Priority descending (P1 first), then Date Raised descending (newest first).

**Badge specifications:**

| Priority | Background | Text | Border |
|----------|-----------|------|--------|
| P1 | `bg-red-100` | `text-red-700` | — |
| P2 | `bg-amber-100` | `text-amber-700` | — |
| Standard | `bg-gray-100` | `text-gray-700` | — |

| Status | Background | Text |
|--------|-----------|------|
| Reported | `bg-blue-100` | `text-blue-700` |
| Under Investigation | `bg-violet-100` | `text-violet-700` |
| Escalated | `bg-amber-100` | `text-amber-700` |
| Resolved | `bg-emerald-100` | `text-emerald-700` |
| Referred | `bg-gray-100` | `text-gray-700` |

---

## Screen: Create Dispute Page

**Route:** `/disputes/new`

**Purpose:** The ops user creates a new dispute by selecting a customer and entering one or more disputed transactions.

**Layout:**

```
┌──────────────────────────────────────────────────────────┐
│  Header: "Dispute Triage"                                │
├──────────────────────────────────────────────────────────┤
│  ← Back to Dashboard                                     │
│                                                          │
│  Page Title: "Create New Dispute"                        │
├──────────────────────────────────────────────────────────┤
│  CUSTOMER SECTION                                        │
│  ┌────────────────────────────────────────────────────┐  │
│  │ Customer *                                         │  │
│  │ [Select a customer              ▾]                 │  │
│  └────────────────────────────────────────────────────┘  │
├──────────────────────────────────────────────────────────┤
│  TRANSACTIONS SECTION                                    │
│  ┌────────────────────────────────────────────────────┐  │
│  │ Transaction 1                              [Remove]│  │
│  │ Amount (ZAR)*   Merchant*                          │  │
│  │ [R ________]    [________________]                 │  │
│  │ Timestamp*            Payment Type*                │  │
│  │ [datetime picker]     [Card ▾]                     │  │
│  ├────────────────────────────────────────────────────┤  │
│  │ Transaction 2                              [Remove]│  │
│  │ (same fields)                                      │  │
│  └────────────────────────────────────────────────────┘  │
│                                                          │
│  [+ Add Transaction]                                     │
├──────────────────────────────────────────────────────────┤
│  [Submit Dispute]  (disabled until valid)                 │
└──────────────────────────────────────────────────────────┘
```

**Components:**

- **Back link** — Text link "← Back to Dashboard" linking to `/`. `data-testid="back-to-dashboard"`.
- **Page title** — `<h1>` "Create New Dispute".
- **Customer dropdown** — `<select>` populated from `GET /api/customers`. Placeholder: "Select a customer". Required. `data-testid="customer-select"`.
- **Transaction entry group** — Repeatable fieldset with:
  - Amount input (`type="number"`, step="0.01", prefix "R"). `data-testid="transaction-amount-{index}"`.
  - Merchant input (`type="text"`). `data-testid="transaction-merchant-{index}"`.
  - Timestamp input (`type="datetime-local"`). `data-testid="transaction-timestamp-{index}"`.
  - Payment type select (options: Card, Apple Pay, EFT). `data-testid="transaction-payment-type-{index}"`.
  - Remove button (shown only when > 1 transaction). `data-testid="remove-transaction-{index}"`.
- **Add Transaction button** — Secondary style. Appends a new empty transaction group. `data-testid="add-transaction-button"`.
- **Submit button** — Primary style. Disabled until: customer selected AND at least one transaction with all fields valid (amount > 0, merchant non-empty, timestamp set, payment type selected). `data-testid="submit-dispute-button"`.

**Data displayed:**

| Field | Format | Source |
|-------|--------|--------|
| Customer options | `{name} — {accountIdentifier}` | `GET /api/customers` |
| Payment type options | Card, Apple Pay, EFT | Static enum |

**Interactions:**

| User Action | System Response |
|-------------|-----------------|
| Selects a customer | Dropdown shows selected name. Enables submit validation check. |
| Fills transaction fields | Real-time validation — red border on invalid fields when blurred. |
| Clicks "Add Transaction" | New empty transaction group appended below existing ones. Index increments. |
| Clicks "Remove" on a transaction | Transaction group removed. Cannot remove if only 1 remains (button hidden). |
| Clicks "Submit Dispute" (valid form) | `POST /api/disputes` with `{ customerId, transactions: [...] }`. On success → redirect to `/disputes/:id`. |
| Clicks "Submit Dispute" (invalid form) | All invalid fields highlighted with red border and inline error messages. |

**Validation rules:**

| Field | Rule | Error Message |
|-------|------|---------------|
| Customer | Required | "Please select a customer" |
| Amount | Required, > 0 | "Amount must be greater than zero" |
| Merchant | Required, non-empty | "Merchant name is required" |
| Timestamp | Required, valid datetime | "Transaction date is required" |
| Payment Type | Required, one of Card/Apple Pay/EFT | "Please select a payment type" |
| Transactions (group) | At least 1 complete transaction | "At least one transaction is required" |

**States:**

- **Empty (initial):** Form rendered with one empty transaction group. Customer dropdown loading from API. Submit disabled.
- **Loading (customer list):** Dropdown shows "Loading customers..." as disabled option. `data-testid="customer-loading"`.
- **Loading (submission):** Submit button shows spinner and "Submitting..." text. All form fields disabled. `data-testid="submit-loading"`.
- **Error (customer fetch failed):** Inline alert above customer dropdown: "Failed to load customers. Please refresh the page." `data-testid="customer-error"`.
- **Error (submission failed):** Toast/alert at top of form: "Failed to create dispute: {error message}. Please try again." with dismiss action. `data-testid="submit-error"`.
- **Validation errors:** Red border (`border-red-500`) on invalid fields. Inline error text (`text-red-600 text-sm`) below each field.

---

## Screen: Dispute Detail Page

**Route:** `/disputes/:id`

**Purpose:** The ops user views complete dispute information, reviews the triage recommendation and rule trace, manages the dispute lifecycle (status transitions), and adds transactions.

**Layout:**

```
┌──────────────────────────────────────────────────────────┐
│  Header: "Dispute Triage"                                │
├──────────────────────────────────────────────────────────┤
│  ← Back to Dashboard                                     │
│                                                          │
│  Page Title: "Dispute #[id]"      [Status Action Btns]   │
├──────────────────────────────────────────────────────────┤
│  ┌─────────────────────────┐ ┌─────────────────────────┐│
│  │ CUSTOMER INFO CARD      │ │ DISPUTE SUMMARY CARD    ││
│  │ Name: John Doe          │ │ Status: [Reported]      ││
│  │ Contact: 082 123 4567   │ │ Priority: [P1]          ││
│  │ Account: **** 4521      │ │ Category: Unauthorised  ││
│  │                         │ │ Total: R16,500          ││
│  │                         │ │ Raised: 22 Jun 2025     ││
│  └─────────────────────────┘ └─────────────────────────┘│
├──────────────────────────────────────────────────────────┤
│  TRIAGE RECOMMENDATION CARD (priority-coloured border)   │
│  ┌────────────────────────────────────────────────────┐  │
│  │ ⚠ RECOMMENDATION                                  │  │
│  │ Immediate Fraud Freeze + P1 High Priority          │  │
│  │ Escalation                                         │  │
│  └────────────────────────────────────────────────────┘  │
├──────────────────────────────────────────────────────────┤
│  RULE TRACE (expandable)                                 │
│  ▶ View Rule Trace Details                               │
│  ┌────────────────────────────────────────────────────┐  │
│  │ Evaluated: 22 Jun 2025 10:00                       │  │
│  │ Inputs:                                            │  │
│  │   Youngest transaction age: 22 hours               │  │
│  │   Total amount: R16,500                            │  │
│  │ Rules:                                             │  │
│  │   R1 (Age < 48h): ✓ FIRED — Txn #3 age = 22h     │  │
│  │   R2 (Amount > R10K): ✓ FIRED — Total = R16,500   │  │
│  │ Result: P1 — Immediate Fraud Freeze + Escalation   │  │
│  └────────────────────────────────────────────────────┘  │
├──────────────────────────────────────────────────────────┤
│  TRANSACTIONS TABLE                                      │
│  ┌────────┬──────────────┬───────────────┬─────────────┐ │
│  │ Amount │ Merchant     │ Timestamp     │ Payment Type│ │
│  ├────────┼──────────────┼───────────────┼─────────────┤ │
│  │R5,500  │ Store A      │ 21 Jun 14:30  │ Apple Pay   │ │
│  │R6,000  │ Store B      │ 21 Jun 14:45  │ Apple Pay   │ │
│  │R5,000  │ Store C      │ 21 Jun 15:10  │ Apple Pay   │ │
│  └────────┴──────────────┴───────────────┴─────────────┘ │
│  [+ Add Transaction]  (hidden if terminal status)        │
├──────────────────────────────────────────────────────────┤
│  RESOLUTION OUTCOME (shown only if status = Resolved)    │
│  Outcome: Refunded                                       │
└──────────────────────────────────────────────────────────┘
```

**Components:**

- **Back link** — "← Back to Dashboard" linking to `/`. `data-testid="back-to-dashboard"`.
- **Page title** — `<h1>` "Dispute #{id}". `data-testid="dispute-title"`.
- **Status action buttons** — Right-aligned in title row. Only valid transitions shown. `data-testid="action-{action-name}"`.
- **Customer info card** — White card with border. Fields: Name, Contact Reference, Account Identifier. `data-testid="customer-info-card"`.
- **Dispute summary card** — White card with border. Fields: Status (badge), Priority (badge), Category, Total Amount (ZAR), Date Raised. `data-testid="dispute-summary-card"`.
- **Triage recommendation card** — Prominent card with left border coloured by priority (4px solid: red for P1, amber for P2, grey for Standard). Contains recommendation text in bold. `data-testid="triage-recommendation"`.
- **Rule trace section** — Collapsible (`<details>`/`<summary>` or accordion). Shows evaluation timestamp, computed inputs, each rule with result (✓/✗), and final recommendation. `data-testid="rule-trace-section"`, `data-testid="rule-trace-toggle"`.
- **Transactions table** — Columns: Amount (ZAR), Merchant, Timestamp, Payment Type. `data-testid="transactions-table"`.
- **Add Transaction button** — Below transactions table. Opens inline form or modal. Hidden when dispute is in terminal status. `data-testid="add-transaction-button"`.
- **Resolution outcome** — Displayed as a labelled field when status is Resolved. `data-testid="resolution-outcome"`.

**Data displayed:**

| Field | Format | Source |
|-------|--------|--------|
| Customer name | String | `dispute.customer.name` |
| Contact reference | String | `dispute.customer.contactReference` |
| Account identifier | String | `dispute.customer.accountIdentifier` |
| Status | Coloured badge | `dispute.status` |
| Priority | Coloured badge | `dispute.priority` |
| Category | String | `dispute.category` (always "Unauthorised/Fraudulent Charge") |
| Total amount | `R{n,nnn}` | `dispute.totalAmount` |
| Date raised | `DD MMM YYYY HH:mm` | `dispute.dateRaised` |
| Recommendation | String (bold) | `dispute.recommendation` |
| Rule trace | Structured JSON rendered as list | `dispute.ruleTrace` |
| Transaction amount | `R{n,nnn}` | `transaction.amount` |
| Transaction merchant | String | `transaction.merchant` |
| Transaction timestamp | `DD MMM YYYY HH:mm` | `transaction.timestamp` |
| Transaction payment type | String | `transaction.paymentType` |
| Resolution outcome | String | `dispute.resolutionOutcome` (if resolved) |

**Interactions:**

| User Action | System Response |
|-------------|-----------------|
| Clicks "Begin Investigation" (status = Reported) | `PATCH /api/disputes/:id/status` with `{ status: "UnderInvestigation" }`. Page refreshes with new status. |
| Clicks "Escalate" (status = Under Investigation) | `PATCH /api/disputes/:id/status` with `{ status: "Escalated" }`. Page refreshes. |
| Clicks "Resolve" (status = Under Investigation or Escalated) | Opens Resolution Outcome Modal. |
| Clicks "Refer" (status = Under Investigation) | `PATCH /api/disputes/:id/status` with `{ status: "Referred" }`. Page refreshes. Buttons disappear (terminal). |
| Clicks "Add Transaction" | Opens Add Transaction Form (inline below table or modal). |
| Submits Add Transaction form | `POST /api/disputes/:id/transactions`. On success: table updates, triage recommendation and rule trace refresh. |
| Toggles Rule Trace section | Expands/collapses the rule trace detail view. |

**Status action button mapping:**

| Current Status | Available Buttons |
|----------------|-------------------|
| Reported | "Begin Investigation" (primary) |
| Under Investigation | "Escalate" (amber), "Resolve" (green), "Refer" (grey) |
| Escalated | "Resolve" (green) |
| Resolved | *(none — terminal)* |
| Referred | *(none — terminal)* |

**Button styles:**

| Action | Tailwind Classes | data-testid |
|--------|-----------------|-------------|
| Begin Investigation | `bg-[#003366] text-white hover:bg-[#004d99]` | `action-investigate` |
| Escalate | `bg-amber-600 text-white hover:bg-amber-700` | `action-escalate` |
| Resolve | `bg-emerald-600 text-white hover:bg-emerald-700` | `action-resolve` |
| Refer | `bg-gray-600 text-white hover:bg-gray-700` | `action-refer` |

**States:**

- **Loading:** Full page skeleton with card placeholders (animated pulse). `data-testid="loading-state"`.
- **Error (dispute not found):** Centered message: "Dispute not found." with "Back to Dashboard" link. `data-testid="not-found-state"`.
- **Error (fetch failed):** Alert: "Failed to load dispute details. Please try again." with "Retry" button. `data-testid="error-state"`.
- **Action loading:** Clicked action button shows spinner, all action buttons disabled during transition. `data-testid="action-loading"`.
- **Action error:** Toast notification: "Failed to update status: {error}." with dismiss. `data-testid="action-error"`.

---

## Modal: Resolution Outcome

**Trigger:** Ops user clicks "Resolve" on a dispute in status Under Investigation or Escalated.

**Purpose:** Capture the resolution outcome before transitioning the dispute to Resolved status.

**Layout:**

```
┌────────────────────────────────────────────┐
│  Resolve Dispute                     [✕]   │
├────────────────────────────────────────────┤
│                                            │
│  Select resolution outcome:                │
│                                            │
│  ○ Refunded                                │
│    Customer was refunded the disputed       │
│    amount.                                  │
│                                            │
│  ○ Declined                                │
│    Dispute rejected — transaction deemed    │
│    legitimate.                              │
│                                            │
│  ○ Chargeback Initiated                    │
│    Sent to card network for recovery.       │
│                                            │
├────────────────────────────────────────────┤
│            [Cancel]    [Confirm Resolve]    │
└────────────────────────────────────────────┘
```

**Components:**

- **Modal overlay** — Semi-transparent backdrop (`bg-black/50`). Clicking outside closes modal. `data-testid="resolution-modal-overlay"`.
- **Modal container** — White card, centered, max-width `md` (28rem). `data-testid="resolution-modal"`.
- **Title** — "Resolve Dispute". Close button (✕) top-right. `data-testid="modal-close"`.
- **Radio group** — Three options with label and description text. `data-testid="outcome-refunded"`, `data-testid="outcome-declined"`, `data-testid="outcome-chargeback"`.
- **Cancel button** — Secondary style. Closes modal without action. `data-testid="modal-cancel"`.
- **Confirm button** — Primary style. Disabled until an outcome is selected. `data-testid="modal-confirm"`.

**Interactions:**

| User Action | System Response |
|-------------|-----------------|
| Selects a radio option | "Confirm Resolve" button becomes enabled. |
| Clicks "Cancel" or close (✕) or overlay | Modal closes. No status change. |
| Clicks "Confirm Resolve" | `PATCH /api/disputes/:id/status` with `{ status: "Resolved", resolutionOutcome: "..." }`. Modal closes. Page refreshes with Resolved status and outcome displayed. |

**States:**

- **Initial:** No radio selected. Confirm button disabled.
- **Submitting:** Confirm button shows spinner, "Resolving...". Radio and Cancel disabled.
- **Error:** Inline error below radio group: "Failed to resolve dispute. Please try again." Modal remains open.

---

## Modal/Inline Form: Add Transaction

**Trigger:** Ops user clicks "Add Transaction" on the dispute detail page (non-terminal status only).

**Purpose:** Add a new transaction to an existing dispute, triggering triage re-evaluation.

**Layout:**

```
┌────────────────────────────────────────────┐
│  Add Transaction                     [✕]   │
├────────────────────────────────────────────┤
│                                            │
│  Amount (ZAR) *        Merchant *          │
│  [R ________]          [________________]  │
│                                            │
│  Transaction Date *    Payment Type *      │
│  [datetime picker]     [Card ▾]            │
│                                            │
├────────────────────────────────────────────┤
│            [Cancel]    [Add Transaction]   │
└────────────────────────────────────────────┘
```

**Components:**

- **Amount input** — Number field, step 0.01, with "R" prefix label. `data-testid="add-txn-amount"`.
- **Merchant input** — Text field. `data-testid="add-txn-merchant"`.
- **Timestamp input** — Datetime-local picker. `data-testid="add-txn-timestamp"`.
- **Payment type select** — Options: Card, Apple Pay, EFT. `data-testid="add-txn-payment-type"`.
- **Cancel button** — Closes form/modal. `data-testid="add-txn-cancel"`.
- **Add button** — Primary. Disabled until all fields valid. `data-testid="add-txn-submit"`.

**Validation:** Same rules as Create Dispute transaction fields (amount > 0, all fields required).

**Interactions:**

| User Action | System Response |
|-------------|-----------------|
| Fills all fields and clicks "Add Transaction" | `POST /api/disputes/:id/transactions` with transaction data. On success: modal closes, transactions table refreshes, triage recommendation and rule trace update. |
| Clicks "Cancel" | Form/modal closes. No changes. |

**States:**

- **Submitting:** Button shows spinner "Adding...". Fields disabled.
- **Error:** Inline alert: "Failed to add transaction: {error}." Form remains open.
- **Success:** Modal/form closes. Parent page data refreshes (optimistic or refetch).

---

## Data Formatting Reference

| Data Type | Format | Example |
|-----------|--------|---------|
| Currency (ZAR) | `R` + amount with thousands separator | R16,500 |
| Date/Time | `DD MMM YYYY HH:mm` | 22 Jun 2025 14:30 |
| Priority badge | Pill with coloured background | `<span class="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">P1</span>` |
| Status badge | Pill with coloured background | `<span class="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">Reported</span>` |
| Payment type | Plain text | Card, Apple Pay, EFT |

---

## Accessibility Requirements

- All form inputs have associated `<label>` elements (or `aria-label` for icon-only buttons).
- Focus management: modals trap focus. On close, focus returns to trigger element.
- Keyboard navigation: all interactive elements reachable via Tab. Enter/Space activate buttons.
- Colour is not the sole indicator — badges include text labels alongside colour.
- Status changes provide screen-reader announcements via `aria-live="polite"` region.
- Sufficient colour contrast ratios (minimum WCAG AA 4.5:1 for text).

---

## Responsive Behaviour

- **Minimum viewport:** 1024px width (desktop-first).
- Below 1024px: no specific mobile layout required (internal ops tool).
- Table columns remain fixed — no responsive collapse needed.
- Cards stack in a 2-column grid on wider screens (≥1024px), full-width at exactly 1024px if needed.

---

## Component Hierarchy (React)

```
App
├── Header
├── Routes
│   ├── DashboardPage (/)
│   │   ├── FilterBar
│   │   │   ├── StatusFilterGroup
│   │   │   └── PriorityFilterGroup
│   │   ├── SortControls
│   │   ├── DisputesTable
│   │   │   ├── DisputeRow (× n)
│   │   │   │   ├── StatusBadge
│   │   │   │   └── PriorityBadge
│   │   │   └── EmptyState / LoadingState / ErrorState
│   │   └── NewDisputeButton
│   │
│   ├── CreateDisputePage (/disputes/new)
│   │   ├── CustomerSelect
│   │   ├── TransactionEntryList
│   │   │   └── TransactionEntryGroup (× n)
│   │   ├── AddTransactionButton
│   │   └── SubmitButton
│   │
│   └── DisputeDetailPage (/disputes/:id)
│       ├── CustomerInfoCard
│       ├── DisputeSummaryCard
│       │   ├── StatusBadge
│       │   └── PriorityBadge
│       ├── TriageRecommendationCard
│       ├── RuleTraceSection
│       ├── TransactionsTable
│       ├── AddTransactionButton → AddTransactionModal
│       ├── StatusActionButtons
│       └── ResolutionOutcomeModal
```

---

## API Endpoints Used Per Screen

| Screen | Method | Endpoint | Purpose |
|--------|--------|----------|---------|
| Dashboard | GET | `/api/disputes?status=...&priority=...&sortBy=...&sortOrder=...` | Fetch filtered/sorted disputes |
| Create Dispute | GET | `/api/customers` | Populate customer dropdown |
| Create Dispute | POST | `/api/disputes` | Submit new dispute |
| Dispute Detail | GET | `/api/disputes/:id` | Fetch dispute with customer, transactions, triage |
| Dispute Detail | PATCH | `/api/disputes/:id/status` | Transition status |
| Dispute Detail | POST | `/api/disputes/:id/transactions` | Add transaction |
