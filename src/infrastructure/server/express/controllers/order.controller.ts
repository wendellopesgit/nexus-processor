import { OrderService } from '@application/services/order.service';
import { logger } from '@shared/utils/logger';
import { Request, Response } from 'express';

export const newOrderHandler = async (orderService: OrderService, req: Request, res: Response) => {
  try {
    const orderData = req.body;

    if (!orderData) {
      return res.status(400).json({ error: 'Order data is required' });
    }

    if (!orderData.customer || !orderData.items || !Array.isArray(orderData.items)) {
      return res.status(400).json({ error: 'Invalid order data' });
    }

    const orderId = await orderService.newOrder(orderData);

    return res.status(202).json({ orderId, status: 'processing' });
  } catch (error) {
    logger.error('Order creation failed:', error);

    if (error instanceof Error) {
      res.status(400).json({ error: error.message });
    }

    return res.status(500).json({ error: 'Failed to process order' });
  }
};

export const getOrderByIdHandler = async (
  orderService: OrderService,
  req: Request,
  res: Response,
) => {
  try {
    const orderId = req.params?.id;

    if (!orderId) {
      return res.status(400).json({ error: 'Order ID is required' });
    }

    const { status } = await orderService.getOrderById(orderId);

    return res.status(200).json({ status });
  } catch (error) {
    logger.error('Failed to fetch order:', error);

    if (error instanceof Error) {
      res.status(400).json({ error: error.message });
    }

    return res.status(500).json({ error: 'Failed to fetch order' });
  }
};
