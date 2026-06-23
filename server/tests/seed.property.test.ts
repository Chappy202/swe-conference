import { describe, it, expect, afterAll, beforeAll } from 'vitest';
import fc from 'fast-check';
import { PrismaClient } from '@prisma/client';
import type { Dispute, Transaction } from '@prisma/client';

const prisma = new PrismaClient();

const AMOUNT_THRESHOLD = 10_000;
const AGE_THRESHOLD_MS = 48 * 60 * 60 * 1000;
const VALID_RESOLUTION_OUTCOMES = ['Refunded', 'Declined', 'ChargebackInitiated'];
const RULE_TRACE_KEYS = ['evaluatedAt', 'inputs', 'rules', 'recommendation', 'priority'];

type DisputeWithTransactions = Dispute & { transactions: Transaction[] };

/**
 * Loaded once for the whole suite. These property tests are dataset-wide
 * invariants asserted over the real seeded data, so we read all disputes
 * (with their transactions) up front and never write to the database.
 */
let disputes: DisputeWithTransactions[] = [];

beforeAll(async () => {
  disputes = await prisma.dispute.findMany({ include: { transactions: true } });
});

afterAll(async () => {
  await prisma.$disconnect();
});

/** Whether the age rule (R1) fires: at least one transaction < 48h before dateRaised. */
function ageRuleFires(dispute: DisputeWithTransactions): boolean {
  const dateRaised = dispute.dateRaised.getTime();
  return dispute.transactions.some((tx) => dateRaised - tx.timestamp.getTime() < AGE_THRESHOLD_MS);
}

/** Whether the amount rule (R2) fires: total amount strictly exceeds R10,000. */
function amountRuleFires(dispute: DisputeWithTransactions): boolean {
  return dispute.totalAmount > AMOUNT_THRESHOLD;
}

/**
 * Expected recommendation text per the triage matrix in the design document.
 * P1 splits on whether the age rule fired.
 */
function expectedRecommendation(priority: string, ageFires: boolean): string {
  if (priority === 'P1') {
    return ageFires
      ? 'Immediate Fraud Freeze + P1 High Priority Escalation'
      : 'P1 High Priority Escalation';
  }
  if (priority === 'P2') {
    return 'Immediate Fraud Freeze';
  }
  return 'Standard Investigation';
}

describe('Seed Data Property Tests', () => {
  describe('Property 1: Total Amount Integrity (task 4.3)', () => {
    it('should have totalAmount equal to the sum of linked transaction amounts for every seeded dispute', () => {
      expect(disputes.length).toBeGreaterThan(0);
      const arbitraryDispute = fc.constantFrom(...disputes);
      fc.assert(
        fc.property(arbitraryDispute, (dispute) => {
          const transactionSum = dispute.transactions.reduce((sum, tx) => sum + tx.amount, 0);
          expect(dispute.totalAmount).toBeCloseTo(transactionSum, 2);
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 2: Category Consistency (task 4.4)', () => {
    it('should have category equal to "Unauthorised/Fraudulent Charge" for every seeded dispute', () => {
      expect(disputes.length).toBeGreaterThan(0);
      const arbitraryDispute = fc.constantFrom(...disputes);
      fc.assert(
        fc.property(arbitraryDispute, (dispute) => {
          expect(dispute.category).toBe('Unauthorised/Fraudulent Charge');
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 3: Rule Trace Validity (task 4.5)', () => {
    it('should have a ruleTrace that parses to an object containing all required keys for every seeded dispute', () => {
      expect(disputes.length).toBeGreaterThan(0);
      const arbitraryDispute = fc.constantFrom(...disputes);
      fc.assert(
        fc.property(arbitraryDispute, (dispute) => {
          const parsed = JSON.parse(dispute.ruleTrace) as Record<string, unknown>;
          for (const key of RULE_TRACE_KEYS) {
            expect(parsed).toHaveProperty(key);
          }
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 4: Priority-Recommendation Alignment (task 4.6)', () => {
    it('should have a recommendation matching the triage matrix for the dispute priority and age rule for every seeded dispute', () => {
      expect(disputes.length).toBeGreaterThan(0);
      const arbitraryDispute = fc.constantFrom(...disputes);
      fc.assert(
        fc.property(arbitraryDispute, (dispute) => {
          const expected = expectedRecommendation(dispute.priority, ageRuleFires(dispute));
          expect(dispute.recommendation).toBe(expected);
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 5: Resolution Outcome Completeness (task 4.7)', () => {
    it('should have a non-null resolutionOutcome from the valid set for every Resolved dispute', () => {
      const resolvedDisputes = disputes.filter((d) => d.status === 'Resolved');
      expect(resolvedDisputes.length).toBeGreaterThan(0);
      const arbitraryResolvedDispute = fc.constantFrom(...resolvedDisputes);
      fc.assert(
        fc.property(arbitraryResolvedDispute, (dispute) => {
          expect(dispute.resolutionOutcome).not.toBeNull();
          expect(VALID_RESOLUTION_OUTCOMES).toContain(dispute.resolutionOutcome);
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 6: Triage Rule Coverage (task 4.8)', () => {
    it('should contain at least one dispute for each of the four triage rule combinations', () => {
      expect(disputes.length).toBeGreaterThan(0);

      let hasAgeAndAmount = false; // age fires + amount fires
      let hasAmountOnly = false; // age doesn't fire + amount fires
      let hasAgeOnly = false; // age fires + amount doesn't fire
      let hasNeither = false; // neither fires

      for (const dispute of disputes) {
        const ageFires = ageRuleFires(dispute);
        const amountFires = amountRuleFires(dispute);

        if (ageFires && amountFires) hasAgeAndAmount = true;
        if (!ageFires && amountFires) hasAmountOnly = true;
        if (ageFires && !amountFires) hasAgeOnly = true;
        if (!ageFires && !amountFires) hasNeither = true;
      }

      expect(hasAgeAndAmount).toBe(true);
      expect(hasAmountOnly).toBe(true);
      expect(hasAgeOnly).toBe(true);
      expect(hasNeither).toBe(true);
    });
  });
});
