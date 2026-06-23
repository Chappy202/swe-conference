import { PrismaClient } from '@prisma/client';
import { AppError } from '../middleware/errorHandler.js';
import { evaluateTriage, TransactionInput } from './triageEngine.js';
import {
  validateStatusTransition,
  isTerminalState,
  DisputeStatus,
  ResolutionOutcome,
} from './statusTransitions.js';

// ---------------------------------------------------------------------------
// DTO types (public API contract)
// ---------------------------------------------------------------------------

/** Customer as returned by the API. */
export interface Customer {
  id: number;
  name: string;
  contactReference: string;
  accountIdentifier: string;
  createdAt: string; // ISO 8601
}

/** Nested customer object in dispute detail. */
export interface CustomerNested {
  id: number;
  name: string;
  contactReference: string;
  accountIdentifier: string;
}

/** Transaction as returned by the API. */
export interface TransactionDto {
  id: number;
  amount: number;
  merchant: string;
  timestamp: string; // ISO 8601
  paymentType: string;
  createdAt: string; // ISO 8601
}

/** Input for creating a transaction (from request body). */
export interface CreateTransactionInput {
  amount: number;
  merchant: string;
  timestamp: string; // ISO 8601
  paymentType: 'Card' | 'ApplePay' | 'EFT';
}

/** Rule trace entry from triage engine. */
export interface RuleTraceEntry {
  rule: string;
  condition: string;
  result: boolean;
  detail: string;
}

/** Full rule trace object. */
export interface RuleTrace {
  evaluatedAt: string;
  inputs: {
    youngestTransactionAge: string;
    totalAmount: number;
  };
  rules: RuleTraceEntry[];
  recommendation: string;
  priority: string;
}

