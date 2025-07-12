import { EventBus, OrderStatusObserver } from '@core/patterns/observer';
import { logger } from '@shared/utils/logger';

describe('EventBus', () => {
  let eventBus: EventBus;
  let observer: OrderStatusObserver;

  beforeEach(() => {
    eventBus = new EventBus();
    observer = new OrderStatusObserver();

    jest.spyOn(observer, 'update');
    jest.spyOn(logger, 'info');
  });

  it('should notify subscribed observers', async () => {
    eventBus.subscribe('order_processed', observer);

    await eventBus.notify('order_processed', { id: '123' });

    expect(observer.update).toHaveBeenCalledWith('order_processed', { id: '123' });
  });

  it('should not notify unsubscribed observers', async () => {
    eventBus.subscribe('order_processed', observer);
    eventBus.unsubscribe('order_processed', observer);

    await eventBus.notify('order_processed', { id: '123' });

    expect(observer.update).not.toHaveBeenCalled();
  });
});
