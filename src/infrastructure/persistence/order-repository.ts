/* eslint-disable @typescript-eslint/no-explicit-any */
import { IOrderRepository } from '@core/repositories/order-repository';
import { logger } from '@shared/utils/logger';
import mongoose, { Model } from 'mongoose';

interface IOrderDocument extends mongoose.Document {
  id: string;
  customer: string;
  items: Array<{
    productId: string;
    quantity: number;
    price: number;
  }>;
  status: string;
  total: number;
  createdAt: Date;
  updatedAt: Date;
}

const orderSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true, index: true },
  customer: { type: String, required: true },
  items: {
    type: [
      {
        productId: { type: String, required: true },
        quantity: { type: Number, required: true, min: 1 },
        price: { type: Number, required: true, min: 0 },
      },
    ],
    required: true,
    validate: [(val: Array<any>) => val.length > 0, 'At least one item is required'],
  },
  status: {
    type: String,
    required: true,
    enum: ['pending', 'processing', 'completed', 'cancelled'],
    default: 'pending',
  },
  total: { type: Number, required: true, min: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

orderSchema.pre<IOrderDocument>('save', function (next) {
  this.updatedAt = new Date();

  if (this.isModified('items')) {
    this.total = this.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }

  next();
});

export class MongoOrderRepository implements IOrderRepository {
  private model: Model<IOrderDocument>;

  constructor() {
    this.model = mongoose.model<IOrderDocument>('Order', orderSchema);
  }

  async save(order: any): Promise<void> {
    try {
      const existingOrder = await this.model.findOne({ id: order.id }).exec();

      if (existingOrder) {
        await this.model.updateOne({ id: order.id }, order).exec();

        logger.info(`Order ${order.id} updated in database`);
      } else {
        const newOrder = new this.model(order);

        await newOrder.save();

        logger.info(`Order ${order.id} saved to database`);
      }
    } catch (error) {
      logger.error(`Error saving order ${order.id}:`, error);

      throw error;
    }
  }

  async findById(id: string): Promise<any> {
    try {
      const order = await this.model.findOne({ id }).lean().exec();

      return order;
    } catch (error) {
      logger.error(`Error finding order ${id}:`, error);

      throw error;
    }
  }

  async updateOrderStatus(id: string, status: string): Promise<void> {
    try {
      await this.model.updateOne({ id }, { $set: { status, updatedAt: new Date() } }).exec();

      logger.info(`Order ${id} status updated to ${status}`);
    } catch (error) {
      logger.error(`Error updating order ${id} status:`, error);

      throw error;
    }
  }

  async listOrdersByStatus(status: string): Promise<any[]> {
    try {
      return await this.model.find({ status }).lean().exec();
    } catch (error) {
      logger.error(`Error listing orders with status ${status}:`, error);

      throw error;
    }
  }
}
