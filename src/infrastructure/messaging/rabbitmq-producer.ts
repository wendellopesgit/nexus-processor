/* eslint-disable @typescript-eslint/no-explicit-any */
import { IMessageProducer } from '@core/ports/messaging';
import { logger } from '@shared/utils/logger';
import { Channel, ChannelModel, connect } from 'amqplib';

export class RabbitMQProducer implements IMessageProducer {
  private channel: Channel | null = null;
  private connection: ChannelModel | null = null;

  constructor(
    private exchangeName: string,
    private connectionUrl: string,
  ) {}

  async connect(): Promise<void> {
    try {
      const dlxName = `${this.exchangeName}.dlx`;

      this.connection = await connect(this.connectionUrl);
      this.channel = await this.connection.createChannel();

      await this.channel.assertExchange(this.exchangeName, 'direct', {
        durable: true,
      });

      await this.channel.assertExchange(dlxName, 'direct', { durable: true });

      logger.info(`Connected to RabbitMQ producer on exchange ${this.exchangeName}`);
    } catch (error) {
      logger.error('Error connecting RabbitMQ producer:', error);
      throw error;
    }
  }

  async publish(routingKey: string, message: any): Promise<void> {
    if (!this.channel) {
      throw new Error('Channel not initialized. Call connect() first.');
    }

    const maxRetries = 3;

    const retryDelay = (attempt: number) => Math.pow(2, attempt) * 1000;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const messageBuffer = Buffer.from(JSON.stringify(message));
        const sent = this.channel.publish(this.exchangeName, routingKey, messageBuffer, {
          persistent: true,
        });

        if (sent) {
          logger.debug(`Message published to ${this.exchangeName} with routing key ${routingKey}`);

          return;
        } else {
          logger.warn(`Message not published to ${this.exchangeName} (backpressure)`);

          throw new Error('Failed to publish message due to backpressure');
        }
      } catch (error) {
        if (attempt < maxRetries) {
          logger.warn(`Retrying message publish (attempt ${attempt + 1}/${maxRetries})...`);

          await new Promise((resolve) => setTimeout(resolve, retryDelay(attempt)));
        } else {
          logger.error(
            'Message failed after maximum retries. Sending to Dead Letter Queue.',
            error,
          );

          this.channel.publish(
            `${this.exchangeName}.dlx`,
            routingKey,
            Buffer.from(JSON.stringify(message)),
            {
              persistent: true,
            },
          );

          throw error;
        }
      }
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
      logger.info('RabbitMQ producer connection closed');
    } catch (error) {
      logger.error('Error closing RabbitMQ producer connection:', error);
      throw error;
    }
  }
}
