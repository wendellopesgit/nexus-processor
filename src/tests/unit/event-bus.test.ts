import { EventBus, IObservable, IObserver } from '@core/patterns/observer/event-bus';

describe('EventBus', () => {
  let eventBus: IObservable;
  let mockObserver: jest.Mocked<IObserver>;

  beforeEach(() => {
    eventBus = new EventBus();
    mockObserver = {
      update: jest.fn().mockResolvedValue(undefined),
    };
  });

  it('should notify subscribed observers', async () => {
    eventBus.subscribe('test_event', mockObserver);

    await eventBus.notify('test_event', { data: 'test' });

    expect(mockObserver.update).toHaveBeenCalledWith('test_event', { data: 'test' });
  });

  it('should not notify unsubscribed observers', async () => {
    eventBus.subscribe('test_event', mockObserver);
    eventBus.unsubscribe('test_event', mockObserver);

    await eventBus.notify('test_event', { data: 'test' });

    expect(mockObserver.update).not.toHaveBeenCalled();
  });

  describe('notify', () => {
    it('should handle observer update errors', async () => {
      const errorObserver = {
        update: jest.fn().mockRejectedValue(new Error('Observer error')),
      };

      eventBus.subscribe('test_event', errorObserver);

      await eventBus.notify('test_event', { data: 'test' });

      expect(errorObserver.update).toHaveBeenCalled();
    });

    it('should not throw when notifying with no observers', async () => {
      await expect(eventBus.notify('no_observers', {})).resolves.not.toThrow();
    });
  });
});
