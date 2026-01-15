import { Prisma } from '@prisma/client';
import { QueryOperator, QueryFilter, PaginationParams } from '../interfaces';

/**
 * Query Parser Utility
 * Converts operator-based query parameters to Prisma filters
 * Reference: ADR-003 - REST API Response Structure & Query Parameters
 */

/**
 * Parse query parameter key to extract field and operator
 * Example: "status[eq]" -> { field: "status", operator: "eq" }
 */
export function parseQueryKey(key: string): {
  field: string;
  operator: QueryOperator;
} | null {
  const match = key.match(/^(.+)\[(\w+)\]$/);
  if (!match) return null;

  const [, field, operator] = match;
  const validOperators: QueryOperator[] = [
    'eq',
    'ne',
    'lt',
    'lte',
    'gt',
    'gte',
    'in',
    'nin',
    'like',
    'null',
  ];

  if (!validOperators.includes(operator as QueryOperator)) {
    return null;
  }

  return {
    field,
    operator: operator as QueryOperator,
  };
}

/**
 * Parse pagination parameters from query string
 */
export function parsePaginationParams(query: Record<string, any>): PaginationParams {
  let offset = parseInt(query['offset[eq]']) || 0;
  let limit = parseInt(query['limit[eq]']) || 20;

  // Enforce maximum limit
  if (limit > 100) limit = 100;
  if (limit < 1) limit = 20;
  if (offset < 0) offset = 0;

  return { offset, limit };
}

/**
 * Parse all query filters from query string
 */
export function parseQueryFilters(query: Record<string, any>): QueryFilter[] {
  const filters: QueryFilter[] = [];

  for (const [key, value] of Object.entries(query)) {
    // Skip pagination parameters
    if (key === 'offset[eq]' || key === 'limit[eq]') continue;

    const parsed = parseQueryKey(key);
    if (!parsed) continue;

    const { field, operator } = parsed;

    // Handle IN/NIN operators (comma-separated values)
    if (operator === 'in' || operator === 'nin') {
      const arrayValue = typeof value === 'string' ? value.split(',') : [value];
      filters.push({ field, operator, value: arrayValue });
      continue;
    }

    // Handle NULL operator (boolean value)
    if (operator === 'null') {
      const boolValue = value === 'true' || value === true;
      filters.push({ field, operator, value: boolValue });
      continue;
    }

    // Handle other operators
    filters.push({ field, operator, value });
  }

  return filters;
}

/**
 * Convert QueryFilter to Prisma where clause
 */
export function filterToPrismaWhere(filter: QueryFilter): any {
  const { field, operator, value } = filter;

  switch (operator) {
    case 'eq':
      return { [field]: value };

    case 'ne':
      return { [field]: { not: value } };

    case 'lt':
      return { [field]: { lt: value } };

    case 'lte':
      return { [field]: { lte: value } };

    case 'gt':
      return { [field]: { gt: value } };

    case 'gte':
      return { [field]: { gte: value } };

    case 'in':
      return { [field]: { in: Array.isArray(value) ? value : [value] } };

    case 'nin':
      return {
        [field]: { notIn: Array.isArray(value) ? value : [value] },
      };

    case 'like':
      return { [field]: { contains: value as string, mode: 'insensitive' } };

    case 'null':
      return { [field]: value === true ? null : { not: null } };

    default:
      return {};
  }
}

/**
 * Convert array of QueryFilters to Prisma where clause
 * Combines multiple filters with AND logic
 */
export function filtersToPrismaWhere(filters: QueryFilter[]): any {
  if (filters.length === 0) return {};

  const whereConditions = filters.map((filter) =>
    filterToPrismaWhere(filter),
  );

  // Single filter - return directly
  if (whereConditions.length === 1) {
    return whereConditions[0];
  }

  // Multiple filters - combine with AND
  return { AND: whereConditions };
}

/**
 * Complete query parser - parses pagination and filters
 * Returns Prisma-ready pagination and where clause
 */
export function parseQuery(query: Record<string, any>): {
  pagination: PaginationParams;
  where: any;
} {
  const pagination = parsePaginationParams(query);
  const filters = parseQueryFilters(query);
  const where = filtersToPrismaWhere(filters);

  return { pagination, where };
}
