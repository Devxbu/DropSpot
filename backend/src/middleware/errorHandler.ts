import type { NextFunction, Request, Response } from 'express';

import { logger } from '../utils/logger';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function errorHandler(err: any, _req: Request, res: Response, _next: NextFunction) {
  const status = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  logger.error({ err, status }, 'Request failed');

  res.status(status).json({
    success: false,
    message,
  });
}
