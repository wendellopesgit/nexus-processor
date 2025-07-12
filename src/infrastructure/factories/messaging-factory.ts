import { IMessageProducer } from '@core/ports/messaging';
import { RabbitMQProducer } from '@infra/messaging/rabbitmq-producer';

export class MessagingFactory {
  static async createProducer(): Promise<IMessageProducer> {
    const producer = new RabbitMQProducer('orders_exchange', process.env.RABBITMQ_URL as string);

    await producer.connect();

    return producer;
  }
}
