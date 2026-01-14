import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsEnum, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';
import { BasePaginationDto } from '../../../common/dto';

enum AccountType {
  ENTERPRISE = 'enterprise',
  SMB = 'smb',
  STARTUP = 'startup',
}

enum AccountStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
}

/**
 * Query DTO for filtering and paginating accounts
 * Uses operator-based query parameters per ADR-003
 */
export class QueryAccountsDto extends BasePaginationDto {
  // LIKE operator - Search
  @ApiPropertyOptional({
    description: 'Search by account name (case-insensitive substring)',
    example: 'acme',
  })
  @IsOptional()
  @IsString()
  'accountName[like]'?: string;

  // EQ operator - Exact match filters
  @ApiPropertyOptional({
    description: 'Filter by account type (exact match)',
    enum: AccountType,
    example: 'enterprise',
  })
  @IsOptional()
  @IsEnum(AccountType)
  'accountType[eq]'?: string;

  @ApiPropertyOptional({
    description: 'Filter by account status (exact match)',
    enum: AccountStatus,
    example: 'active',
  })
  @IsOptional()
  @IsEnum(AccountStatus)
  'status[eq]'?: string;

  @ApiPropertyOptional({
    description: 'Filter by parent account ID (get all children)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsString()
  'parentAccountId[eq]'?: string;

  // IN operator - Multiple values
  @ApiPropertyOptional({
    description: 'Filter by multiple statuses (comma-separated)',
    example: 'active,suspended',
  })
  @IsOptional()
  @IsString()
  'status[in]'?: string;

  @ApiPropertyOptional({
    description: 'Filter by multiple account types (comma-separated)',
    example: 'enterprise,smb',
  })
  @IsOptional()
  @IsString()
  'accountType[in]'?: string;

  // NULL operator - Check for null
  @ApiPropertyOptional({
    description: 'Filter accounts with or without parent (true = no parent, false = has parent)',
    example: true,
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  'parentAccountId[null]'?: boolean;
}
