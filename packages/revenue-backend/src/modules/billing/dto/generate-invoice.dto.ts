import { IsUUID, IsOptional, IsDateString, IsEnum, IsBoolean } from 'class-validator';

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

export class GenerateConsolidatedInvoiceDto {
  @IsUUID()
  parentAccountId: string;

  @IsDateString()
  periodStart: string;

  @IsDateString()
  periodEnd: string;

  @IsOptional()
  @IsBoolean()
  includeChildren?: boolean;
}
