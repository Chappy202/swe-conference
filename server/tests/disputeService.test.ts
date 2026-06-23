import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  listCustomers,
  listDisputes,
  getDisputeById,
  createDispute,
  transitionStatus,
  addTransaction,
} from '../src/services/disputeService.js';
import { AppError } from '../src/middleware/errorHandler.js';

// ---------------------------------------------------------------------------
// Mock Prisma client builder
// ---------------------------------------------------------------------------

interface MockDb {
  customer: {
    findMany: ReturnType<typeof vi.fn>;
    findUnique: ReturnType<typeof vi.fn>;
  };
  dispute: {
    findMany: ReturnType<typeof vi.fn>;
    findUnique: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
  };
  transaction: {
    create: ReturnType<typeof vi.fn>;
  };
}

function createMockDb(): MockDb {
  return {
    customer: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
    },
    dispute: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    transaction: {
      create: vi.fn(),
    },
  };
}

const sampleRuleTrace = {
  evaluatedAt: '2024-03-15T10:00:00.000Z',
  inputs: { youngestTransactionAge: '10 hours', totalAmount: 16500 },
  rules: [],
  recommendation: 'Immediate Fraud Freeze + P1 High Priority Escalation',
  priority: 'P1',
};

function makeDbCustomer(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    name: 'Thabo Mokoena',
    contactReference: '+27 82 345 6789',
    accountIdentifier: '4532-XXXX-XXXX-8821',
    createdAt: new Date('2024-03-01T08:00:00.000Z'),
    ...overrides,
  };
}

function makeDbTransaction(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    disputeId: 1,
    amount: 16500,
    merchant: 'Woolworths Sandton',
    timestamp: new Date('2024-03-14T10:00:00.000Z'),
    paymentType: 'ApplePay',
    createdAt: new Date('2024-03-15T10:00:00.000Z'),
    ...overrides,
  };
}

function makeDbDispute(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    customerId: 1,
    status: 'Reported',
    category: 'Unauthorised/Fraudulent Charge',
    totalAmount: 16500,
    dateRaised: new Date('2024-03-15T10:00:00.000Z'),
    priority: 'P1',
    recommendation: 'Immediate Fraud Freeze + P1 High Priority Escalation',
    ruleTrace: JSON.stringify(sampleRuleTrace),
    resolutionOutcome: null,
    createdAt: new Date('2024-03-15T10:00:00.000Z'),
    updatedAt: new Date('2024-03-15T10:00:00.000Z'),
    customer: makeDbCustomer(),
    transactions: [makeDbTransaction()],
    ...overrides,
  };
}

