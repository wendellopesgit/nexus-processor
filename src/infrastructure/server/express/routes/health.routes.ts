import { logger } from '@shared/utils/logger';
import { connect } from 'amqplib';
import { Request, Response, Router } from 'express';
import mongoose from 'mongoose';

export const createHealthRoutes = (): Router => {
  const router = Router();

  router.get('/health', async (_req: Request, res: Response) => {
    const checks = {
      api: 'ok',
      database: await checkDatabase(),
      rabbitmq: await checkRabbitMQ(),
    };

    const status = Object.values(checks).every((v) => v === 'ok') ? 200 : 503;

    res.status(status).json({
      status: status === 200 ? 'OK' : 'Degraded',
      checks,
      timestamp: new Date(),
    });
  });

  return router;
};

async function checkDatabase(): Promise<string> {
  try {
    if (mongoose.connection.readyState !== 1) {
      return 'error';
    }

    if (!mongoose.connection.db) {
      return 'error';
    }

    await mongoose.connection.db.admin().ping();

    return 'ok';
  } catch (error) {
    logger.error('Database health check failed:', error);

    return 'error';
  }
}

async function checkRabbitMQ(): Promise<string> {
  try {
    const conn = await connect(process.env.RABBITMQ_URL!);

    await conn.close();

    return 'ok';
  } catch (error) {
    logger.error('RabbitMQ health check failed:', error);

    return 'error';
  }
}
