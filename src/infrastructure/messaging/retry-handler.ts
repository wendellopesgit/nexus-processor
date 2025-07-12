/* eslint-disable @typescript-eslint/no-explicit-any */
import { IRetryHandler } from '@core/ports/messaging';
import { logger } from '@shared/utils/logger';
import { Channel } from 'amqplib';

export class RetryHandler implements IRetryHandler {
  private maxRetries: number;
  private initialDelay: number;
  private backoffFactor: number;
  private dlxExchange: string;

  constructor(
    maxRetries = 3,
    initialDelay = 1000,
    backoffFactor = 2,
    dlxExchange = 'dlx.exchange',
  ) {
    this.maxRetries = maxRetries;
    this.initialDelay = initialDelay;
    this.backoffFactor = backoffFactor;
    this.dlxExchange = dlxExchange;
  }

  async setup(channel: Channel): Promise<void> {
    try {
      const dlxQueue = 'dlx.queue';

      await channel.assertExchange(this.dlxExchange, 'direct', { durable: true });
      await channel.assertQueue(dlxQueue, { durable: true });
      await channel.bindQueue(dlxQueue, this.dlxExchange, '');

      logger.info(`Retry handler setup complete with DLX exchange ${this.dlxExchange}`);
    } catch (error) {
      logger.error('Error setting up retry handler:', error);

      throw error;
    }
  }

  async handleRetry(
    channel: Channel,
    msg: any,
    handler: () => Promise<void>,
    queueName: string,
  ): Promise<void> {
    try {
      await handler();

      channel.ack(msg);
    } catch (error) {
      logger.error('Error in message handler:', error);

      const retryCount = this.getRetryCount(msg) || 0;

      if (retryCount < this.maxRetries) {
        await this.retryMessage(channel, msg, queueName, retryCount);
      } else {
        await this.sendToDlx(channel, msg);
      }
    }
  }

  private async retryMessage(
    channel: Channel,
    msg: any,
    queueName: string,
    retryCount: number,
  ): Promise<void> {
    const retryQueue = `${queueName}.retry`;
    const delay = this.calculateDelay(retryCount);

    try {
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

      logger.warn(
        `Message requeued for retry ${retryCount + 1}/${this.maxRetries} with ${delay}ms delay`,
      );
    } catch (error) {
      logger.error('Error retrying message:', error);

      channel.nack(msg);
    }
  }

  private async sendToDlx(channel: Channel, msg: any): Promise<void> {
    try {
      channel.publish(this.dlxExchange, '', msg.content, {
        headers: msg.properties.headers,
      });

      channel.ack(msg);

      logger.error(`Message sent to DLX after ${this.maxRetries} retries`);
    } catch (error) {
      logger.error('Error sending message to DLX:', error);

      channel.nack(msg);
    }
  }

  private getRetryCount(msg: any): number {
    return msg.properties.headers?.['x-retry-count'] || 0;
  }

  private calculateDelay(retryCount: number): number {
    return this.initialDelay * Math.pow(this.backoffFactor, retryCount);
  }
}
