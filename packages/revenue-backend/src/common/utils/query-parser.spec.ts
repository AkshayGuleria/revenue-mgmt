import {
  parseQueryKey,
  parsePaginationParams,
  parseQueryFilters,
  filterToPrismaWhere,
  filtersToPrismaWhere,
  parseQuery,
} from './query-parser';
import { QueryFilter } from '../interfaces';

describe('QueryParser', () => {
  describe('parseQueryKey', () => {
    it('should parse valid query key with eq operator', () => {
      const result = parseQueryKey('status[eq]');
      expect(result).toEqual({ field: 'status', operator: 'eq' });
    });

    it('should parse valid query key with all supported operators', () => {
      const operators = ['eq', 'ne', 'lt', 'lte', 'gt', 'gte', 'in', 'nin', 'like', 'null'];

      operators.forEach(op => {
        const result = parseQueryKey(`field[${op}]`);
        expect(result).toEqual({ field: 'field', operator: op });
      });
    });

    it('should return null for invalid operator', () => {
      const result = parseQueryKey('status[invalid]');
      expect(result).toBeNull();
    });

    it('should return null for key without operator', () => {
      const result = parseQueryKey('status');
      expect(result).toBeNull();
    });

    it('should return null for malformed key', () => {
      const result = parseQueryKey('status[eq');
      expect(result).toBeNull();
    });
  });

  describe('parsePaginationParams', () => {
    it('should parse offset and limit', () => {
      const query = { 'offset[eq]': '10', 'limit[eq]': '50' };
      const result = parsePaginationParams(query);
      expect(result).toEqual({ offset: 10, limit: 50 });
    });

    it('should use default values when not provided', () => {
      const result = parsePaginationParams({});
      expect(result).toEqual({ offset: 0, limit: 20 });
    });

    it('should enforce maximum limit of 100', () => {
      const query = { 'limit[eq]': '200' };
      const result = parsePaginationParams(query);
      expect(result.limit).toBe(100);
    });

    it('should enforce minimum limit of 1', () => {
      const query = { 'limit[eq]': '0' };
      const result = parsePaginationParams(query);
      expect(result.limit).toBe(20);
    });

    it('should enforce minimum offset of 0', () => {
      const query = { 'offset[eq]': '-10' };
      const result = parsePaginationParams(query);
      expect(result.offset).toBe(0);
    });
  });

  describe('parseQueryFilters', () => {
    it('should parse single filter', () => {
      const query = { 'status[eq]': 'active' };
      const result = parseQueryFilters(query);
      expect(result).toEqual([
        { field: 'status', operator: 'eq', value: 'active' },
      ]);
    });

    it('should parse multiple filters', () => {
      const query = {
        'status[eq]': 'active',
        'total[gte]': '100',
      };
      const result = parseQueryFilters(query);
      expect(result).toHaveLength(2);
      expect(result).toContainEqual({ field: 'status', operator: 'eq', value: 'active' });
      expect(result).toContainEqual({ field: 'total', operator: 'gte', value: '100' });
    });

    it('should skip pagination parameters', () => {
      const query = {
        'offset[eq]': '0',
        'limit[eq]': '20',
        'status[eq]': 'active',
      };
      const result = parseQueryFilters(query);
      expect(result).toHaveLength(1);
      expect(result[0].field).toBe('status');
    });

    it('should handle IN operator with comma-separated values', () => {
      const query = { 'status[in]': 'active,pending' };
      const result = parseQueryFilters(query);
      expect(result).toEqual([
        { field: 'status', operator: 'in', value: ['active', 'pending'] },
      ]);
    });

    it('should handle NIN operator with comma-separated values', () => {
      const query = { 'status[nin]': 'cancelled,void' };
      const result = parseQueryFilters(query);
      expect(result).toEqual([
        { field: 'status', operator: 'nin', value: ['cancelled', 'void'] },
      ]);
    });

    it('should handle NULL operator with true value', () => {
      const query = { 'parentAccountId[null]': 'true' };
      const result = parseQueryFilters(query);
      expect(result).toEqual([
        { field: 'parentAccountId', operator: 'null', value: true },
      ]);
    });

    it('should handle NULL operator with false value', () => {
      const query = { 'parentAccountId[null]': 'false' };
      const result = parseQueryFilters(query);
      expect(result).toEqual([
        { field: 'parentAccountId', operator: 'null', value: false },
      ]);
    });

    it('should skip invalid query keys', () => {
      const query = {
        'status[eq]': 'active',
        'invalid_key': 'value',
        'another[bad]': 'test',
      };
      const result = parseQueryFilters(query);
      expect(result).toHaveLength(1);
      expect(result[0].field).toBe('status');
    });
  });

  describe('filterToPrismaWhere', () => {
    it('should convert eq operator', () => {
      const filter: QueryFilter = { field: 'status', operator: 'eq', value: 'active' };
      const result = filterToPrismaWhere(filter);
      expect(result).toEqual({ status: 'active' });
    });

    it('should convert ne operator', () => {
      const filter: QueryFilter = { field: 'status', operator: 'ne', value: 'cancelled' };
      const result = filterToPrismaWhere(filter);
      expect(result).toEqual({ status: { not: 'cancelled' } });
    });

    it('should convert lt operator', () => {
      const filter: QueryFilter = { field: 'total', operator: 'lt', value: 100 };
      const result = filterToPrismaWhere(filter);
      expect(result).toEqual({ total: { lt: 100 } });
    });

    it('should convert lte operator', () => {
      const filter: QueryFilter = { field: 'total', operator: 'lte', value: 100 };
      const result = filterToPrismaWhere(filter);
      expect(result).toEqual({ total: { lte: 100 } });
    });

    it('should convert gt operator', () => {
      const filter: QueryFilter = { field: 'total', operator: 'gt', value: 100 };
      const result = filterToPrismaWhere(filter);
      expect(result).toEqual({ total: { gt: 100 } });
    });

    it('should convert gte operator', () => {
      const filter: QueryFilter = { field: 'total', operator: 'gte', value: 100 };
      const result = filterToPrismaWhere(filter);
      expect(result).toEqual({ total: { gte: 100 } });
    });

    it('should convert in operator with array', () => {
      const filter: QueryFilter = { field: 'status', operator: 'in', value: ['active', 'pending'] };
      const result = filterToPrismaWhere(filter);
      expect(result).toEqual({ status: { in: ['active', 'pending'] } });
    });

    it('should convert in operator with single value', () => {
      const filter: QueryFilter = { field: 'status', operator: 'in', value: 'active' };
      const result = filterToPrismaWhere(filter);
      expect(result).toEqual({ status: { in: ['active'] } });
    });

    it('should convert nin operator with array', () => {
      const filter: QueryFilter = { field: 'status', operator: 'nin', value: ['cancelled', 'void'] };
      const result = filterToPrismaWhere(filter);
      expect(result).toEqual({ status: { notIn: ['cancelled', 'void'] } });
    });

    it('should convert nin operator with single value', () => {
      const filter: QueryFilter = { field: 'status', operator: 'nin', value: 'cancelled' };
      const result = filterToPrismaWhere(filter);
      expect(result).toEqual({ status: { notIn: ['cancelled'] } });
    });

    it('should convert like operator', () => {
      const filter: QueryFilter = { field: 'accountName', operator: 'like', value: 'acme' };
      const result = filterToPrismaWhere(filter);
      expect(result).toEqual({ accountName: { contains: 'acme', mode: 'insensitive' } });
    });

    it('should convert null operator with true value', () => {
      const filter: QueryFilter = { field: 'parentAccountId', operator: 'null', value: true };
      const result = filterToPrismaWhere(filter);
      expect(result).toEqual({ parentAccountId: null });
    });

    it('should convert null operator with false value', () => {
      const filter: QueryFilter = { field: 'parentAccountId', operator: 'null', value: false };
      const result = filterToPrismaWhere(filter);
      expect(result).toEqual({ parentAccountId: { not: null } });
    });
  });

  describe('filtersToPrismaWhere', () => {
    it('should return empty object for empty filters', () => {
      const result = filtersToPrismaWhere([]);
      expect(result).toEqual({});
    });

    it('should return single filter directly', () => {
      const filters: QueryFilter[] = [
        { field: 'status', operator: 'eq', value: 'active' },
      ];
      const result = filtersToPrismaWhere(filters);
      expect(result).toEqual({ status: 'active' });
    });

    it('should combine multiple filters with AND', () => {
      const filters: QueryFilter[] = [
        { field: 'status', operator: 'eq', value: 'active' },
        { field: 'total', operator: 'gte', value: 100 },
      ];
      const result = filtersToPrismaWhere(filters);
      expect(result).toEqual({
        AND: [
          { status: 'active' },
          { total: { gte: 100 } },
        ],
      });
    });

    it('should handle complex multiple filters', () => {
      const filters: QueryFilter[] = [
        { field: 'status', operator: 'in', value: ['active', 'pending'] },
        { field: 'total', operator: 'gte', value: 100 },
        { field: 'parentAccountId', operator: 'null', value: false },
      ];
      const result = filtersToPrismaWhere(filters);
      expect(result).toEqual({
        AND: [
          { status: { in: ['active', 'pending'] } },
          { total: { gte: 100 } },
          { parentAccountId: { not: null } },
        ],
      });
    });
  });

  describe('parseQuery', () => {
    it('should parse complete query with pagination and filters', () => {
      const query = {
        'offset[eq]': '10',
        'limit[eq]': '50',
        'status[eq]': 'active',
        'total[gte]': '100',
      };
      const result = parseQuery(query);
      expect(result.pagination).toEqual({ offset: 10, limit: 50 });
      expect(result.where).toEqual({
        AND: [
          { status: 'active' },
          { total: { gte: '100' } },
        ],
      });
    });

    it('should parse query with only pagination', () => {
      const query = {
        'offset[eq]': '0',
        'limit[eq]': '20',
      };
      const result = parseQuery(query);
      expect(result.pagination).toEqual({ offset: 0, limit: 20 });
      expect(result.where).toEqual({});
    });

    it('should parse query with only filters', () => {
      const query = {
        'status[eq]': 'active',
      };
      const result = parseQuery(query);
      expect(result.pagination).toEqual({ offset: 0, limit: 20 });
      expect(result.where).toEqual({ status: 'active' });
    });

    it('should handle empty query', () => {
      const result = parseQuery({});
      expect(result.pagination).toEqual({ offset: 0, limit: 20 });
      expect(result.where).toEqual({});
    });
  });
});
