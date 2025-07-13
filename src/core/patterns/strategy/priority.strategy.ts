import { Order } from '@core/entities/order.entity';
import { logger } from '@shared/utils/logger';
import { IProcessingStrategy } from './processing-strategy.interface';

/**
 * Estratégia de processamento prioritário único
 */
export class PriorityProcessingStrategy implements IProcessingStrategy {
  async process(order: Order): Promise<void> {
    logger.info(`Processing order ${order.id} with PRIORITY strategy`);

    await this.handlePriorityFeatures(order);
  }

  private async handlePriorityFeatures(order: Order): Promise<void> {
    logger.debug(`Applying priority features to order ${order.id}`);
  }
}
