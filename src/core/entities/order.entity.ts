import { OrderItemDto } from '@application/dtos/order-item.dto';

export type OrderItem = {
  productId: string;
  quantity: number;
  price: number;
};

export type OrderStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';

export class Order {
  constructor(
    public readonly id: string,
    public readonly customer: string,
    public readonly items: OrderItem[],
    public status: OrderStatus = 'pending',
    public readonly createdAt: Date = new Date(),
    public updatedAt: Date = new Date(),
  ) {}

  static create({
    id,
    customer,
    items,
  }: {
    id?: string;
    customer: string;
    items: OrderItemDto[];
  }): Order {
    const orderId = id || `ord_${Date.now()}`;

    return new Order(
      orderId,
      customer,
      items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        price: item.price,
      })),
      'pending',
      new Date(),
      new Date(),
    );
  }
}
