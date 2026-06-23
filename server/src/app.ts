import express, { Express } from 'express';
import cors from 'cors';
import { apiRouter } from './routes/api.js';
import { errorHandler } from './middleware/errorHandler.js';

/**
 * Builds the Express application with all middleware, routes, and the error
 * handler wired up. Does NOT call `app.listen` — the listener lives in
 * `index.ts` so the app can be imported directly by tests.
 */
export function createApp(): Express {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.use('/api', apiRouter);

  app.use(errorHandler);

  return app;
}

export const app = createApp();
