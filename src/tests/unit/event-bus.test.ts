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
});
