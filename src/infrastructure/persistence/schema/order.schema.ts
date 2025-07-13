/* eslint-disable @typescript-eslint/no-explicit-any */
import { OrderStatus } from '@core/entities/order.entity';
import mongoose from 'mongoose';

export interface IOrderDocument extends mongoose.Document {
  id: string;
  customer: string;
  items: Array<{
    productId: string;
    quantity: number;
    price: number;
  }>;
  status: OrderStatus;
  total: number;
  createdAt: Date;
  updatedAt: Date;
}

export const orderSchema = new mongoose.Schema({
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
    enum: ['pending', 'processing', 'completed', 'failed', 'cancelled'],
    default: 'pending',
  },
  total: { type: Number, required: true, min: 0, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

orderSchema.pre<IOrderDocument>('save', function (next) {
  this.updatedAt = new Date();

  this.total = this.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  this.total = parseFloat(this.total.toFixed(2));

  next();
});
