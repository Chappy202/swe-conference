import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const SAMPLE_RULE_TRACE = JSON.stringify({
  evaluatedAt: '2024-03-15T10:00:00.000Z',
  inputs: { youngestTransactionAge: '10 hours', totalAmount: 16500 },
  rules: [],
  recommendation: 'Immediate Fraud Freeze + P1 High Priority Escalation',
  priority: 'P1',
});

describe('API Routes', () => {
  let testCustomerId: number;
  let testDisputeId: number;
  // Track records created by this suite so we only delete our own data and
  // leave the seeded dataset intact for seed.test.ts.
  const createdDisputeIds: number[] = [];

  async function trackNewDisputes<T>(fn: () => Promise<T>): Promise<T> {
    const before = (await prisma.dispute.findMany({ select: { id: true } })).map((d) => d.id);
    const result = await fn();
    const after = await prisma.dispute.findMany({ select: { id: true } });
    for (const d of after) {
      if (!before.includes(d.id) && !createdDisputeIds.includes(d.id)) {
        createdDisputeIds.push(d.id);
      }
    }
    return result;
  }

  beforeAll(async () => {
    const customer = await prisma.customer.create({
      data: {
        name: 'Thabo Mokoena',
        contactReference: 'thabo.mokoena@email.co.za',
        accountIdentifier: 'ACC-001-ZA',
      },
    });
    testCustomerId = customer.id;

    const dispute = await prisma.dispute.create({
      data: {
        customerId: customer.id,
        status: 'Reported',
        category: 'Unauthorised/Fraudulent Charge',
        totalAmount: 16500,
        dateRaised: '2024-03-15T10:00:00.000Z',
        priority: 'P1',
        recommendation: 'Immediate Fraud Freeze + P1 High Priority Escalation',
        ruleTrace: SAMPLE_RULE_TRACE,
        transactions: {
          create: [
            {
              amount: 5500,
              merchant: 'Woolworths Sandton',
              timestamp: '2024-03-14T08:00:00.000Z',
              paymentType: 'ApplePay',
            },
            {
              amount: 3200,
              merchant: 'Checkers Rosebank',
              timestamp: '2024-03-14T12:00:00.000Z',
              paymentType: 'ApplePay',
            },
            {
              amount: 7800,
              merchant: 'Takealot Online',
              timestamp: '2024-03-14T15:00:00.000Z',
              paymentType: 'Card',
            },
          ],
        },
      },
    });
    testDisputeId = dispute.id;
    createdDisputeIds.push(dispute.id);
  });

  afterAll(async () => {
    // Remove every dispute (and its transactions) belonging to the customer this
    // suite created, then the customer itself. Deleting by customerId — rather
    // than a tracked id list — guarantees no orphaned rows leak into the shared
    // database and break seed.test.ts's global invariants.
    const disputes = await prisma.dispute.findMany({
      where: { customerId: testCustomerId },
      select: { id: true },
    });
    const ids = disputes.map((d) => d.id);
    if (ids.length > 0) {
      await prisma.transaction.deleteMany({ where: { disputeId: { in: ids } } });
      await prisma.dispute.deleteMany({ where: { id: { in: ids } } });
    }
    await prisma.customer.deleteMany({ where: { id: testCustomerId } });
    await prisma.$disconnect();
  });

  describe('GET /api/customers', () => {
    describe('TC-012: when fetching customers', () => {
      it('should return 200 with an array of customers', async () => {
        const response = await request(app).get('/api/customers');

        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body.length).toBeGreaterThan(0);

        const customer = response.body[0];
        expect(customer).toHaveProperty('id');
        expect(customer).toHaveProperty('name');
        expect(customer).toHaveProperty('contactReference');
        expect(customer).toHaveProperty('accountIdentifier');
        expect(customer).toHaveProperty('createdAt');
      });
    });
  });

  describe('GET /api/disputes', () => {
    it('should return a summary array including denormalized customerName', async () => {
      const response = await request(app).get('/api/disputes');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      const found = response.body.find((d: { id: number }) => d.id === testDisputeId);
      expect(found).toBeDefined();
      expect(found).toHaveProperty('customerName');
      expect(found).not.toHaveProperty('transactions');
      expect(found).not.toHaveProperty('ruleTrace');
    });

    it('should filter by status', async () => {
      const response = await request(app).get('/api/disputes?status=Reported');

      expect(response.status).toBe(200);
      for (const dispute of response.body) {
        expect(dispute.status).toBe('Reported');
      }
    });

    it('should filter by priority', async () => {
      const response = await request(app).get('/api/disputes?priority=P1');

      expect(response.status).toBe(200);
      for (const dispute of response.body) {
        expect(dispute.priority).toBe('P1');
      }
    });

    it('should sort by totalAmount ascending', async () => {
      const response = await request(app).get('/api/disputes?sortBy=totalAmount&sortOrder=asc');

      expect(response.status).toBe(200);
      const amounts = response.body.map((d: { totalAmount: number }) => d.totalAmount);
      const sorted = [...amounts].sort((a, b) => a - b);
      expect(amounts).toEqual(sorted);
    });

    it('should sort by dateRaised descending', async () => {
      const response = await request(app).get('/api/disputes?sortBy=dateRaised&sortOrder=desc');

      expect(response.status).toBe(200);
      const dates = response.body.map((d: { dateRaised: string }) =>
        new Date(d.dateRaised).getTime()
      );
      const sorted = [...dates].sort((a, b) => b - a);
      expect(dates).toEqual(sorted);
    });

    it('should default to priority order (P1 first)', async () => {
      const response = await request(app).get('/api/disputes');

      expect(response.status).toBe(200);
      const rank: Record<string, number> = { P1: 1, P2: 2, Standard: 3 };
      const ranks = response.body.map((d: { priority: string }) => rank[d.priority] ?? 99);
      const sorted = [...ranks].sort((a, b) => a - b);
      expect(ranks).toEqual(sorted);
    });
  });

  describe('POST /api/disputes', () => {
    describe('TC-013: when creating a dispute with valid data', () => {
      it('should return 201 with the dispute and triage result', async () => {
        const payload = {
          customerId: testCustomerId,
          transactions: [
            {
              amount: 8500,
              merchant: 'Game Menlyn',
              timestamp: '2024-03-14T09:00:00.000Z',
              paymentType: 'Card',
            },
            {
              amount: 4200,
              merchant: 'Makro Silver Lakes',
              timestamp: '2024-03-14T14:00:00.000Z',
              paymentType: 'ApplePay',
            },
          ],
        };

        const response = await trackNewDisputes(() =>
          request(app).post('/api/disputes').send(payload).set('Content-Type', 'application/json')
        );

        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty('id');
        expect(response.body).toHaveProperty('status', 'Reported');
        expect(response.body).toHaveProperty('priority');
        expect(response.body).toHaveProperty('recommendation');
        expect(response.body).toHaveProperty('totalAmount', 12700);
        expect(response.body).toHaveProperty('ruleTrace');
        expect(response.body.customerId).toBe(testCustomerId);
        expect(response.body).toHaveProperty('customer');
        expect(Array.isArray(response.body.transactions)).toBe(true);
      });
    });

    describe('TC-014: when creating a dispute with empty transactions', () => {
      it('should return 400 with VALIDATION_ERROR', async () => {
        const response = await request(app)
          .post('/api/disputes')
          .send({ customerId: testCustomerId, transactions: [] })
          .set('Content-Type', 'application/json');

        expect(response.status).toBe(400);
        expect(response.body.error).toHaveProperty('code', 'VALIDATION_ERROR');
      });
    });

    describe('TC-015: when creating a dispute with invalid customerId', () => {
      it('should return 400 with VALIDATION_ERROR', async () => {
        const response = await request(app)
          .post('/api/disputes')
          .send({
            customerId: 99999,
            transactions: [
              {
                amount: 1000,
                merchant: 'Test Merchant',
                timestamp: '2024-03-14T10:00:00.000Z',
                paymentType: 'Card',
              },
            ],
          })
          .set('Content-Type', 'application/json');

        expect(response.status).toBe(400);
        expect(response.body.error).toHaveProperty('code', 'VALIDATION_ERROR');
      });
    });

    describe('when customerId is missing', () => {
      it('should return 400 with VALIDATION_ERROR', async () => {
        const response = await request(app)
          .post('/api/disputes')
          .send({
            transactions: [
              {
                amount: 1000,
                merchant: 'Test',
                timestamp: '2024-03-14T10:00:00.000Z',
                paymentType: 'Card',
              },
            ],
          });

        expect(response.status).toBe(400);
        expect(response.body.error).toHaveProperty('code', 'VALIDATION_ERROR');
      });
    });

    describe('when a transaction field is invalid', () => {
      const base = {
        amount: 1000,
        merchant: 'Test',
        timestamp: '2024-03-14T10:00:00.000Z',
        paymentType: 'Card',
      };
      const cases: Array<[string, Record<string, unknown>]> = [
        ['non-positive amount', { ...base, amount: 0 }],
        ['empty merchant', { ...base, merchant: '' }],
        ['invalid timestamp', { ...base, timestamp: 'nonsense' }],
        ['invalid paymentType', { ...base, paymentType: 'Bitcoin' }],
      ];

      for (const [label, txn] of cases) {
        it(`should return 400 VALIDATION_ERROR for ${label}`, async () => {
          const response = await request(app)
            .post('/api/disputes')
            .send({ customerId: testCustomerId, transactions: [txn] });

          expect(response.status).toBe(400);
          expect(response.body.error).toHaveProperty('code', 'VALIDATION_ERROR');
        });
      }
    });
  });

  describe('PATCH /api/disputes/:id/status', () => {
    let disputeForTransition: number;

    beforeEach(async () => {
      const dispute = await prisma.dispute.create({
        data: {
          customerId: testCustomerId,
          status: 'Reported',
          category: 'Unauthorised/Fraudulent Charge',
          totalAmount: 5000,
          dateRaised: '2024-03-15T10:00:00.000Z',
          priority: 'P2',
          recommendation: 'Immediate Fraud Freeze',
          ruleTrace: SAMPLE_RULE_TRACE,
        },
      });
      disputeForTransition = dispute.id;
      createdDisputeIds.push(dispute.id);
    });

    describe('TC-016: when updating status with valid transition', () => {
      it('should return 200 with updated dispute status', async () => {
        const response = await request(app)
          .patch(`/api/disputes/${disputeForTransition}/status`)
          .send({ status: 'UnderInvestigation' });

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('status', 'UnderInvestigation');
        expect(response.body).toHaveProperty('id', disputeForTransition);
      });
    });

    describe('when the transition is invalid', () => {
      it('should return 400 with INVALID_STATUS_TRANSITION', async () => {
        const response = await request(app)
          .patch(`/api/disputes/${disputeForTransition}/status`)
          .send({ status: 'Resolved', resolutionOutcome: 'Refunded' });

        expect(response.status).toBe(400);
        expect(response.body.error).toHaveProperty('code', 'INVALID_STATUS_TRANSITION');
      });
    });

    describe('when resolving without a resolutionOutcome', () => {
      it('should return 400 with MISSING_RESOLUTION_OUTCOME', async () => {
        // First move to UnderInvestigation (a state from which Resolved is allowed).
        await request(app)
          .patch(`/api/disputes/${disputeForTransition}/status`)
          .send({ status: 'UnderInvestigation' });

        const response = await request(app)
          .patch(`/api/disputes/${disputeForTransition}/status`)
          .send({ status: 'Resolved' });

        expect(response.status).toBe(400);
        expect(response.body.error).toHaveProperty('code', 'MISSING_RESOLUTION_OUTCOME');
      });
    });

    describe('when resolving with a valid resolutionOutcome', () => {
      it('should store the resolutionOutcome and return 200', async () => {
        await request(app)
          .patch(`/api/disputes/${disputeForTransition}/status`)
          .send({ status: 'UnderInvestigation' });

        const response = await request(app)
          .patch(`/api/disputes/${disputeForTransition}/status`)
          .send({ status: 'Resolved', resolutionOutcome: 'ChargebackInitiated' });

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('status', 'Resolved');
        expect(response.body).toHaveProperty('resolutionOutcome', 'ChargebackInitiated');
      });
    });

    describe('when the status field is missing', () => {
      it('should return 400 with VALIDATION_ERROR', async () => {
        const response = await request(app)
          .patch(`/api/disputes/${disputeForTransition}/status`)
          .send({});

        expect(response.status).toBe(400);
        expect(response.body.error).toHaveProperty('code', 'VALIDATION_ERROR');
      });
    });

    describe('when the dispute does not exist', () => {
      it('should return 404 with DISPUTE_NOT_FOUND', async () => {
        const response = await request(app)
          .patch('/api/disputes/999999/status')
          .send({ status: 'UnderInvestigation' });

        expect(response.status).toBe(404);
        expect(response.body.error).toHaveProperty('code', 'DISPUTE_NOT_FOUND');
      });
    });
  });

  describe('GET /api/disputes/:id', () => {
    describe('TC-017: when fetching a dispute by id', () => {
      it('should return full detail with customer, transactions, and ruleTrace', async () => {
        const response = await request(app).get(`/api/disputes/${testDisputeId}`);

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('id', testDisputeId);
        expect(response.body).toHaveProperty('status');
        expect(response.body).toHaveProperty('priority');
        expect(response.body).toHaveProperty('recommendation');
        expect(response.body).toHaveProperty('totalAmount');
        expect(response.body).toHaveProperty('dateRaised');
        expect(response.body).toHaveProperty('customer');
        expect(response.body.customer).toHaveProperty('name');
        expect(response.body).toHaveProperty('transactions');
        expect(Array.isArray(response.body.transactions)).toBe(true);
        expect(response.body.transactions.length).toBeGreaterThan(0);
        expect(response.body).toHaveProperty('ruleTrace');
        expect(response.body.ruleTrace).toBeTypeOf('object');
      });
    });

    describe('TC-018: when fetching a non-existent dispute', () => {
      it('should return 404 with DISPUTE_NOT_FOUND error', async () => {
        const response = await request(app).get('/api/disputes/9999');

        expect(response.status).toBe(404);
        expect(response.body.error).toHaveProperty('code', 'DISPUTE_NOT_FOUND');
      });
    });
  });

  describe('POST /api/disputes/:id/transactions', () => {
    describe('TC-019: when adding transactions to an active dispute', () => {
      let disputeForReeval: number;

      beforeEach(async () => {
        const dispute = await prisma.dispute.create({
          data: {
            customerId: testCustomerId,
            status: 'UnderInvestigation',
            category: 'Unauthorised/Fraudulent Charge',
            totalAmount: 5000,
            dateRaised: '2024-03-15T10:00:00.000Z',
            priority: 'P2',
            recommendation: 'Immediate Fraud Freeze',
            ruleTrace: SAMPLE_RULE_TRACE,
            transactions: {
              create: [
                {
                  amount: 5000,
                  merchant: 'Woolworths CBD',
                  timestamp: '2024-03-14T10:00:00.000Z',
                  paymentType: 'ApplePay',
                },
              ],
            },
          },
        });
        disputeForReeval = dispute.id;
        createdDisputeIds.push(dispute.id);
      });

      it('should re-evaluate triage and update priority when totalAmount changes', async () => {
        const response = await request(app)
          .post(`/api/disputes/${disputeForReeval}/transactions`)
          .send({
            amount: 8000,
            merchant: 'iStore Sandton City',
            timestamp: '2024-03-14T11:00:00.000Z',
            paymentType: 'ApplePay',
          });

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('totalAmount', 13000);
        expect(response.body).toHaveProperty('priority', 'P1');
        expect(response.body.recommendation).toBe(
          'Immediate Fraud Freeze + P1 High Priority Escalation'
        );
        expect(response.body.transactions).toHaveLength(2);
      });

      it('should return 400 VALIDATION_ERROR for an invalid amount', async () => {
        const response = await request(app)
          .post(`/api/disputes/${disputeForReeval}/transactions`)
          .send({
            amount: -5,
            merchant: 'Bad',
            timestamp: '2024-03-14T11:00:00.000Z',
            paymentType: 'Card',
          });

        expect(response.status).toBe(400);
        expect(response.body.error).toHaveProperty('code', 'VALIDATION_ERROR');
      });
    });

    describe('TC-020: when adding transactions to a resolved dispute', () => {
      let resolvedDisputeId: number;

      beforeEach(async () => {
        const dispute = await prisma.dispute.create({
          data: {
            customerId: testCustomerId,
            status: 'Resolved',
            category: 'Unauthorised/Fraudulent Charge',
            totalAmount: 5000,
            dateRaised: '2024-03-15T10:00:00.000Z',
            priority: 'Standard',
            recommendation: 'Standard Investigation',
            ruleTrace: SAMPLE_RULE_TRACE,
            resolutionOutcome: 'Refunded',
          },
        });
        resolvedDisputeId = dispute.id;
        createdDisputeIds.push(dispute.id);
      });

      it('should return 400 with DISPUTE_IN_TERMINAL_STATE error', async () => {
        const response = await request(app)
          .post(`/api/disputes/${resolvedDisputeId}/transactions`)
          .send({
            amount: 2000,
            merchant: 'Some Merchant',
            timestamp: '2024-03-14T10:00:00.000Z',
            paymentType: 'Card',
          });

        expect(response.status).toBe(400);
        expect(response.body.error).toHaveProperty('code', 'DISPUTE_IN_TERMINAL_STATE');
      });
    });

    describe('when the dispute does not exist', () => {
      it('should return 404 with DISPUTE_NOT_FOUND', async () => {
        const response = await request(app).post('/api/disputes/999999/transactions').send({
          amount: 2000,
          merchant: 'Some Merchant',
          timestamp: '2024-03-14T10:00:00.000Z',
          paymentType: 'Card',
        });

        expect(response.status).toBe(404);
        expect(response.body.error).toHaveProperty('code', 'DISPUTE_NOT_FOUND');
      });
    });
  });
});
