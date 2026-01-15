import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateContractDto, UpdateContractDto, QueryContractsDto } from './dto';
import { Prisma } from '@prisma/client';
import { parseQuery } from '../../common/utils/query-parser';
import {
  buildSingleResponse,
  buildPaginatedListResponse,
} from '../../common/utils/response-builder';
import { ApiResponse } from '../../common/interfaces';

@Injectable()
export class ContractsService {
  constructor(private prisma: PrismaService) {}

  async create(
    createContractDto: CreateContractDto,
  ): Promise<ApiResponse<any>> {
    const { accountId, startDate, endDate, ...data } = createContractDto;

    // Validate account exists
    const account = await this.prisma.account.findUnique({
      where: { id: accountId },
    });

    if (!account) {
      throw new NotFoundException(`Account with ID ${accountId} not found`);
    }

    // Validate dates
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (end <= start) {
      throw new BadRequestException('End date must be after start date');
    }

    try {
      const contract = await this.prisma.contract.create({
        data: {
          ...data,
          accountId,
          startDate: start,
          endDate: end,
        },
      });

      return buildSingleResponse(contract);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ConflictException(
            'Contract with this number already exists',
          );
        }
      }
      throw error;
    }
  }

  async findAll(query: QueryContractsDto): Promise<ApiResponse<any>> {
    // Parse query parameters using utility
    const { pagination, where: parsedWhere } = parseQuery(query);

    const where: Prisma.ContractWhereInput = {
      ...parsedWhere,
    };

    const [contracts, total] = await Promise.all([
      this.prisma.contract.findMany({
        where,
        skip: pagination.offset,
        take: pagination.limit,
        orderBy: { createdAt: 'desc' },
        include: {
          account: {
            select: {
              id: true,
              accountName: true,
              status: true,
            },
          },
          _count: {
            select: {
              invoices: true,
            },
          },
        },
      }),
      this.prisma.contract.count({ where }),
    ]);

    return buildPaginatedListResponse(
      contracts,
      pagination.offset,
      pagination.limit,
      total,
    );
  }

  async findOne(id: string): Promise<ApiResponse<any>> {
    const contract = await this.prisma.contract.findUnique({
      where: { id },
      include: {
        account: {
          select: {
            id: true,
            accountName: true,
            primaryContactEmail: true,
            status: true,
          },
        },
        invoices: {
          select: {
            id: true,
            invoiceNumber: true,
            status: true,
            total: true,
            issueDate: true,
            dueDate: true,
          },
          orderBy: {
            issueDate: 'desc',
          },
        },
        _count: {
          select: {
            invoices: true,
          },
        },
      },
    });

    if (!contract) {
      throw new NotFoundException(`Contract with ID ${id} not found`);
    }

    return buildSingleResponse(contract);
  }

  async update(
    id: string,
    updateContractDto: UpdateContractDto,
  ): Promise<ApiResponse<any>> {
    // Check if contract exists
    await this.findOne(id);

    const { accountId, startDate, endDate, ...data } = updateContractDto;

    // Validate account if being updated
    if (accountId) {
      const account = await this.prisma.account.findUnique({
        where: { id: accountId },
      });

      if (!account) {
        throw new NotFoundException(`Account with ID ${accountId} not found`);
      }
    }

    // Validate dates if both are provided
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);

      if (end <= start) {
        throw new BadRequestException('End date must be after start date');
      }
    }

    try {
      const updateData: any = { ...data };

      if (accountId) updateData.accountId = accountId;
      if (startDate) updateData.startDate = new Date(startDate);
      if (endDate) updateData.endDate = new Date(endDate);

      const contract = await this.prisma.contract.update({
        where: { id },
        data: updateData,
      });

      return buildSingleResponse(contract);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ConflictException(
            'Contract with this number already exists',
          );
        }
      }
      throw error;
    }
  }

  async remove(id: string): Promise<void> {
    // Check if contract exists
    await this.findOne(id);

    // Hard delete (no soft delete for contracts in schema)
    await this.prisma.contract.delete({
      where: { id },
    });
  }
}
