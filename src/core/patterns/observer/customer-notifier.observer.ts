import { Order } from '@core/entities/order.entity';
import { logger } from '@shared/utils/logger';
import { IObserver } from './event-bus';

/**
 * Observer notificar o cliente sobre o status do pedido
 */
export class CustomNotifierObserver implements IObserver<Order> {
  async update(event: string, order: Order): Promise<void> {
    if (event === 'order_processed') {
      this.notifyCustomer(order);

      logger.info(`Order ${order.id} status updated to ${order.status}`);
    }
  }

  private notifyCustomer(order: Order): void {
    logger.info(`Hello ${order.customer}, we have received your order ${order.id}, news soon!`);
  }
}
