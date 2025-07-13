import { OrderService } from '@application/services/order.service';
import { logger } from '@shared/utils/logger';
import express from 'express';
import { errorHandler, notFoundHandler } from './middlewares/error.middleware';
import { loggingMiddleware } from './middlewares/logging.middleware';
import { createHealthRoutes } from './routes/health.routes';
import { createOrderRoutes } from './routes/order.routes';

export class ExpressServer {
  private app: express.Application;
  private port: number;

  constructor(private readonly orderService: OrderService) {
    this.app = express();
    this.port = Number(process.env.PORT || 3000);

    this.setupMiddlewares();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  private setupRoutes(): void {
    this.app.use('/api', createHealthRoutes());
    this.app.use('/api', createOrderRoutes(this.orderService));
  }

  private setupMiddlewares(): void {
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
    this.app.use(loggingMiddleware);
  }

  private setupErrorHandling(): void {
    this.app.use(notFoundHandler);
    this.app.use(errorHandler);
  }

  start(): void {
    this.app.listen(this.port, () => {
      logger.info(`Server running on port ${this.port}`);
    });
  }
}
