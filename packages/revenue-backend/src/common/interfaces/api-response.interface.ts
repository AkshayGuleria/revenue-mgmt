/**
 * Standard API response interfaces
 * Reference: ADR-003 - REST API Response Structure & Query Parameters
 */

/**
 * Query operator types for filtering
 */
export type QueryOperator =
  | 'eq' // equals
  | 'ne' // not equals
  | 'lt' // less than
  | 'lte' // less than or equal
  | 'gt' // greater than
  | 'gte' // greater than or equal
  | 'in' // in array
  | 'nin' // not in array
  | 'like' // case-insensitive substring
  | 'null'; // is null / not null

/**
 * Parsed query filter
 */
export interface QueryFilter {
  field: string;
  operator: QueryOperator;
  value: string | number | boolean | string[];
}

/**
 * Pagination parameters from query string
 */
export interface PaginationParams {
  offset: number;
  limit: number;
}

/**
 * Standard paging object in all API responses
 * All fields are required but can be null
 */
export interface PagingObject {
  offset: number | null;
  limit: number | null;
  total: number | null;
  totalPages: number | null;
  hasNext: boolean | null;
  hasPrev: boolean | null;
}

/**
 * Generic successful API response
 * Used for both single resources and collections
 */
export interface ApiResponse<T> {
  data: T | T[];
  paging: PagingObject;
}

/**
 * Error response structure
 */
export interface ErrorResponse {
  error: {
    code: string;
    message: string;
    statusCode: number;
    timestamp: string;
    path: string;
    details?: Record<string, any>;
  };
}

/**
 * Create empty paging object (for single resources)
 */
export function createEmptyPaging(): PagingObject {
  return {
    offset: null,
    limit: null,
    total: null,
    totalPages: null,
    hasNext: null,
    hasPrev: null,
  };
}

/**
 * Create paging object for non-paginated lists (only total)
 */
export function createNonPaginatedPaging(total: number): PagingObject {
  return {
    offset: null,
    limit: null,
    total,
    totalPages: null,
    hasNext: null,
    hasPrev: null,
  };
}

/**
 * Create full paging object for paginated lists
 */
export function createPaginatedPaging(
  offset: number,
  limit: number,
  total: number,
): PagingObject {
  const totalPages = Math.ceil(total / limit);
  const currentPage = Math.floor(offset / limit) + 1;

  return {
    offset,
    limit,
    total,
    totalPages,
    hasNext: currentPage < totalPages,
    hasPrev: offset > 0,
  };
}
