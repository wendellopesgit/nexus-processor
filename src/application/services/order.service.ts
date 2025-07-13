import { OrderResponseDto } from '@application/dtos/order-item.dto';
import { Order } from '@core/entities/order.entity';
import { IMessageProducer } from '@core/interfaces/messaging/message-producer.interface';
import { IOrderRepository } from '@core/interfaces/repositories/order-repository.interface';
import { CreateOrderDto } from '@shared/types/order.type';
import { logger } from '@shared/utils/logger';

export class OrderService {
  constructor(
    private readonly orderRepository: IOrderRepository,
    private readonly messageProducer: IMessageProducer,
  ) {}

  async newOrder(createDto: CreateOrderDto): Promise<string> {
    try {
      if (createDto.items.length > 10) {
        throw new Error('Maximum of 10 items per order exceeded');
      }

      const order = Order.create({
        id: createDto?.id || this.generateOrderId(),
        customer: createDto.customer,
        items: createDto.items,
      });

      await this.orderRepository.save(order);

      logger.info('Order saved on database!');

      await this.messageProducer.connect();
      await this.messageProducer.publish('order.new', order);

      logger.info('Order delivered with success!');

      return order.id;
    } catch (error) {
      logger.error('Order creation failed:', error);

      throw error;
    }
  }

  async orderProcessor(createDto: CreateOrderDto): Promise<OrderResponseDto> {
    try {
      if (createDto.items.length > 10) {
        throw new Error('Maximum of 10 items per order exceeded');
      }

      const order = Order.create({
        id: createDto?.id || this.generateOrderId(),
        customer: createDto.customer,
        items: createDto.items,
      });

      await this.orderRepository.save(order);

      await this.messageProducer.publish('order_created', {
        orderId: order.id,
        customer: order.customer,
        total: order.items.reduce((sum, item) => sum + item.price * item.quantity, 0),
      });

      return OrderResponseDto.fromDomain(order);
    } catch (error) {
      logger.error('Order creation failed:', error);

      throw error;
    }
  }

  async getOrderById(id: string): Promise<OrderResponseDto> {
    const order = await this.orderRepository.findById(id);

    if (!order) {
      throw new Error('Order not found');
    }

    return OrderResponseDto.fromDomain(order);
  }

  private generateOrderId(): string {
    return `ord_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  }
}
