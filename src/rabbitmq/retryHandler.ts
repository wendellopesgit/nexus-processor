import { logger } from '@utils/logger';
import amqp from 'amqplib';

class RetryHandler {
  private maxRetries: number;
  private retryDelay: number;
  private dlxExchange: string;
  private dlxQueue: string;

  constructor(
    maxRetries = 3,
    retryDelay = 5000,
    dlxExchange = 'dlx.exchange',
    dlxQueue = 'dlx.queue',
  ) {
    this.maxRetries = maxRetries;
    this.retryDelay = retryDelay;
    this.dlxExchange = dlxExchange;
    this.dlxQueue = dlxQueue;
  }

  async setupDLX(channel: amqp.Channel) {
    await channel.assertExchange(this.dlxExchange, 'direct', { durable: true });
    await channel.assertQueue(this.dlxQueue, { durable: true });
    await channel.bindQueue(this.dlxQueue, this.dlxExchange, '');
  }

  async handleRetry(
    channel: amqp.Channel,
    msg: amqp.ConsumeMessage,
    handler: () => Promise<void>,
    currentQueue: string,
  ) {
    try {
      await handler();
      channel.ack(msg);
    } catch (error) {
      const retryCount = this.getRetryCount(msg) || 0;

      if (retryCount < this.maxRetries) {
        logger.warn(`Retry ${retryCount + 1}/${this.maxRetries} for message: ${error}`);

        const retryQueue = `${currentQueue}.retry`;

        await channel.assertQueue(retryQueue, {
          durable: true,
          deadLetterExchange: '',
          deadLetterRoutingKey: currentQueue,
          messageTtl: this.retryDelay,
        });

        channel.sendToQueue(retryQueue, msg.content, {
          headers: {
            ...msg.properties.headers,
            'x-retry-count': retryCount + 1,
          },
        });

        channel.ack(msg);
      } else {
        logger.error(`Max retries exceeded for message, sending to DLX`);

        channel.publish(this.dlxExchange, '', msg.content, {
          headers: msg.properties.headers,
        });

        channel.ack(msg);
      }
    }
  }

  private getRetryCount(msg: amqp.ConsumeMessage): number {
    return msg.properties.headers?.['x-retry-count'] || 0;
  }
}

export default RetryHandler;
