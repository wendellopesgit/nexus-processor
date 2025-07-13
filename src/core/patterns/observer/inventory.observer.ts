import { Order, OrderItem } from '@core/entities/order.entity';
import { logger } from '@shared/utils/logger';
import { IObserver } from './event-bus';

/**
 * Observer para a simulação de atualização de estoque
 */
export class InventoryObserver implements IObserver<Order> {
  async update(event: string, order: Order): Promise<void> {
    if (event === 'order_processed') {
      await this.updateStockLevels(order.items);

      logger.info(`Updating inventory for order ${order.id}`);
    }
  }

  private async updateStockLevels(items: OrderItem[]): Promise<void> {
    logger.debug('Updating stock levels for items:', items);
  }
}
