import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { BillingEngineService } from './services/billing-engine.service';
import { BillingQueueService } from './services/billing-queue.service';
import { GenerateInvoiceDto, BatchGenerateInvoicesDto } from './dto/generate-invoice.dto';

@ApiTags('Billing')
@Controller('billing')
export class BillingController {
  constructor(
    private readonly billingEngine: BillingEngineService,
    private readonly billingQueue: BillingQueueService,
  ) {}

  @Post('generate')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Generate invoice from contract (synchronous)',
    description:
      'Generates an invoice from an active contract immediately. For background processing, use /billing/queue endpoint.',
  })
  @ApiResponse({
    status: 201,
    description: 'Invoice generated successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Contract not found',
  })
  async generateInvoice(@Body() dto: GenerateInvoiceDto) {
    const periodStart = dto.periodStart
      ? new Date(dto.periodStart)
      : undefined;
    const periodEnd = dto.periodEnd ? new Date(dto.periodEnd) : undefined;

    const result = await this.billingEngine.generateInvoiceFromContract({
      contractId: dto.contractId,
      periodStart,
      periodEnd,
    });

    return {
      data: result,
      paging: {
        offset: null,
        limit: null,
        total: null,
        totalPages: null,
        hasNext: null,
        hasPrev: null,
      },
    };
  }

  @Post('queue')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({
    summary: 'Queue invoice generation from contract (asynchronous)',
    description:
      'Queues an invoice generation job for background processing. Returns job ID for status tracking.',
  })
  @ApiResponse({
    status: 202,
    description: 'Invoice generation job queued',
  })
  async queueInvoiceGeneration(@Body() dto: GenerateInvoiceDto) {
    const jobId = await this.billingQueue.queueContractInvoiceGeneration({
      contractId: dto.contractId,
      periodStart: dto.periodStart,
      periodEnd: dto.periodEnd,
    });

    return {
      data: {
        jobId,
        status: 'queued',
        message: 'Invoice generation job queued successfully',
      },
      paging: {
        offset: null,
        limit: null,
        total: null,
        totalPages: null,
        hasNext: null,
        hasPrev: null,
      },
    };
  }

  @Post('batch')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({
    summary: 'Queue batch contract billing',
    description:
      'Queues a batch billing job for all active contracts. Used for scheduled monthly/quarterly/annual billing.',
  })
  @ApiResponse({
    status: 202,
    description: 'Batch billing job queued',
  })
  async queueBatchBilling(@Body() dto: BatchGenerateInvoicesDto) {
    const jobId = await this.billingQueue.queueBatchContractBilling({
      billingDate: dto.billingDate || new Date().toISOString(),
      billingPeriod: dto.billingPeriod || 'monthly',
    });

    return {
      data: {
        jobId,
        status: 'queued',
        message: 'Batch billing job queued successfully',
      },
      paging: {
        offset: null,
        limit: null,
        total: null,
        totalPages: null,
        hasNext: null,
        hasPrev: null,
      },
    };
  }

  @Get('jobs/:jobId')
  @ApiOperation({
    summary: 'Get billing job status',
    description: 'Check the status of a queued billing job',
  })
  @ApiResponse({
    status: 200,
    description: 'Job status retrieved',
  })
  @ApiResponse({
    status: 404,
    description: 'Job not found',
  })
  async getJobStatus(@Param('jobId') jobId: string) {
    const status = await this.billingQueue.getJobStatus(jobId);

    if (!status) {
      return {
        data: null,
        paging: {
          offset: null,
          limit: null,
          total: null,
          totalPages: null,
          hasNext: null,
          hasPrev: null,
        },
      };
    }

    return {
      data: status,
      paging: {
        offset: null,
        limit: null,
        total: null,
        totalPages: null,
        hasNext: null,
        hasPrev: null,
      },
    };
  }

  @Get('queue/stats')
  @ApiOperation({
    summary: 'Get billing queue statistics',
    description: 'Get current statistics for the contract billing queue',
  })
  @ApiResponse({
    status: 200,
    description: 'Queue statistics retrieved',
  })
  async getQueueStats() {
    const stats = await this.billingQueue.getQueueStats();

    return {
      data: stats,
      paging: {
        offset: null,
        limit: null,
        total: null,
        totalPages: null,
        hasNext: null,
        hasPrev: null,
      },
    };
  }
}
