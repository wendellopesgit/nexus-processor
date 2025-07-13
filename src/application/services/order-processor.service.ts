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
      const order = JSON.parse(msg.content.toString());

      try {
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

      // simula a leitura e processamento da fila
      // await new Promise((resolve) => setTimeout(resolve, 5000));

      await this.orderRepository.updateOrderStatus(order.id, 'completed');

      logger.info(`Order: ${order.id} updated with success!`);

      await this.eventBus.notify('order_processed', order);
    } catch (error) {
      if (error instanceof Error) {
        const errorMessage = `Order processing failed for order ${order.id}: ${error.message}`;

        logger.error(errorMessage, error);
      }

      await this.orderRepository.updateOrderStatus(order.id, 'failed');

      throw error;
    }
  }
}
