import { Test, TestingModule } from '@nestjs/testing';
import {
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { ContractsService } from './contracts.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateContractDto, UpdateContractDto } from './dto';
import {
  BillingFrequency,
  ContractStatus,
  PaymentTerms,
} from './dto/create-contract.dto';
import { Prisma } from '@prisma/client';

describe('ContractsService', () => {
  let service: ContractsService;
  let prisma: PrismaService;

  const mockPrismaService = {
    contract: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    account: {
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ContractsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<ContractsService>(ContractsService);
    prisma = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  describe('create', () => {
    const mockAccount = {
      id: 'account-123',
      accountName: 'Test Account',
    };

    const createContractDto: CreateContractDto = {
      contractNumber: 'CNT-2024-0001',
      accountId: 'account-123',
      startDate: '2024-01-01',
      endDate: '2024-12-31',
      contractValue: 120000,
      billingFrequency: BillingFrequency.ANNUAL,
      paymentTerms: PaymentTerms.NET_30,
    };

    const mockCreatedContract = {
      id: 'contract-123',
      ...createContractDto,
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-12-31'),
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should create a contract successfully', async () => {
      mockPrismaService.account.findUnique.mockResolvedValue(mockAccount);
      mockPrismaService.contract.create.mockResolvedValue(mockCreatedContract);

      const result = await service.create(createContractDto);

      expect(result).toEqual({
        data: mockCreatedContract,
        paging: {
          offset: null,
          limit: null,
          total: null,
          totalPages: null,
          hasNext: null,
          hasPrev: null,
        },
      });
      expect(mockPrismaService.account.findUnique).toHaveBeenCalledWith({
        where: { id: 'account-123' },
      });
      expect(mockPrismaService.contract.create).toHaveBeenCalled();
    });

    it('should throw NotFoundException when account does not exist', async () => {
      mockPrismaService.account.findUnique.mockResolvedValue(null);

      await expect(service.create(createContractDto)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.create(createContractDto)).rejects.toThrow(
        'Account with ID account-123 not found',
      );
      expect(mockPrismaService.contract.create).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when end date is before start date', async () => {
      const invalidDto = {
        ...createContractDto,
        startDate: '2024-12-31',
        endDate: '2024-01-01',
      };

      mockPrismaService.account.findUnique.mockResolvedValue(mockAccount);

      await expect(service.create(invalidDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.create(invalidDto)).rejects.toThrow(
        'End date must be after start date',
      );
    });

    it('should throw ConflictException when contract number already exists', async () => {
      const prismaError = new Prisma.PrismaClientKnownRequestError(
        'Unique constraint failed',
        {
          code: 'P2002',
          clientVersion: '5.0.0',
        },
      );

      mockPrismaService.account.findUnique.mockResolvedValue(mockAccount);
      mockPrismaService.contract.create.mockRejectedValue(prismaError);

      await expect(service.create(createContractDto)).rejects.toThrow(
        ConflictException,
      );
      await expect(service.create(createContractDto)).rejects.toThrow(
        'Contract with this number already exists',
      );
    });
  });

  describe('findAll', () => {
    const mockContracts = [
      {
        id: 'contract-1',
        contractNumber: 'CNT-2024-0001',
        status: 'active',
        contractValue: '120000.00',
        account: {
          id: 'account-1',
          accountName: 'Test Account 1',
          status: 'active',
        },
        _count: { invoices: 5 },
      },
      {
        id: 'contract-2',
        contractNumber: 'CNT-2024-0002',
        status: 'draft',
        contractValue: '50000.00',
        account: {
          id: 'account-2',
          accountName: 'Test Account 2',
          status: 'active',
        },
        _count: { invoices: 0 },
      },
    ];

    it('should return paginated list of contracts', async () => {
      const query = { 'offset[eq]': 0, 'limit[eq]': 20 };

      mockPrismaService.contract.findMany.mockResolvedValue(mockContracts);
      mockPrismaService.contract.count.mockResolvedValue(2);

      const result = await service.findAll(query);

      expect(result.data).toEqual(mockContracts);
      expect(result.paging).toEqual({
        offset: 0,
        limit: 20,
        total: 2,
        totalPages: 1,
        hasNext: false,
        hasPrev: false,
      });
    });

    it('should filter by status using eq operator', async () => {
      const query = { 'status[eq]': 'active' };

      mockPrismaService.contract.findMany.mockResolvedValue([mockContracts[0]]);
      mockPrismaService.contract.count.mockResolvedValue(1);

      await service.findAll(query);

      expect(mockPrismaService.contract.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            status: 'active',
          },
        }),
      );
    });

    it('should filter by contract number using like operator', async () => {
      const query = { 'contractNumber[like]': 'CNT-2024' };

      mockPrismaService.contract.findMany.mockResolvedValue(mockContracts);
      mockPrismaService.contract.count.mockResolvedValue(2);

      await service.findAll(query);

      expect(mockPrismaService.contract.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            contractNumber: { contains: 'CNT-2024', mode: 'insensitive' },
          },
        }),
      );
    });

    it('should filter by account ID', async () => {
      const query = { 'accountId[eq]': 'account-1' };

      mockPrismaService.contract.findMany.mockResolvedValue([mockContracts[0]]);
      mockPrismaService.contract.count.mockResolvedValue(1);

      await service.findAll(query);

      expect(mockPrismaService.contract.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            accountId: 'account-1',
          },
        }),
      );
    });

    it('should filter by multiple statuses using in operator', async () => {
      const query = { 'status[in]': 'active,draft' };

      mockPrismaService.contract.findMany.mockResolvedValue(mockContracts);
      mockPrismaService.contract.count.mockResolvedValue(2);

      await service.findAll(query);

      expect(mockPrismaService.contract.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            status: { in: ['active', 'draft'] },
          },
        }),
      );
    });
  });

  describe('findOne', () => {
    const mockContract = {
      id: 'contract-1',
      contractNumber: 'CNT-2024-0001',
      status: 'active',
      account: {
        id: 'account-1',
        accountName: 'Test Account',
        primaryContactEmail: 'test@example.com',
        status: 'active',
      },
      invoices: [],
      _count: { invoices: 0 },
    };

    it('should return contract by ID', async () => {
      mockPrismaService.contract.findUnique.mockResolvedValue(mockContract);

      const result = await service.findOne('contract-1');

      expect(result).toEqual({
        data: mockContract,
        paging: {
          offset: null,
          limit: null,
          total: null,
          totalPages: null,
          hasNext: null,
          hasPrev: null,
        },
      });
      expect(mockPrismaService.contract.findUnique).toHaveBeenCalledWith({
        where: { id: 'contract-1' },
        include: expect.any(Object),
      });
    });

    it('should throw NotFoundException when contract does not exist', async () => {
      mockPrismaService.contract.findUnique.mockResolvedValue(null);

      await expect(service.findOne('non-existent')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findOne('non-existent')).rejects.toThrow(
        'Contract with ID non-existent not found',
      );
    });
  });

  describe('update', () => {
    const mockContract = {
      id: 'contract-1',
      contractNumber: 'CNT-2024-0001',
      status: 'active',
      account: { id: 'account-1' },
      invoices: [],
      _count: { invoices: 0 },
    };

    const mockAccount = {
      id: 'account-1',
      accountName: 'Test Account',
    };

    const updateContractDto: UpdateContractDto = {
      contractValue: 150000,
      status: ContractStatus.ACTIVE,
    };

    beforeEach(() => {
      mockPrismaService.contract.findUnique.mockResolvedValue(mockContract);
      mockPrismaService.account.findUnique.mockResolvedValue(mockAccount);
    });

    it('should update contract successfully', async () => {
      const updatedContract = { ...mockContract, ...updateContractDto };
      mockPrismaService.contract.update.mockResolvedValue(updatedContract);

      const result = await service.update('contract-1', updateContractDto);

      expect(result.data).toEqual(updatedContract);
      expect(mockPrismaService.contract.update).toHaveBeenCalledWith({
        where: { id: 'contract-1' },
        data: updateContractDto,
      });
    });

    it('should throw NotFoundException when contract does not exist', async () => {
      mockPrismaService.contract.findUnique.mockResolvedValueOnce(null);

      await expect(
        service.update('non-existent', updateContractDto),
      ).rejects.toThrow(NotFoundException);
    });

    it('should validate account when updating accountId', async () => {
      const updateWithAccount = { accountId: 'account-2' };

      mockPrismaService.account.findUnique.mockResolvedValueOnce({
        id: 'account-2',
      });
      mockPrismaService.contract.update.mockResolvedValue({
        ...mockContract,
        accountId: 'account-2',
      });

      await service.update('contract-1', updateWithAccount);

      expect(mockPrismaService.account.findUnique).toHaveBeenCalledWith({
        where: { id: 'account-2' },
      });
    });

    it('should throw NotFoundException when new account does not exist', async () => {
      jest.clearAllMocks();
      mockPrismaService.contract.findUnique.mockResolvedValueOnce(mockContract);
      mockPrismaService.account.findUnique.mockResolvedValueOnce(null);

      await expect(
        service.update('contract-1', { accountId: 'non-existent' }),
      ).rejects.toThrow(NotFoundException);

      expect(mockPrismaService.contract.update).not.toHaveBeenCalled();
    });

    it('should validate dates when updating both startDate and endDate', async () => {
      const invalidUpdate = {
        startDate: '2024-12-31',
        endDate: '2024-01-01',
      };

      await expect(
        service.update('contract-1', invalidUpdate),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.update('contract-1', invalidUpdate),
      ).rejects.toThrow('End date must be after start date');
    });

    it('should throw ConflictException when contract number already exists', async () => {
      const prismaError = new Prisma.PrismaClientKnownRequestError(
        'Unique constraint failed',
        {
          code: 'P2002',
          clientVersion: '5.0.0',
        },
      );

      mockPrismaService.contract.update.mockRejectedValue(prismaError);

      await expect(
        service.update('contract-1', { contractNumber: 'CNT-2024-0002' }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('remove', () => {
    const mockContract = {
      id: 'contract-1',
      contractNumber: 'CNT-2024-0001',
      account: {},
      invoices: [],
      _count: { invoices: 0 },
    };

    it('should delete contract successfully', async () => {
      mockPrismaService.contract.findUnique.mockResolvedValue(mockContract);
      mockPrismaService.contract.delete.mockResolvedValue(mockContract);

      await service.remove('contract-1');

      expect(mockPrismaService.contract.delete).toHaveBeenCalledWith({
        where: { id: 'contract-1' },
      });
    });

    it('should throw NotFoundException when contract does not exist', async () => {
      mockPrismaService.contract.findUnique.mockResolvedValue(null);

      await expect(service.remove('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
