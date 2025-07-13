import { OrderBatchDto } from '@application/dtos/order-batch.dto';
import { OrderBatchService } from '@application/services/order-batch.service';
import { IMessageProducer } from '@core/interfaces/messaging/message-producer.interface';
import { IOrderRepository } from '@core/interfaces/repositories/order-repository.interface';

describe('OrderBatchService', () => {
  let service: OrderBatchService;
  let mockOrderRepository: jest.Mocked<IOrderRepository>;
  let mockMessageProducer: jest.Mocked<IMessageProducer>;

  beforeEach(() => {
    mockOrderRepository = {
      save: jest.fn().mockResolvedValue(undefined),
      saveBatch: jest.fn().mockResolvedValue(undefined),
      findById: jest.fn().mockResolvedValue(null),
      updateOrderStatus: jest.fn().mockResolvedValue(undefined),
    };

    mockMessageProducer = {
      connect: jest.fn().mockResolvedValue(undefined),
      publish: jest.fn().mockResolvedValue(undefined),
      close: jest.fn().mockResolvedValue(undefined),
    };

    service = new OrderBatchService(mockOrderRepository, mockMessageProducer);
  });

  describe('processBatch', () => {
    it('should process a batch of orders successfully', async () => {
      const batchDto = new OrderBatchDto('customer1', [
        { items: [{ productId: '1', quantity: 1, price: 10 }] },
        { items: [{ productId: '2', quantity: 2, price: 20 }] },
      ]);

      const result = await service.processBatch(batchDto);

      expect(result.batchId).toBeDefined();
      expect(result.orderIds).toHaveLength(2);
      expect(mockOrderRepository.saveBatch).toHaveBeenCalledTimes(1);
      expect(mockMessageProducer.publish).toHaveBeenCalledTimes(2);
    });

    it('should process batches larger than BATCH_SIZE in chunks', async () => {
      const largeBatch = new OrderBatchDto(
        'customer1',
        Array(15).fill({ items: [{ productId: '1', quantity: 1, price: 10 }] }),
      );

      const result = await service.processBatch(largeBatch);

      expect(result.orderIds).toHaveLength(15);
      expect(mockOrderRepository.saveBatch).toHaveBeenCalledTimes(2);
      expect(mockMessageProducer.publish).toHaveBeenCalledTimes(15);
    });
  });
});