/** Dispute summary for list endpoint. */
export interface DisputeSummary {
  id: number;
  customerId: number;
  customerName: string;
  status: string;
  category: string;
  totalAmount: number;
  dateRaised: string;
  priority: string;
  recommendation: string;
  resolutionOutcome: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Full dispute detail for single-resource endpoints. */
export interface DisputeDetail {
  id: number;
  customerId: number;
  customer: CustomerNested;
  status: string;
  category: string;
  totalAmount: number;
  dateRaised: string;
  priority: string;
  recommendation: string;
  ruleTrace: RuleTrace;
  resolutionOutcome: string | null;
  transactions: TransactionDto[];
  createdAt: string;
  updatedAt: string;
}

/** Parameters for listing disputes with filters and sorting. */
export interface ListDisputesParams {
  status?: string[];
  priority?: string[];
  sortBy?: 'dateRaised' | 'totalAmount' | 'priority';
  sortOrder?: 'asc' | 'desc';
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DEFAULT_CATEGORY = 'Unauthorised/Fraudulent Charge';

/** Custom numeric ordering used when sorting by priority (P1 highest urgency). */
const PRIORITY_ORDER: Record<string, number> = {
  P1: 1,
  P2: 2,
  Standard: 3,
};

const VALID_RESOLUTION_OUTCOMES: ResolutionOutcome[] = [
  'Refunded',
  'Declined',
  'ChargebackInitiated',
];

// ---------------------------------------------------------------------------
// Prisma client (shared singleton; injectable for testing)
// ---------------------------------------------------------------------------

export const prisma = new PrismaClient();

/**
 * Minimal structural type of the Prisma client surface this service uses.
 * Declared loosely so unit tests can supply a mock without the full client.
 */
type DbClient = Pick<PrismaClient, 'customer' | 'dispute' | 'transaction'>;

// ---------------------------------------------------------------------------
// DTO mappers
// ---------------------------------------------------------------------------

function toIso(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

interface DbTransaction {
  id: number;
  amount: number;
  merchant: string;
  timestamp: Date | string;
  paymentType: string;
  createdAt: Date | string;
}

interface DbCustomer {
  id: number;
  name: string;
  contactReference: string;
  accountIdentifier: string;
  createdAt: Date | string;
}

interface DbDispute {
  id: number;
  customerId: number;
  status: string;
  category: string;
  totalAmount: number;
  dateRaised: Date | string;
  priority: string;
  recommendation: string;
  ruleTrace: string;
  resolutionOutcome: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

function toCustomerDto(customer: DbCustomer): Customer {
  return {
    id: customer.id,
    name: customer.name,
    contactReference: customer.contactReference,
    accountIdentifier: customer.accountIdentifier,
    createdAt: toIso(customer.createdAt),
  };
}

function toTransactionDto(transaction: DbTransaction): TransactionDto {
  return {
    id: transaction.id,
    amount: transaction.amount,
    merchant: transaction.merchant,
    timestamp: toIso(transaction.timestamp),
    paymentType: transaction.paymentType,
    createdAt: toIso(transaction.createdAt),
  };
}

function toDisputeDetail(
  dispute: DbDispute & { customer: DbCustomer; transactions: DbTransaction[] }
): DisputeDetail {
  return {
    id: dispute.id,
    customerId: dispute.customerId,
    customer: {
      id: dispute.customer.id,
      name: dispute.customer.name,
      contactReference: dispute.customer.contactReference,
      accountIdentifier: dispute.customer.accountIdentifier,
    },
    status: dispute.status,
    category: dispute.category,
    totalAmount: dispute.totalAmount,
    dateRaised: toIso(dispute.dateRaised),
    priority: dispute.priority,
    recommendation: dispute.recommendation,
    ruleTrace: JSON.parse(dispute.ruleTrace) as RuleTrace,
    resolutionOutcome: dispute.resolutionOutcome,
    transactions: dispute.transactions.map(toTransactionDto),
    createdAt: toIso(dispute.createdAt),
    updatedAt: toIso(dispute.updatedAt),
  };
}

function toDisputeSummary(dispute: DbDispute & { customer: DbCustomer }): DisputeSummary {
  return {
    id: dispute.id,
    customerId: dispute.customerId,
    customerName: dispute.customer.name,
    status: dispute.status,
    category: dispute.category,
    totalAmount: dispute.totalAmount,
    dateRaised: toIso(dispute.dateRaised),
    priority: dispute.priority,
    recommendation: dispute.recommendation,
    resolutionOutcome: dispute.resolutionOutcome,
    createdAt: toIso(dispute.createdAt),
    updatedAt: toIso(dispute.updatedAt),
  };
}

/** Maps stored transactions to the shape the triage engine expects. */
function toTriageInputs(transactions: DbTransaction[]): TransactionInput[] {
  return transactions.map((t) => ({
    id: t.id,
    amount: t.amount,
    merchant: t.merchant,
    timestamp: toIso(t.timestamp),
    paymentType: t.paymentType as TransactionInput['paymentType'],
  }));
}

// ---------------------------------------------------------------------------
// Service functions
// ---------------------------------------------------------------------------

/** Returns all customer records. */
export async function listCustomers(db: DbClient = prisma): Promise<Customer[]> {
  const customers = await db.customer.findMany({ orderBy: { id: 'asc' } });
  return customers.map(toCustomerDto);
}

/**
 * Returns dispute summaries with denormalized customerName. Applies optional
 * status/priority filtering and sorting. Defaults to priority desc (P1 first)
 * then dateRaised desc (newest first).
 */
export async function listDisputes(
  params: ListDisputesParams = {},
  db: DbClient = prisma
): Promise<DisputeSummary[]> {
  const where: { status?: { in: string[] }; priority?: { in: string[] } } = {};
  if (params.status && params.status.length > 0) {
    where.status = { in: params.status };
  }
  if (params.priority && params.priority.length > 0) {
    where.priority = { in: params.priority };
  }

  const disputes = await db.dispute.findMany({
    where,
    include: { customer: true },
  });

  const summaries = disputes.map(toDisputeSummary);
  return sortSummaries(summaries, params.sortBy, params.sortOrder);
}

/** Sorts dispute summaries in-memory per the requested field and direction. */
function sortSummaries(
  summaries: DisputeSummary[],
  sortBy?: ListDisputesParams['sortBy'],
  sortOrder: ListDisputesParams['sortOrder'] = 'desc'
): DisputeSummary[] {
  const direction = sortOrder === 'asc' ? 1 : -1;
  const sorted = [...summaries];

  if (sortBy === 'totalAmount') {
    sorted.sort((a, b) => (a.totalAmount - b.totalAmount) * direction);
  } else if (sortBy === 'dateRaised') {
    sorted.sort(
      (a, b) => (new Date(a.dateRaised).getTime() - new Date(b.dateRaised).getTime()) * direction
    );
  } else if (sortBy === 'priority') {
    // For priority, desc means most urgent first (P1), which is ascending rank.
    // Negate `direction` so desc (-1) yields ascending rank order (P1 first).
    sorted.sort((a, b) => comparePriority(a, b) * -direction);
  } else {
    // Default: priority desc (P1 first) then dateRaised desc (newest first).
    // "Priority descending" means most urgent first, i.e. ascending PRIORITY_ORDER rank.
    sorted.sort((a, b) => {
      const byPriority = comparePriority(a, b);
      if (byPriority !== 0) return byPriority;
      return (new Date(a.dateRaised).getTime() - new Date(b.dateRaised).getTime()) * -1;
    });
  }

  return sorted;
}

/**
 * Compares two disputes by priority urgency. Lower PRIORITY_ORDER value (P1) is
 * more urgent; ascending result places P1 first. Returns negative when `a` is
 * more urgent than `b`.
 */
function comparePriority(a: DisputeSummary, b: DisputeSummary): number {
  const aRank = PRIORITY_ORDER[a.priority] ?? Number.MAX_SAFE_INTEGER;
  const bRank = PRIORITY_ORDER[b.priority] ?? Number.MAX_SAFE_INTEGER;
  return aRank - bRank;
}

/**
 * Fetches a dispute by id with nested customer, transactions, and parsed
 * ruleTrace. Throws DISPUTE_NOT_FOUND when the id does not exist.
 */
export async function getDisputeById(id: number, db: DbClient = prisma): Promise<DisputeDetail> {
  const dispute = await db.dispute.findUnique({
    where: { id },
    include: { customer: true, transactions: true },
  });

  if (!dispute) {
    throw new AppError('DISPUTE_NOT_FOUND', `Dispute with id ${id} not found.`, 404);
  }

  return toDisputeDetail(dispute);
}

/**
 * Creates a dispute with status Reported, calculates totalAmount, runs the
 * triage engine, and persists priority/recommendation/ruleTrace. Throws
 * VALIDATION_ERROR when the customer does not exist.
 */
export async function createDispute(
  customerId: number,
  transactions: CreateTransactionInput[],
  db: DbClient = prisma
): Promise<DisputeDetail> {
  const customer = await db.customer.findUnique({ where: { id: customerId } });
  if (!customer) {
    throw new AppError('VALIDATION_ERROR', `Customer with id ${customerId} does not exist.`, 400);
  }

  const dateRaised = new Date().toISOString();
  const totalAmount = transactions.reduce((sum, t) => sum + t.amount, 0);

  const triageInputs: TransactionInput[] = transactions.map((t, index) => ({
    id: index + 1,
    amount: t.amount,
    merchant: t.merchant,
    timestamp: t.timestamp,
    paymentType: t.paymentType,
  }));
  const triage = evaluateTriage(dateRaised, triageInputs);

  const created = await db.dispute.create({
    data: {
      customerId,
      status: 'Reported',
      category: DEFAULT_CATEGORY,
      totalAmount,
      dateRaised: new Date(dateRaised),
      priority: triage.priority,
      recommendation: triage.recommendation,
      ruleTrace: serializeRuleTrace(triage),
      transactions: {
        create: transactions.map((t) => ({
          amount: t.amount,
          merchant: t.merchant,
          timestamp: new Date(t.timestamp),
          paymentType: t.paymentType,
        })),
      },
    },
    include: { customer: true, transactions: true },
  });

  return toDisputeDetail(created);
}

/**
 * Validates and applies a status transition. Throws DISPUTE_NOT_FOUND,
 * INVALID_STATUS_TRANSITION, or MISSING_RESOLUTION_OUTCOME as appropriate.
 */
export async function transitionStatus(
  id: number,
  status: string,
  resolutionOutcome?: string,
  db: DbClient = prisma
): Promise<DisputeDetail> {
  const dispute = await db.dispute.findUnique({ where: { id } });
  if (!dispute) {
    throw new AppError('DISPUTE_NOT_FOUND', `Dispute with id ${id} not found.`, 404);
  }

  const result = validateStatusTransition({
    currentStatus: dispute.status as DisputeStatus,
    targetStatus: status as DisputeStatus,
    resolutionOutcome: resolutionOutcome as ResolutionOutcome | undefined,
  });

  if (!result.valid) {
    throw new AppError(result.errorCode!, result.errorMessage!, 400);
  }

  const isResolving = status === 'Resolved';
  const updated = await db.dispute.update({
    where: { id },
    data: {
      status,
      ...(isResolving ? { resolutionOutcome } : {}),
    },
    include: { customer: true, transactions: true },
  });

  return toDisputeDetail(updated);
}

/**
 * Adds a transaction to a dispute, recalculates totalAmount from all linked
 * transactions, re-runs triage, and persists the updated fields. Throws
 * DISPUTE_NOT_FOUND or DISPUTE_IN_TERMINAL_STATE as appropriate.
 */
export async function addTransaction(
  id: number,
  transaction: CreateTransactionInput,
  db: DbClient = prisma
): Promise<DisputeDetail> {
  const dispute = await db.dispute.findUnique({
    where: { id },
    include: { transactions: true },
  });
  if (!dispute) {
    throw new AppError('DISPUTE_NOT_FOUND', `Dispute with id ${id} not found.`, 404);
  }

  if (isTerminalState(dispute.status as DisputeStatus)) {
    throw new AppError(
      'DISPUTE_IN_TERMINAL_STATE',
      `Cannot add transactions to a dispute in '${dispute.status}' state.`,
      400
    );
  }

  await db.transaction.create({
    data: {
      disputeId: id,
      amount: transaction.amount,
      merchant: transaction.merchant,
      timestamp: new Date(transaction.timestamp),
      paymentType: transaction.paymentType,
    },
  });

  const allTransactions: DbTransaction[] = [
    ...dispute.transactions,
    {
      id: 0,
      amount: transaction.amount,
      merchant: transaction.merchant,
      timestamp: transaction.timestamp,
      paymentType: transaction.paymentType,
      createdAt: new Date(),
    },
  ];

  const totalAmount = allTransactions.reduce((sum, t) => sum + t.amount, 0);
  const triage = evaluateTriage(toIso(dispute.dateRaised), toTriageInputs(allTransactions));

  const updated = await db.dispute.update({
    where: { id },
    data: {
      totalAmount,
      priority: triage.priority,
      recommendation: triage.recommendation,
      ruleTrace: serializeRuleTrace(triage),
    },
    include: { customer: true, transactions: true },
  });

  return toDisputeDetail(updated);
}

/** Serializes a triage result into the stored ruleTrace JSON string. */
function serializeRuleTrace(triage: ReturnType<typeof evaluateTriage>): string {
  const ruleTrace: RuleTrace = {
    evaluatedAt: triage.evaluatedAt,
    inputs: triage.inputs,
    rules: triage.rules,
    recommendation: triage.recommendation,
    priority: triage.priority,
  };
  return JSON.stringify(ruleTrace);
}

export { VALID_RESOLUTION_OUTCOMES };
