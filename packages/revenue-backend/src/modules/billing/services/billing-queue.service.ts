import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { QUEUE_NAMES, JOB_TYPES } from '../../../common/queues';
import {
  GenerateContractInvoiceJobData,
  BatchContractBillingJobData,
} from '../processors/contract-billing.processor';

@Injectable()
export class BillingQueueService {
  private readonly logger = new Logger(BillingQueueService.name);

  constructor(
    @InjectQueue(QUEUE_NAMES.CONTRACT_BILLING)
    private contractBillingQueue: Queue,
  ) {}

  /**
   * Queue a contract invoice generation job
   */
  async queueContractInvoiceGeneration(
    data: GenerateContractInvoiceJobData,
  ): Promise<string> {
    const job = await this.contractBillingQueue.add(
      JOB_TYPES.GENERATE_CONTRACT_INVOICE,
      data,
      {
        removeOnComplete: true,
        removeOnFail: false,
      },
    );

    this.logger.log(
      `Queued contract invoice generation job ${job.id} for contract ${data.contractId}`,
    );

    return job.id!;
  }

  /**
   * Queue a batch contract billing job
   */
  async queueBatchContractBilling(
    data: BatchContractBillingJobData,
  ): Promise<string> {
    const job = await this.contractBillingQueue.add(
      JOB_TYPES.BATCH_CONTRACT_BILLING,
      data,
      {
        removeOnComplete: true,
        removeOnFail: false,
      },
    );

    this.logger.log(
      `Queued batch contract billing job ${job.id} for ${data.billingPeriod}`,
    );

    return job.id!;
  }

  /**
   * Get job status
   */
  async getJobStatus(jobId: string) {
    const job = await this.contractBillingQueue.getJob(jobId);

    if (!job) {
      return null;
    }

    const state = await job.getState();
    const progress = job.progress;
    const returnValue = job.returnvalue;
    const failedReason = job.failedReason;

    return {
      id: job.id,
      name: job.name,
      data: job.data,
      state,
      progress,
      result: returnValue,
      error: failedReason,
      attemptsMade: job.attemptsMade,
      processedOn: job.processedOn,
      finishedOn: job.finishedOn,
    };
  }

  /**
   * Get queue statistics
   */
  async getQueueStats() {
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      this.contractBillingQueue.getWaitingCount(),
      this.contractBillingQueue.getActiveCount(),
      this.contractBillingQueue.getCompletedCount(),
      this.contractBillingQueue.getFailedCount(),
      this.contractBillingQueue.getDelayedCount(),
    ]);

    return {
      queue: QUEUE_NAMES.CONTRACT_BILLING,
      waiting,
      active,
      completed,
      failed,
      delayed,
      total: waiting + active + completed + failed + delayed,
    };
  }
}
