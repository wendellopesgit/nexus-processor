/* eslint-disable @typescript-eslint/no-explicit-any */
import { logger } from '@shared/utils/logger';
import { Channel, ChannelModel, connect, ConsumeMessage } from 'amqplib';
import { IMessageConsumer } from 'core/ports/messaging';

class RabbitMQConsumer implements IMessageConsumer {
  private connection: ChannelModel | null = null;
  private channel: Channel | null = null;

  constructor(
    private queueName: string,
    private connectionUrl: string,
  ) {}

  async connect(): Promise<void> {
    try {
      this.connection = await connect(this.connectionUrl);
      this.channel = await this.connection.createChannel();

      await this.channel.assertQueue(this.queueName, { durable: true });

      logger.info(`Connected to RabbitMQ and listening to queue: ${this.queueName}`);
    } catch (error) {
      logger.error('Error connecting to RabbitMQ:', error);

      throw error;
    }
  }

  public getChannel(): Channel | null {
    return this.channel;
  }

  async consume(handler: (msg: any) => Promise<void>): Promise<void> {
    if (!this.channel) {
      throw new Error('Channel not initialized. Call connect() first.');
    }

    await this.channel.consume(
      this.queueName,
      async (msg: ConsumeMessage | null) => {
        try {
          if (msg) {
            await handler(msg);
            this.channel!.ack(msg);
          }
        } catch (err) {
          logger.error('Error processing message:', err);
          if (msg) {
            this.channel!.nack(msg, false, false);
          }
        }
      },
      { noAck: false },
    );
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
      logger.info('RabbitMQ connection closed');
    } catch (error) {
      logger.error('Error closing RabbitMQ connection:', error);
      throw error;
    }
  }
}

export default RabbitMQConsumer;
