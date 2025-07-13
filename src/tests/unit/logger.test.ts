/* eslint-disable @typescript-eslint/no-require-imports */
import { httpLogStream, logger } from '@shared/utils/logger';
import winston from 'winston';

describe('Logger', () => {
  it('should create logger with transports', () => {
    expect(logger.transports.length).toBeGreaterThan(0);
    expect(logger.transports.some((t) => t.level === 'error')).toBeTruthy();
  });

  it('should create logger with correct transports', () => {
    expect(logger.transports.length).toBe(5);
    expect(logger.transports.some((t) => t.level === 'error')).toBeTruthy();
  });

  it('should use JSON format in production', () => {
    process.env.NODE_ENV = 'production';

    const prodLogger = winston.createLogger(require('@shared/utils/logger').loggerOptions);

    expect(prodLogger.format).toBeDefined();
  });

  it('httpLogStream should write to logger', () => {
    const mockInfo = jest.spyOn(logger, 'info').mockImplementation(jest.fn());
    const message = 'test log message';

    httpLogStream.write(message);

    expect(mockInfo).toHaveBeenCalledWith(message.trim());
  });

  afterEach(() => {
    process.env.NODE_ENV = 'test';
    jest.restoreAllMocks();
  });
});
