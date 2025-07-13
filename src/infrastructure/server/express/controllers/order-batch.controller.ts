import { OrderBatchDto } from '@application/dtos/order-batch.dto';
import { OrderBatchService } from '@application/services/order-batch.service';
import { logger } from '@shared/utils/logger';
import { Request, Response } from 'express';

export const createOrderBatchHandler = async (
  orderBatchService: OrderBatchService,
  req: Request,
  res: Response,
) => {
  try {
    const batchData = req.body;

    if (!batchData) {
      return res.status(400).json({ error: 'Batch data is required' });
    }

    const { dto: batchDto, error } = OrderBatchDto.create(batchData);

    if (error || !batchDto) {
      return res.status(400).json({ error: error || 'Invalid batch data' });
    }

    const result = await orderBatchService.processBatch(batchDto);

    return res.status(202).json({
      batchId: result.batchId,
      orderIds: result.orderIds,
      status: 'batch_processing',
    });
  } catch (error) {
    logger.error('Order batch creation failed:', error);

    if (error instanceof Error) {
      return res.status(400).json({ error: error.message });
    }

    return res.status(500).json({ error: 'Failed to process order batch' });
  }
};
