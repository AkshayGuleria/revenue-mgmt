import { Test, TestingModule } from '@nestjs/testing';
import { BillingController } from './billing.controller';
import { BillingEngineService } from './services/billing-engine.service';
import { BillingQueueService } from './services/billing-queue.service';
import { ConsolidatedBillingService } from './services/consolidated-billing.service';
import { BillingPeriod } from './dto/generate-invoice.dto';
import { Decimal } from '@prisma/client/runtime/library';

describe('BillingController', () => {
  let controller: BillingController;
  let billingEngine: BillingEngineService;
  let billingQueue: BillingQueueService;
  let consolidatedBilling: ConsolidatedBillingService;

  const mockBillingEngine = {
    generateInvoiceFromContract: jest.fn(),
  };

  const mockBillingQueue = {
    queueContractInvoiceGeneration: jest.fn(),
    queueBatchContractBilling: jest.fn(),
    queueConsolidatedInvoiceGeneration: jest.fn(),
    getJobStatus: jest.fn(),
    getQueueStats: jest.fn(),
    getConsolidatedQueueStats: jest.fn(),
  };

  const mockConsolidatedBilling = {
    generateConsolidatedInvoice: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BillingController],
      providers: [
        {
          provide: BillingEngineService,
          useValue: mockBillingEngine,
        },
        {
          provide: BillingQueueService,
          useValue: mockBillingQueue,
        },
        {
          provide: ConsolidatedBillingService,
          useValue: mockConsolidatedBilling,
        },
      ],
    }).compile();

    controller = module.get<BillingController>(BillingController);
    billingEngine = module.get<BillingEngineService>(BillingEngineService);
    billingQueue = module.get<BillingQueueService>(BillingQueueService);
    consolidatedBilling = module.get<ConsolidatedBillingService>(
      ConsolidatedBillingService,
    );

    // Prevent unused variable warnings
    void billingEngine;
    void billingQueue;
    void consolidatedBilling;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('generateInvoice', () => {
    it('should generate invoice from contract without period dates', async () => {
      const dto = {
        contractId: 'contract-123',
      };

      const mockResult = {
        invoiceId: 'invoice-123',
        invoiceNumber: 'INV-2026-000001',
        total: new Decimal(30000),
      };

      mockBillingEngine.generateInvoiceFromContract.mockResolvedValue(
        mockResult,
      );

      const result = await controller.generateInvoice(dto);

      expect(result).toEqual({
        data: mockResult,
        paging: {
          offset: null,
          limit: null,
          total: null,
          totalPages: null,
          hasNext: null,
          hasPrev: null,
        },
      });

      expect(
        mockBillingEngine.generateInvoiceFromContract,
      ).toHaveBeenCalledWith({
        contractId: 'contract-123',
        periodStart: undefined,
        periodEnd: undefined,
      });
    });

    it('should generate invoice with period dates', async () => {
      const dto = {
        contractId: 'contract-456',
        periodStart: '2026-01-01',
        periodEnd: '2026-03-31',
      };

      const mockResult = {
        invoiceId: 'invoice-456',
        invoiceNumber: 'INV-2026-000002',
        total: new Decimal(30000),
      };

      mockBillingEngine.generateInvoiceFromContract.mockResolvedValue(
        mockResult,
      );

      const result = await controller.generateInvoice(dto);

      expect(result.data).toEqual(mockResult);
      expect(
        mockBillingEngine.generateInvoiceFromContract,
      ).toHaveBeenCalledWith({
        contractId: 'contract-456',
        periodStart: new Date('2026-01-01'),
        periodEnd: new Date('2026-03-31'),
      });
    });

    it('should handle only periodStart', async () => {
      const dto = {
        contractId: 'contract-789',
        periodStart: '2026-01-01',
      };

      const mockResult = {
        invoiceId: 'invoice-789',
        invoiceNumber: 'INV-2026-000003',
        total: new Decimal(15000),
      };

      mockBillingEngine.generateInvoiceFromContract.mockResolvedValue(
        mockResult,
      );

      await controller.generateInvoice(dto);

      expect(
        mockBillingEngine.generateInvoiceFromContract,
      ).toHaveBeenCalledWith({
        contractId: 'contract-789',
        periodStart: new Date('2026-01-01'),
        periodEnd: undefined,
      });
    });

    it('should handle only periodEnd', async () => {
      const dto = {
        contractId: 'contract-999',
        periodEnd: '2026-03-31',
      };

      const mockResult = {
        invoiceId: 'invoice-999',
        invoiceNumber: 'INV-2026-000004',
        total: new Decimal(15000),
      };

      mockBillingEngine.generateInvoiceFromContract.mockResolvedValue(
        mockResult,
      );

      await controller.generateInvoice(dto);

      expect(
        mockBillingEngine.generateInvoiceFromContract,
      ).toHaveBeenCalledWith({
        contractId: 'contract-999',
        periodStart: undefined,
        periodEnd: new Date('2026-03-31'),
      });
    });
  });

  describe('queueInvoiceGeneration', () => {
    it('should queue invoice generation without period dates', async () => {
      const dto = {
        contractId: 'contract-123',
      };

      mockBillingQueue.queueContractInvoiceGeneration.mockResolvedValue(
        'job-123',
      );

      const result = await controller.queueInvoiceGeneration(dto);

      expect(result).toEqual({
        data: {
          jobId: 'job-123',
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
      });

      expect(
        mockBillingQueue.queueContractInvoiceGeneration,
      ).toHaveBeenCalledWith({
        contractId: 'contract-123',
        periodStart: undefined,
        periodEnd: undefined,
      });
    });

    it('should queue invoice generation with period dates', async () => {
      const dto = {
        contractId: 'contract-456',
        periodStart: '2026-01-01',
        periodEnd: '2026-03-31',
      };

      mockBillingQueue.queueContractInvoiceGeneration.mockResolvedValue(
        'job-456',
      );

      const result = await controller.queueInvoiceGeneration(dto);

      expect(result.data.jobId).toBe('job-456');
      expect(
        mockBillingQueue.queueContractInvoiceGeneration,
      ).toHaveBeenCalledWith({
        contractId: 'contract-456',
        periodStart: '2026-01-01',
        periodEnd: '2026-03-31',
      });
    });
  });

  describe('queueBatchBilling', () => {
    it('should queue batch billing with default values', async () => {
      const dto = {};

      mockBillingQueue.queueBatchContractBilling.mockResolvedValue(
        'batch-job-123',
      );

      const result = await controller.queueBatchBilling(dto);

      expect(result).toEqual({
        data: {
          jobId: 'batch-job-123',
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
      });

      expect(mockBillingQueue.queueBatchContractBilling).toHaveBeenCalledWith({
        billingDate: expect.any(String),
        billingPeriod: 'monthly',
      });
    });

    it('should queue batch billing with custom values', async () => {
      const dto = {
        billingDate: '2026-01-01',
        billingPeriod: BillingPeriod.QUARTERLY,
      };

      mockBillingQueue.queueBatchContractBilling.mockResolvedValue(
        'batch-job-456',
      );

      const result = await controller.queueBatchBilling(dto);

      expect(result.data.jobId).toBe('batch-job-456');
      expect(mockBillingQueue.queueBatchContractBilling).toHaveBeenCalledWith({
        billingDate: '2026-01-01',
        billingPeriod: BillingPeriod.QUARTERLY,
      });
    });

    it('should queue batch billing with annual period', async () => {
      const dto = {
        billingDate: '2026-01-01',
        billingPeriod: BillingPeriod.ANNUAL,
      };

      mockBillingQueue.queueBatchContractBilling.mockResolvedValue(
        'batch-job-789',
      );

      await controller.queueBatchBilling(dto);

      expect(mockBillingQueue.queueBatchContractBilling).toHaveBeenCalledWith({
        billingDate: '2026-01-01',
        billingPeriod: BillingPeriod.ANNUAL,
      });
    });
  });

  describe('getJobStatus', () => {
    it('should return job status when job exists', async () => {
      const mockStatus = {
        jobId: 'job-123',
        state: 'completed',
        progress: 100,
        result: {
          invoiceId: 'invoice-123',
          invoiceNumber: 'INV-2026-000001',
        },
      };

      mockBillingQueue.getJobStatus.mockResolvedValue(mockStatus);

      const result = await controller.getJobStatus('job-123');

      expect(result).toEqual({
        data: mockStatus,
        paging: {
          offset: null,
          limit: null,
          total: null,
          totalPages: null,
          hasNext: null,
          hasPrev: null,
        },
      });

      expect(mockBillingQueue.getJobStatus).toHaveBeenCalledWith('job-123');
    });

    it('should return null when job does not exist', async () => {
      mockBillingQueue.getJobStatus.mockResolvedValue(null);

      const result = await controller.getJobStatus('job-999');

      expect(result).toEqual({
        data: null,
        paging: {
          offset: null,
          limit: null,
          total: null,
          totalPages: null,
          hasNext: null,
          hasPrev: null,
        },
      });

      expect(mockBillingQueue.getJobStatus).toHaveBeenCalledWith('job-999');
    });
  });

  describe('getQueueStats', () => {
    it('should return queue statistics', async () => {
      const mockStats = {
        queue: 'contract-billing',
        waiting: 5,
        active: 2,
        completed: 100,
        failed: 3,
        delayed: 0,
        total: 110,
      };

      mockBillingQueue.getQueueStats.mockResolvedValue(mockStats);

      const result = await controller.getQueueStats();

      expect(result).toEqual({
        data: mockStats,
        paging: {
          offset: null,
          limit: null,
          total: null,
          totalPages: null,
          hasNext: null,
          hasPrev: null,
        },
      });

      expect(mockBillingQueue.getQueueStats).toHaveBeenCalled();
    });
  });

  describe('generateConsolidatedInvoice', () => {
    it('should generate consolidated invoice synchronously', async () => {
      const dto = {
        parentAccountId: 'parent-123',
        periodStart: '2026-01-01',
        periodEnd: '2026-01-31',
        includeChildren: true,
      };

      const mockResult = {
        invoiceId: 'consolidated-invoice-123',
        invoiceNumber: 'CONS-INV-2026-000001',
        total: new Decimal(150000),
        subsidiariesIncluded: 2,
      };

      mockConsolidatedBilling.generateConsolidatedInvoice.mockResolvedValue(
        mockResult,
      );

      const result = await controller.generateConsolidatedInvoice(dto);

      expect(result).toEqual({
        data: mockResult,
        paging: {
          offset: null,
          limit: null,
          total: null,
          totalPages: null,
          hasNext: null,
          hasPrev: null,
        },
      });

      expect(
        mockConsolidatedBilling.generateConsolidatedInvoice,
      ).toHaveBeenCalledWith({
        parentAccountId: 'parent-123',
        periodStart: new Date('2026-01-01'),
        periodEnd: new Date('2026-01-31'),
        includeChildren: true,
      });
    });

    it('should default includeChildren to true when not provided', async () => {
      const dto = {
        parentAccountId: 'parent-456',
        periodStart: '2026-01-01',
        periodEnd: '2026-01-31',
      };

      const mockResult = {
        invoiceId: 'consolidated-invoice-456',
        invoiceNumber: 'CONS-INV-2026-000002',
        total: new Decimal(75000),
        subsidiariesIncluded: 1,
      };

      mockConsolidatedBilling.generateConsolidatedInvoice.mockResolvedValue(
        mockResult,
      );

      await controller.generateConsolidatedInvoice(dto);

      expect(
        mockConsolidatedBilling.generateConsolidatedInvoice,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          includeChildren: true,
        }),
      );
    });
  });

  describe('queueConsolidatedInvoiceGeneration', () => {
    it('should queue consolidated invoice generation', async () => {
      const dto = {
        parentAccountId: 'parent-789',
        periodStart: '2026-02-01',
        periodEnd: '2026-02-28',
        includeChildren: false,
      };

      mockBillingQueue.queueConsolidatedInvoiceGeneration.mockResolvedValue(
        'job-789',
      );

      const result = await controller.queueConsolidatedInvoiceGeneration(dto);

      expect(result).toEqual({
        data: {
          jobId: 'job-789',
          status: 'queued',
          message: 'Consolidated invoice generation job queued successfully',
        },
        paging: {
          offset: null,
          limit: null,
          total: null,
          totalPages: null,
          hasNext: null,
          hasPrev: null,
        },
      });

      expect(
        mockBillingQueue.queueConsolidatedInvoiceGeneration,
      ).toHaveBeenCalledWith({
        parentAccountId: 'parent-789',
        periodStart: '2026-02-01',
        periodEnd: '2026-02-28',
        includeChildren: false,
      });
    });
  });

  describe('getConsolidatedQueueStats', () => {
    it('should return consolidated billing queue statistics', async () => {
      const mockStats = {
        queue: 'consolidated-billing',
        waiting: 2,
        active: 1,
        completed: 45,
        failed: 1,
        delayed: 0,
        total: 49,
      };

      mockBillingQueue.getConsolidatedQueueStats.mockResolvedValue(mockStats);

      const result = await controller.getConsolidatedQueueStats();

      expect(result).toEqual({
        data: mockStats,
        paging: {
          offset: null,
          limit: null,
          total: null,
          totalPages: null,
          hasNext: null,
          hasPrev: null,
        },
      });

      expect(mockBillingQueue.getConsolidatedQueueStats).toHaveBeenCalled();
    });
  });
});
