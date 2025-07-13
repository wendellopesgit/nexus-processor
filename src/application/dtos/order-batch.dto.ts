/* eslint-disable @typescript-eslint/no-explicit-any */
import { OrderItemDto } from './order-item.dto';

export class OrderBatchDto {
  constructor(
    public readonly customer: string,
    public readonly orders: Array<{
      items: OrderItemDto[];
    }>,
  ) {}

  static create(data: any): { dto?: OrderBatchDto; error?: string } {
    if (!data.customer || typeof data.customer !== 'string') {
      return { error: 'Invalid customer' };
    }

    if (!Array.isArray(data.orders)) {
      return { error: 'Orders must be an array' };
    }

    const validatedOrders = [];

    for (const order of data.orders) {
      if (!Array.isArray(order.items)) {
        return { error: 'Each order must contain an items array' };
      }

      const validatedItems = [];

      for (const item of order.items) {
        const { dto: itemDto, error } = OrderItemDto.create(item);

        if (error) {
          return { error: `Invalid item in order: ${error}` };
        }

        validatedItems.push(itemDto!);
      }

      validatedOrders.push({ items: validatedItems });
    }

    return {
      dto: new OrderBatchDto(data.customer, validatedOrders),
    };
  }
}
