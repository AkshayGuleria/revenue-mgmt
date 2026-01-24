import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { Decimal } from '@prisma/client/runtime/library';

export interface ConsolidatedInvoiceParams {
  parentAccountId: string;
  periodStart: Date;
  periodEnd: Date;
  includeChildren?: boolean; // Default: true
}

export interface ConsolidatedInvoiceResult {
  invoiceId: string;
  invoiceNumber: string;
  total: Decimal;
  subsidiariesIncluded: number;
}

@Injectable()
export class ConsolidatedBillingService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Generate consolidated invoice for parent account and all subsidiaries
   */
  async generateConsolidatedInvoice(
    params: ConsolidatedInvoiceParams,
  ): Promise<ConsolidatedInvoiceResult> {
    const {
      parentAccountId,
      periodStart,
      periodEnd,
      includeChildren = true,
    } = params;

    // Fetch parent account
    const parentAccount = await this.prisma.account.findUnique({
      where: { id: parentAccountId },
    });

    if (!parentAccount || parentAccount.deletedAt) {
      throw new NotFoundException(
        `Parent account ${parentAccountId} not found`,
      );
    }

    if (parentAccount.creditHold) {
      throw new BadRequestException(
        `Account ${parentAccountId} is on credit hold. Cannot generate invoice.`,
      );
    }

    // Get all descendant accounts if requested
    const accountIds = [parentAccountId];
    if (includeChildren) {
      const descendants = await this.getDescendantAccounts(parentAccountId);
      accountIds.push(...descendants.map((acc) => acc.id));
    }

    // Collect all contracts for these accounts in the period
    // Includes both owned contracts AND shared contracts
    const contracts = await this.prisma.contract.findMany({
      where: {
        OR: [
          // Owned contracts
          {
            accountId: { in: accountIds },
          },
          // Shared contracts
          {
            shares: {
              some: {
                accountId: { in: accountIds },
              },
            },
          },
        ],
        status: 'active',
        startDate: { lte: periodEnd },
        endDate: { gte: periodStart },
      },
      include: {
        account: {
          select: {
            id: true,
            accountName: true,
            billingContactName: true,
            billingContactEmail: true,
          },
        },
        shares: {
          select: {
            accountId: true,
          },
        },
      },
    });

    if (contracts.length === 0) {
      throw new BadRequestException(
        `No active contracts found for consolidated billing period`,
      );
    }

    // Calculate total amounts across all contracts
    const lineItems = [];
    let subtotal = new Decimal(0);

    for (const contract of contracts) {
      const contractAmount = await this.calculateContractAmount(
        contract,
        periodStart,
        periodEnd,
      );

      if (contractAmount.total.gt(0)) {
        lineItems.push({
          description: this.buildLineItemDescription(
            contract,
            periodStart,
            periodEnd,
          ),
          quantity: contractAmount.quantity,
          unitPrice: contractAmount.unitPrice,
          amount: contractAmount.total,
          metadata: {
            contractId: contract.id,
            contractNumber: contract.contractNumber,
            accountId: contract.accountId,
            accountName: contract.account.accountName,
          },
        });

        subtotal = subtotal.add(contractAmount.total);
      }
    }

    if (lineItems.length === 0) {
      throw new BadRequestException(
        `No billable items found for the specified period`,
      );
    }

    // Calculate tax and totals
    const tax = this.calculateTax(subtotal, parentAccount);
    const discount = new Decimal(0); // TODO: Apply consolidated discounts
    const total = subtotal.add(tax).sub(discount);

    // Generate invoice number
    const invoiceNumber = await this.generateInvoiceNumber();

    // Calculate due date
    const issueDate = new Date();
    const dueDate = this.calculateDueDate(
      issueDate,
      parentAccount.paymentTermsDays,
    );

    // Create consolidated invoice
    const invoice = await this.prisma.$transaction(async (tx) => {
      const newInvoice = await tx.invoice.create({
        data: {
          invoiceNumber,
          accountId: parentAccountId,
          issueDate,
          dueDate,
          periodStart,
          periodEnd,
          subtotal,
          tax,
          discount,
          total,
          currency: parentAccount.currency,
          status: 'draft',
          billingType: 'recurring',
          consolidated: true,
          notes: `Consolidated invoice for ${accountIds.length} account(s)`,
        },
      });

      // Create invoice items
      await tx.invoiceItem.createMany({
        data: lineItems.map((item) => ({
          invoiceId: newInvoice.id,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          amount: item.amount,
        })),
      });

      return newInvoice;
    });

    return {
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      total: invoice.total,
      subsidiariesIncluded: accountIds.length - 1, // Exclude parent
    };
  }

  /**
   * Get all descendant accounts recursively (up to 5 levels)
   */
  private async getDescendantAccounts(
    parentId: string,
    currentDepth = 0,
    maxDepth = 5,
  ): Promise<any[]> {
    if (currentDepth >= maxDepth) {
      return [];
    }

    const children = await this.prisma.account.findMany({
      where: {
        parentAccountId: parentId,
        deletedAt: null,
        status: 'active',
      },
      select: {
        id: true,
        accountName: true,
        parentAccountId: true,
      },
    });

    const descendants = [...children];

    for (const child of children) {
      const childDescendants = await this.getDescendantAccounts(
        child.id,
        currentDepth + 1,
        maxDepth,
      );
      descendants.push(...childDescendants);
    }

    return descendants;
  }

  /**
   * Calculate amount for a single contract in the billing period
   * TODO: Implement pro-rated billing based on period dates
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private async calculateContractAmount(
    contract: any,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    periodStart: Date,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    periodEnd: Date,
  ): Promise<{
    quantity: Decimal;
    unitPrice: Decimal;
    total: Decimal;
  }> {
    // Determine billing frequency
    const frequency = contract.billingFrequency.toLowerCase();

    // Calculate quantity (seats or units)
    const quantity = contract.seatCount
      ? new Decimal(contract.seatCount)
      : new Decimal(1);

    // Calculate unit price based on frequency
    let unitPrice = new Decimal(contract.contractValue);

    if (frequency === 'annual') {
      unitPrice = unitPrice.div(12); // Monthly rate from annual
    } else if (frequency === 'quarterly') {
      unitPrice = unitPrice.div(3); // Monthly rate from quarterly
    }

    // For seat-based pricing
    if (contract.seatPrice) {
      unitPrice = new Decimal(contract.seatPrice);
    }

    const total = quantity.mul(unitPrice);

    return {
      quantity,
      unitPrice,
      total,
    };
  }

  /**
   * Build line item description
   */
  private buildLineItemDescription(
    contract: any,
    periodStart: Date,
    periodEnd: Date,
  ): string {
    const accountName = contract.account.accountName;
    const contractNumber = contract.contractNumber;
    const startStr = periodStart.toISOString().split('T')[0];
    const endStr = periodEnd.toISOString().split('T')[0];

    let description = `Contract ${contractNumber} - ${accountName}`;

    if (contract.seatCount) {
      description += ` (${contract.seatCount} seats)`;
    }

    description += ` - Period: ${startStr} to ${endStr}`;

    return description;
  }

  /**
   * Calculate tax based on account configuration
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private calculateTax(subtotal: Decimal, account: any): Decimal {
    // TODO: Implement tax calculation based on jurisdiction
    // For now, return 0
    return new Decimal(0);
  }

  /**
   * Generate unique invoice number
   */
  private async generateInvoiceNumber(): Promise<string> {
    const count = await this.prisma.invoice.count();
    const year = new Date().getFullYear();
    const month = (new Date().getMonth() + 1).toString().padStart(2, '0');
    const sequence = (count + 1).toString().padStart(5, '0');
    return `INV-${year}${month}-${sequence}`;
  }

  /**
   * Calculate due date based on payment terms
   */
  private calculateDueDate(issueDate: Date, paymentTermsDays: number): Date {
    const dueDate = new Date(issueDate);
    dueDate.setDate(dueDate.getDate() + paymentTermsDays);
    return dueDate;
  }
}
