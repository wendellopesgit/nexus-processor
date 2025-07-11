/* eslint-disable @typescript-eslint/no-explicit-any */
import { logger } from '@utils/logger';
import Queue from 'bull';

class BatchProcessor {
  private batchQueue: Queue.Queue;

  constructor(queueName: string) {
    this.batchQueue = new Queue(queueName, process.env.REDIS_URL || 'redis://localhost:6379');
    this.setupProcessor();
  }

  private setupProcessor() {
    this.batchQueue.process(async (job) => {
      try {
        logger.info(`Processing batch job ${job.id} with ${job.data.items.length} items`);

        await new Promise((resolve) => setTimeout(resolve, 1000));

        logger.info(`Completed batch job ${job.id}`);

        return { success: true };
      } catch (error) {
        logger.error(`Error processing batch job ${job.id}:`, error);
        throw error;
      }
    });

    this.batchQueue.on('failed', (job, err) => {
      logger.error(`Job ${job?.id} failed with error:`, err);
    });
  }

  async addToBatch(data: any) {
    await this.batchQueue.add(data, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 1000,
      },
    });
  }
}

export default BatchProcessor;
