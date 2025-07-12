/* eslint-disable @typescript-eslint/no-explicit-any */
import { logger } from '@shared/utils/logger';

export interface IObserver {
  update(event: string, data: any): Promise<void>;
}

export interface IObservable {
  subscribe(event: string, observer: IObserver): void;
  unsubscribe(event: string, observer: IObserver): void;
  notify(event: string, data: any): Promise<void>;
}

export class EventBus implements IObservable {
  private observers: Record<string, IObserver[]> = {};

  subscribe(event: string, observer: IObserver): void {
    if (!this.observers[event]) {
      this.observers[event] = [];
    }
    this.observers[event].push(observer);
    logger.info(`Observer subscribed to ${event} events`);
  }

  unsubscribe(event: string, observer: IObserver): void {
    if (this.observers[event]) {
      this.observers[event] = this.observers[event].filter((obs) => obs !== observer);
    }
  }

  async notify(event: string, data: any): Promise<void> {
    if (!this.observers[event]) return;

    logger.info(`Notifying ${this.observers[event].length} observers of ${event} event`);
    await Promise.all(
      this.observers[event].map((observer) =>
        observer.update(event, data).catch((err) => logger.error(`Error notifying observer:`, err)),
      ),
    );
  }
}

export class OrderStatusObserver implements IObserver {
  async update(event: string, data: any): Promise<void> {
    if (event === 'order_processed') {
      logger.info(`Order ${data.id} status updated to processed`);
    }
  }
}

export class InventoryObserver implements IObserver {
  async update(event: string, data: any): Promise<void> {
    if (event === 'order_processed') {
      logger.info(`Updating inventory for order ${data.id}`);
    }
  }
}
