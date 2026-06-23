import { describe, it, expect, afterAll } from 'vitest';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

afterAll(async () => {
  await prisma.$disconnect();
});

describe('Seed Data', () => {
  describe('Customer records', () => {
    it('should create between 3 and 5 customers', async () => {
      const count = await prisma.customer.count();
      expect(count).toBeGreaterThanOrEqual(3);
      expect(count).toBeLessThanOrEqual(5);
    });

    it('should use South African names', async () => {
      const customers = await prisma.customer.findMany();
      const southAfricanNames = [
        'Thabo',
        'Sipho',
        'Naledi',
        'Lerato',
        'Bongani',
        'Zanele',
        'Mandla',
        'Nomvula',
        'Kagiso',
        'Lindiwe',
        'Mpho',
        'Sibusiso',
        'Ayanda',
        'Palesa',
        'Themba',
      ];

      expect(customers.length).toBeGreaterThan(0);
      for (const customer of customers) {
        const hasRecognisableName = southAfricanNames.some((name) =>
          customer.name.includes(name)
        );
        expect(hasRecognisableName).toBe(true);
      }
    });
  });

  describe('Dispute data integrity', () => {
    it('should have totalAmount equal to sum of transaction amounts for each dispute', async () => {
      const disputes = await prisma.dispute.findMany({
        include: { transactions: true },
      });

      expect(disputes.length).toBeGreaterThan(0);
      for (const dispute of disputes) {
        const transactionSum = dispute.transactions.reduce(
          (sum, tx) => sum + tx.amount,
          0
        );
        expect(dispute.totalAmount).toBeCloseTo(transactionSum, 2);
      }
    });

    it('should set category to "Unauthorised/Fraudulent Charge" for all disputes', async () => {
      const disputes = await prisma.dispute.findMany();

      expect(disputes.length).toBeGreaterThan(0);
      for (const dispute of disputes) {
        expect(dispute.category).toBe('Unauthorised/Fraudulent Charge');
      }
    });
  });

  describe('Rule trace validity', () => {
    it('should have valid JSON ruleTrace with required keys for each dispute', async () => {
      const disputes = await prisma.dispute.findMany();

      expect(disputes.length).toBeGreaterThan(0);
      for (const dispute of disputes) {
        const parsed = JSON.parse(dispute.ruleTrace);
        expect(parsed).toHaveProperty('evaluatedAt');
        expect(parsed).toHaveProperty('inputs');
        expect(parsed).toHaveProperty('rules');
        expect(parsed).toHaveProperty('recommendation');
        expect(parsed).toHaveProperty('priority');
      }
    });
  });

  describe('Triage rule coverage', () => {
    it('should cover all 4 triage rule combinations', async () => {
      const disputes = await prisma.dispute.findMany({
        include: { transactions: true },
      });

      const AMOUNT_THRESHOLD = 10_000;
      const AGE_THRESHOLD_MS = 48 * 60 * 60 * 1000;

      let hasCaseA = false; // < 48h + > R10,000 → P1 both
      let hasCaseB = false; // >= 48h + > R10,000 → P1 amount-only
      let hasCaseC = false; // < 48h + <= R10,000 → P2 age-only
      let hasCaseD = false; // >= 48h + <= R10,000 → Standard neither

      for (const dispute of disputes) {
        const dateRaised = dispute.dateRaised.getTime();
        const hasRecentTransaction = dispute.transactions.some(
          (tx) => dateRaised - tx.timestamp.getTime() < AGE_THRESHOLD_MS
        );
        const exceedsAmount = dispute.totalAmount > AMOUNT_THRESHOLD;

        if (hasRecentTransaction && exceedsAmount) hasCaseA = true;
        if (!hasRecentTransaction && exceedsAmount) hasCaseB = true;
        if (hasRecentTransaction && !exceedsAmount) hasCaseC = true;
        if (!hasRecentTransaction && !exceedsAmount) hasCaseD = true;
      }

      expect(hasCaseA).toBe(true);
      expect(hasCaseB).toBe(true);
      expect(hasCaseC).toBe(true);
      expect(hasCaseD).toBe(true);
    });
  });

  describe('Status and resolution', () => {
    it('should have non-null resolutionOutcome for all Resolved disputes', async () => {
      const resolvedDisputes = await prisma.dispute.findMany({
        where: { status: 'Resolved' },
      });

      expect(resolvedDisputes.length).toBeGreaterThan(0);
      for (const dispute of resolvedDisputes) {
        expect(dispute.resolutionOutcome).not.toBeNull();
      }
    });
  });

  describe('Timestamp strategy', () => {
    it('should use relative timestamps (not hardcoded absolute dates)', async () => {
      const disputes = await prisma.dispute.findMany({
        include: { transactions: true },
      });

      expect(disputes.length).toBeGreaterThan(0);

      const now = Date.now();
      const oneWeekMs = 7 * 24 * 60 * 60 * 1000;

      for (const dispute of disputes) {
        const dateRaisedDiff = Math.abs(now - dispute.dateRaised.getTime());
        expect(dateRaisedDiff).toBeLessThan(oneWeekMs);

        for (const tx of dispute.transactions) {
          const txDiff = Math.abs(now - tx.timestamp.getTime());
          expect(txDiff).toBeLessThan(oneWeekMs);
        }
      }
    });
  });

  describe('Anchor story', () => {
    it('should have at least one dispute with multiple transactions', async () => {
      const disputes = await prisma.dispute.findMany({
        include: { _count: { select: { transactions: true } } },
      });

      const multiTransactionDispute = disputes.find(
        (d) => d._count.transactions > 1
      );
      expect(multiTransactionDispute).toBeDefined();
    });
  });
});
