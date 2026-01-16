import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { SeatCalculatorService } from './seat-calculator.service';
import { Decimal } from '@prisma/client/runtime/library';

export interface GenerateInvoiceParams {
  contractId: string;
  periodStart?: Date;
  periodEnd?: Date;
}

export interface InvoiceGenerationResult {
  invoiceId: string;
  invoiceNumber: string;
  total: Decimal;
}

@Injectable()
export class BillingEngineService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly seatCalculator: SeatCalculatorService,
  ) {}

  /**
   * Generate invoice from contract
   */
  async generateInvoiceFromContract(
    params: GenerateInvoiceParams,
  ): Promise<InvoiceGenerationResult> {
    const { contractId, periodStart, periodEnd } = params;

    // Fetch contract with account details
    const contract = await this.prisma.contract.findUnique({
      where: { id: contractId },
      include: {
        account: true,
      },
    });

    if (!contract) {
      throw new NotFoundException(`Contract ${contractId} not found`);
    }

    if (contract.status !== 'active') {
      throw new Error(`Contract ${contractId} is not active`);
    }

    // Calculate billing period
    const billingPeriod = this.calculateBillingPeriod(
      contract,
      periodStart,
      periodEnd,
    );

    // Calculate invoice amounts
    const amounts = await this.calculateInvoiceAmounts(contract);

    // Generate invoice number
    const invoiceNumber = await this.generateInvoiceNumber();

    // Calculate due date based on payment terms
    const issueDate = new Date();
    const dueDate = this.calculateDueDate(
      issueDate,
      contract.account.paymentTermsDays,
    );

    // Create invoice with transaction
    const invoice = await this.prisma.$transaction(async (tx) => {
      const newInvoice = await tx.invoice.create({
        data: {
          invoiceNumber,
          accountId: contract.accountId,
          contractId: contract.id,
          issueDate,
          dueDate,
          periodStart: billingPeriod.start,
          periodEnd: billingPeriod.end,
          subtotal: amounts.subtotal,
          tax: amounts.tax,
          discount: amounts.discount,
          total: amounts.total,
          currency: contract.account.currency,
          status: 'draft',
          billingType: 'recurring',
        },
      });

      // Create invoice items
      await tx.invoiceItem.createMany({
        data: amounts.lineItems.map((item) => ({
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
    };
  }

  /**
   * Calculate billing period based on contract frequency
   */
  private calculateBillingPeriod(
    contract: any,
    periodStart?: Date,
    periodEnd?: Date,
  ): { start: Date; end: Date } {
    if (periodStart && periodEnd) {
      return { start: periodStart, end: periodEnd };
    }

    const now = new Date();
    const start = periodStart || now;

    // Calculate period end based on billing frequency
    let end: Date;
    switch (contract.billingFrequency) {
      case 'monthly':
        end = new Date(start);
        end.setMonth(end.getMonth() + 1);
        break;
      case 'quarterly':
        end = new Date(start);
        end.setMonth(end.getMonth() + 3);
        break;
      case 'annual':
        end = new Date(start);
        end.setFullYear(end.getFullYear() + 1);
        break;
      default:
        end = new Date(start);
        end.setMonth(end.getMonth() + 1);
    }

    return { start, end };
  }

  /**
   * Calculate invoice amounts including seat-based pricing
   */
  private async calculateInvoiceAmounts(contract: any) {
    const lineItems: Array<{
      description: string;
      quantity: Decimal;
      unitPrice: Decimal;
      amount: Decimal;
    }> = [];

    let subtotal = new Decimal(0);

    // Seat-based billing
    if (contract.seatCount && contract.seatPrice) {
      const seatPricing = this.seatCalculator.calculateSeatPricing(
        contract.seatCount,
        contract.seatPrice,
        null, // TODO: Fetch volume tiers from product
      );

      lineItems.push({
        description: `${contract.billingFrequency.charAt(0).toUpperCase() + contract.billingFrequency.slice(1)} Subscription - ${contract.seatCount} seats`,
        quantity: new Decimal(contract.seatCount),
        unitPrice: seatPricing.pricePerSeat,
        amount: seatPricing.subtotal,
      });

      subtotal = subtotal.add(seatPricing.subtotal);
    } else {
      // Fixed contract value
      const periodAmount = this.calculatePeriodAmount(
        contract.contractValue,
        contract.billingFrequency,
      );

      lineItems.push({
        description: `${contract.billingFrequency.charAt(0).toUpperCase() + contract.billingFrequency.slice(1)} Subscription`,
        quantity: new Decimal(1),
        unitPrice: periodAmount,
        amount: periodAmount,
      });

      subtotal = subtotal.add(periodAmount);
    }

    // Calculate tax (0 for now, will be implemented in Phase 4)
    const tax = new Decimal(0);

    // Calculate discount (0 for now, will be enhanced later)
    const discount = new Decimal(0);

    // Calculate total
    const total = subtotal.add(tax).sub(discount);

    return {
      lineItems,
      subtotal,
      tax,
      discount,
      total,
    };
  }

  /**
   * Calculate period amount based on contract value and frequency
   */
  private calculatePeriodAmount(
    contractValue: Decimal,
    frequency: string,
  ): Decimal {
    switch (frequency) {
      case 'monthly':
        return contractValue.div(12);
      case 'quarterly':
        return contractValue.div(4);
      case 'annual':
        return contractValue;
      default:
        return contractValue.div(12);
    }
  }

  /**
   * Generate unique invoice number
   */
  private async generateInvoiceNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.prisma.invoice.count({
      where: {
        invoiceNumber: {
          startsWith: `INV-${year}-`,
        },
      },
    });

    const nextNumber = (count + 1).toString().padStart(6, '0');
    return `INV-${year}-${nextNumber}`;
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
