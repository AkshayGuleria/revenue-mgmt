import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import {
  CreateInvoiceDto,
  UpdateInvoiceDto,
  QueryInvoicesDto,
  CreateInvoiceItemDto,
} from './dto';
import { Prisma } from '@prisma/client';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { parseQuery } from '../../common/utils/query-parser';
import {
  buildSingleResponse,
  buildPaginatedListResponse,
} from '../../common/utils/response-builder';
import { ApiResponse } from '../../common/interfaces';

@Injectable()
export class InvoicesService {
  constructor(private prisma: PrismaService) {}

  async create(createInvoiceDto: CreateInvoiceDto): Promise<ApiResponse<any>> {
    const {
      accountId,
      contractId,
      issueDate,
      dueDate,
      periodStart,
      periodEnd,
      paidDate,
      items,
      ...data
    } = createInvoiceDto;

    // Validate account exists
    const account = await this.prisma.account.findUnique({
      where: { id: accountId },
    });

    if (!account) {
      throw new NotFoundException(`Account with ID ${accountId} not found`);
    }

    // Validate contract exists if provided
    if (contractId) {
      const contract = await this.prisma.contract.findUnique({
        where: { id: contractId },
      });

      if (!contract) {
        throw new NotFoundException(`Contract with ID ${contractId} not found`);
      }

      // Validate contract belongs to account
      if (contract.accountId !== accountId) {
        throw new BadRequestException(
          'Contract does not belong to the specified account',
        );
      }
    }

    // Validate dates
    const issue = new Date(issueDate);
    const due = new Date(dueDate);

    if (due <= issue) {
      throw new BadRequestException('Due date must be after issue date');
    }

    // Validate period dates if provided
    if (periodStart && periodEnd) {
      const start = new Date(periodStart);
      const end = new Date(periodEnd);

      if (end <= start) {
        throw new BadRequestException(
          'Period end date must be after period start date',
        );
      }
    }

    // Validate amount calculations
    const calculatedTotal =
      data.subtotal + (data.tax || 0) - (data.discount || 0);
    const tolerance = 0.01; // Allow 1 cent tolerance for rounding

    if (Math.abs(calculatedTotal - data.total) > tolerance) {
      throw new BadRequestException(
        `Total amount ${data.total} does not match calculated total ${calculatedTotal.toFixed(2)} (subtotal + tax - discount)`,
      );
    }

    try {
      const invoice = await this.prisma.invoice.create({
        data: {
          ...data,
          accountId,
          contractId,
          issueDate: issue,
          dueDate: due,
          periodStart: periodStart ? new Date(periodStart) : undefined,
          periodEnd: periodEnd ? new Date(periodEnd) : undefined,
          paidDate: paidDate ? new Date(paidDate) : undefined,
          items: items
            ? {
                create: items,
              }
            : undefined,
        },
        include: {
          items: true,
        },
      });

      return buildSingleResponse(invoice);
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ConflictException(
            'Invoice with this number already exists',
          );
        }
      }
      throw error;
    }
  }

  async findAll(query: QueryInvoicesDto): Promise<ApiResponse<any>> {
    // Parse query parameters using utility
    const { pagination, where: parsedWhere } = parseQuery(query);

    const where: Prisma.InvoiceWhereInput = {
      ...parsedWhere,
    };

    const [invoices, total] = await Promise.all([
      this.prisma.invoice.findMany({
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
          contract: {
            select: {
              id: true,
              contractNumber: true,
              status: true,
            },
          },
          _count: {
            select: {
              items: true,
            },
          },
        },
      }),
      this.prisma.invoice.count({ where }),
    ]);

    return buildPaginatedListResponse(
      invoices,
      pagination.offset,
      pagination.limit,
      total,
    );
  }

  async findOne(id: string): Promise<ApiResponse<any>> {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id },
      include: {
        account: {
          select: {
            id: true,
            accountName: true,
            primaryContactEmail: true,
            billingContactEmail: true,
            status: true,
          },
        },
        contract: {
          select: {
            id: true,
            contractNumber: true,
            status: true,
            startDate: true,
            endDate: true,
          },
        },
        items: {
          orderBy: {
            createdAt: 'asc',
          },
        },
        _count: {
          select: {
            items: true,
          },
        },
      },
    });

    if (!invoice) {
      throw new NotFoundException(`Invoice with ID ${id} not found`);
    }

    return buildSingleResponse(invoice);
  }

  async update(
    id: string,
    updateInvoiceDto: UpdateInvoiceDto,
  ): Promise<ApiResponse<any>> {
    // Check if invoice exists
    await this.findOne(id);

    const {
      accountId,
      contractId,
      issueDate,
      dueDate,
      periodStart,
      periodEnd,
      paidDate,
      items, // Removed in this version, kept for DTO compatibility
      ...data
    } = updateInvoiceDto;

    // Note: items field is extracted but not used (DTO compatibility)
    void items;

    // Validate account if being updated
    if (accountId) {
      const account = await this.prisma.account.findUnique({
        where: { id: accountId },
      });

      if (!account) {
        throw new NotFoundException(`Account with ID ${accountId} not found`);
      }
    }

    // Validate contract if being updated
    if (contractId) {
      const contract = await this.prisma.contract.findUnique({
        where: { id: contractId },
      });

      if (!contract) {
        throw new NotFoundException(`Contract with ID ${contractId} not found`);
      }

      // If both accountId and contractId are provided, validate they match
      const targetAccountId = accountId || (await this.getInvoiceAccountId(id));
      if (contract.accountId !== targetAccountId) {
        throw new BadRequestException(
          'Contract does not belong to the specified account',
        );
      }
    }

    // Validate dates if both are provided
    if (issueDate && dueDate) {
      const issue = new Date(issueDate);
      const due = new Date(dueDate);

      if (due <= issue) {
        throw new BadRequestException('Due date must be after issue date');
      }
    }

    // Validate period dates if both are provided
    if (periodStart && periodEnd) {
      const start = new Date(periodStart);
      const end = new Date(periodEnd);

      if (end <= start) {
        throw new BadRequestException(
          'Period end date must be after period start date',
        );
      }
    }

    try {
      const updateData: any = { ...data };

      if (accountId) updateData.accountId = accountId;
      if (contractId !== undefined) updateData.contractId = contractId;
      if (issueDate) updateData.issueDate = new Date(issueDate);
      if (dueDate) updateData.dueDate = new Date(dueDate);
      if (periodStart) updateData.periodStart = new Date(periodStart);
      if (periodEnd) updateData.periodEnd = new Date(periodEnd);
      if (paidDate) updateData.paidDate = new Date(paidDate);

      const invoice = await this.prisma.invoice.update({
        where: { id },
        data: updateData,
      });

      return buildSingleResponse(invoice);
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ConflictException(
            'Invoice with this number already exists',
          );
        }
      }
      throw error;
    }
  }

  async remove(id: string): Promise<void> {
    // Check if invoice exists
    await this.findOne(id);

    // Hard delete (cascade will delete items)
    await this.prisma.invoice.delete({
      where: { id },
    });
  }

  async addLineItem(
    invoiceId: string,
    createInvoiceItemDto: CreateInvoiceItemDto,
  ): Promise<ApiResponse<any>> {
    // Check if invoice exists
    await this.findOne(invoiceId);

    const item = await this.prisma.invoiceItem.create({
      data: {
        ...createInvoiceItemDto,
        invoiceId,
      },
    });

    return buildSingleResponse(item);
  }

  async removeLineItem(invoiceId: string, itemId: string): Promise<void> {
    // Check if invoice exists
    await this.findOne(invoiceId);

    // Check if item exists and belongs to invoice
    const item = await this.prisma.invoiceItem.findUnique({
      where: { id: itemId },
    });

    if (!item) {
      throw new NotFoundException(`Invoice item with ID ${itemId} not found`);
    }

    if (item.invoiceId !== invoiceId) {
      throw new BadRequestException('Invoice item does not belong to invoice');
    }

    await this.prisma.invoiceItem.delete({
      where: { id: itemId },
    });
  }

  /**
   * Helper method to get invoice's account ID
   */
  private async getInvoiceAccountId(invoiceId: string): Promise<string> {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: invoiceId },
      select: { accountId: true },
    });

    if (!invoice) {
      throw new NotFoundException(`Invoice with ID ${invoiceId} not found`);
    }

    return invoice.accountId;
  }
}
