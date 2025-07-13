import { logger } from '@shared/utils/logger';

/**
 * Interface para observadores (subscribers)
 */
export interface IObserver<T = unknown> {
  update(event: string, data: T): Promise<void>;
}

/**
 * Interface para observáveis (publisher)
 */
export interface IObservable {
  subscribe(event: string, observer: IObserver): void;
  unsubscribe(event: string, observer: IObserver): void;
  notify<T>(event: string, data: T): Promise<void>;
}

/**
 * Implementação concreta do Event Bus usando Observer Pattern
 */
export class EventBus implements IObservable {
  private observers: Map<string, IObserver[]> = new Map();

  subscribe(event: string, observer: IObserver): void {
    if (!this.observers.has(event)) {
      this.observers.set(event, []);
    }

    this.observers.get(event)!.push(observer);

    logger.info(`Observer subscribed to ${event} events`);
  }

  unsubscribe(event: string, observer: IObserver): void {
    const eventObservers = this.observers.get(event);

    if (eventObservers) {
      this.observers.set(
        event,
        eventObservers.filter((obs) => obs !== observer),
      );
    }
  }

  async notify<T>(event: string, data: T): Promise<void> {
    const eventObservers = this.observers.get(event) || [];

    if (eventObservers.length === 0) {
      logger.debug(`No observers for event: ${event}`);
      return;
    }

    logger.info(`Notifying ${eventObservers.length} observers of ${event} event`);

    await Promise.all(
      eventObservers.map((observer) =>
        observer.update(event, data).catch((error) => {
          logger.error(`Error notifying observer for event ${event}:`, error);
        }),
      ),
    );
  }
}
