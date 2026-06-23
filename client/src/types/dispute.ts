export type Status = 'Reported' | 'UnderInvestigation' | 'Escalated' | 'Resolved' | 'Referred';
export type Priority = 'P1' | 'P2' | 'Standard';
export type PaymentType = 'Card' | 'ApplePay' | 'EFT';
export type ResolutionOutcome = 'Refunded' | 'Declined' | 'ChargebackInitiated';

export interface Customer {
  id: number;
  name: string;
  contactReference: string;
  accountIdentifier: string;
}

export interface Transaction {
  id: number;
  amount: number;
  merchant: string;
  timestamp: string;
  paymentType: PaymentType;
  createdAt: string;
}

export interface RuleTraceEntry {
  rule: string;
  condition: string;
  result: boolean;
  detail: string;
}

export interface RuleTrace {
  evaluatedAt: string;
  inputs: {
    youngestTransactionAge: string;
    totalAmount: number;
  };
  rules: RuleTraceEntry[];
  recommendation: string;
  priority: Priority;
}

export interface DisputeDetail {
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

export interface StatusTransitionRequest {
  status: Status;
  resolutionOutcome?: ResolutionOutcome;
}

export interface AddTransactionRequest {
  amount: number;
  merchant: string;
  timestamp: string;
  paymentType: PaymentType;
}

// ─── Create Dispute Form types ──────────────────────────────────────────────

/** Form state for a single transaction entry (all values are strings for controlled inputs). */
export interface TransactionFormState {
  amount: string;
  merchant: string;
  timestamp: string;
  paymentType: string;
}

/** Validation errors for a single transaction entry group. */
export interface TransactionFieldErrors {
  amount: string | null;
  merchant: string | null;
  timestamp: string | null;
  paymentType: string | null;
}

/** Top-level form state managed by the CreateDisputePage component. */
export interface CreateDisputeFormState {
  selectedCustomerId: number | null;
  transactions: TransactionFormState[];
  validationErrors: TransactionFieldErrors[];
  customerError: string | null;
  isSubmitting: boolean;
  submitError: string | null;
}

/** POST /api/disputes request body (matches OpenAPI CreateDisputeRequest). */
export interface CreateDisputePayload {
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
export interface CreateDisputeResponse {
  id: number;
}

/** Factory for an empty transaction form state. */
export function createEmptyTransaction(): TransactionFormState {
  return {
    amount: '',
    merchant: '',
    timestamp: '',
    paymentType: '',
  };
}

/** Factory for empty field errors. */
export function createEmptyErrors(): TransactionFieldErrors {
  return {
    amount: null,
    merchant: null,
    timestamp: null,
    paymentType: null,
  };
}
