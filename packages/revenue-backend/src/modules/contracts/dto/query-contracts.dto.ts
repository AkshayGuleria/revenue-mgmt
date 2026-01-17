import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsEnum,
  IsBoolean,
  IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';
import { BasePaginationDto } from '../../../common/dto/pagination.dto';
import { BillingFrequency, ContractStatus } from './create-contract.dto';

export class QueryContractsDto extends BasePaginationDto {
  @ApiPropertyOptional({
    description: 'Search by contract number (partial match)',
    example: 'CNT-2024',
  })
  @IsOptional()
  @IsString()
  'contractNumber[like]'?: string;

  @ApiPropertyOptional({
    description: 'Filter by exact contract number',
    example: 'CNT-2024-0001',
  })
  @IsOptional()
  @IsString()
  'contractNumber[eq]'?: string;

  @ApiPropertyOptional({
    description: 'Filter by account ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsString()
  'accountId[eq]'?: string;

  @ApiPropertyOptional({
    description: 'Filter by contract status',
    enum: ContractStatus,
    example: 'active',
  })
  @IsOptional()
  @IsEnum(ContractStatus)
  'status[eq]'?: string;

  @ApiPropertyOptional({
    description: 'Filter by multiple statuses (comma-separated)',
    example: 'active,draft',
  })
  @IsOptional()
  @IsString()
  'status[in]'?: string;

  @ApiPropertyOptional({
    description: 'Filter by billing frequency',
    enum: BillingFrequency,
  })
  @IsOptional()
  @IsEnum(BillingFrequency)
  'billingFrequency[eq]'?: string;

  @ApiPropertyOptional({
    description: 'Filter by auto-renew setting',
    example: true,
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  'autoRenew[eq]'?: boolean;

  @ApiPropertyOptional({
    description: 'Filter contracts starting after date',
    example: '2024-01-01',
  })
  @IsOptional()
  @IsDateString()
  'startDate[gte]'?: string;

  @ApiPropertyOptional({
    description: 'Filter contracts starting before date',
    example: '2024-12-31',
  })
  @IsOptional()
  @IsDateString()
  'startDate[lte]'?: string;

  @ApiPropertyOptional({
    description: 'Filter contracts ending after date',
    example: '2024-01-01',
  })
  @IsOptional()
  @IsDateString()
  'endDate[gte]'?: string;

  @ApiPropertyOptional({
    description: 'Filter contracts ending before date',
    example: '2024-12-31',
  })
  @IsOptional()
  @IsDateString()
  'endDate[lte]'?: string;

  @ApiPropertyOptional({
    description: 'Filter by contract value greater than',
    example: 10000,
  })
  @IsOptional()
  @Type(() => Number)
  'contractValue[gt]'?: number;

  @ApiPropertyOptional({
    description: 'Filter by contract value greater than or equal',
    example: 10000,
  })
  @IsOptional()
  @Type(() => Number)
  'contractValue[gte]'?: number;

  @ApiPropertyOptional({
    description: 'Filter by contract value less than',
    example: 100000,
  })
  @IsOptional()
  @Type(() => Number)
  'contractValue[lt]'?: number;

  @ApiPropertyOptional({
    description: 'Filter by contract value less than or equal',
    example: 100000,
  })
  @IsOptional()
  @Type(() => Number)
  'contractValue[lte]'?: number;
}
