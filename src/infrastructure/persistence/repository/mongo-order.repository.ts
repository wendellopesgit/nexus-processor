import { Order, OrderStatus } from '@core/entities/order.entity';
import { IOrderRepository } from '@core/interfaces/repositories/order-repository.interface';
import { logger } from '@shared/utils/logger';
import mongoose, { Model } from 'mongoose';
import { IOrderDocument, orderSchema } from '../schema/order.schema';

export class MongoOrderRepository implements IOrderRepository {
  private model: Model<IOrderDocument>;

  constructor() {
    this.model = mongoose.model<IOrderDocument>('Order', orderSchema);
  }

  async save(order: Order): Promise<void> {
    try {
      const existingOrder = await this.model.findOne({ id: order.id }).exec();

      if (existingOrder) {
        await this.model
          .updateOne(
            { id: order.id },
            {
              $set: {
                ...order,
                updatedAt: new Date(),
              },
            },
          )
          .exec();

        logger.info(`Order ${order.id} updated in database`);
      } else {
        const newOrder = new this.model({
          ...order,
          status: 'pending',
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        await newOrder.save();

        logger.info(`Order ${order.id} saved to database`);
      }
    } catch (error) {
      logger.error(`Error saving order ${order.id}:`, error);

      throw error;
    }
  }

  async findById(id: string): Promise<Order | null> {
    try {
      const order = await this.model.findOne({ id }).lean().exec();

      if (!order) {
        logger.warn(`Order ${id} not found`);
        return null;
      }

      return order as Order;
    } catch (error) {
      logger.error(`Error finding order ${id}:`, error);

      throw error;
    }
  }

  async updateOrderStatus(id: string, status: OrderStatus): Promise<void> {
    try {
      const result = await this.model
        .updateOne(
          { id },
          {
            $set: {
              status,
              updatedAt: new Date(),
            },
          },
        )
        .exec();

      if (result.modifiedCount === 0) {
        logger.warn(`Order ${id} not found for status update`);

        throw new Error(`Order ${id} not found`);
      }

      logger.info(`Order ${id} status updated to ${status}`);
    } catch (error) {
      logger.error(`Error updating order ${id} status:`, error);

      throw error;
    }
  }

  async saveBatch(orders: Order[]): Promise<void> {
    try {
      const operations = orders.map((order) => ({
        updateOne: {
          filter: { id: order.id },
          update: {
            $set: {
              ...order,
              updatedAt: new Date(),
            },
          },
          upsert: true,
        },
      }));

      await this.model.bulkWrite(operations);

      logger.info(`Saved batch of ${orders.length} orders to database`);
    } catch (error) {
      logger.error('Error saving orders batch:', error);

      throw error;
    }
  }
}
