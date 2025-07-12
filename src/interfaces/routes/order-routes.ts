import { OrderController } from '@infra/controllers/order-controller';
import { RabbitMQProducer } from '@infra/messaging/rabbitmq-producer';
import { Router } from 'express';

const router = Router();
const producer = new RabbitMQProducer('orders', process.env.RABBITMQ_URL as string);
const orderController = new OrderController(producer);

router.post('/orders', orderController.createOrder.bind(orderController));
router.get('/orders/:id/status', orderController.getOrderStatus.bind(orderController));

export default router;
