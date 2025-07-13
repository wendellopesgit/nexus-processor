/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * DTO para itens do pedido
 */
export class OrderItemDto {
  constructor(
    public readonly productId: string,
    public readonly quantity: number,
    public readonly price: number,
  ) {}

  static create(data: any): { dto?: OrderItemDto; error?: string } {
    if (!data.productId || typeof data.productId !== 'string') {
      return { error: 'Invalid product ID' };
    }

    if (typeof data.quantity !== 'number' || data.quantity <= 0) {
      return { error: 'Invalid quantity' };
    }

    if (typeof data.price !== 'number' || data.price <= 0) {
      return { error: 'Invalid price' };
    }

    return {
      dto: new OrderItemDto(
        data.productId,
        Math.floor(data.quantity),
        parseFloat(data.price.toFixed(2)),
      ),
    };
  }
}

/**
 * DTO para resposta de pedidos
 */
export class OrderResponseDto {
  constructor(
    public readonly id: string,
    public readonly status: string,
    public readonly total: number,
    public readonly createdAt: Date,
  ) {}

  static fromDomain(order: any): OrderResponseDto {
    return new OrderResponseDto(order.id, order.status, order.total, order.createdAt);
  }
}
