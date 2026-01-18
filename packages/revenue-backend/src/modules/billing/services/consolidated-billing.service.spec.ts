import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { ConsolidatedBillingService } from './consolidated-billing.service';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { Decimal } from '@prisma/client/runtime/library';

describe('ConsolidatedBillingService', () => {
  let service: ConsolidatedBillingService;
  let prisma: PrismaService;

  const mockPrismaService = {
    account: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
    contract: {
      findMany: jest.fn(),
    },
    invoice: {
      create: jest.fn(),
      count: jest.fn(),
    },
    invoiceItem: {
      createMany: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConsolidatedBillingService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<ConsolidatedBillingService>(ConsolidatedBillingService);
    prisma = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateConsolidatedInvoice', () => {
    it('should generate consolidated invoice for parent and subsidiaries', async () => {
      const parentAccount = {
        id: 'parent-id',
        accountName: 'Parent Corp',
        currency: 'USD',
        paymentTermsDays: 30,
        creditHold: false,
        deletedAt: null,
      };

      const subsidiaries = [
        { id: 'sub-1', accountName: 'Subsidiary 1', parentAccountId: 'parent-id' },
        { id: 'sub-2', accountName: 'Subsidiary 2', parentAccountId: 'parent-id' },
      ];

      const contracts = [
        {
          id: 'contract-1',
          contractNumber: 'CNT-001',
          accountId: 'parent-id',
          status: 'active',
          contractValue: new Decimal(120000),
          billingFrequency: 'annual',
          seatCount: 10,
          seatPrice: new Decimal(1000),
          account: { id: 'parent-id', accountName: 'Parent Corp' },
        },
        {
          id: 'contract-2',
          contractNumber: 'CNT-002',
          accountId: 'sub-1',
          status: 'active',
          contractValue: new Decimal(60000),
          billingFrequency: 'annual',
          seatCount: 5,
          seatPrice: new Decimal(1000),
          account: { id: 'sub-1', accountName: 'Subsidiary 1' },
        },
      ];

      const createdInvoice = {
        id: 'invoice-id',
        invoiceNumber: 'INV-202601-00001',
        total: new Decimal(15000),
      };

      jest.spyOn(prisma.account, 'findUnique').mockResolvedValueOnce(parentAccount as any);
      // Mock for getDescendantAccounts - first level
      jest.spyOn(prisma.account, 'findMany').mockResolvedValueOnce(subsidiaries as any);
      // Mock for getDescendantAccounts - second level (sub-1 has no children)
      jest.spyOn(prisma.account, 'findMany').mockResolvedValueOnce([]);
      // Mock for getDescendantAccounts - second level (sub-2 has no children)
      jest.spyOn(prisma.account, 'findMany').mockResolvedValueOnce([]);
      jest.spyOn(prisma.contract, 'findMany').mockResolvedValueOnce(contracts as any);
      jest.spyOn(prisma.invoice, 'count').mockResolvedValueOnce(0);

      // Mock transaction
      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        const mockTx = {
          invoice: {
            create: jest.fn().mockResolvedValueOnce(createdInvoice),
          },
          invoiceItem: {
            createMany: jest.fn().mockResolvedValueOnce({ count: 2 }),
          },
        };
        return callback(mockTx);
      });

      const result = await service.generateConsolidatedInvoice({
        parentAccountId: 'parent-id',
        periodStart: new Date('2026-01-01'),
        periodEnd: new Date('2026-01-31'),
        includeChildren: true,
      });

      expect(result.invoiceId).toBe('invoice-id');
      expect(result.invoiceNumber).toBe('INV-202601-00001');
      expect(result.subsidiariesIncluded).toBe(2);
      expect(prisma.contract.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: [
              { accountId: { in: ['parent-id', 'sub-1', 'sub-2'] } },
              { shares: { some: { accountId: { in: ['parent-id', 'sub-1', 'sub-2'] } } } },
            ],
          }),
        }),
      );
    });

    it('should throw NotFoundException if parent account not found', async () => {
      jest.spyOn(prisma.account, 'findUnique').mockResolvedValueOnce(null);

      await expect(
        service.generateConsolidatedInvoice({
          parentAccountId: 'invalid-id',
          periodStart: new Date('2026-01-01'),
          periodEnd: new Date('2026-01-31'),
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if account is on credit hold', async () => {
      const parentAccount = {
        id: 'parent-id',
        creditHold: true,
        deletedAt: null,
      };

      jest.spyOn(prisma.account, 'findUnique').mockResolvedValueOnce(parentAccount as any);

      await expect(
        service.generateConsolidatedInvoice({
          parentAccountId: 'parent-id',
          periodStart: new Date('2026-01-01'),
          periodEnd: new Date('2026-01-31'),
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if no active contracts found', async () => {
      const parentAccount = {
        id: 'parent-id',
        creditHold: false,
        deletedAt: null,
      };

      jest.spyOn(prisma.account, 'findUnique').mockResolvedValueOnce(parentAccount as any);
      jest.spyOn(prisma.account, 'findMany').mockResolvedValueOnce([]); // No descendants
      jest.spyOn(prisma.contract, 'findMany').mockResolvedValueOnce([]); // No contracts

      await expect(
        service.generateConsolidatedInvoice({
          parentAccountId: 'parent-id',
          periodStart: new Date('2026-01-01'),
          periodEnd: new Date('2026-01-31'),
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should generate invoice for parent only when includeChildren is false', async () => {
      const parentAccount = {
        id: 'parent-id',
        accountName: 'Parent Corp',
        currency: 'USD',
        paymentTermsDays: 30,
        creditHold: false,
        deletedAt: null,
      };

      const contracts = [
        {
          id: 'contract-1',
          contractNumber: 'CNT-001',
          accountId: 'parent-id',
          status: 'active',
          contractValue: new Decimal(120000),
          billingFrequency: 'annual',
          seatCount: 10,
          seatPrice: new Decimal(1000),
          account: { id: 'parent-id', accountName: 'Parent Corp' },
        },
      ];

      const createdInvoice = {
        id: 'invoice-id',
        invoiceNumber: 'INV-202601-00001',
        total: new Decimal(10000),
      };

      jest.spyOn(prisma.account, 'findUnique').mockResolvedValueOnce(parentAccount as any);
      // includeChildren is false, so no getDescendantAccounts call
      jest.spyOn(prisma.contract, 'findMany').mockResolvedValueOnce(contracts as any);
      jest.spyOn(prisma.invoice, 'count').mockResolvedValueOnce(0);

      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        const mockTx = {
          invoice: {
            create: jest.fn().mockResolvedValueOnce(createdInvoice),
          },
          invoiceItem: {
            createMany: jest.fn().mockResolvedValueOnce({ count: 1 }),
          },
        };
        return callback(mockTx);
      });

      const result = await service.generateConsolidatedInvoice({
        parentAccountId: 'parent-id',
        periodStart: new Date('2026-01-01'),
        periodEnd: new Date('2026-01-31'),
        includeChildren: false,
      });

      expect(result.subsidiariesIncluded).toBe(0);
      expect(prisma.contract.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: [
              { accountId: { in: ['parent-id'] } },
              { shares: { some: { accountId: { in: ['parent-id'] } } } },
            ],
          }),
        }),
      );
    });
  });
});
