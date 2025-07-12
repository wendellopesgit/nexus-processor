import { EventBus, InventoryObserver, OrderStatusObserver } from '@core/patterns/observer';
import {
  BatchProcessingStrategy,
  IProcessingStrategy,
  PriorityProcessingStrategy,
  StandardProcessingStrategy,
} from '@core/patterns/strategy';
import { ProcessOrderUseCase } from '@core/use-cases/process-order';
import { OrderController } from '@infra/controllers/order-controller';
import { OrderProcessor } from '@infra/controllers/order-processor';
import { MessagingFactory } from '@infra/factories/messaging-factory';
import RabbitMQConsumer from '@infra/messaging/rabbitmq-consumer';
import { RabbitMQProducer } from '@infra/messaging/rabbitmq-producer';
import { RetryHandler } from '@infra/messaging/retry-handler';
import { MongoOrderRepository } from '@infra/persistence/mongo-order-repository';
import { Server } from '@interfaces/server';
import { logger } from '@shared/utils/logger';
import mongoose from 'mongoose';

export class Container {
  private static eventBus: EventBus;
  private static producer: RabbitMQProducer;
  private static orderRepository: MongoOrderRepository;

  static async initialize(): Promise<void> {
    this.eventBus = new EventBus();
    this.orderRepository = new MongoOrderRepository();

    this.producer = new RabbitMQProducer('orders_exchange', process.env.RABBITMQ_URL as string);

    await this.producer.connect();

    this.eventBus.subscribe('order_processed', new OrderStatusObserver());
    this.eventBus.subscribe('order_processed', new InventoryObserver());

    try {
      await mongoose.connect(process.env.MONGO_URL as string);

      logger.info('Connected to MongoDB');
    } catch (error) {
      logger.error('MongoDB connection error:', error);

      throw error;
    }
  }

  static createOrderProcessor(): OrderProcessor {
    const consumer = new RabbitMQConsumer('orders', process.env.RABBITMQ_URL!);
    const retryHandler = new RetryHandler();

    const strategy = this.getProcessingStrategy();

    const processOrderUseCase = new ProcessOrderUseCase(
      this.orderRepository,
      this.eventBus,
      strategy,
    );

    return new OrderProcessor(consumer, retryHandler, processOrderUseCase, 'orders');
  }

  static createServer(): Server {
    return new Server(Number(process.env.PORT || 3000));
  }

  static async getOrderController(): Promise<OrderController> {
    const producer = await MessagingFactory.createProducer();

    return new OrderController(producer);
  }

  private static getProcessingStrategy(): IProcessingStrategy {
    const strategyType = process.env.PROCESSING_STRATEGY || 'standard';

    switch (strategyType) {
      case 'priority':
        return new PriorityProcessingStrategy();
      case 'batch':
        return new BatchProcessingStrategy();
      default:
        return new StandardProcessingStrategy();
    }
  }
}