describe('disputeService', () => {
  let db: MockDb;

  beforeEach(() => {
    db = createMockDb();
  });

  describe('listCustomers', () => {
    describe('when customers exist', () => {
      it('should return all customers as DTOs with ISO createdAt', async () => {
        db.customer.findMany.mockResolvedValue([makeDbCustomer()]);

        const result = await listCustomers(db as never);

        expect(result).toHaveLength(1);
        expect(result[0]).toEqual({
          id: 1,
          name: 'Thabo Mokoena',
          contactReference: '+27 82 345 6789',
          accountIdentifier: '4532-XXXX-XXXX-8821',
          createdAt: '2024-03-01T08:00:00.000Z',
        });
      });
    });

    describe('when no customers exist', () => {
      it('should return an empty array', async () => {
        db.customer.findMany.mockResolvedValue([]);

        const result = await listCustomers(db as never);

        expect(result).toEqual([]);
      });
    });
  });

  describe('getDisputeById', () => {
    describe('when the dispute exists', () => {
      it('should return full detail with nested customer, transactions, and parsed ruleTrace', async () => {
        db.dispute.findUnique.mockResolvedValue(makeDbDispute());

        const result = await getDisputeById(1, db as never);

        expect(result.id).toBe(1);
        expect(result.customer.name).toBe('Thabo Mokoena');
        expect(result.transactions).toHaveLength(1);
        expect(result.ruleTrace).toEqual(sampleRuleTrace);
        expect(result.dateRaised).toBe('2024-03-15T10:00:00.000Z');
      });
    });

    describe('when the dispute does not exist', () => {
      it('should throw a DISPUTE_NOT_FOUND AppError with status 404', async () => {
        db.dispute.findUnique.mockResolvedValue(null);

        await expect(getDisputeById(999, db as never)).rejects.toMatchObject({
          code: 'DISPUTE_NOT_FOUND',
          status: 404,
        });
      });
    });
  });

  describe('listDisputes', () => {
    describe('when filters are provided', () => {
      it('should pass status and priority filters into the where clause', async () => {
        db.dispute.findMany.mockResolvedValue([]);

        await listDisputes({ status: ['Reported'], priority: ['P1'] }, db as never);

        expect(db.dispute.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: { status: { in: ['Reported'] }, priority: { in: ['P1'] } },
          })
        );
      });
    });

    describe('when no filters are provided', () => {
      it('should query with an empty where clause', async () => {
        db.dispute.findMany.mockResolvedValue([]);

        await listDisputes({}, db as never);

        expect(db.dispute.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: {} }));
      });
    });

    describe('denormalization', () => {
      it('should include customerName from the joined customer', async () => {
        db.dispute.findMany.mockResolvedValue([makeDbDispute()]);

        const result = await listDisputes({}, db as never);

        expect(result[0].customerName).toBe('Thabo Mokoena');
      });
    });

    describe('sorting', () => {
      it('should sort by totalAmount ascending when requested', async () => {
        db.dispute.findMany.mockResolvedValue([
          makeDbDispute({ id: 1, totalAmount: 500 }),
          makeDbDispute({ id: 2, totalAmount: 100 }),
          makeDbDispute({ id: 3, totalAmount: 300 }),
        ]);

        const result = await listDisputes({ sortBy: 'totalAmount', sortOrder: 'asc' }, db as never);

        expect(result.map((d) => d.totalAmount)).toEqual([100, 300, 500]);
      });

      it('should default to priority desc (P1 first) then dateRaised desc', async () => {
        db.dispute.findMany.mockResolvedValue([
          makeDbDispute({ id: 1, priority: 'Standard', dateRaised: new Date('2024-01-01') }),
          makeDbDispute({ id: 2, priority: 'P1', dateRaised: new Date('2024-01-01') }),
          makeDbDispute({ id: 3, priority: 'P1', dateRaised: new Date('2024-02-01') }),
        ]);

        const result = await listDisputes({}, db as never);

        expect(result.map((d) => d.id)).toEqual([3, 2, 1]);
      });
    });
  });

  describe('createDispute', () => {
    describe('when the customer exists', () => {
      it('should create the dispute with status Reported and run triage', async () => {
        db.customer.findUnique.mockResolvedValue(makeDbCustomer());
        db.dispute.create.mockResolvedValue(makeDbDispute());

        const result = await createDispute(
          1,
          [
            {
              amount: 8000,
              merchant: 'A',
              timestamp: new Date(Date.now() - 3600_000).toISOString(),
              paymentType: 'Card',
            },
            {
              amount: 8500,
              merchant: 'B',
              timestamp: new Date(Date.now() - 7200_000).toISOString(),
              paymentType: 'Card',
            },
          ],
          db as never
        );

        expect(db.dispute.create).toHaveBeenCalled();
        const createArg = db.dispute.create.mock.calls[0][0];
        expect(createArg.data.status).toBe('Reported');
        expect(createArg.data.totalAmount).toBe(16500);
        expect(createArg.data.priority).toBeDefined();
        expect(createArg.data.ruleTrace).toBeTypeOf('string');
        expect(result.id).toBe(1);
      });
    });

    describe('when the customer does not exist', () => {
      it('should throw a VALIDATION_ERROR AppError', async () => {
        db.customer.findUnique.mockResolvedValue(null);

        await expect(
          createDispute(
            999,
            [
              {
                amount: 100,
                merchant: 'A',
                timestamp: new Date().toISOString(),
                paymentType: 'Card',
              },
            ],
            db as never
          )
        ).rejects.toMatchObject({ code: 'VALIDATION_ERROR', status: 400 });

        expect(db.dispute.create).not.toHaveBeenCalled();
      });
    });
  });

  describe('transitionStatus', () => {
    describe('when the transition is valid', () => {
      it('should update the status and return the detail', async () => {
        db.dispute.findUnique.mockResolvedValue(makeDbDispute({ status: 'Reported' }));
        db.dispute.update.mockResolvedValue(makeDbDispute({ status: 'UnderInvestigation' }));

        const result = await transitionStatus(1, 'UnderInvestigation', undefined, db as never);

        expect(db.dispute.update).toHaveBeenCalledWith(
          expect.objectContaining({
            where: { id: 1 },
            data: expect.objectContaining({ status: 'UnderInvestigation' }),
          })
        );
        expect(result.status).toBe('UnderInvestigation');
      });
    });

    describe('when resolving with an outcome', () => {
      it('should persist the resolutionOutcome', async () => {
        db.dispute.findUnique.mockResolvedValue(makeDbDispute({ status: 'UnderInvestigation' }));
        db.dispute.update.mockResolvedValue(
          makeDbDispute({ status: 'Resolved', resolutionOutcome: 'Refunded' })
        );

        await transitionStatus(1, 'Resolved', 'Refunded', db as never);

        expect(db.dispute.update).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({ status: 'Resolved', resolutionOutcome: 'Refunded' }),
          })
        );
      });
    });

    describe('when the transition is invalid', () => {
      it('should throw INVALID_STATUS_TRANSITION', async () => {
        db.dispute.findUnique.mockResolvedValue(makeDbDispute({ status: 'Reported' }));

        await expect(
          transitionStatus(1, 'Resolved', 'Refunded', db as never)
        ).rejects.toMatchObject({ code: 'INVALID_STATUS_TRANSITION', status: 400 });

        expect(db.dispute.update).not.toHaveBeenCalled();
      });
    });

    describe('when resolving without an outcome', () => {
      it('should throw MISSING_RESOLUTION_OUTCOME', async () => {
        db.dispute.findUnique.mockResolvedValue(makeDbDispute({ status: 'UnderInvestigation' }));

        await expect(transitionStatus(1, 'Resolved', undefined, db as never)).rejects.toMatchObject(
          { code: 'MISSING_RESOLUTION_OUTCOME', status: 400 }
        );
      });
    });

    describe('when the dispute does not exist', () => {
      it('should throw DISPUTE_NOT_FOUND', async () => {
        db.dispute.findUnique.mockResolvedValue(null);

        await expect(
          transitionStatus(999, 'UnderInvestigation', undefined, db as never)
        ).rejects.toMatchObject({ code: 'DISPUTE_NOT_FOUND', status: 404 });
      });
    });
  });

  describe('addTransaction', () => {
    const validTxn = {
      amount: 2000,
      merchant: 'New Merchant',
      timestamp: new Date('2024-03-14T11:00:00.000Z').toISOString(),
      paymentType: 'Card' as const,
    };

    describe('when the dispute is active', () => {
      it('should create the transaction, recalc totalAmount, and re-run triage', async () => {
        db.dispute.findUnique.mockResolvedValue(
          makeDbDispute({
            status: 'UnderInvestigation',
            transactions: [makeDbTransaction({ amount: 5000 })],
          })
        );
        db.transaction.create.mockResolvedValue(makeDbTransaction());
        db.dispute.update.mockResolvedValue(makeDbDispute({ totalAmount: 7000 }));

        await addTransaction(1, validTxn, db as never);

        expect(db.transaction.create).toHaveBeenCalled();
        const updateArg = db.dispute.update.mock.calls[0][0];
        expect(updateArg.data.totalAmount).toBe(7000);
        expect(updateArg.data.ruleTrace).toBeTypeOf('string');
      });
    });

    describe('when the dispute is in a terminal state', () => {
      it('should throw DISPUTE_IN_TERMINAL_STATE and not create a transaction', async () => {
        db.dispute.findUnique.mockResolvedValue(makeDbDispute({ status: 'Resolved' }));

        await expect(addTransaction(1, validTxn, db as never)).rejects.toMatchObject({
          code: 'DISPUTE_IN_TERMINAL_STATE',
          status: 400,
        });
        expect(db.transaction.create).not.toHaveBeenCalled();
      });
    });

    describe('when the dispute does not exist', () => {
      it('should throw DISPUTE_NOT_FOUND', async () => {
        db.dispute.findUnique.mockResolvedValue(null);

        await expect(addTransaction(999, validTxn, db as never)).rejects.toMatchObject({
          code: 'DISPUTE_NOT_FOUND',
          status: 404,
        });
      });
    });
  });

  describe('AppError shape', () => {
    it('exposes code, status, and timestamp', () => {
      const err = new AppError('VALIDATION_ERROR', 'bad', 400);
      expect(err).toBeInstanceOf(Error);
      expect(err.code).toBe('VALIDATION_ERROR');
      expect(err.status).toBe(400);
      expect(typeof err.timestamp).toBe('string');
    });
  });
});
