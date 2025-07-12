/* eslint-disable @typescript-eslint/no-explicit-any */
import { logger } from '@shared/utils/logger';

export interface IProcessingStrategy {
  process(order: any): Promise<void>;
}

export class StandardProcessingStrategy implements IProcessingStrategy {
  async process(order: any): Promise<void> {
    logger.info(`Processing order ${order.id} with standard strategy`);

    await new Promise((resolve) => setTimeout(resolve, 100));
  }
}

export class PriorityProcessingStrategy implements IProcessingStrategy {
  async process(order: any): Promise<void> {
    logger.info(`Processing order ${order.id} with priority strategy`);

    await new Promise((resolve) => setTimeout(resolve, 50));
  }
}

export class BatchProcessingStrategy implements IProcessingStrategy {
  private batch: any[] = [];
  private batchSize = 10;
  private timeout = 5000;
  private timer: ReturnType<typeof setTimeout> | null = null;

  async process(order: any): Promise<void> {
    this.batch.push(order);

    logger.info(`Added order ${order.id} to batch (${this.batch.length}/${this.batchSize})`);

    if (this.batch.length >= this.batchSize) {
      await this.processBatch();
    } else if (!this.timer) {
      this.timer = setTimeout(() => this.processBatch(), this.timeout);
    }
  }

  private async processBatch(): Promise<void> {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }

    if (this.batch.length === 0) return;

    const batchToProcess = [...this.batch];

    this.batch = [];

    logger.info(`Processing batch of ${batchToProcess.length} orders`);

    await new Promise((resolve) => setTimeout(resolve, 100 * batchToProcess.length));

    logger.info(`Batch processing completed for ${batchToProcess.length} orders`);
  }
}
