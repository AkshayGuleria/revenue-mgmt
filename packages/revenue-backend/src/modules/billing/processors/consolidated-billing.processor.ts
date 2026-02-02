import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { QUEUE_NAMES } from '../../../common/queues';
import { ConsolidatedBillingService } from '../services/consolidated-billing.service';

export interface ConsolidatedBillingJobData {
  parentAccountId: string;
  periodStart: string; // ISO date string
  periodEnd: string; // ISO date string
  includeChildren?: boolean;
}

@Processor(QUEUE_NAMES.CONSOLIDATED_BILLING, {
  concurrency: 2, // Process 2 consolidated billing jobs in parallel
})
export class ConsolidatedBillingProcessor extends WorkerHost {
  private readonly logger = new Logger(ConsolidatedBillingProcessor.name);

  constructor(
    private readonly consolidatedBillingService: ConsolidatedBillingService,
  ) {
    super();
  }

  async process(job: Job<ConsolidatedBillingJobData>): Promise<any> {
    this.logger.log(
      `Processing consolidated billing job ${job.id} for parent account ${job.data.parentAccountId}`,
    );

    try {
      const { parentAccountId, periodStart, periodEnd, includeChildren } =
        job.data;

      // Generate consolidated invoice
      const result =
        await this.consolidatedBillingService.generateConsolidatedInvoice({
          parentAccountId,
          periodStart: new Date(periodStart),
          periodEnd: new Date(periodEnd),
          includeChildren,
        });

      this.logger.log(
        `Consolidated invoice ${result.invoiceNumber} generated for parent account ${parentAccountId}. ` +
          `Included ${result.subsidiariesIncluded} subsidiaries. Total: ${result.total}`,
      );

      return {
        success: true,
        invoiceId: result.invoiceId,
        invoiceNumber: result.invoiceNumber,
        total: result.total.toString(),
        subsidiariesIncluded: result.subsidiariesIncluded,
      };
    } catch (error) {
      // In test environment, background jobs may fail due to test cleanup
      // Only log errors in non-test environments to avoid confusing test output
      if (process.env.NODE_ENV !== 'test') {
        this.logger.error(
          `Failed to generate consolidated invoice for parent account ${job.data.parentAccountId}: ${error.message}`,
          error.stack,
        );
      }
      throw error;
    }
  }
}
