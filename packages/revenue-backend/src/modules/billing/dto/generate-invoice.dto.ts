import { IsUUID, IsOptional, IsDateString, IsEnum } from 'class-validator';

export enum BillingPeriod {
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  ANNUAL = 'annual',
}

export class GenerateInvoiceDto {
  @IsUUID()
  contractId: string;

  @IsOptional()
  @IsDateString()
  periodStart?: string;

  @IsOptional()
  @IsDateString()
  periodEnd?: string;

  @IsOptional()
  @IsEnum(BillingPeriod)
  billingPeriod?: BillingPeriod;
}

export class BatchGenerateInvoicesDto {
  @IsOptional()
  @IsDateString()
  billingDate?: string;

  @IsOptional()
  @IsEnum(BillingPeriod)
  billingPeriod?: BillingPeriod;
}
