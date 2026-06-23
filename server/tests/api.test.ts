import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
// NOTE: supertest must be added as a devDependency: npm install -D supertest @types/supertest
import request from 'supertest';
import { app } from '../src/app.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('API Routes', () => {
  let testCustomerId: number;
  let testDisputeId: number;

  beforeAll(async () => {
    // Seed test data
    const customer = await prisma.customer.create({
      data: {
        name: 'Thabo Mokoena',
        contactReference: 'thabo.mokoena@email.co.za',
        accountIdentifier: 'ACC-001-ZA',
      },
    });
    testCustomerId = customer.id;

    // Create a dispute with transactions for testing
    const dispute = await prisma.dispute.create({
      data: {
        customerId: customer.id,
        status: 'Reported',
        category: 'Unauthorised/Fraudulent Charge',
        totalAmount: 16500,
        dateRaised: '2024-03-15T10:00:00.000Z',
        priority: 'P1',
        recommendation: 'Immediate Fraud Freeze + P1 High Priority Escalation',
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
  });

  afterAll(async () => {
    // Clean up test data in correct order (transactions first due to FK)
    await prisma.transaction.deleteMany({});
    await prisma.dispute.deleteMany({});
    await prisma.customer.deleteMany({});
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
      });
    });
  });

  describe('POST /api/disputes', () => {
    describe('TC-013: when creating a dispute with valid data', () => {
      it('should return 201 with the dispute and triage result', async () => {
        const payload = {
          customerId: testCustomerId,
          category: 'Unauthorised/Fraudulent Charge',
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

        const response = await request(app)
          .post('/api/disputes')
          .send(payload)
          .set('Content-Type', 'application/json');

        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty('id');
        expect(response.body).toHaveProperty('status', 'Reported');
        expect(response.body).toHaveProperty('priority');
        expect(response.body).toHaveProperty('recommendation');
        expect(response.body).toHaveProperty('totalAmount', 12700);
        expect(response.body).toHaveProperty('ruleTrace');
        expect(response.body.customerId).toBe(testCustomerId);
      });
    });

    describe('TC-014: when creating a dispute with empty transactions', () => {
      it('should return 400 with validation error', async () => {
        const payload = {
          customerId: testCustomerId,
          category: 'Unauthorised/Fraudulent Charge',
          transactions: [],
        };

        const response = await request(app)
          .post('/api/disputes')
          .send(payload)
          .set('Content-Type', 'application/json');

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('error');
        expect(response.body.error).toHaveProperty('code');
      });
    });

    describe('TC-015: when creating a dispute with invalid customerId', () => {
      it('should return 400 with validation error', async () => {
        const payload = {
          customerId: 99999,
          category: 'Unauthorised/Fraudulent Charge',
          transactions: [
            {
              amount: 1000,
              merchant: 'Test Merchant',
              timestamp: '2024-03-14T10:00:00.000Z',
              paymentType: 'Card',
            },
          ],
        };

        const response = await request(app)
          .post('/api/disputes')
          .send(payload)
          .set('Content-Type', 'application/json');

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('error');
      });
    });
  });

  describe('PATCH /api/disputes/:id/status', () => {
    describe('TC-016: when updating status with valid transition', () => {
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
          },
        });
        disputeForTransition = dispute.id;
      });

      it('should return 200 with updated dispute status', async () => {
        const response = await request(app)
          .patch(`/api/disputes/${disputeForTransition}/status`)
          .send({ status: 'UnderInvestigation' })
          .set('Content-Type', 'application/json');

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('status', 'UnderInvestigation');
        expect(response.body).toHaveProperty('id', disputeForTransition);
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
      });
    });

    describe('TC-018: when fetching a non-existent dispute', () => {
      it('should return 404 with DISPUTE_NOT_FOUND error', async () => {
        const response = await request(app).get('/api/disputes/9999');

        expect(response.status).toBe(404);
        expect(response.body).toHaveProperty('error');
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
      });

      it('should re-evaluate triage and update priority when totalAmount changes', async () => {
        const newTransaction = {
          amount: 8000,
          merchant: 'iStore Sandton City',
          timestamp: '2024-03-14T11:00:00.000Z',
          paymentType: 'ApplePay',
        };

        const response = await request(app)
          .post(`/api/disputes/${disputeForReeval}/transactions`)
          .send(newTransaction)
          .set('Content-Type', 'application/json');

        expect(response.status).toBe(200);
        // Total is now R13,000 (> R10K) and age < 48h → P1
        expect(response.body).toHaveProperty('totalAmount', 13000);
        expect(response.body).toHaveProperty('priority', 'P1');
        expect(response.body.recommendation).toBe(
          'Immediate Fraud Freeze + P1 High Priority Escalation'
        );
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
            resolutionOutcome: 'Refunded',
          },
        });
        resolvedDisputeId = dispute.id;
      });

      it('should return 400 with DISPUTE_IN_TERMINAL_STATE error', async () => {
        const newTransaction = {
          amount: 2000,
          merchant: 'Some Merchant',
          timestamp: '2024-03-14T10:00:00.000Z',
          paymentType: 'Card',
        };

        const response = await request(app)
          .post(`/api/disputes/${resolvedDisputeId}/transactions`)
          .send(newTransaction)
          .set('Content-Type', 'application/json');

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('error');
        expect(response.body.error).toHaveProperty('code', 'DISPUTE_IN_TERMINAL_STATE');
      });
    });
  });
});
