import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';
import { CreateAccountDto, UpdateAccountDto, QueryAccountsDto } from './dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class AccountsService {
  constructor(private prisma: PrismaService) {}

  async create(createAccountDto: CreateAccountDto) {
    const { parentAccountId, ...data } = createAccountDto;

    // Validate parent account exists if provided
    if (parentAccountId) {
      const parentAccount = await this.prisma.account.findUnique({
        where: { id: parentAccountId },
      });

      if (!parentAccount) {
        throw new NotFoundException(
          `Parent account with ID ${parentAccountId} not found`,
        );
      }

      // Prevent creating circular hierarchy
      if (parentAccountId === data.primaryContactEmail) {
        throw new BadRequestException(
          'Cannot create circular account hierarchy',
        );
      }
    }

    try {
      return await this.prisma.account.create({
        data: {
          ...data,
          parentAccountId,
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ConflictException('Account with this email already exists');
        }
      }
      throw error;
    }
  }

  async findAll(query: QueryAccountsDto) {
    const {
      search,
      accountType,
      status,
      parentAccountId,
      page = 1,
      limit = 20,
    } = query;

    const where: Prisma.AccountWhereInput = {
      deletedAt: null, // Only active accounts
    };

    // Apply search filter
    if (search) {
      where.OR = [
        { accountName: { contains: search, mode: 'insensitive' } },
        { primaryContactEmail: { contains: search, mode: 'insensitive' } },
        { billingContactEmail: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Apply filters
    if (accountType) {
      where.accountType = accountType;
    }

    if (status) {
      where.status = status;
    }

    if (parentAccountId) {
      where.parentAccountId = parentAccountId;
    }

    const skip = (page - 1) * limit;

    const [accounts, total] = await Promise.all([
      this.prisma.account.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          parent: {
            select: {
              id: true,
              accountName: true,
            },
          },
          _count: {
            select: {
              children: true,
              contracts: true,
              invoices: true,
            },
          },
        },
      }),
      this.prisma.account.count({ where }),
    ]);

    return {
      data: accounts,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const account = await this.prisma.account.findUnique({
      where: { id },
      include: {
        parent: {
          select: {
            id: true,
            accountName: true,
          },
        },
        children: {
          select: {
            id: true,
            accountName: true,
            status: true,
          },
        },
        contracts: {
          select: {
            id: true,
            contractNumber: true,
            status: true,
            startDate: true,
            endDate: true,
          },
          where: {
            status: 'active',
          },
        },
        _count: {
          select: {
            children: true,
            contracts: true,
            invoices: true,
          },
        },
      },
    });

    if (!account || account.deletedAt) {
      throw new NotFoundException(`Account with ID ${id} not found`);
    }

    return account;
  }

  async update(id: string, updateAccountDto: UpdateAccountDto) {
    // Check if account exists
    await this.findOne(id);

    const { parentAccountId, ...data } = updateAccountDto;

    // Validate parent account if being updated
    if (parentAccountId !== undefined) {
      if (parentAccountId) {
        const parentAccount = await this.prisma.account.findUnique({
          where: { id: parentAccountId },
        });

        if (!parentAccount) {
          throw new NotFoundException(
            `Parent account with ID ${parentAccountId} not found`,
          );
        }

        // Prevent self-referencing
        if (parentAccountId === id) {
          throw new BadRequestException(
            'Account cannot be its own parent',
          );
        }

        // Check for circular hierarchy
        await this.checkCircularHierarchy(id, parentAccountId);
      }
    }

    try {
      return await this.prisma.account.update({
        where: { id },
        data: {
          ...data,
          ...(parentAccountId !== undefined && { parentAccountId }),
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ConflictException('Account with this email already exists');
        }
      }
      throw error;
    }
  }

  async remove(id: string) {
    // Check if account exists
    await this.findOne(id);

    // Soft delete
    return await this.prisma.account.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        status: 'inactive',
      },
    });
  }

  /**
   * Check for circular hierarchy by traversing parent chain
   */
  private async checkCircularHierarchy(
    accountId: string,
    newParentId: string,
  ): Promise<void> {
    let currentId = newParentId;
    const visited = new Set<string>([accountId]);

    while (currentId) {
      if (visited.has(currentId)) {
        throw new BadRequestException(
          'Cannot create circular account hierarchy',
        );
      }

      visited.add(currentId);

      const parent = await this.prisma.account.findUnique({
        where: { id: currentId },
        select: { parentAccountId: true },
      });

      currentId = parent?.parentAccountId || null;
    }
  }
}
