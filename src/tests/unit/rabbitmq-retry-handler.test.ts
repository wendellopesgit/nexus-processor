/* eslint-disable @typescript-eslint/no-explicit-any */
import { RabbitMQRetryHandler } from '@infrastructure/messaging/rabbitmq/retry-handler';
import { logger } from '@shared/utils/logger';
import { Channel, Message } from 'amqplib';

jest.mock('@shared/utils/logger');

describe('RabbitMQRetryHandler', () => {
  let retryHandler: RabbitMQRetryHandler;
  let mockChannel: jest.Mocked<Channel>;

  beforeEach(() => {
    retryHandler = new RabbitMQRetryHandler();
    mockChannel = {
      assertExchange: jest.fn().mockResolvedValue({}),
      assertQueue: jest.fn().mockResolvedValue({}),
      bindQueue: jest.fn().mockResolvedValue({}),
      publish: jest.fn().mockResolvedValue(true),
      ack: jest.fn().mockResolvedValue(undefined),
      nack: jest.fn().mockResolvedValue(undefined),
      sendToQueue: jest.fn().mockResolvedValue(true),
    } as unknown as jest.Mocked<Channel>;

    jest.spyOn(logger, 'error').mockImplementation(jest.fn());
    jest.spyOn(logger, 'info').mockImplementation(jest.fn());
  });

  describe('setup', () => {
    it('should setup DLX exchange and queue', async () => {
      await retryHandler.setup(mockChannel);

      expect(mockChannel.assertExchange).toHaveBeenCalledWith('global.dlx', 'direct', {
        durable: true,
      });
      expect(mockChannel.assertQueue).toHaveBeenCalledWith('global.dlq', {
        durable: true,
      });
      expect(mockChannel.bindQueue).toHaveBeenCalledWith('global.dlq', 'global.dlx', '');
    });
  });

  describe('handleRetry', () => {
    it('should call handler successfully without ack', async () => {
      const handler = jest.fn().mockResolvedValue(undefined);
      const msg = { content: Buffer.from('test'), properties: { headers: {} } } as Message;

      await retryHandler.handleRetry(mockChannel, msg, handler, 'test-queue');

      expect(handler).toHaveBeenCalled();
    });
    it('should retry on failure', async () => {
      const handler = jest.fn().mockRejectedValue(new Error('test error'));
      const msg = { content: Buffer.from('test'), properties: { headers: {} } } as Message;

      await retryHandler.handleRetry(mockChannel, msg, handler, 'test-queue');

      expect(handler).toHaveBeenCalled();
      expect(mockChannel.sendToQueue).toHaveBeenCalled();
    });

    it('should send to DLX after max retries', async () => {
      const handler = jest.fn().mockRejectedValue(new Error('test error'));
      const msg = {
        content: Buffer.from('test'),
        properties: {
          headers: { 'x-retry-count': 3 },
        },
      } as any;

      await retryHandler.handleRetry(mockChannel, msg, handler, 'test-queue');

      expect(mockChannel.publish).toHaveBeenCalledWith(
        'global.dlx',
        '',
        msg.content,
        expect.any(Object),
      );
    });
  });

  describe('private methods', () => {
    it('should calculate delay with backoff factor', () => {
      const retryHandler = new RabbitMQRetryHandler(3, 1000, 2);

      expect((retryHandler as any).calculateDelay(0)).toBe(1000);
      expect((retryHandler as any).calculateDelay(1)).toBe(2000);
      expect((retryHandler as any).calculateDelay(2)).toBe(4000);
    });

    it('should get retry count from message headers', () => {
      const retryHandler = new RabbitMQRetryHandler();
      const msgWithCount = { properties: { headers: { 'x-retry-count': 2 } } };
      const msgWithoutCount = { properties: { headers: {} } };

      expect((retryHandler as any).getRetryCount(msgWithCount)).toBe(2);
      expect((retryHandler as any).getRetryCount(msgWithoutCount)).toBe(0);
    });

    it('should use custom retry parameters', () => {
      const customHandler = new RabbitMQRetryHandler(5, 500, 3);

      expect((customHandler as any).maxRetries).toBe(5);
      expect((customHandler as any).initialDelay).toBe(500);
      expect((customHandler as any).backoffFactor).toBe(3);
    });
  });
});
