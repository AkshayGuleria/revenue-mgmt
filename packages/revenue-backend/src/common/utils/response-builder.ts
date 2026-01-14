import {
  ApiResponse,
  PagingObject,
  createEmptyPaging,
  createNonPaginatedPaging,
  createPaginatedPaging,
} from '../interfaces';

/**
 * Response Builder Utility
 * Creates consistent API responses with data and paging objects
 * Reference: ADR-003 - REST API Response Structure & Query Parameters
 */

/**
 * Build response for a single resource
 * Paging object has all null values
 */
export function buildSingleResponse<T>(data: T): ApiResponse<T> {
  return {
    data,
    paging: createEmptyPaging(),
  };
}

/**
 * Build response for a non-paginated list (small collections)
 * Paging object only has total, rest are null
 */
export function buildNonPaginatedListResponse<T>(data: T[]): ApiResponse<T> {
  return {
    data,
    paging: createNonPaginatedPaging(data.length),
  };
}

/**
 * Build response for a paginated list
 * All paging fields are filled
 */
export function buildPaginatedListResponse<T>(
  data: T[],
  offset: number,
  limit: number,
  total: number,
): ApiResponse<T> {
  return {
    data,
    paging: createPaginatedPaging(offset, limit, total),
  };
}

/**
 * Build custom response with explicit paging object
 * Use when you need full control over paging values
 */
export function buildCustomResponse<T>(
  data: T | T[],
  paging: PagingObject,
): ApiResponse<T> {
  return {
    data,
    paging,
  };
}
