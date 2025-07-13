import { ContainerApplication } from '@infrastructure/config/container';
import { logger } from '@shared/utils/logger';
import dotenv from 'dotenv';
import 'reflect-metadata';

// Carrega variáveis de ambiente
dotenv.config({ path: `.env.${process.env.NODE_ENV || 'development'}` });

// Tratamento de exceções não tratadas ao longo do processo
process.on('uncaughtException', (error: Error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason: unknown) => {
  logger.error('Unhandled Rejection:', reason);
  process.exit(1);
});

async function main() {
  try {
    logger.info('Starting application...');

    // Inicializa o container de dependências
    await ContainerApplication.initialize();

    // Inicia o processador de pedidos
    await ContainerApplication.createOrderProcessor();

    // Inicia o servidor HTTP
    const server = ContainerApplication.createServer();

    server.start();

    logger.info(`Application started successfully in ${process.env.NODE_ENV} mode`);
  } catch (error) {
    logger.error('Failed to start application:', error);

    process.exit(1);
  }
}

main();
