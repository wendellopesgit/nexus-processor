import { Order } from '@core/entities/order.entity';
import { logger } from '@shared/utils/logger';
import { IProcessingStrategy } from './processing-strategy.interface';

/**
 * Estratégia de processamento em lote
 */
export class BatchProcessingStrategy implements IProcessingStrategy {
  private batch: Order[] = [];
  private readonly batchSize: number = parseInt(process.env.BATCH_SIZE || '10', 10);
  private readonly timeoutMs: number = parseInt(process.env.BATCH_TIMEOUT_MS || '5000', 10);
  private timeoutId: ReturnType<typeof setTimeout> | null = null;

  async process(order: Order): Promise<void> {
    this.batch.push(order);

    if (this.batch.length >= this.batchSize) {
      await this.processCurrentBatch();
    } else if (!this.timeoutId) {
      this.timeoutId = setTimeout(() => {
        this.processCurrentBatch().catch((error) => {
          logger.error('Error processing batch:', error);
        });
      }, this.timeoutMs);
    }
  }

  async processBatch(orders: Order[]): Promise<void> {
    logger.info(`Processing BATCH of ${orders.length} orders`);

    await Promise.all(
      orders.map((order) =>
        this.processOrder(order).catch((error) => {
          logger.error(`Error processing order ${order.id} in batch:`, error);
        }),
      ),
    );
  }

  private async processCurrentBatch(): Promise<void> {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);

      this.timeoutId = null;
    }

    if (this.batch.length === 0) return;

    const batchToProcess = [...this.batch];

    this.batch = [];

    await this.processBatch(batchToProcess);
  }

  // Incluído "setTimeout" para simular um processamento mais lento por sem em lote
  private async processOrder(order: Order): Promise<void> {
    logger.debug(`Processing order ${order.id} within batch`);

    await new Promise((resolve) => setTimeout(resolve, 200));
  }
}
