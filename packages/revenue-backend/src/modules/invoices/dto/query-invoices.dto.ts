import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { BasePaginationDto } from '../../../common/dto/pagination.dto';

export class QueryInvoicesDto extends BasePaginationDto {
  // Operator-based query parameters
  // Examples:
  // ?status[eq]=paid
  // ?accountId[eq]=123e4567
  // ?contractId[eq]=123e4567
  // ?total[gte]=1000&total[lte]=10000
  // ?dueDate[gte]=2024-01-01&dueDate[lte]=2024-12-31
  // ?invoiceNumber[like]=INV-2024
  // ?purchaseOrderNumber[like]=PO-
  // ?consolidated[eq]=false

  @ApiPropertyOptional({
    description: 'Filter by invoice number (supports operators)',
    example: 'INV-2024-0001',
  })
  @IsOptional()
  @IsString()
  invoiceNumber?: string;

  @ApiPropertyOptional({
    description: 'Filter by account ID (supports operators)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsString()
  accountId?: string;

  @ApiPropertyOptional({
    description: 'Filter by contract ID (supports operators)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsString()
  contractId?: string;

  @ApiPropertyOptional({
    description: 'Filter by purchase order number (supports operators)',
    example: 'PO-2024-1234',
  })
  @IsOptional()
  @IsString()
  purchaseOrderNumber?: string;

  @ApiPropertyOptional({
    description: 'Filter by status (supports operators)',
    example: 'paid',
  })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({
    description: 'Filter by issue date (supports operators)',
    example: '2024-01-01',
  })
  @IsOptional()
  @IsString()
  issueDate?: string;

  @ApiPropertyOptional({
    description: 'Filter by due date (supports operators)',
    example: '2024-01-31',
  })
  @IsOptional()
  @IsString()
  dueDate?: string;

  @ApiPropertyOptional({
    description: 'Filter by total amount (supports operators)',
    example: '10000',
  })
  @IsOptional()
  @IsString()
  total?: string;

  @ApiPropertyOptional({
    description: 'Filter by billing type (supports operators)',
    example: 'recurring',
  })
  @IsOptional()
  @IsString()
  billingType?: string;

  @ApiPropertyOptional({
    description: 'Filter by consolidated status (supports operators)',
    example: 'false',
  })
  @IsOptional()
  @IsString()
  consolidated?: string;

  @ApiPropertyOptional({
    description: 'Filter by currency (supports operators)',
    example: 'USD',
  })
  @IsOptional()
  @IsString()
  currency?: string;
}
