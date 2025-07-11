import { logger } from '@utils/logger';
import { ChannelModel, ConfirmChannel, connect, ConsumeMessage } from 'amqplib';

class RabbitMQConsumer {
  private connection: ChannelModel | null = null;
  private channel: ConfirmChannel | null = null;

  constructor(private queueName: string) {}

  async connect(): Promise<void> {
    try {
      this.connection = await connect(process.env.RABBITMQ_URL as string);
      this.channel = await this.connection.createConfirmChannel();

      await this.channel.assertQueue(this.queueName, { durable: true });

      logger.info(`Connected to RabbitMQ and listening to queue: ${this.queueName}`);
    } catch (error) {
      logger.error('Error connecting to RabbitMQ:', error);
      throw error;
    }
  }

  async consume(handler: (msg: ConsumeMessage | null) => Promise<void>): Promise<void> {
    if (!this.channel) {
      throw new Error('Channel not initialized. Call connect() first.');
    }

    await this.channel.consume(
      this.queueName,
      async (msg) => {
        try {
          await handler(msg);
          if (msg && this.channel) {
            this.channel.ack(msg);
          }
        } catch (err) {
          logger.error('Error processing message:', err);
          if (msg && this.channel) {
            this.channel.nack(msg);
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
