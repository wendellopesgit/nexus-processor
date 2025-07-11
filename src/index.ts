import RabbitMQConsumer from '@rabbitmq/consumer';
import { logger } from '@utils/logger';

const consumer = new RabbitMQConsumer('my_queue');

async function main() {
  await consumer.connect();

  await consumer.consume(async (msg) => {
    if (msg) {
      logger.info('Received message:', msg.content.toString());
    }
  });

  setTimeout(async () => {
    await consumer.close();
  }, 5000);
}

main().catch((error) => {
  logger.error('Error in main:', error);
  process.exit(1);
});
