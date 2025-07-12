/* eslint-disable @typescript-eslint/no-explicit-any */
import { IObservable } from '@core/patterns/observer';
import { IProcessingStrategy } from '@core/patterns/strategy';
import { IOrderRepository } from '@core/repositories/order-repository';
import { logger } from '@shared/utils/logger';

export class ProcessOrderUseCase {
  constructor(
    private orderRepository: IOrderRepository,
    private eventBus: IObservable,
    private processingStrategy: IProcessingStrategy,
  ) {}

  async execute(order: any): Promise<void> {
    try {
      await this.orderRepository.updateOrderStatus(order.id, 'processing');

      await this.processingStrategy.process(order);

      await this.orderRepository.updateOrderStatus(order.id, 'completed');

      await this.eventBus.notify('order_processed', order);

      logger.info(`Order ${order.id} processed successfully`);
    } catch (error) {
      await this.orderRepository.updateOrderStatus(order.id, 'failed');

      logger.error(`Error processing order ${order.id}:`, error);

      throw error;
    }
  }
}
