import { Channel } from 'amqplib';

/* eslint-disable @typescript-eslint/no-explicit-any */
export interface IMessageConsumer {
  connect(): Promise<void>;
  consume(handler: (msg: any) => Promise<void>): Promise<void>;
  close(): Promise<void>;
}

export interface IMessageProducer {
  connect(): Promise<void>;
  publish(queue: string, message: any): Promise<void>;
}

export interface IRetryHandler {
  setup(channel: Channel): Promise<void>;
  handleRetry(
    channel: any,
    msg: any,
    handler: () => Promise<void>,
    currentQueue: string,
  ): Promise<void>;
}
