export type Priority = 'P1' | 'P2' | 'Standard';

export interface TransactionInput {
  id: number;
  amount: number;
  merchant: string;
  timestamp: string;
  paymentType: 'Card' | 'ApplePay' | 'EFT';
}

export interface TriageInputs {
  youngestTransactionAge: string;
  totalAmount: number;
}

export interface RuleEntry {
  rule: string;
  condition: string;
  result: boolean;
  detail: string;
}

export interface TriageResult {
  priority: Priority;
  recommendation: string;
  evaluatedAt: string;
  inputs: TriageInputs;
  rules: RuleEntry[];
}

export const AMOUNT_THRESHOLD = 10000;
export const AGE_THRESHOLD_HOURS = 48;

export function evaluateTriage(
  dateRaised: string,
  transactions: TransactionInput[],
): TriageResult {
  const totalAmount = transactions.reduce((sum, t) => sum + t.amount, 0);
  const dateRaisedMs = new Date(dateRaised).getTime();
  const ages = transactions.map(
    (t) => (dateRaisedMs - new Date(t.timestamp).getTime()) / (1000 * 60 * 60),
  );
  const youngestAge = Math.min(...ages);

  const r1Result = youngestAge < AGE_THRESHOLD_HOURS;
  const r2Result = totalAmount > AMOUNT_THRESHOLD;

  let priority: Priority;
  let recommendation: string;

  if (r1Result && r2Result) {
    priority = 'P1';
    recommendation = 'Immediate Fraud Freeze + P1 High Priority Escalation';
  } else if (r2Result) {
    priority = 'P1';
    recommendation = 'P1 High Priority Escalation';
  } else if (r1Result) {
    priority = 'P2';
    recommendation = 'Immediate Fraud Freeze';
  } else {
    priority = 'Standard';
    recommendation = 'Standard Investigation';
  }

  const rules: RuleEntry[] = [
    {
      rule: 'R1',
      condition: `Any transaction age < ${AGE_THRESHOLD_HOURS} hours`,
      result: r1Result,
      detail: `Youngest transaction age: ${Math.round(youngestAge)} hours`,
    },
    {
      rule: 'R2',
      condition: `Total amount > ${AMOUNT_THRESHOLD}`,
      result: r2Result,
      detail: `Total amount: ${totalAmount}`,
    },
  ];

  return {
    priority,
    recommendation,
    evaluatedAt: new Date().toISOString(),
    inputs: {
      youngestTransactionAge: `${Math.round(youngestAge)} hours`,
      totalAmount,
    },
    rules,
  };
}
