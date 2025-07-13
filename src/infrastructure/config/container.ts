import { OrderProcessorService } from '@application/services/order-processor.service';
import { OrderService } from '@application/services/order.service';
import { CustomNotifierObserver } from '@core/patterns/observer/customer-notifier.observer';
import { EventBus } from '@core/patterns/observer/event-bus';
import { InventoryObserver } from '@core/patterns/observer/inventory.observer';
import { RabbitMQConsumer } from '@infrastructure/messaging/rabbitmq/consumer';
import { RabbitMQProducer } from '@infrastructure/messaging/rabbitmq/producer';
import { RabbitMQRetryHandler } from '@infrastructure/messaging/rabbitmq/retry-handler';
import { MongoOrderRepository } from '@infrastructure/persistence/repository/mongo-order.repository';
import { ExpressServer } from '@infrastructure/server/express/server';
import { logger } from '@shared/utils/logger';
import mongoose from 'mongoose';

export class ContainerApplication {
  private static eventBus: EventBus;
  private static producer: RabbitMQProducer;
  private static orderRepository: MongoOrderRepository;

  static async initialize(): Promise<void> {
    this.producer = new RabbitMQProducer('orders', process.env.RABBITMQ_URL as string);
    this.orderRepository = new MongoOrderRepository();

    await this.producer.connect();

    // Inicialização do EventBus (Para eventos dentro da aplicação)
    this.eventBus = new EventBus();

    // Inscrição de observers no EventBus para escutar atualização dos pedidos
    this.eventBus.subscribe('order_processed', new CustomNotifierObserver());
    this.eventBus.subscribe('order_processed', new InventoryObserver());

    try {
      await mongoose.connect(process.env.MONGO_URL as string);

      logger.info('Connected to MongoDB');
    } catch (error) {
      logger.error('MongoDB connection error:', error);

      throw error;
    }
  }

  static async createOrderProcessor(): Promise<void> {
    const consumer = new RabbitMQConsumer('orders', process.env.RABBITMQ_URL!);

    await consumer.connect();

    const channel = consumer.getChannel();

    if (!channel) {
      throw new Error('Failed to get channel from consumer');
    }

    const retryHandler = new RabbitMQRetryHandler();

    await retryHandler.setup(channel);

    const orderProcessor = new OrderProcessorService(
      this.eventBus,
      this.orderRepository,
      consumer,
      retryHandler,
    );

    orderProcessor.execute();
  }

  static getOrderService(): OrderService {
    const producer = new RabbitMQProducer('orders', process.env.RABBITMQ_URL as string);

    return new OrderService(this.orderRepository, producer);
  }

  static createServer(): ExpressServer {
    const orderController = this.getOrderService();

    return new ExpressServer(orderController);
  }
}
