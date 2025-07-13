import { OrderService } from '@application/services/order.service';
import { Router } from 'express';
import { getOrderByIdHandler, newOrderHandler } from '../controllers/order.controller';

export const createOrderRoutes = (orderService: OrderService): Router => {
  const router = Router();

  router.post('/orders', (req, res) => newOrderHandler(orderService, req, res));
  router.get('/orders/:id/status', (req, res) => getOrderByIdHandler(orderService, req, res));

  return router;
};
