/* eslint-disable @typescript-eslint/no-explicit-any */
import { logger } from '@shared/utils/logger';
import mongoose from 'mongoose';
import { IOrderRepository } from '../../core/repositories/order-repository';

const orderSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  customer: { type: String, required: true },
  items: { type: Array, required: true },
  status: { type: String, default: 'pending' },
  createdAt: { type: Date, default: Date.now },
});

const OrderModel = mongoose.model('Order', orderSchema);

export class MongoOrderRepository implements IOrderRepository {
  async save(order: any): Promise<void> {
    try {
      const newOrder = new OrderModel(order);

      await newOrder.save();

      logger.info(`Order ${order.id} saved to database`);
    } catch (error) {
      logger.error(`Error saving order ${order.id}:`, error);

      throw error;
    }
  }

  async findById(id: string): Promise<any> {
    return OrderModel.findOne({ id }).exec();
  }

  async updateOrderStatus(id: string, status: string): Promise<void> {
    await OrderModel.updateOne({ id }, { status }).exec();
  }
}
