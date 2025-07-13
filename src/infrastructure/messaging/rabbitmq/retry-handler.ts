import { IRetryHandler } from '@core/interfaces/messaging/retry-handler.interface';
import { logger } from '@shared/utils/logger';
import { Channel, Message } from 'amqplib';

export class RabbitMQRetryHandler implements IRetryHandler {
  private readonly maxRetries: number;
  private readonly initialDelay: number;
  private readonly backoffFactor: number;

  constructor(
    maxRetries: number = parseInt(process.env.RETRY_MAX_ATTEMPTS || '3', 10),
    initialDelay: number = parseInt(process.env.RETRY_INITIAL_DELAY_MS || '1000', 10),
    backoffFactor: number = parseInt(process.env.RETRY_BACKOFF_FACTOR || '2', 10),
  ) {
    this.maxRetries = maxRetries;
    this.initialDelay = initialDelay;
    this.backoffFactor = backoffFactor;
  }

  async setup(channel: Channel): Promise<void> {
    try {
      const dlxExchange = 'global.dlx';
      await channel.assertExchange(dlxExchange, 'direct', { durable: true });
      await channel.assertQueue('global.dlq', { durable: true });
      await channel.bindQueue('global.dlq', dlxExchange, '');

      logger.info('Retry handler setup completed');
    } catch (error) {
      logger.error('Error setting up retry handler:', error);
      throw error;
    }
  }

  async handleRetry(
    channel: Channel,
    msg: Message,
    handler: () => Promise<void>,
    queueName: string,
  ): Promise<void> {
    try {
      await handler();
    } catch (error) {
      logger.error(`Error processing message from queue ${queueName}:`, error);

      const retryCount = this.getRetryCount(msg);

      if (retryCount >= this.maxRetries) {
        await this.sendToDlx(channel, msg);
        logger.error(`Max retries (${this.maxRetries}) reached for message`);
        return;
      }

      await this.retryMessage(channel, msg, queueName, retryCount);
      logger.warn(`Message requeued for retry (${retryCount + 1}/${this.maxRetries})`);
    }
  }

  private async retryMessage(
    channel: Channel,
    msg: Message,
    queueName: string,
    retryCount: number,
  ): Promise<void> {
    const retryQueue = `${queueName}.retry`;
    const delay = this.calculateDelay(retryCount);

    await channel.assertQueue(retryQueue, {
      durable: true,
      deadLetterExchange: '',
      deadLetterRoutingKey: queueName,
      messageTtl: delay,
    });

    channel.sendToQueue(retryQueue, msg.content, {
      headers: {
        ...msg.properties.headers,
        'x-retry-count': retryCount + 1,
        'x-original-queue': queueName,
      },
    });

    channel.ack(msg);
  }

  private async sendToDlx(channel: Channel, msg: Message): Promise<void> {
    try {
      channel.publish('global.dlx', '', msg.content, {
        headers: msg.properties.headers,
      });
      channel.ack(msg);
    } catch (error) {
      logger.error('Failed to send message to DLX:', error);
      channel.nack(msg, false, false);
      throw error;
    }
  }

  private getRetryCount(msg: Message): number {
    return msg.properties.headers?.['x-retry-count'] || 0;
  }

  private calculateDelay(retryCount: number): number {
    return this.initialDelay * Math.pow(this.backoffFactor, retryCount);
  }
}
