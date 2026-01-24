import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import { ContractBillingProcessor } from './contract-billing.processor';
import { BillingEngineService } from '../services/billing-engine.service';
import { Job } from 'bullmq';
import { Decimal } from '@prisma/client/runtime/library';

describe('ContractBillingProcessor', () => {
  let processor: ContractBillingProcessor;
  let billingEngine: BillingEngineService;

  const mockBillingEngine = {
    generateInvoiceFromContract: jest.fn(),
  };

  beforeEach(async () => {
    // Mock logger to suppress console output during tests
    jest.spyOn(Logger.prototype, 'log').mockImplementation();
    jest.spyOn(Logger.prototype, 'error').mockImplementation();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ContractBillingProcessor,
        {
          provide: BillingEngineService,
          useValue: mockBillingEngine,
        },
      ],
    }).compile();

    processor = module.get<ContractBillingProcessor>(ContractBillingProcessor);
    billingEngine = module.get<BillingEngineService>(BillingEngineService);

    // Prevent unused variable warning
    void billingEngine;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(processor).toBeDefined();
  });

  describe('process - generate-contract-invoice', () => {
    it('should process single contract invoice generation job', async () => {
      const jobData = {
        contractId: 'contract-123',
      };

      const mockJob = {
        id: 'job-123',
        name: 'generate-contract-invoice',
        data: jobData,
      } as Job;

      const mockResult = {
        invoiceId: 'invoice-123',
        invoiceNumber: 'INV-2026-000001',
        total: new Decimal(30000),
      };

      mockBillingEngine.generateInvoiceFromContract.mockResolvedValue(
        mockResult,
      );

      const result = await processor.process(mockJob);

      expect(result).toEqual(mockResult);
      expect(
        mockBillingEngine.generateInvoiceFromContract,
      ).toHaveBeenCalledWith({
        contractId: 'contract-123',
        periodStart: undefined,
        periodEnd: undefined,
      });
    });

    it('should process job with period dates', async () => {
      const jobData = {
        contractId: 'contract-456',
        periodStart: '2026-01-01',
        periodEnd: '2026-03-31',
      };

      const mockJob = {
        id: 'job-456',
        name: 'generate-contract-invoice',
        data: jobData,
      } as Job;

      const mockResult = {
        invoiceId: 'invoice-456',
        invoiceNumber: 'INV-2026-000002',
        total: new Decimal(30000),
      };

      mockBillingEngine.generateInvoiceFromContract.mockResolvedValue(
        mockResult,
      );

      const result = await processor.process(mockJob);

      expect(result).toEqual(mockResult);
      expect(
        mockBillingEngine.generateInvoiceFromContract,
      ).toHaveBeenCalledWith({
        contractId: 'contract-456',
        periodStart: new Date('2026-01-01'),
        periodEnd: new Date('2026-03-31'),
      });
    });

    it('should throw error if invoice generation fails', async () => {
      const jobData = {
        contractId: 'invalid-contract',
      };

      const mockJob = {
        id: 'job-789',
        name: 'generate-contract-invoice',
        data: jobData,
      } as Job;

      mockBillingEngine.generateInvoiceFromContract.mockRejectedValue(
        new Error('Contract not found'),
      );

      await expect(processor.process(mockJob)).rejects.toThrow(
        'Contract not found',
      );
    });
  });

  describe('process - batch-contract-billing', () => {
    it('should process batch contract billing job', async () => {
      const jobData = {
        billingDate: '2026-01-01',
        billingPeriod: 'monthly' as const,
      };

      const mockJob = {
        id: 'batch-job-123',
        name: 'batch-contract-billing',
        data: jobData,
      } as Job;

      const result = await processor.process(mockJob);

      // Current implementation returns placeholder
      expect(result).toEqual({
        processedCount: 0,
        failedCount: 0,
        message: 'Batch billing not yet implemented',
      });
    });

    it('should handle quarterly batch billing', async () => {
      const jobData = {
        billingDate: '2026-04-01',
        billingPeriod: 'quarterly' as const,
      };

      const mockJob = {
        id: 'batch-job-456',
        name: 'batch-contract-billing',
        data: jobData,
      } as Job;

      const result = await processor.process(mockJob);

      expect(result.message).toBe('Batch billing not yet implemented');
    });

    it('should handle annual batch billing', async () => {
      const jobData = {
        billingDate: '2026-01-01',
        billingPeriod: 'annual' as const,
      };

      const mockJob = {
        id: 'batch-job-789',
        name: 'batch-contract-billing',
        data: jobData,
      } as Job;

      const result = await processor.process(mockJob);

      expect(result.message).toBe('Batch billing not yet implemented');
    });
  });

  describe('process - unknown job type', () => {
    it('should throw error for unknown job type', async () => {
      const mockJob = {
        id: 'job-unknown',
        name: 'unknown-job-type',
        data: {},
      } as Job;

      await expect(processor.process(mockJob)).rejects.toThrow(
        'Unknown job type: unknown-job-type',
      );
    });
  });

  describe('event handlers', () => {
    it('should handle onCompleted event', () => {
      const mockJob = {
        id: 'job-123',
        name: 'generate-contract-invoice',
      } as Job;

      // Should not throw
      expect(() => processor.onCompleted(mockJob)).not.toThrow();
    });

    it('should handle onFailed event', () => {
      const mockJob = {
        id: 'job-456',
        name: 'generate-contract-invoice',
      } as Job;

      const error = new Error('Processing failed');

      // Should not throw
      expect(() => processor.onFailed(mockJob, error)).not.toThrow();
    });

    it('should handle onActive event', () => {
      const mockJob = {
        id: 'job-789',
        name: 'generate-contract-invoice',
      } as Job;

      // Should not throw
      expect(() => processor.onActive(mockJob)).not.toThrow();
    });
  });
});
