import { Router, Request, Response, NextFunction } from 'express';
import * as disputeService from '../services/disputeService.js';
import { ListDisputesParams } from '../services/disputeService.js';
import {
  validateCreateDisputeBody,
  validateStatusTransitionBody,
  validateTransactionInput,
} from './validation.js';

export const apiRouter = Router();

/** Parses a comma-separated query parameter into a trimmed string array. */
function parseCsvParam(value: unknown): string[] | undefined {
  if (typeof value !== 'string' || value.trim() === '') return undefined;
  return value
    .split(',')
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
}

apiRouter.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

apiRouter.get('/customers', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const customers = await disputeService.listCustomers();
    res.json(customers);
  } catch (error) {
    next(error);
  }
});

apiRouter.get('/disputes', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const params: ListDisputesParams = {
      status: parseCsvParam(req.query.status),
      priority: parseCsvParam(req.query.priority),
      sortBy: req.query.sortBy as ListDisputesParams['sortBy'],
      sortOrder: req.query.sortOrder as ListDisputesParams['sortOrder'],
    };
    const disputes = await disputeService.listDisputes(params);
    res.json(disputes);
  } catch (error) {
    next(error);
  }
});

apiRouter.get('/disputes/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);
    const dispute = await disputeService.getDisputeById(id);
    res.json(dispute);
  } catch (error) {
    next(error);
  }
});

apiRouter.post('/disputes', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { customerId, transactions } = validateCreateDisputeBody(req.body);
    const dispute = await disputeService.createDispute(customerId, transactions);
    res.status(201).json(dispute);
  } catch (error) {
    next(error);
  }
});

apiRouter.patch('/disputes/:id/status', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);
    const { status, resolutionOutcome } = validateStatusTransitionBody(req.body);
    const dispute = await disputeService.transitionStatus(id, status, resolutionOutcome);
    res.json(dispute);
  } catch (error) {
    next(error);
  }
});

apiRouter.post(
  '/disputes/:id/transactions',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = Number(req.params.id);
      const transaction = validateTransactionInput(req.body);
      const dispute = await disputeService.addTransaction(id, transaction);
      res.json(dispute);
    } catch (error) {
      next(error);
    }
  }
);
