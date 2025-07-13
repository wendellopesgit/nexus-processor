import { OrderProcessorService } from '@application/services/order-processor.service';
import { IMessageConsumer } from '@core/interfaces/messaging/message-consumer.interface';
import { IRetryHandler } from '@core/interfaces/messaging/retry-handler.interface';
import { IOrderRepository } from '@core/interfaces/repositories/order-repository.interface';
import { EventBus } from '@core/patterns/observer/event-bus';
import { logger } from '@shared/utils/logger';

describe('OrderProcessorService', () => {
  let service: OrderProcessorService;
  let mockEventBus: jest.Mocked<EventBus>;
  let mockOrderRepository: jest.Mocked<IOrderRepository>;
  let mockConsumer: jest.Mocked<IMessageConsumer>;
  let mockRetryHandler: jest.Mocked<IRetryHandler>;

  beforeEach(() => {
    mockEventBus = {
      notify: jest.fn().mockResolvedValue(undefined),
      subscribe: jest.fn(),
      unsubscribe: jest.fn(),
    } as unknown as jest.Mocked<EventBus>;

    mockOrderRepository = {
      updateOrderStatus: jest.fn().mockResolvedValue(undefined),
      save: jest.fn(),
      saveBatch: jest.fn(),
      findById: jest.fn(),
    } as unknown as jest.Mocked<IOrderRepository>;

    mockConsumer = {
      connect: jest.fn(),
      consume: jest.fn().mockImplementation((handler) => {
        return handler({
          content: Buffer.from(JSON.stringify({ id: '123', customer: 'test', items: [] })),
          properties: { headers: {} },
        });
      }),
      getChannel: jest.fn().mockReturnValue({
        ack: jest.fn(),
        nack: jest.fn(),
      }),
      getQueueName: jest.fn().mockReturnValue('test-queue'),
      close: jest.fn(),
    } as unknown as jest.Mocked<IMessageConsumer>;

    mockRetryHandler = {
      setup: jest.fn().mockResolvedValue(undefined),
      handleRetry: jest.fn().mockImplementation(async (channel, msg, handler) => {
        try {
          await handler();
          channel.ack(msg);
        } catch (error) {
          channel.nack(msg, false, false);

          throw error;
        }
      }),
    } as unknown as jest.Mocked<IRetryHandler>;

    jest.spyOn(logger, 'info').mockImplementation(jest.fn());
    jest.spyOn(logger, 'error').mockImplementation(jest.fn());
    jest.spyOn(logger, 'warn').mockImplementation(jest.fn());

    service = new OrderProcessorService(
      mockEventBus,
      mockOrderRepository,
      mockConsumer,
      mockRetryHandler,
    );
  });

  describe('execute', () => {
    it('should process messages from consumer', async () => {
      await service.execute();

      expect(mockConsumer.consume).toHaveBeenCalled();
      expect(mockRetryHandler.handleRetry).toHaveBeenCalled();
      expect(mockOrderRepository.updateOrderStatus).toHaveBeenCalledWith('123', 'completed');
      expect(mockEventBus.notify).toHaveBeenCalledWith(
        'order_processed',
        expect.objectContaining({ id: '123' }),
      );
    }, 100);

    it('should handle processing errors', async () => {
      const dbError = new Error('DB error');
      mockOrderRepository.updateOrderStatus
        .mockRejectedValueOnce(dbError)
        .mockResolvedValueOnce(undefined);

      await service.execute();

      expect(mockOrderRepository.updateOrderStatus).toHaveBeenCalledWith('123', 'failed');

      const errorCalls = (logger.error as jest.Mock).mock.calls;
      const foundErrorCall = errorCalls.some(
        (call) => call[0].includes('DB error') && call[1] instanceof Error,
      );

      expect(foundErrorCall).toBeTruthy();
    }, 10000);

    it('should log processing start and completion', async () => {
      await service.execute();

      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('Starting processing for order 123'),
      );
      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('Order: 123 updated with success!'),
      );
    }, 10000);

    it('should handle event bus notification errors', async () => {
      const notifyError = new Error('Notification failed');
      mockEventBus.notify.mockRejectedValueOnce(notifyError);

      await service.execute();

      expect(logger.error).toHaveBeenCalled();
    });
  });
});
