import { AppError } from '../middleware/errorHandler.js';
import { CreateTransactionInput } from '../services/disputeService.js';

const PAYMENT_TYPES = ['Card', 'ApplePay', 'EFT'] as const;
const KNOWN_STATUSES = ['Reported', 'UnderInvestigation', 'Escalated', 'Resolved', 'Referred'];

function fail(message: string): never {
  throw new AppError('VALIDATION_ERROR', message, 400);
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Returns true when the string is a valid ISO 8601 timestamp. */
function isValidIso8601(value: string): boolean {
  if (typeof value !== 'string' || value.trim() === '') return false;
  const time = Date.parse(value);
  return !Number.isNaN(time);
}

/**
 * Validates a single transaction input object: amount > 0, non-empty merchant,
 * valid ISO 8601 timestamp, and paymentType in [Card, ApplePay, EFT].
 * Throws VALIDATION_ERROR on the first violation.
 */
export function validateTransactionInput(txn: unknown): CreateTransactionInput {
  if (!isPlainObject(txn)) {
    fail('Transaction must be an object.');
  }

  const { amount, merchant, timestamp, paymentType } = txn;

  if (typeof amount !== 'number' || Number.isNaN(amount) || amount <= 0) {
    fail('Transaction amount must be a number greater than 0.');
  }

  if (typeof merchant !== 'string' || merchant.trim() === '') {
    fail('Transaction merchant must be a non-empty string.');
  }

  if (typeof timestamp !== 'string' || !isValidIso8601(timestamp)) {
    fail('Transaction timestamp must be a valid ISO 8601 string.');
  }

  if (typeof paymentType !== 'string' || !PAYMENT_TYPES.includes(paymentType as never)) {
    fail(`Transaction paymentType must be one of: ${PAYMENT_TYPES.join(', ')}.`);
  }

  return {
    amount: amount as number,
    merchant: merchant as string,
    timestamp: timestamp as string,
    paymentType: paymentType as CreateTransactionInput['paymentType'],
  };
}

/**
 * Validates the create-dispute request body: customerId is a number and
 * transactions is a non-empty array of valid transactions.
 */
export function validateCreateDisputeBody(body: unknown): {
  customerId: number;
  transactions: CreateTransactionInput[];
} {
  if (!isPlainObject(body)) {
    fail('Request body must be an object.');
  }

  const { customerId, transactions } = body;

  if (typeof customerId !== 'number' || !Number.isInteger(customerId)) {
    fail('customerId is required and must be a number.');
  }

  if (!Array.isArray(transactions) || transactions.length === 0) {
    fail('At least one transaction is required.');
  }

  const validated = (transactions as unknown[]).map((txn) => validateTransactionInput(txn));

  return { customerId: customerId as number, transactions: validated };
}

/**
 * Validates the status transition request body: status is present and is a
 * recognized status value. Carries through an optional resolutionOutcome.
 */
export function validateStatusTransitionBody(body: unknown): {
  status: string;
  resolutionOutcome?: string;
} {
  if (!isPlainObject(body)) {
    fail('Request body must be an object.');
  }

  const { status, resolutionOutcome } = body;

  if (typeof status !== 'string' || !KNOWN_STATUSES.includes(status)) {
    fail('status is required and must be a recognized status value.');
  }

  if (resolutionOutcome !== undefined && typeof resolutionOutcome !== 'string') {
    fail('resolutionOutcome must be a string when provided.');
  }

  return {
    status: status as string,
    resolutionOutcome: resolutionOutcome as string | undefined,
  };
}
