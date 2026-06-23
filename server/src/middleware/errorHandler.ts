import { Request, Response, NextFunction } from 'express';

/**
 * Structured application error carrying an HTTP status, a machine-readable code,
 * and the timestamp at which it was raised. Thrown by the service layer and
 * formatted into the standard error envelope by {@link errorHandler}.
 */
export class AppError extends Error {
  public readonly code: string;
  public readonly status: number;
  public readonly timestamp: string;

  constructor(code: string, message: string, status: number) {
    super(message);
    this.code = code;
    this.status = status;
    this.timestamp = new Date().toISOString();
    this.name = 'AppError';
  }
}

/**
 * Express error-handling middleware. Formats {@link AppError} instances into the
 * standard error envelope and falls back to INTERNAL_ERROR for unknown errors.
 */
export const errorHandler = (err: Error, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof AppError) {
    console.error(`[${err.code}] ${err.message}`);
    res.status(err.status).json({
      error: {
        code: err.code,
        message: err.message,
        status: err.status,
        timestamp: err.timestamp,
      },
    });
    return;
  }

  console.error(`[INTERNAL_ERROR] ${err.message}`, err);
  res.status(500).json({
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred.',
      status: 500,
      timestamp: new Date().toISOString(),
    },
  });
};
