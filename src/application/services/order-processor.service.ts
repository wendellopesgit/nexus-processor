/* eslint-disable @typescript-eslint/no-explicit-any */
import { Order } from '@core/entities/order.entity';
import { IMessageConsumer } from '@core/interfaces/messaging/message-consumer.interface';
import { IRetryHandler } from '@core/interfaces/messaging/retry-handler.interface';
import { IOrderRepository } from '@core/interfaces/repositories/order-repository.interface';
import { IObservable } from '@core/patterns/observer/event-bus';
import { logger } from '@shared/utils/logger';

export class OrderProcessorService {
  constructor(
    private readonly eventBus: IObservable,
    private readonly orderRepository: IOrderRepository,
    private readonly consumer: IMessageConsumer,
    private readonly retryHandler: IRetryHandler,
  ) {}

  async execute() {
    await this.consumer.consume(async (msg: any) => {
      if (!msg) return;

      const channel = this.consumer.getChannel();

      try {
        const order = JSON.parse(msg.content.toString());

        await this.retryHandler.handleRetry(
          channel,
          msg,
          () => this.processOrder(order),
          this.consumer.getQueueName(),
        );
      } catch (error) {
        logger.error('Order processing failed:', error);

        channel.nack(msg, false, false);
      }
    });
  }

  private async processOrder(order: Order): Promise<void> {
    try {
      logger.info(`Starting processing for order ${order.id}`);

      await new Promise((resolve) => setTimeout(resolve, 5000));

      await this.orderRepository.updateOrderStatus(order.id, 'completed');

      logger.info(`Order: ${order.id} updated with success!`);

      await this.eventBus.notify('order_processed', order);

      logger.info('Order update status notified to others services!');
    } catch (error) {
      await this.orderRepository.updateOrderStatus(order.id, 'failed');

      logger.error(`Error processing order ${order.id}:`, error);

      throw error;
    }
  }
}
