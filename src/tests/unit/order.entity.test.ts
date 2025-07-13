import { Order } from '@core/entities/order.entity';

describe('Order Entity', () => {
  describe('create', () => {
    it('should initialize with provided values', () => {
      const items = [{ productId: '1', quantity: 1, price: 10 }];
      const order = new Order('test-id', 'test-customer', items, 'pending');

      expect(order.id).toBe('test-id');
      expect(order.customer).toBe('test-customer');
      expect(order.items).toEqual(items);
      expect(order.status).toBe('pending');
      expect(order.createdAt).toBeInstanceOf(Date);
      expect(order.updatedAt).toBeInstanceOf(Date);
    });

    it('should create an order with generated id when not provided', () => {
      const order = Order.create({
        customer: 'test',
        items: [{ productId: '1', quantity: 1, price: 10 }],
      });

      expect(order.id).toBeDefined();
      expect(order.id.startsWith('ord_')).toBeTruthy();
    });

    it('should create an order with provided id', () => {
      const order = Order.create({
        id: 'custom-id',
        customer: 'test',
        items: [{ productId: '1', quantity: 1, price: 10 }],
      });

      expect(order.id).toBe('custom-id');
    });

    it('should create order items from DTO', () => {
      const order = Order.create({
        customer: 'test',
        items: [{ productId: '1', quantity: 1, price: 10 }],
      });

      expect(order.items).toEqual([{ productId: '1', quantity: 1, price: 10 }]);
    });
  });
});
