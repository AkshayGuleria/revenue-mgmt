import {
  buildSingleResponse,
  buildNonPaginatedListResponse,
  buildPaginatedListResponse,
  buildCustomResponse,
} from './response-builder';

describe('ResponseBuilder', () => {
  describe('buildSingleResponse', () => {
    it('should build response for single resource with empty paging', () => {
      const data = { id: '123', name: 'Test' };
      const result = buildSingleResponse(data);

      expect(result).toEqual({
        data: { id: '123', name: 'Test' },
        paging: {
          offset: null,
          limit: null,
          total: null,
          totalPages: null,
          hasNext: null,
          hasPrev: null,
        },
      });
    });

    it('should handle null data', () => {
      const result = buildSingleResponse(null);
      expect(result.data).toBeNull();
      expect(result.paging.offset).toBeNull();
    });

    it('should handle complex nested objects', () => {
      const data = {
        id: '123',
        nested: {
          field: 'value',
          array: [1, 2, 3],
        },
      };
      const result = buildSingleResponse(data);
      expect(result.data).toEqual(data);
    });
  });

  describe('buildNonPaginatedListResponse', () => {
    it('should build response for non-paginated list', () => {
      const data = [
        { id: '1', name: 'Item 1' },
        { id: '2', name: 'Item 2' },
        { id: '3', name: 'Item 3' },
      ];
      const result = buildNonPaginatedListResponse(data);

      expect(result).toEqual({
        data,
        paging: {
          offset: null,
          limit: null,
          total: 3,
          totalPages: null,
          hasNext: null,
          hasPrev: null,
        },
      });
    });

    it('should handle empty array', () => {
      const result = buildNonPaginatedListResponse([]);
      expect(result.data).toEqual([]);
      expect(result.paging.total).toBe(0);
    });

    it('should handle single item array', () => {
      const data = [{ id: '1', name: 'Item 1' }];
      const result = buildNonPaginatedListResponse(data);
      expect(result.data).toEqual(data);
      expect(result.paging.total).toBe(1);
    });
  });

  describe('buildPaginatedListResponse', () => {
    it('should build response for paginated list', () => {
      const data = [
        { id: '1', name: 'Item 1' },
        { id: '2', name: 'Item 2' },
      ];
      const result = buildPaginatedListResponse(data, 0, 20, 100);

      expect(result).toEqual({
        data,
        paging: {
          offset: 0,
          limit: 20,
          total: 100,
          totalPages: 5,
          hasNext: true,
          hasPrev: false,
        },
      });
    });

    it('should calculate hasNext and hasPrev correctly for first page', () => {
      const data = [{ id: '1' }];
      const result = buildPaginatedListResponse(data, 0, 10, 50);

      expect(result.paging.hasNext).toBe(true);
      expect(result.paging.hasPrev).toBe(false);
    });

    it('should calculate hasNext and hasPrev correctly for middle page', () => {
      const data = [{ id: '1' }];
      const result = buildPaginatedListResponse(data, 20, 10, 50);

      expect(result.paging.hasNext).toBe(true);
      expect(result.paging.hasPrev).toBe(true);
    });

    it('should calculate hasNext and hasPrev correctly for last page', () => {
      const data = [{ id: '1' }];
      const result = buildPaginatedListResponse(data, 40, 10, 50);

      expect(result.paging.hasNext).toBe(false);
      expect(result.paging.hasPrev).toBe(true);
    });

    it('should handle exact page boundary', () => {
      const data = [{ id: '1' }];
      const result = buildPaginatedListResponse(data, 0, 20, 20);

      expect(result.paging.totalPages).toBe(1);
      expect(result.paging.hasNext).toBe(false);
      expect(result.paging.hasPrev).toBe(false);
    });

    it('should handle empty results on page > 1', () => {
      const result = buildPaginatedListResponse([], 40, 20, 100);

      expect(result.data).toEqual([]);
      expect(result.paging.offset).toBe(40);
      expect(result.paging.hasNext).toBe(true);
    });
  });

  describe('buildCustomResponse', () => {
    it('should build response with custom paging object for single resource', () => {
      const data = { id: '123', name: 'Test' };
      const customPaging = {
        offset: 10,
        limit: 20,
        total: 100,
        totalPages: 5,
        hasNext: true,
        hasPrev: true,
      };
      const result = buildCustomResponse(data, customPaging);

      expect(result).toEqual({
        data,
        paging: customPaging,
      });
    });

    it('should build response with custom paging object for array', () => {
      const data = [
        { id: '1', name: 'Item 1' },
        { id: '2', name: 'Item 2' },
      ];
      const customPaging = {
        offset: null,
        limit: null,
        total: 2,
        totalPages: null,
        hasNext: null,
        hasPrev: null,
      };
      const result = buildCustomResponse(data, customPaging);

      expect(result).toEqual({
        data,
        paging: customPaging,
      });
    });

    it('should allow completely custom paging values', () => {
      const data = { custom: 'data' };
      const customPaging = {
        offset: 0,
        limit: 50,
        total: 1000,
        totalPages: 20,
        hasNext: true,
        hasPrev: false,
      };
      const result = buildCustomResponse(data, customPaging);

      expect(result.paging).toEqual(customPaging);
    });

    it('should handle null paging values in custom object', () => {
      const data = [1, 2, 3];
      const customPaging = {
        offset: null,
        limit: null,
        total: null,
        totalPages: null,
        hasNext: null,
        hasPrev: null,
      };
      const result = buildCustomResponse(data, customPaging);

      expect(result.paging).toEqual(customPaging);
    });
  });
});
