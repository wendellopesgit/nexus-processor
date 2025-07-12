import { IMessageConsumer, IRetryHandler } from '@core/ports/messaging';
import { ProcessOrderUseCase } from '@core/use-cases/process-order';
import RabbitMQConsumer from '@infra/messaging/rabbitmq-consumer';
import { logger } from '@shared/utils/logger';

export class OrderProcessor {
  constructor(
    private messageConsumer: IMessageConsumer,
    private retryHandler: IRetryHandler,
    private processOrderUseCase: ProcessOrderUseCase,
    private queueName: string,
  ) {}

  async start() {
    try {
      await this.messageConsumer.connect();

      const rabbitConsumer = this.messageConsumer as RabbitMQConsumer;
      const channel = rabbitConsumer.getChannel();

      if (!channel) {
        throw new Error('Failed to get channel from consumer');
      }

      await this.retryHandler.setup(channel);

      await this.messageConsumer.consume(async (msg) => {
        if (!msg) return;

        await this.retryHandler.handleRetry(
          channel,
          msg,
          async () => {
            const order = JSON.parse(msg.content.toString());
            await this.processOrderUseCase.execute(order);
          },
          this.queueName,
        );
      });
    } catch (error) {
      logger.error('Error in OrderProcessor:', error);
      process.exit(1);
    }
  }
}
