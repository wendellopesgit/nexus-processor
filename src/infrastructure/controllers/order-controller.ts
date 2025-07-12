import { IMessageProducer } from '@core/ports/messaging';
import { IOrderRepository } from '@core/repositories/order-repository';
import { logger } from '@shared/utils/logger';
import { Request, Response } from 'express';

export class OrderController {
  private isProducerReady: boolean = false;
  private connectionAttempts: number = 0;
  private readonly maxConnectionAttempts: number = 3;

  constructor(
    private messageProducer: IMessageProducer,
    private orderRepository: IOrderRepository,
  ) {
    this.initializeProducer();
  }

  private async initializeProducer(): Promise<void> {
    try {
      if (this.isProducerReady) return;

      logger.info('Initializing RabbitMQ producer connection...');

      await this.messageProducer.connect();

      this.isProducerReady = true;
      this.connectionAttempts = 0;

      logger.info('RabbitMQ producer connected successfully');
    } catch (error) {
      this.connectionAttempts++;

      logger.error(`Failed to connect to RabbitMQ (attempt ${this.connectionAttempts}):`, error);

      if (this.connectionAttempts < this.maxConnectionAttempts) {
        const delay = Math.pow(2, this.connectionAttempts) * 1000;

        setTimeout(() => this.initializeProducer(), delay);
      }
    }
  }

  async createOrder(req: Request, res: Response): Promise<void> {
    try {
      const order = req.body;

      if (!order.id || !order.items || order.items.length === 0) {
        res.status(400).json({ error: 'Invalid order data' });
        return;
      }

      if (!this.isProducerReady) {
        throw new Error('Message producer is not ready. Please try again later.');
      }

      logger.info(`Received new order ${order.id}`);

      await this.messageProducer.publish('orders', order);

      res.status(202).json({
        message: 'Order received and being processed',
        orderId: order.id,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      logger.error('Error creating order:', error);

      if (errorMessage.includes('not ready') || errorMessage.includes('not initialized')) {
        this.isProducerReady = false;

        await this.initializeProducer();

        res.status(503).json({
          error: 'Service temporarily unavailable. Please try again shortly.',
          retryAfter: '5s',
        });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  }

  async getOrderStatus(req: Request, res: Response): Promise<void> {
    try {
      const order = await this.orderRepository.findById(req.params.id);

      if (!order) {
        res.status(404).json({ error: 'Order not found' });
        return;
      }

      res.status(200).json({ orderId: order.id, status: order.status });
    } catch (error) {
      logger.error('Error getting order status:', error);

      res.status(500).json({ error: 'Internal server error' });
    }
  }
}
