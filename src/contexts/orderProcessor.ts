/* eslint-disable @typescript-eslint/no-explicit-any */
import RabbitMQConsumer from '@rabbitmq/consumer';
import RetryHandler from '@rabbitmq/retryHandler';
import { logger } from '@utils/logger';
import BatchProcessor from '@workers/batchProcessor';

class OrderProcessor {
  private consumer: RabbitMQConsumer;
  private batchProcessor: BatchProcessor;
  private retryHandler: RetryHandler;

  constructor() {
    this.consumer = new RabbitMQConsumer('orders');
    this.batchProcessor = new BatchProcessor('order-reports');
    this.retryHandler = new RetryHandler();
  }

  async start() {
    try {
      await this.consumer.connect();
      await this.consumer.consume(async (msg) => {
        if (!msg) return;

        await this.retryHandler.handleRetry(
          this.consumer['channel']!,
          msg,
          async () => {
            const order = JSON.parse(msg.content.toString());
            logger.info(`Processing order ${order.id}`);

            await this.processOrder(order);

            await this.batchProcessor.addToBatch({
              type: 'order',
              item: order,
              timestamp: new Date(),
            });
          },
          'orders',
        );
      });
    } catch (error) {
      logger.error('Error in OrderProcessor:', error);
      process.exit(1);
    }
  }

  private async processOrder(order: any) {
    await new Promise((resolve) => setTimeout(resolve, 200));
    if (Math.random() < 0.1) {
      throw new Error('Random processing error');
    }
    logger.info(`Order ${order.id} processed successfully`);
  }
}

export default OrderProcessor;
