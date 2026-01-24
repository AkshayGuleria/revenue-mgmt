import { Test, TestingModule } from '@nestjs/testing';
import { BillingEngineService } from './billing-engine.service';
import { SeatCalculatorService } from './seat-calculator.service';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';
import { Decimal } from '@prisma/client/runtime/library';

describe('BillingEngineService', () => {
  let service: BillingEngineService;
  let prismaService: PrismaService;
  let seatCalculator: SeatCalculatorService;

  const mockPrismaService = {
    contract: {
      findUnique: jest.fn(),
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

  const mockSeatCalculator = {
    calculateSeatPricing: jest.fn(),
    calculateProration: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BillingEngineService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: SeatCalculatorService,
          useValue: mockSeatCalculator,
        },
      ],
    }).compile();

    service = module.get<BillingEngineService>(BillingEngineService);
    prismaService = module.get<PrismaService>(PrismaService);
    seatCalculator = module.get<SeatCalculatorService>(SeatCalculatorService);

    // Prevent unused variable warnings
    void prismaService;
    void seatCalculator;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateInvoiceFromContract', () => {
    const mockContract = {
      id: 'contract-123',
      contractNumber: 'CNT-2026-0001',
      accountId: 'account-123',
      startDate: new Date('2026-01-01'),
      endDate: new Date('2026-12-31'),
      contractValue: new Decimal(120000),
      billingFrequency: 'quarterly',
      seatCount: 50,
      committedSeats: 50,
      seatPrice: new Decimal(600),
      status: 'active',
      account: {
        id: 'account-123',
        accountName: 'Acme Corp',
        currency: 'USD',
        paymentTermsDays: 30,
      },
    };

    const mockInvoice = {
      id: 'invoice-123',
      invoiceNumber: 'INV-2026-000001',
      total: new Decimal(30000),
    };

    it('should throw NotFoundException if contract not found', async () => {
      mockPrismaService.contract.findUnique.mockResolvedValue(null);

      await expect(
        service.generateInvoiceFromContract({ contractId: 'invalid-id' }),
      ).rejects.toThrow(NotFoundException);

      expect(mockPrismaService.contract.findUnique).toHaveBeenCalledWith({
        where: { id: 'invalid-id' },
        include: { account: true },
      });
    });

    it('should throw error if contract is not active', async () => {
      mockPrismaService.contract.findUnique.mockResolvedValue({
        ...mockContract,
        status: 'expired',
      });

      await expect(
        service.generateInvoiceFromContract({ contractId: 'contract-123' }),
      ).rejects.toThrow('Contract contract-123 is not active');
    });

    it('should generate invoice with seat-based pricing', async () => {
      mockPrismaService.contract.findUnique.mockResolvedValue(mockContract);
      mockPrismaService.invoice.count.mockResolvedValue(0);

      mockSeatCalculator.calculateSeatPricing.mockReturnValue({
        seatCount: 50,
        pricePerSeat: new Decimal(600),
        subtotal: new Decimal(30000),
      });

      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        return callback({
          invoice: {
            create: jest.fn().mockResolvedValue(mockInvoice),
          },
          invoiceItem: {
            createMany: jest.fn(),
          },
        });
      });

      const result = await service.generateInvoiceFromContract({
        contractId: 'contract-123',
      });

      expect(result.invoiceId).toBe('invoice-123');
      expect(result.invoiceNumber).toBe('INV-2026-000001');
      expect(result.total.toString()).toBe('30000');
      expect(mockSeatCalculator.calculateSeatPricing).toHaveBeenCalledWith(
        50,
        mockContract.seatPrice,
        null,
      );
    });

    it('should generate invoice with fixed contract value', async () => {
      const fixedContract = {
        ...mockContract,
        seatCount: null,
        seatPrice: null,
        billingFrequency: 'annual',
      };

      mockPrismaService.contract.findUnique.mockResolvedValue(fixedContract);
      mockPrismaService.invoice.count.mockResolvedValue(0);

      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        return callback({
          invoice: {
            create: jest.fn().mockResolvedValue({
              ...mockInvoice,
              total: new Decimal(120000),
            }),
          },
          invoiceItem: {
            createMany: jest.fn(),
          },
        });
      });

      const result = await service.generateInvoiceFromContract({
        contractId: 'contract-123',
      });

      expect(result.total.toString()).toBe('120000');
      expect(mockSeatCalculator.calculateSeatPricing).not.toHaveBeenCalled();
    });

    it('should generate invoice number with correct format', async () => {
      mockPrismaService.contract.findUnique.mockResolvedValue(mockContract);
      mockPrismaService.invoice.count.mockResolvedValue(42);

      mockSeatCalculator.calculateSeatPricing.mockReturnValue({
        seatCount: 50,
        pricePerSeat: new Decimal(600),
        subtotal: new Decimal(30000),
      });

      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        const year = new Date().getFullYear();
        return callback({
          invoice: {
            create: jest.fn().mockResolvedValue({
              ...mockInvoice,
              invoiceNumber: `INV-${year}-000043`,
            }),
          },
          invoiceItem: {
            createMany: jest.fn(),
          },
        });
      });

      const result = await service.generateInvoiceFromContract({
        contractId: 'contract-123',
      });

      const year = new Date().getFullYear();
      expect(result.invoiceNumber).toBe(`INV-${year}-000043`);
    });

    it('should calculate due date based on payment terms', async () => {
      const contractWith60Days = {
        ...mockContract,
        account: {
          ...mockContract.account,
          paymentTermsDays: 60,
        },
      };

      mockPrismaService.contract.findUnique.mockResolvedValue(
        contractWith60Days,
      );
      mockPrismaService.invoice.count.mockResolvedValue(0);

      mockSeatCalculator.calculateSeatPricing.mockReturnValue({
        seatCount: 50,
        pricePerSeat: new Decimal(600),
        subtotal: new Decimal(30000),
      });

      let capturedDueDate: Date;
      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        return callback({
          invoice: {
            create: jest.fn().mockImplementation((data) => {
              capturedDueDate = data.data.dueDate;
              return Promise.resolve(mockInvoice);
            }),
          },
          invoiceItem: {
            createMany: jest.fn(),
          },
        });
      });

      await service.generateInvoiceFromContract({
        contractId: 'contract-123',
      });

      // Due date should be 60 days after issue date
      const issueDate = new Date();
      const expectedDueDate = new Date(issueDate);
      expectedDueDate.setDate(expectedDueDate.getDate() + 60);

      // Allow 1 day margin for test execution time
      const diff = Math.abs(
        capturedDueDate!.getTime() - expectedDueDate.getTime(),
      );
      expect(diff).toBeLessThan(86400000); // 1 day in milliseconds
    });

    it('should use custom period dates if provided', async () => {
      const periodStart = new Date('2026-01-01');
      const periodEnd = new Date('2026-03-31');

      mockPrismaService.contract.findUnique.mockResolvedValue(mockContract);
      mockPrismaService.invoice.count.mockResolvedValue(0);

      mockSeatCalculator.calculateSeatPricing.mockReturnValue({
        seatCount: 50,
        pricePerSeat: new Decimal(600),
        subtotal: new Decimal(30000),
      });

      let capturedPeriodStart: Date;
      let capturedPeriodEnd: Date;
      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        return callback({
          invoice: {
            create: jest.fn().mockImplementation((data) => {
              capturedPeriodStart = data.data.periodStart;
              capturedPeriodEnd = data.data.periodEnd;
              return Promise.resolve(mockInvoice);
            }),
          },
          invoiceItem: {
            createMany: jest.fn(),
          },
        });
      });

      await service.generateInvoiceFromContract({
        contractId: 'contract-123',
        periodStart,
        periodEnd,
      });

      expect(capturedPeriodStart).toEqual(periodStart);
      expect(capturedPeriodEnd).toEqual(periodEnd);
    });

    it('should create invoice items with correct line descriptions', async () => {
      mockPrismaService.contract.findUnique.mockResolvedValue(mockContract);
      mockPrismaService.invoice.count.mockResolvedValue(0);

      mockSeatCalculator.calculateSeatPricing.mockReturnValue({
        seatCount: 50,
        pricePerSeat: new Decimal(600),
        subtotal: new Decimal(30000),
      });

      let capturedLineItems: any[];
      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        return callback({
          invoice: {
            create: jest.fn().mockResolvedValue(mockInvoice),
          },
          invoiceItem: {
            createMany: jest.fn().mockImplementation((data) => {
              capturedLineItems = data.data;
              return Promise.resolve();
            }),
          },
        });
      });

      await service.generateInvoiceFromContract({
        contractId: 'contract-123',
      });

      expect(capturedLineItems).toHaveLength(1);
      expect(capturedLineItems[0].description).toBe(
        'Quarterly Subscription - 50 seats',
      );
      expect(capturedLineItems[0].quantity.toString()).toBe('50');
      expect(capturedLineItems[0].unitPrice.toString()).toBe('600');
      expect(capturedLineItems[0].amount.toString()).toBe('30000');
    });

    it('should handle monthly billing frequency', async () => {
      const monthlyContract = {
        ...mockContract,
        billingFrequency: 'monthly',
        seatCount: null,
        seatPrice: null,
      };

      mockPrismaService.contract.findUnique.mockResolvedValue(monthlyContract);
      mockPrismaService.invoice.count.mockResolvedValue(0);

      let capturedLineItems: any[];
      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        return callback({
          invoice: {
            create: jest.fn().mockResolvedValue(mockInvoice),
          },
          invoiceItem: {
            createMany: jest.fn().mockImplementation((data) => {
              capturedLineItems = data.data;
              return Promise.resolve();
            }),
          },
        });
      });

      await service.generateInvoiceFromContract({
        contractId: 'contract-123',
      });

      // Monthly = contractValue / 12
      const expectedAmount = new Decimal(120000).div(12);
      expect(capturedLineItems[0].amount.toString()).toBe(
        expectedAmount.toString(),
      );
      expect(capturedLineItems[0].description).toBe('Monthly Subscription');
    });

    it('should handle annual billing frequency', async () => {
      const annualContract = {
        ...mockContract,
        billingFrequency: 'annual',
        seatCount: null,
        seatPrice: null,
      };

      mockPrismaService.contract.findUnique.mockResolvedValue(annualContract);
      mockPrismaService.invoice.count.mockResolvedValue(0);

      let capturedLineItems: any[];
      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        return callback({
          invoice: {
            create: jest.fn().mockResolvedValue(mockInvoice),
          },
          invoiceItem: {
            createMany: jest.fn().mockImplementation((data) => {
              capturedLineItems = data.data;
              return Promise.resolve();
            }),
          },
        });
      });

      await service.generateInvoiceFromContract({
        contractId: 'contract-123',
      });

      // Annual = full contractValue
      expect(capturedLineItems[0].amount.toString()).toBe('120000');
      expect(capturedLineItems[0].description).toBe('Annual Subscription');
    });
  });
});
