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
