/* eslint-disable @typescript-eslint/no-explicit-any */
import { IMessageConsumer } from '@core/interfaces/messaging/message-consumer.interface';
import { logger } from '@shared/utils/logger';
import { Channel, connect, ConsumeMessage } from 'amqplib';

export class RabbitMQConsumer implements IMessageConsumer {
  private connection: any;
  private channel: Channel | null = null;
  private isConnected = false;

  constructor(
    private readonly queueName: string,
    private readonly connectionUrl: string,
  ) {}

  async connect(): Promise<void> {
    if (this.isConnected) return;

    try {
      this.connection = await connect(this.connectionUrl);
      this.channel = await this.connection.createChannel();

      if (!this.channel) {
        throw new Error('[Consumer] Failed to create RabbitMQ channel');
      }

      let queueExists = false;
      try {
        await this.channel.checkQueue(this.queueName);

        queueExists = true;
      } catch (error) {
        queueExists = false;

        logger.error('Error details: ', error);
      }

      if (!queueExists) {
        await this.channel.assertQueue(this.queueName, {
          durable: true,
          deadLetterExchange: `${this.queueName}.dlx`,
        });
      } else {
        await this.channel.assertQueue(this.queueName, { durable: true });
      }

      const dlxExchange = `${this.queueName}.dlx`;

      await this.channel.assertExchange(dlxExchange, 'direct', { durable: true });
      await this.channel.assertQueue(`${this.queueName}.dlq`, { durable: true });
      await this.channel.bindQueue(`${this.queueName}.dlq`, dlxExchange, '');

      this.isConnected = true;

      logger.info(`RabbitMQ consumer connected to queue ${this.queueName}`);
    } catch (error) {
      logger.error('Failed to connect RabbitMQ consumer:', error);

      throw error;
    }
  }

  getChannel(): Channel {
    if (!this.channel) {
      throw new Error('[Consumer] Failed to create RabbitMQ channel');
    }

    return this.channel;
  }

  getQueueName(): string {
    return this.queueName;
  }

  async consume(handler: (msg: ConsumeMessage) => Promise<void>): Promise<void> {
    if (!this.channel) {
      throw new Error('Consumer not connected');
    }

    const consumeHandler = async (msg: ConsumeMessage | null) => {
      if (!msg) return;

      try {
        await handler(msg);
        this.channel!.ack(msg);
      } catch (error) {
        logger.error('Error processing message:', error);

        this.channel!.nack(msg, false, false);
      }
    };

    await this.channel.consume(this.queueName, consumeHandler, { noAck: false });
  }

  async close(): Promise<void> {
    try {
      if (this.channel) {
        await this.channel.close();

        this.channel = null;
      }

      if (this.connection) {
        await this.connection.close();

        this.connection = null;
      }

      this.isConnected = false;

      logger.info('RabbitMQ consumer disconnected');
    } catch (error) {
      logger.error('Error closing RabbitMQ consumer:', error);

      throw error;
    }
  }
}
