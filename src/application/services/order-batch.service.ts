/* eslint-disable @typescript-eslint/no-explicit-any */
import { OrderBatchDto } from '@application/dtos/order-batch.dto';
import { Order } from '@core/entities/order.entity';
import { IMessageProducer } from '@core/interfaces/messaging/message-producer.interface';
import { IOrderRepository } from '@core/interfaces/repositories/order-repository.interface';
import { logger } from '@shared/utils/logger';

export class OrderBatchService {
  private readonly BATCH_SIZE = 10;

  constructor(
    private readonly orderRepository: IOrderRepository,
    private readonly messageProducer: IMessageProducer,
  ) {}

  async processBatch(batchDto: OrderBatchDto): Promise<{ batchId: string; orderIds: string[] }> {
    const batchId = `batch_${Date.now()}`;
    const orderIds: string[] = [];

    try {
      logger.info(`Starting batch processing for batch ${batchId}`);

      for (let i = 0; i < batchDto.orders.length; i += this.BATCH_SIZE) {
        const subBatch = batchDto.orders.slice(i, i + this.BATCH_SIZE);

        await this.processSubBatch(batchDto.customer, subBatch, orderIds);
      }

      logger.info(`Batch ${batchId} processed successfully with ${orderIds.length} orders`);

      return { batchId, orderIds };
    } catch (error) {
      logger.error(`Failed to process batch ${batchId}:`, error);

      throw error;
    }
  }

  private async processSubBatch(
    customer: string,
    subBatch: Array<{ items: any[] }>,
    orderIds: string[],
  ): Promise<void> {
    const controller = new AbortController();
    const { signal } = controller;

    const timeout = setTimeout(
      () => controller.abort(new Error('Batch processing timeout')),
      Number(process.env.BATCH_TIMEOUT_MS),
    );

    try {
      const orders: Order[] = [];

      for (const orderData of subBatch) {
        if (signal.aborted) {
          throw signal.reason;
        }

        const order = Order.create({
          customer,
          items: orderData.items,
        });

        orders.push(order);
        orderIds.push(order.id);
      }

      await this.saveOrdersBatch(orders);
      await this.publishOrdersBatch(orders);
    } finally {
      clearTimeout(timeout);
    }
  }

  private async saveOrdersBatch(orders: Order[]): Promise<void> {
    try {
      await this.orderRepository.saveBatch(orders);

      logger.info(`Saved batch of ${orders.length} orders to database`);
    } catch (error) {
      logger.error('Failed to save orders batch:', error);

      throw error;
    }
  }

  private async publishOrdersBatch(orders: Order[]): Promise<void> {
    try {
      await this.messageProducer.connect();

      for (const order of orders) {
        await this.messageProducer.publish('order.new', order);
      }

      logger.info(`Published batch of ${orders.length} orders to RabbitMQ`);
    } catch (error) {
      logger.error('Failed to publish orders batch:', error);

      throw error;
    }
  }
}
