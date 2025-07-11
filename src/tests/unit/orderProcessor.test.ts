import OrderProcessor from '@contexts/orderProcessor';
import { logger } from '@utils/logger';

describe('OrderProcessor', () => {
  let orderProcessor: OrderProcessor;

  beforeEach(() => {
    orderProcessor = new OrderProcessor();
    jest.clearAllMocks();
  });

  it('should start successfully', async () => {
    await expect(orderProcessor.start()).resolves.not.toThrow();
  });

  it('should handle order processing error with retry', async () => {
    const mockError = new Error('Processing error');

    jest.spyOn(orderProcessor, 'start').mockRejectedValueOnce(mockError);

    await orderProcessor.start();

    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining('Error in OrderProcessor:'),
      mockError,
    );
  });
});
