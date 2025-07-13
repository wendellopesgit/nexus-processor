import { AppError } from '@shared/errors/app.error';
import { logger } from '@shared/utils/logger';
import { NextFunction, Request, Response } from 'express';

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof AppError) {
    logger.warn(`Business error: ${err.message}`);

    res.status(err.statusCode).json({ error: err.message });

    return;
  }

  logger.error(`Unexpected error: ${err.stack}`);

  res.status(500).json({ error: 'Internal Server Error' });
}

export function notFoundHandler(_req: Request, res: Response): void {
  res.status(404).json({ error: 'Endpoint not found' });
}
