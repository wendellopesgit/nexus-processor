import { OrderBatchService } from '@application/services/order-batch.service';
import { OrderService } from '@application/services/order.service';
import { Router } from 'express';
import { createOrderBatchHandler } from '../controllers/order-batch.controller';
import { getOrderByIdHandler, newOrderHandler } from '../controllers/order.controller';

export const createOrderRoutes = (
  orderService: OrderService,
  orderBatchService: OrderBatchService,
): Router => {
  const router = Router();

  router.post('/orders', (req, res) => newOrderHandler(orderService, req, res));
  router.post('/orders/batch', (req, res) => createOrderBatchHandler(orderBatchService, req, res));
  router.get('/orders/:id/status', (req, res) => getOrderByIdHandler(orderService, req, res));

  return router;
};
