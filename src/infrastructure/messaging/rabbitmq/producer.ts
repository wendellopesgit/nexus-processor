/* eslint-disable @typescript-eslint/no-explicit-any */
import { IMessageProducer } from '@core/interfaces/messaging/message-producer.interface';
import { logger } from '@shared/utils/logger';
import { Channel, connect } from 'amqplib';

export class RabbitMQProducer implements IMessageProducer {
  private channel: Channel | null = null;
  private connection: any;
  private isConnected = false;

  private readonly maxRetries: number = 3;
  private readonly initialDelay: number = 1000;

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
        throw new Error('[Producer] Failed to create RabbitMQ channel');
      }

      await this.channel.assertExchange('orders', 'direct', { durable: true });
      await this.channel.assertQueue('orders', { durable: true });
      await this.channel.bindQueue('orders', 'orders', 'order.new');

      await this.channel.assertExchange('orders.dlx', 'direct', { durable: true });
      await this.channel.assertQueue('orders.dlq', { durable: true });
      await this.channel.bindQueue('orders.dlq', 'orders.dlx', '');

      this.isConnected = true;

      logger.info(`RabbitMQ producer connected and routing configured`);
    } catch (error) {
      logger.error('Failed to connect RabbitMQ producer:', error);
      throw error;
    }
  }

  async publish(routingKey: string, message: unknown): Promise<void> {
    if (!this.channel) {
      throw new Error('Producer not connected');
    }

    const messageBuffer = Buffer.from(JSON.stringify(message));

    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      try {
        const published = this.channel.publish(this.queueName, routingKey, messageBuffer, {
          persistent: true,
        });

        if (!published) {
          throw new Error('Message not published due to backpressure');
        }

        logger.debug(`Message published to ${routingKey}`);

        return;
      } catch (error) {
        logger.warn(`Publish attempt ${attempt + 1} failed:`, error);

        if (attempt < this.maxRetries - 1) {
          await new Promise((resolve) =>
            setTimeout(resolve, this.initialDelay * Math.pow(2, attempt)),
          );

          continue;
        }

        await this.sendToDlx(routingKey, messageBuffer);

        throw error;
      }
    }
  }

  private async sendToDlx(routingKey: string, message: Buffer): Promise<void> {
    if (!this.channel) return;

    try {
      const dlxExchange = `${this.queueName}.dlx`;

      this.channel.publish(dlxExchange, routingKey, message, {
        persistent: true,
      });

      logger.error(`Message sent to DLX ${dlxExchange}`);
    } catch (error) {
      logger.error('Failed to send message to DLX:', error);

      throw error;
    }
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

      logger.info('RabbitMQ producer disconnected');
    } catch (error) {
      logger.error('Error closing RabbitMQ producer:', error);

      throw error;
    }
  }
}
