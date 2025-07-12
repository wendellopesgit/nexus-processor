import healthRoutes from '@interfaces/routes/health-routes';
import orderRoutes from '@interfaces/routes/order-routes';
import { logger } from '@shared/utils/logger';
import express from 'express';

export class Server {
  private app: express.Application;
  private port: number;

  constructor(port: number = 3000) {
    this.app = express();
    this.port = port;

    this.configureMiddleware();
    this.configureRoutes();
  }

  private configureMiddleware(): void {
    this.app.use(express.json());
    this.app.use((req, _res, next) => {
      logger.info(`${req.method} ${req.path}`);
      next();
    });
  }

  private configureRoutes(): void {
    this.app.use('/api', orderRoutes);
    this.app.use('/api', healthRoutes);
  }

  start(): void {
    this.app.listen(this.port, () => {
      logger.info(`Server running on port ${this.port}`);
    });
  }
}
