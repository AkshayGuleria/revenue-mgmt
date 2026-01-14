import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsNumber, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Base Pagination DTO
 * Provides reusable pagination parameters for all list endpoints
 * Reference: ADR-003 - REST API Response Structure & Query Parameters
 *
 * Usage: Extend this class in your query DTOs
 * Example: export class QueryAccountsDto extends BasePaginationDto { ... }
 */
export class BasePaginationDto {
  @ApiPropertyOptional({
    description: 'Offset for pagination (0-indexed, SQL-friendly)',
    example: 0,
    default: 0,
    minimum: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  'offset[eq]'?: number;

  @ApiPropertyOptional({
    description: 'Number of items per page',
    example: 20,
    default: 20,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  'limit[eq]'?: number;
}
