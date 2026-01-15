import { Test, TestingModule } from '@nestjs/testing';
import {
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { AccountsService } from './accounts.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateAccountDto, UpdateAccountDto } from './dto';
import { AccountType, PaymentTerms } from './dto/create-account.dto';
import { AccountStatus } from './dto/update-account.dto';
import { Prisma } from '@prisma/client';

describe('AccountsService', () => {
  let service: AccountsService;
  let prisma: PrismaService;

  const mockPrismaService = {
    account: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AccountsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<AccountsService>(AccountsService);
    prisma = module.get<PrismaService>(PrismaService);

    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createAccountDto: CreateAccountDto = {
      accountName: 'Acme Corporation',
      primaryContactEmail: 'contact@acme.com',
      accountType: AccountType.ENTERPRISE,
      paymentTerms: PaymentTerms.NET_30,
      currency: 'USD',
    };

    const mockCreatedAccount = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      ...createAccountDto,
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    };

    it('should create a new account successfully', async () => {
      mockPrismaService.account.create.mockResolvedValue(mockCreatedAccount);

      const result = await service.create(createAccountDto);

      expect(result).toEqual({
        data: mockCreatedAccount,
        paging: {
          offset: null,
          limit: null,
          total: null,
          totalPages: null,
          hasNext: null,
          hasPrev: null,
        },
      });
      expect(mockPrismaService.account.create).toHaveBeenCalledWith({
        data: {
          ...createAccountDto,
          parentAccountId: undefined,
        },
      });
    });

    it('should create account with parent', async () => {
      const parentId = 'parent-123';
      const createWithParent = {
        ...createAccountDto,
        parentAccountId: parentId,
      };
      const mockParent = { id: parentId, accountName: 'Parent Corp' };

      mockPrismaService.account.findUnique.mockResolvedValue(mockParent);
      mockPrismaService.account.create.mockResolvedValue({
        ...mockCreatedAccount,
        parentAccountId: parentId,
      });

      const result = await service.create(createWithParent);

      expect(mockPrismaService.account.findUnique).toHaveBeenCalledWith({
        where: { id: parentId },
      });
      expect(result.data.parentAccountId).toBe(parentId);
    });

    it('should throw NotFoundException when parent account does not exist', async () => {
      const createWithParent = {
        ...createAccountDto,
        parentAccountId: 'non-existent-parent',
      };

      mockPrismaService.account.findUnique.mockResolvedValue(null);

      await expect(service.create(createWithParent)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.create(createWithParent)).rejects.toThrow(
        'Parent account with ID non-existent-parent not found',
      );
    });

    it('should throw ConflictException when email already exists', async () => {
      const prismaError = new Prisma.PrismaClientKnownRequestError(
        'Unique constraint failed',
        {
          code: 'P2002',
          clientVersion: '5.0.0',
        },
      );

      mockPrismaService.account.create.mockRejectedValue(prismaError);

      await expect(service.create(createAccountDto)).rejects.toThrow(
        ConflictException,
      );
      await expect(service.create(createAccountDto)).rejects.toThrow(
        'Account with this email already exists',
      );
    });
  });

  describe('findAll', () => {
    const mockAccounts = [
      {
        id: 'account-1',
        accountName: 'Acme Corp',
        status: 'active',
        accountType: 'enterprise',
        parent: null,
        _count: { children: 2, contracts: 5, invoices: 10 },
      },
      {
        id: 'account-2',
        accountName: 'Tech Startup',
        status: 'active',
        accountType: 'startup',
        parent: null,
        _count: { children: 0, contracts: 1, invoices: 3 },
      },
    ];

    it('should return paginated list of accounts', async () => {
      const query = { 'offset[eq]': 0, 'limit[eq]': 20 };

      mockPrismaService.account.findMany.mockResolvedValue(mockAccounts);
      mockPrismaService.account.count.mockResolvedValue(2);

      const result = await service.findAll(query);

      expect(result.data).toEqual(mockAccounts);
      expect(result.paging).toEqual({
        offset: 0,
        limit: 20,
        total: 2,
        totalPages: 1,
        hasNext: false,
        hasPrev: false,
      });
      expect(mockPrismaService.account.findMany).toHaveBeenCalledWith({
        where: { deletedAt: null },
        skip: 0,
        take: 20,
        orderBy: { createdAt: 'desc' },
        include: expect.any(Object),
      });
    });

    it('should filter by status using eq operator', async () => {
      const query = { 'status[eq]': 'active' };

      mockPrismaService.account.findMany.mockResolvedValue([mockAccounts[0]]);
      mockPrismaService.account.count.mockResolvedValue(1);

      await service.findAll(query);

      expect(mockPrismaService.account.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            status: 'active',
            deletedAt: null,
          },
        }),
      );
    });

    it('should filter by account name using like operator', async () => {
      const query = { 'accountName[like]': 'acme' };

      mockPrismaService.account.findMany.mockResolvedValue([mockAccounts[0]]);
      mockPrismaService.account.count.mockResolvedValue(1);

      await service.findAll(query);

      expect(mockPrismaService.account.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            accountName: { contains: 'acme', mode: 'insensitive' },
            deletedAt: null,
          },
        }),
      );
    });

    it('should filter by multiple statuses using in operator', async () => {
      const query = { 'status[in]': 'active,suspended' };

      mockPrismaService.account.findMany.mockResolvedValue(mockAccounts);
      mockPrismaService.account.count.mockResolvedValue(2);

      await service.findAll(query);

      expect(mockPrismaService.account.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            status: { in: ['active', 'suspended'] },
            deletedAt: null,
          },
        }),
      );
    });

    it('should filter accounts without parent using null operator', async () => {
      const query = { 'parentAccountId[null]': true };

      mockPrismaService.account.findMany.mockResolvedValue(mockAccounts);
      mockPrismaService.account.count.mockResolvedValue(2);

      await service.findAll(query);

      expect(mockPrismaService.account.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            parentAccountId: null,
            deletedAt: null,
          },
        }),
      );
    });

    it('should handle pagination correctly', async () => {
      const query = { 'offset[eq]': 20, 'limit[eq]': 10 };

      mockPrismaService.account.findMany.mockResolvedValue(mockAccounts);
      mockPrismaService.account.count.mockResolvedValue(45);

      const result = await service.findAll(query);

      expect(result.paging).toEqual({
        offset: 20,
        limit: 10,
        total: 45,
        totalPages: 5,
        hasNext: true,
        hasPrev: true,
      });
    });

    it('should always exclude soft-deleted accounts', async () => {
      const query = {};

      mockPrismaService.account.findMany.mockResolvedValue([]);
      mockPrismaService.account.count.mockResolvedValue(0);

      await service.findAll(query);

      expect(mockPrismaService.account.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            deletedAt: null,
          }),
        }),
      );
    });
  });

  describe('findOne', () => {
    const mockAccount = {
      id: 'account-1',
      accountName: 'Acme Corp',
      status: 'active',
      deletedAt: null,
      parent: null,
      children: [],
      contracts: [],
      _count: { children: 0, contracts: 0, invoices: 0 },
    };

    it('should return account by ID', async () => {
      mockPrismaService.account.findUnique.mockResolvedValue(mockAccount);

      const result = await service.findOne('account-1');

      expect(result).toEqual({
        data: mockAccount,
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
        where: { id: 'account-1' },
        include: expect.any(Object),
      });
    });

    it('should throw NotFoundException when account does not exist', async () => {
      mockPrismaService.account.findUnique.mockResolvedValue(null);

      await expect(service.findOne('non-existent')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findOne('non-existent')).rejects.toThrow(
        'Account with ID non-existent not found',
      );
    });

    it('should throw NotFoundException when account is soft-deleted', async () => {
      const deletedAccount = {
        ...mockAccount,
        deletedAt: new Date(),
      };
      mockPrismaService.account.findUnique.mockResolvedValue(deletedAccount);

      await expect(service.findOne('account-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    const mockAccount = {
      id: 'account-1',
      accountName: 'Acme Corp',
      status: 'active',
      deletedAt: null,
    };

    const updateAccountDto: UpdateAccountDto = {
      accountName: 'Acme Corporation Updated',
      status: AccountStatus.ACTIVE,
    };

    beforeEach(() => {
      // Mock findOne call that update() uses internally
      mockPrismaService.account.findUnique.mockResolvedValue(mockAccount);
    });

    it('should update account successfully', async () => {
      const updatedAccount = { ...mockAccount, ...updateAccountDto };
      mockPrismaService.account.update.mockResolvedValue(updatedAccount);

      const result = await service.update('account-1', updateAccountDto);

      expect(result.data).toEqual(updatedAccount);
      expect(mockPrismaService.account.update).toHaveBeenCalledWith({
        where: { id: 'account-1' },
        data: updateAccountDto,
      });
    });

    it('should throw NotFoundException when account does not exist', async () => {
      mockPrismaService.account.findUnique.mockResolvedValueOnce(null);

      await expect(
        service.update('non-existent', updateAccountDto),
      ).rejects.toThrow(NotFoundException);
    });

    it('should validate parent account when updating parentAccountId', async () => {
      const parentId = 'parent-123';
      const mockParent = { id: parentId, accountName: 'Parent Corp' };

      mockPrismaService.account.findUnique
        .mockResolvedValueOnce(mockAccount) // findOne check
        .mockResolvedValueOnce(mockParent) // parent validation
        .mockResolvedValueOnce({ parentAccountId: null }); // circular check

      mockPrismaService.account.update.mockResolvedValue({
        ...mockAccount,
        parentAccountId: parentId,
      });

      await service.update('account-1', { parentAccountId: parentId });

      expect(mockPrismaService.account.update).toHaveBeenCalled();
    });

    it('should throw NotFoundException when parent account does not exist', async () => {
      jest.clearAllMocks(); // Clear previous mocks
      mockPrismaService.account.findUnique
        .mockResolvedValueOnce(mockAccount) // findOne check
        .mockResolvedValueOnce(null); // parent validation (returns null, should throw)

      await expect(
        service.update('account-1', { parentAccountId: 'non-existent' }),
      ).rejects.toThrow(NotFoundException);

      expect(mockPrismaService.account.update).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when trying to set self as parent', async () => {
      mockPrismaService.account.findUnique.mockResolvedValueOnce(mockAccount);

      await expect(
        service.update('account-1', { parentAccountId: 'account-1' }),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.update('account-1', { parentAccountId: 'account-1' }),
      ).rejects.toThrow('Account cannot be its own parent');
    });

    it('should detect circular hierarchy', async () => {
      const childId = 'child-123';

      jest.clearAllMocks(); // Clear previous mocks

      // Mock account structure: trying to set account-1's parent to child-123
      // where child-123 has account-1 as its parent (creating a circle)
      mockPrismaService.account.findUnique
        .mockResolvedValueOnce(mockAccount) // findOne check
        .mockResolvedValueOnce({ id: childId }) // parent validation - child exists
        .mockResolvedValueOnce({ parentAccountId: 'account-1' }); // circular check - child's parent is account-1

      await expect(
        service.update('account-1', { parentAccountId: childId }),
      ).rejects.toThrow(BadRequestException);

      expect(mockPrismaService.account.update).not.toHaveBeenCalled();
    });

    it('should throw ConflictException when email already exists', async () => {
      const prismaError = new Prisma.PrismaClientKnownRequestError(
        'Unique constraint failed',
        {
          code: 'P2002',
          clientVersion: '5.0.0',
        },
      );

      mockPrismaService.account.update.mockRejectedValue(prismaError);

      await expect(
        service.update('account-1', {
          primaryContactEmail: 'existing@email.com',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('remove', () => {
    const mockAccount = {
      id: 'account-1',
      accountName: 'Acme Corp',
      status: 'active',
      deletedAt: null,
    };

    it('should soft delete account', async () => {
      mockPrismaService.account.findUnique.mockResolvedValue(mockAccount);
      mockPrismaService.account.update.mockResolvedValue({
        ...mockAccount,
        deletedAt: new Date(),
        status: 'inactive',
      });

      await service.remove('account-1');

      expect(mockPrismaService.account.update).toHaveBeenCalledWith({
        where: { id: 'account-1' },
        data: {
          deletedAt: expect.any(Date),
          status: 'inactive',
        },
      });
    });

    it('should throw NotFoundException when account does not exist', async () => {
      mockPrismaService.account.findUnique.mockResolvedValue(null);

      await expect(service.remove('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException when account is already deleted', async () => {
      mockPrismaService.account.findUnique.mockResolvedValue({
        ...mockAccount,
        deletedAt: new Date(),
      });

      await expect(service.remove('account-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('checkCircularHierarchy', () => {
    it('should allow valid parent-child relationship', async () => {
      mockPrismaService.account.findUnique
        .mockResolvedValueOnce({ id: 'account-1', deletedAt: null }) // findOne
        .mockResolvedValueOnce({ id: 'parent-1' }) // parent validation
        .mockResolvedValueOnce({ parentAccountId: null }); // circular check

      mockPrismaService.account.update.mockResolvedValue({
        id: 'account-1',
        parentAccountId: 'parent-1',
      });

      await expect(
        service.update('account-1', { parentAccountId: 'parent-1' }),
      ).resolves.toBeDefined();
    });

    it('should detect multi-level circular hierarchy', async () => {
      // Structure: A -> B -> C, trying to set C's parent to A
      mockPrismaService.account.findUnique
        .mockResolvedValueOnce({ id: 'account-A', deletedAt: null }) // findOne
        .mockResolvedValueOnce({ id: 'account-C' }) // parent validation
        .mockResolvedValueOnce({ parentAccountId: 'account-B' }) // C's parent is B
        .mockResolvedValueOnce({ parentAccountId: 'account-A' }); // B's parent is A

      await expect(
        service.update('account-A', { parentAccountId: 'account-C' }),
      ).rejects.toThrow('Cannot create circular account hierarchy');
    });
  });
});
