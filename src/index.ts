import { Container } from '@infra/config/container';
import { logger } from '@shared/utils/logger';

async function main() {
  try {
    await Container.initialize();

    const orderProcessor = Container.createOrderProcessor();

    await orderProcessor.start();

    const server = Container.createServer();

    server.start();

    logger.info('Application started successfully');
  } catch (error) {
    logger.error('Error starting application:', error);

    process.exit(1);
  }
}

main();
