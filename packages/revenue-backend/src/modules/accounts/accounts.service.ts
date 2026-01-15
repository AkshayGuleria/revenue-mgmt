import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateAccountDto, UpdateAccountDto, QueryAccountsDto } from './dto';
import { Prisma } from '@prisma/client';
import { parseQuery } from '../../common/utils/query-parser';
import {
  buildSingleResponse,
  buildPaginatedListResponse,
} from '../../common/utils/response-builder';
import { ApiResponse } from '../../common/interfaces';

@Injectable()
export class AccountsService {
  constructor(private prisma: PrismaService) {}

  async create(createAccountDto: CreateAccountDto): Promise<ApiResponse<any>> {
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
      const account = await this.prisma.account.create({
        data: {
          ...data,
          parentAccountId,
        },
      });

      return buildSingleResponse(account);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ConflictException('Account with this email already exists');
        }
      }
      throw error;
    }
  }

  async findAll(query: QueryAccountsDto): Promise<ApiResponse<any>> {
    // Parse query parameters using utility
    const { pagination, where: parsedWhere } = parseQuery(query);

    // Build complete where clause
    const where: Prisma.AccountWhereInput = {
      ...parsedWhere,
      deletedAt: null, // Always exclude soft-deleted accounts
    };

    const [accounts, total] = await Promise.all([
      this.prisma.account.findMany({
        where,
        skip: pagination.offset,
        take: pagination.limit,
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

    return buildPaginatedListResponse(
      accounts,
      pagination.offset,
      pagination.limit,
      total,
    );
  }

  async findOne(id: string): Promise<ApiResponse<any>> {
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

    return buildSingleResponse(account);
  }

  async update(
    id: string,
    updateAccountDto: UpdateAccountDto,
  ): Promise<ApiResponse<any>> {
    // Check if account exists (this will throw if not found)
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
          throw new BadRequestException('Account cannot be its own parent');
        }

        // Check for circular hierarchy
        await this.checkCircularHierarchy(id, parentAccountId);
      }
    }

    try {
      const account = await this.prisma.account.update({
        where: { id },
        data: {
          ...data,
          ...(parentAccountId !== undefined && { parentAccountId }),
        },
      });

      return buildSingleResponse(account);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ConflictException('Account with this email already exists');
        }
      }
      throw error;
    }
  }

  async remove(id: string): Promise<void> {
    // Check if account exists (this will throw if not found)
    await this.findOne(id);

    // Soft delete
    await this.prisma.account.update({
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
