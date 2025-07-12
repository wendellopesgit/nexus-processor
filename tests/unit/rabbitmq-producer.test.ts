/* eslint-disable @typescript-eslint/no-explicit-any */
import { RabbitMQProducer } from '../../src/infrastructure/messaging/rabbitmq-producer';

jest.mock('../../src/shared/utils/logger');

describe('RabbitMQProducer', () => {
  let producer: RabbitMQProducer;

  beforeEach(() => {
    producer = new RabbitMQProducer('test-exchange', 'amqp://localhost');
    producer['channel'] = {
      publish: jest.fn().mockReturnValue(true),
      assertExchange: jest.fn(),
    } as any;
  });

  it('should publish a message successfully', async () => {
    await expect(producer.publish('test-key', { test: 'message' })).resolves.not.toThrow();
    expect(producer['channel']?.publish).toHaveBeenCalled();
  });

  it('should retry on failure and send to DLX after max retries', async () => {
    producer['channel']!.publish = jest
      .fn()
      .mockReturnValueOnce(false)
      .mockReturnValueOnce(false)
      .mockReturnValueOnce(false);

    await expect(producer.publish('test-key', { test: 'message' })).rejects.toThrow();
    expect(producer['channel']?.publish).toHaveBeenCalledTimes(4); // 3 retries + 1 DLX
  });
});
