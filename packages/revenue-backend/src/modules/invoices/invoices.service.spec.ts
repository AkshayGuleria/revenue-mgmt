import { Test, TestingModule } from '@nestjs/testing';
import { InvoicesService } from './invoices.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import {
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { CreateInvoiceDto, UpdateInvoiceDto, InvoiceStatus } from './dto';
import { Prisma } from '@prisma/client';

describe('InvoicesService', () => {
  let service: InvoicesService;
  let prisma: PrismaService;

  const mockPrismaService = {
    invoice: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    account: {
      findUnique: jest.fn(),
    },
    contract: {
      findUnique: jest.fn(),
    },
    invoiceItem: {
      create: jest.fn(),
      findUnique: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InvoicesService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<InvoicesService>(InvoicesService);
    prisma = module.get<PrismaService>(PrismaService);

    // Prevent unused variable warning
    void prisma;

    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createDto: CreateInvoiceDto = {
      invoiceNumber: 'INV-2024-0001',
      accountId: 'account-id-123',
      issueDate: '2024-01-01',
      dueDate: '2024-01-31',
      subtotal: 10000,
      tax: 800,
      discount: 500,
      total: 10300,
    };

    it('should create an invoice successfully', async () => {
      const mockAccount = { id: 'account-id-123' };
      const mockInvoice = {
        id: 'invoice-id-123',
        ...createDto,
        issueDate: new Date('2024-01-01'),
        dueDate: new Date('2024-01-31'),
        items: [],
      };

      mockPrismaService.account.findUnique.mockResolvedValue(mockAccount);
      mockPrismaService.invoice.create.mockResolvedValue(mockInvoice);

      const result = await service.create(createDto);

      expect(result.data).toEqual(mockInvoice);
      expect(result.paging).toEqual({
        offset: null,
        limit: null,
        total: null,
        totalPages: null,
        hasNext: null,
        hasPrev: null,
      });
      expect(mockPrismaService.account.findUnique).toHaveBeenCalledWith({
        where: { id: 'account-id-123' },
      });
    });

    it('should create invoice with line items', async () => {
      const dtoWithItems = {
        ...createDto,
        items: [
          {
            description: 'Enterprise Plan',
            quantity: 100,
            unitPrice: 99.99,
            amount: 9999,
          },
        ],
      };

      const mockAccount = { id: 'account-id-123' };
      const mockInvoice = {
        id: 'invoice-id-123',
        ...dtoWithItems,
        items: dtoWithItems.items,
      };

      mockPrismaService.account.findUnique.mockResolvedValue(mockAccount);
      mockPrismaService.invoice.create.mockResolvedValue(mockInvoice);

      const result = await service.create(dtoWithItems);

      expect(result.data).toEqual(mockInvoice);
    });

    it('should create invoice with contract reference', async () => {
      const dtoWithContract = {
        ...createDto,
        contractId: 'contract-id-123',
      };

      const mockAccount = { id: 'account-id-123' };
      const mockContract = {
        id: 'contract-id-123',
        accountId: 'account-id-123',
      };
      const mockInvoice = {
        id: 'invoice-id-123',
        ...dtoWithContract,
      };

      mockPrismaService.account.findUnique.mockResolvedValue(mockAccount);
      mockPrismaService.contract.findUnique.mockResolvedValue(mockContract);
      mockPrismaService.invoice.create.mockResolvedValue(mockInvoice);

      const result = await service.create(dtoWithContract);

      expect(result.data).toEqual(mockInvoice);
      expect(mockPrismaService.contract.findUnique).toHaveBeenCalledWith({
        where: { id: 'contract-id-123' },
      });
    });

    it('should throw NotFoundException if account not found', async () => {
      mockPrismaService.account.findUnique.mockResolvedValue(null);

      await expect(service.create(createDto)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.create(createDto)).rejects.toThrow(
        'Account with ID account-id-123 not found',
      );
    });

    it('should throw NotFoundException if contract not found', async () => {
      const dtoWithContract = {
        ...createDto,
        contractId: 'contract-id-123',
      };

      mockPrismaService.account.findUnique.mockResolvedValue({
        id: 'account-id-123',
      });
      mockPrismaService.contract.findUnique.mockResolvedValue(null);

      await expect(service.create(dtoWithContract)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.create(dtoWithContract)).rejects.toThrow(
        'Contract with ID contract-id-123 not found',
      );
    });

    it('should throw BadRequestException if contract does not belong to account', async () => {
      const dtoWithContract = {
        ...createDto,
        contractId: 'contract-id-123',
      };

      mockPrismaService.account.findUnique.mockResolvedValue({
        id: 'account-id-123',
      });
      mockPrismaService.contract.findUnique.mockResolvedValue({
        id: 'contract-id-123',
        accountId: 'different-account-id',
      });

      await expect(service.create(dtoWithContract)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.create(dtoWithContract)).rejects.toThrow(
        'Contract does not belong to the specified account',
      );
    });

    it('should throw BadRequestException if due date is before issue date', async () => {
      const invalidDto = {
        ...createDto,
        issueDate: '2024-01-31',
        dueDate: '2024-01-01',
      };

      mockPrismaService.account.findUnique.mockResolvedValue({
        id: 'account-id-123',
      });

      await expect(service.create(invalidDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.create(invalidDto)).rejects.toThrow(
        'Due date must be after issue date',
      );
    });

    it('should throw BadRequestException if total amount does not match calculation', async () => {
      const invalidDto = {
        ...createDto,
        total: 99999, // Wrong total
      };

      mockPrismaService.account.findUnique.mockResolvedValue({
        id: 'account-id-123',
      });

      await expect(service.create(invalidDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.create(invalidDto)).rejects.toThrow(
        /Total amount .* does not match calculated total/,
      );
    });

    it('should throw ConflictException if invoice number already exists', async () => {
      mockPrismaService.account.findUnique.mockResolvedValue({
        id: 'account-id-123',
      });

      const prismaError = new Prisma.PrismaClientKnownRequestError(
        'Unique constraint failed',
        {
          code: 'P2002',
          clientVersion: '5.0.0',
        },
      );
      mockPrismaService.invoice.create.mockRejectedValue(prismaError);

      await expect(service.create(createDto)).rejects.toThrow(
        ConflictException,
      );
      await expect(service.create(createDto)).rejects.toThrow(
        'Invoice with this number already exists',
      );
    });
  });

  describe('findAll', () => {
    it('should return paginated list of invoices', async () => {
      const query: any = {
        offset: { eq: '0' },
        limit: { eq: '20' },
      };

      const mockInvoices = [
        {
          id: 'invoice-id-1',
          invoiceNumber: 'INV-2024-0001',
          account: { id: 'account-1', accountName: 'Acme' },
          contract: { id: 'contract-1', contractNumber: 'CNT-001' },
          _count: { items: 3 },
        },
      ];

      mockPrismaService.invoice.findMany.mockResolvedValue(mockInvoices);
      mockPrismaService.invoice.count.mockResolvedValue(1);

      const result = await service.findAll(query);

      expect(result.data).toEqual(mockInvoices);
      expect(result.paging).toEqual({
        offset: 0,
        limit: 20,
        total: 1,
        totalPages: 1,
        hasNext: false,
        hasPrev: false,
      });
    });

    it('should filter invoices by query parameters', async () => {
      const query: any = {
        status: { eq: 'paid' },
        offset: { eq: '0' },
        limit: { eq: '20' },
      };

      mockPrismaService.invoice.findMany.mockResolvedValue([]);
      mockPrismaService.invoice.count.mockResolvedValue(0);

      await service.findAll(query);

      expect(mockPrismaService.invoice.findMany).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return invoice with details', async () => {
      const mockInvoice = {
        id: 'invoice-id-123',
        invoiceNumber: 'INV-2024-0001',
        account: {
          id: 'account-123',
          accountName: 'Acme',
        },
        contract: {
          id: 'contract-123',
          contractNumber: 'CNT-001',
        },
        items: [
          {
            id: 'item-1',
            description: 'Enterprise Plan',
            quantity: 100,
          },
        ],
        _count: { items: 1 },
      };

      mockPrismaService.invoice.findUnique.mockResolvedValue(mockInvoice);

      const result = await service.findOne('invoice-id-123');

      expect(result.data).toEqual(mockInvoice);
      expect(mockPrismaService.invoice.findUnique).toHaveBeenCalledWith({
        where: { id: 'invoice-id-123' },
        include: expect.any(Object),
      });
    });

    it('should throw NotFoundException if invoice not found', async () => {
      mockPrismaService.invoice.findUnique.mockResolvedValue(null);

      await expect(service.findOne('invalid-id')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findOne('invalid-id')).rejects.toThrow(
        'Invoice with ID invalid-id not found',
      );
    });
  });

  describe('update', () => {
    it('should update invoice successfully', async () => {
      const updateDto: UpdateInvoiceDto = {
        status: InvoiceStatus.PAID,
      };

      const mockExistingInvoice = {
        id: 'invoice-id-123',
        invoiceNumber: 'INV-2024-0001',
      };

      const mockUpdatedInvoice = {
        ...mockExistingInvoice,
        ...updateDto,
      };

      mockPrismaService.invoice.findUnique.mockResolvedValue(
        mockExistingInvoice,
      );
      mockPrismaService.invoice.update.mockResolvedValue(mockUpdatedInvoice);

      const result = await service.update('invoice-id-123', updateDto);

      expect(result.data).toEqual(mockUpdatedInvoice);
    });

    it('should validate account if accountId is updated', async () => {
      const updateDto: UpdateInvoiceDto = {
        accountId: 'new-account-id',
      };

      const mockExistingInvoice = {
        id: 'invoice-id-123',
        accountId: 'old-account-id',
      };

      const mockAccount = { id: 'new-account-id' };

      mockPrismaService.invoice.findUnique.mockResolvedValue(
        mockExistingInvoice,
      );
      mockPrismaService.account.findUnique.mockResolvedValue(mockAccount);
      mockPrismaService.invoice.update.mockResolvedValue({
        ...mockExistingInvoice,
        ...updateDto,
      });

      await service.update('invoice-id-123', updateDto);

      expect(mockPrismaService.account.findUnique).toHaveBeenCalledWith({
        where: { id: 'new-account-id' },
      });
    });

    it('should throw ConflictException if invoice number already exists', async () => {
      const updateDto: UpdateInvoiceDto = {
        invoiceNumber: 'INV-2024-9999',
      };

      mockPrismaService.invoice.findUnique.mockResolvedValue({
        id: 'invoice-id-123',
      });

      const prismaError = new Prisma.PrismaClientKnownRequestError(
        'Unique constraint failed',
        {
          code: 'P2002',
          clientVersion: '5.0.0',
        },
      );
      mockPrismaService.invoice.update.mockRejectedValue(prismaError);

      await expect(service.update('invoice-id-123', updateDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('remove', () => {
    it('should delete invoice successfully', async () => {
      const mockInvoice = {
        id: 'invoice-id-123',
        invoiceNumber: 'INV-2024-0001',
      };

      mockPrismaService.invoice.findUnique.mockResolvedValue(mockInvoice);
      mockPrismaService.invoice.delete.mockResolvedValue(mockInvoice);

      await service.remove('invoice-id-123');

      expect(mockPrismaService.invoice.delete).toHaveBeenCalledWith({
        where: { id: 'invoice-id-123' },
      });
    });

    it('should throw NotFoundException if invoice not found', async () => {
      mockPrismaService.invoice.findUnique.mockResolvedValue(null);

      await expect(service.remove('invalid-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('addLineItem', () => {
    it('should add line item to invoice successfully', async () => {
      const itemDto = {
        description: 'Enterprise Plan',
        quantity: 100,
        unitPrice: 99.99,
        amount: 9999,
      };

      const mockInvoice = {
        id: 'invoice-id-123',
        invoiceNumber: 'INV-2024-0001',
      };

      const mockItem = {
        id: 'item-id-123',
        invoiceId: 'invoice-id-123',
        ...itemDto,
      };

      mockPrismaService.invoice.findUnique.mockResolvedValue(mockInvoice);
      mockPrismaService.invoiceItem.create.mockResolvedValue(mockItem);

      const result = await service.addLineItem('invoice-id-123', itemDto);

      expect(result.data).toEqual(mockItem);
      expect(mockPrismaService.invoiceItem.create).toHaveBeenCalledWith({
        data: {
          ...itemDto,
          invoiceId: 'invoice-id-123',
        },
      });
    });

    it('should throw NotFoundException if invoice not found', async () => {
      const itemDto = {
        description: 'Enterprise Plan',
        quantity: 100,
        unitPrice: 99.99,
        amount: 9999,
      };

      mockPrismaService.invoice.findUnique.mockResolvedValue(null);

      await expect(service.addLineItem('invalid-id', itemDto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('removeLineItem', () => {
    it('should remove line item successfully', async () => {
      const mockInvoice = {
        id: 'invoice-id-123',
        invoiceNumber: 'INV-2024-0001',
      };

      const mockItem = {
        id: 'item-id-123',
        invoiceId: 'invoice-id-123',
      };

      mockPrismaService.invoice.findUnique.mockResolvedValue(mockInvoice);
      mockPrismaService.invoiceItem.findUnique.mockResolvedValue(mockItem);
      mockPrismaService.invoiceItem.delete.mockResolvedValue(mockItem);

      await service.removeLineItem('invoice-id-123', 'item-id-123');

      expect(mockPrismaService.invoiceItem.delete).toHaveBeenCalledWith({
        where: { id: 'item-id-123' },
      });
    });

    it('should throw NotFoundException if item not found', async () => {
      mockPrismaService.invoice.findUnique.mockResolvedValue({
        id: 'invoice-id-123',
      });
      mockPrismaService.invoiceItem.findUnique.mockResolvedValue(null);

      await expect(
        service.removeLineItem('invoice-id-123', 'invalid-item-id'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if item does not belong to invoice', async () => {
      mockPrismaService.invoice.findUnique.mockResolvedValue({
        id: 'invoice-id-123',
      });
      mockPrismaService.invoiceItem.findUnique.mockResolvedValue({
        id: 'item-id-123',
        invoiceId: 'different-invoice-id',
      });

      await expect(
        service.removeLineItem('invoice-id-123', 'item-id-123'),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.removeLineItem('invoice-id-123', 'item-id-123'),
      ).rejects.toThrow('Invoice item does not belong to invoice');
    });
  });

  describe('create - additional edge cases', () => {
    it('should throw BadRequestException if period end is before period start', async () => {
      const dto: CreateInvoiceDto = {
        invoiceNumber: 'INV-001',
        accountId: 'account-123',
        issueDate: '2024-01-01',
        dueDate: '2024-01-31',
        subtotal: 10000,
        total: 10000,
        periodStart: '2024-02-01',
        periodEnd: '2024-01-01', // End before start
      };

      mockPrismaService.account.findUnique.mockResolvedValue({
        id: 'account-123',
      });

      await expect(service.create(dto)).rejects.toThrow(BadRequestException);
      await expect(service.create(dto)).rejects.toThrow(
        'Period end date must be after period start date',
      );
    });

    it('should rethrow unknown errors during create', async () => {
      const dto: CreateInvoiceDto = {
        invoiceNumber: 'INV-001',
        accountId: 'account-123',
        issueDate: '2024-01-01',
        dueDate: '2024-01-31',
        subtotal: 10000,
        total: 10000,
      };

      mockPrismaService.account.findUnique.mockResolvedValue({
        id: 'account-123',
      });

      const unknownError = new Error('Database connection failed');
      mockPrismaService.invoice.create.mockRejectedValue(unknownError);

      await expect(service.create(dto)).rejects.toThrow(
        'Database connection failed',
      );
    });
  });

  describe('update - additional edge cases', () => {
    it('should throw NotFoundException if accountId is updated to non-existent account', async () => {
      const updateDto: UpdateInvoiceDto = {
        accountId: 'non-existent-account',
      };

      mockPrismaService.invoice.findUnique.mockResolvedValue({
        id: 'invoice-id-123',
      });
      mockPrismaService.account.findUnique.mockResolvedValue(null);

      await expect(service.update('invoice-id-123', updateDto)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.update('invoice-id-123', updateDto)).rejects.toThrow(
        'Account with ID non-existent-account not found',
      );
    });

    it('should throw NotFoundException if contractId is updated to non-existent contract', async () => {
      const updateDto: UpdateInvoiceDto = {
        contractId: 'non-existent-contract',
      };

      mockPrismaService.invoice.findUnique.mockResolvedValue({
        id: 'invoice-id-123',
      });
      mockPrismaService.contract.findUnique.mockResolvedValue(null);

      await expect(service.update('invoice-id-123', updateDto)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.update('invoice-id-123', updateDto)).rejects.toThrow(
        'Contract with ID non-existent-contract not found',
      );
    });

    it('should throw BadRequestException if contract does not belong to account when updating', async () => {
      const updateDto: UpdateInvoiceDto = {
        contractId: 'contract-123',
      };

      mockPrismaService.invoice.findUnique.mockResolvedValueOnce({
        id: 'invoice-id-123',
        accountId: 'account-123',
      });
      mockPrismaService.contract.findUnique.mockResolvedValue({
        id: 'contract-123',
        accountId: 'different-account', // Different account
      });

      await expect(service.update('invoice-id-123', updateDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.update('invoice-id-123', updateDto)).rejects.toThrow(
        'Contract does not belong to the specified account',
      );
    });

    it('should throw BadRequestException if due date is before issue date when updating', async () => {
      const updateDto: UpdateInvoiceDto = {
        issueDate: '2024-01-31',
        dueDate: '2024-01-01', // Due before issue
      };

      mockPrismaService.invoice.findUnique.mockResolvedValue({
        id: 'invoice-id-123',
      });

      await expect(service.update('invoice-id-123', updateDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.update('invoice-id-123', updateDto)).rejects.toThrow(
        'Due date must be after issue date',
      );
    });

    it('should throw BadRequestException if period end is before period start when updating', async () => {
      const updateDto: UpdateInvoiceDto = {
        periodStart: '2024-02-01',
        periodEnd: '2024-01-01', // End before start
      };

      mockPrismaService.invoice.findUnique.mockResolvedValue({
        id: 'invoice-id-123',
      });

      await expect(service.update('invoice-id-123', updateDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.update('invoice-id-123', updateDto)).rejects.toThrow(
        'Period end date must be after period start date',
      );
    });

    it('should rethrow unknown errors during update', async () => {
      const updateDto: UpdateInvoiceDto = {
        invoiceNumber: 'INV-2024-9999',
      };

      mockPrismaService.invoice.findUnique.mockResolvedValue({
        id: 'invoice-id-123',
      });

      const unknownError = new Error('Database connection failed');
      mockPrismaService.invoice.update.mockRejectedValue(unknownError);

      await expect(service.update('invoice-id-123', updateDto)).rejects.toThrow(
        'Database connection failed',
      );
    });
  });
});
