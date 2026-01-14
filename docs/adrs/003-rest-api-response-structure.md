# ADR-003: REST API Response Structure & Query Parameters

**Status:** Accepted
**Date:** 2026-01-14
**Decision Makers:** tommi (Architecture Lead)
**Tags:** #api #rest #standards #query-parameters

---

## Context

We need a consistent, predictable REST API response structure across all endpoints in the revenue management system. The structure must:

1. Support both single resources and collections
2. Provide consistent pagination metadata
3. Enable SQL-friendly query parameters with operators
4. Support advanced filtering (equals, greater than, less than, in, like, etc.)
5. Work seamlessly with PostgreSQL offset-based pagination

Without standardization, each endpoint would have different response formats, making client integration difficult and error-prone.

---

## Decision

We will use a **uniform response structure** with consistent `data` and `paging` objects for all successful API responses.

### 1. Response Structure

#### All Successful Responses

```typescript
{
  "data": T | T[],  // Single resource or array
  "paging": {
    "offset": number | null,
    "limit": number | null,
    "total": number | null,
    "totalPages": number | null,
    "hasNext": boolean | null,
    "hasPrev": boolean | null
  }
}
```

#### Paginated List Response

```json
{
  "data": [
    { "id": "123", "accountName": "Acme Corp", ... },
    { "id": "456", "accountName": "TechStart Inc", ... }
  ],
  "paging": {
    "offset": 0,
    "limit": 20,
    "total": 156,
    "totalPages": 8,
    "hasNext": true,
    "hasPrev": false
  }
}
```

#### Single Resource Response

```json
{
  "data": {
    "id": "123",
    "accountName": "Acme Corp",
    ...
  },
  "paging": {
    "offset": null,
    "limit": null,
    "total": null,
    "totalPages": null,
    "hasNext": null,
    "hasPrev": null
  }
}
```

#### Non-Paginated Collection Response

For small nested collections (e.g., `/api/accounts/:id/children`):

```json
{
  "data": [
    { "id": "456", "accountName": "Subsidiary 1" },
    { "id": "789", "accountName": "Subsidiary 2" }
  ],
  "paging": {
    "offset": null,
    "limit": null,
    "total": 2,
    "totalPages": null,
    "hasNext": null,
    "hasPrev": null
  }
}
```

#### Error Response

```json
{
  "error": {
    "code": "ACCOUNT_NOT_FOUND",
    "message": "Account with ID xyz not found",
    "statusCode": 404,
    "timestamp": "2026-01-14T19:30:00.000Z",
    "path": "/api/accounts/xyz",
    "details": { ... }
  }
}
```

### 2. Query Parameter Operators

Use **operator suffixes** in square brackets for filtering:

#### Supported Operators

| Operator | SQL | Example | Description |
|----------|-----|---------|-------------|
| `[eq]` | `=` | `status[eq]=active` | Equals |
| `[ne]` | `!=` | `status[ne]=inactive` | Not equals |
| `[lt]` | `<` | `creditLimit[lt]=10000` | Less than |
| `[lte]` | `<=` | `createdAt[lte]=2024-12-31` | Less than or equal |
| `[gt]` | `>` | `creditLimit[gt]=5000` | Greater than |
| `[gte]` | `>=` | `createdAt[gte]=2024-01-01` | Greater than or equal |
| `[in]` | `IN (...)` | `status[in]=active,suspended` | In list |
| `[nin]` | `NOT IN (...)` | `type[nin]=startup` | Not in list |
| `[like]` | `ILIKE` | `name[like]=acme` | Case-insensitive substring |
| `[null]` | `IS NULL` | `parentAccountId[null]=true` | Is null / not null |

#### Query Examples

```bash
# Pagination (offset-based, SQL-friendly)
GET /api/accounts?offset[eq]=0&limit[eq]=20

# Filter by equality
GET /api/accounts?status[eq]=active&accountType[eq]=enterprise

# Date range filtering
GET /api/contracts?startDate[gte]=2024-01-01&endDate[lte]=2024-12-31

# Numeric comparisons
GET /api/accounts?creditLimit[gt]=10000&creditLimit[lte]=100000

# IN operator (comma-separated values)
GET /api/invoices?status[in]=pending,overdue

# LIKE operator (case-insensitive search)
GET /api/accounts?accountName[like]=acme

# NULL checks (get top-level accounts without parent)
GET /api/accounts?parentAccountId[null]=true

# Complex combined query
GET /api/invoices?status[in]=pending,overdue&dueDate[lt]=2024-01-15&total[gte]=1000&offset[eq]=0&limit[eq]=50
```

### 3. Pagination Rules

#### Offset-Based Pagination

- Use `offset[eq]` and `limit[eq]` query parameters
- Default: `offset=0`, `limit=20`
- Maximum limit: `100`
- Directly maps to SQL: `LIMIT x OFFSET y`

#### When to Paginate

- **Always paginate** main list endpoints: `GET /api/accounts`, `GET /api/contracts`, `GET /api/invoices`
- **Never paginate** single resource: `GET /api/accounts/:id`
- **Optional pagination** for nested collections:
  - Small collections (< 20 items typically): No pagination, fill only `total` in paging object
  - Large collections: Paginate with full paging object

#### Paging Object Rules

- **Paginated list**: Fill all fields (`offset`, `limit`, `total`, `totalPages`, `hasNext`, `hasPrev`)
- **Single resource**: All fields `null`
- **Non-paginated list**: Only `total` filled, rest `null`

### 4. HTTP Status Codes

| Code | Usage | Response Body |
|------|-------|---------------|
| 200 OK | Successful GET, PUT, PATCH | `{ data, paging }` |
| 201 Created | Successful POST | `{ data, paging }` with created resource |
| 204 No Content | Successful DELETE | No body |
| 400 Bad Request | Validation errors | `{ error }` |
| 404 Not Found | Resource not found | `{ error }` |
| 409 Conflict | Duplicate resource | `{ error }` |
| 500 Internal Server Error | Server errors | `{ error }` |

### 5. TypeScript Interfaces

```typescript
// Query operators
type QueryOperator =
  | 'eq' | 'ne' | 'lt' | 'lte' | 'gt' | 'gte'
  | 'in' | 'nin' | 'like' | 'null';

// Paging object (always present)
interface PagingObject {
  offset: number | null;
  limit: number | null;
  total: number | null;
  totalPages: number | null;
  hasNext: boolean | null;
  hasPrev: boolean | null;
}

// Success response
interface ApiResponse<T> {
  data: T | T[];
  paging: PagingObject;
}

// Error response
interface ErrorResponse {
  error: {
    code: string;
    message: string;
    statusCode: number;
    timestamp: string;
    path: string;
    details?: Record<string, any>;
  };
}
```

---

## Consequences

### Positive

✅ **Consistency**: All endpoints follow the same pattern, making client integration predictable

✅ **SQL-Friendly**: Offset-based pagination maps directly to SQL `LIMIT x OFFSET y`

✅ **Flexibility**: Operator-based filters support complex queries without custom endpoints

✅ **Type Safety**: TypeScript interfaces ensure compile-time correctness

✅ **Explicit Operators**: `status[eq]=active` is more explicit than `status=active`, preventing ambiguity

✅ **Future-Proof**: Easy to add new operators (`[startswith]`, `[endswith]`, `[regex]`) without breaking existing APIs

✅ **Client-Friendly**: Consistent `paging` object (even when null) simplifies client code

### Negative

⚠️ **Query String Length**: Complex filters with multiple operators can create long URLs
- **Mitigation**: Recommend POST-based search endpoints for very complex queries

⚠️ **Learning Curve**: Developers must learn operator syntax instead of standard `?key=value`
- **Mitigation**: Comprehensive Swagger documentation with examples

⚠️ **Parsing Complexity**: Need utility functions to parse `field[operator]=value` syntax
- **Mitigation**: Create reusable query parser utility (Phase 1)

⚠️ **Null Overhead**: Single resources return empty paging objects with all nulls
- **Mitigation**: Small JSON overhead (< 100 bytes), acceptable for consistency

---

## Implementation

### Phase 1 (Current)

1. ✅ Create ADR-003 documenting the structure
2. ✅ Create TypeScript interfaces (`src/common/interfaces/`)
3. ✅ Create query parser utility (`src/common/utils/query-parser.ts`)
4. ✅ Create response builder utility (`src/common/utils/response-builder.ts`)
5. ✅ Create base pagination DTO (`src/common/dto/pagination.dto.ts`)
6. ✅ Refactor Accounts API to use new structure
7. ✅ Update CLAUDE.md with implementation rules

### Phase 2+

- Apply to all future modules (Contracts, Products, Invoices, etc.)
- Add sorting support: `sortBy[eq]=createdAt&sortOrder[eq]=desc`
- Add advanced operators: `[startswith]`, `[endswith]`, `[between]`
- Consider GraphQL for clients needing extreme flexibility

---

## Alternatives Considered

### 1. Page-Based Pagination (`page=1&limit=20`)

**Rejected:** Not SQL-friendly. Requires calculating `OFFSET = (page - 1) * limit` in application code.

### 2. Simple Query Parameters (`status=active`)

**Rejected:** Ambiguous. Does `status=active` mean equals, contains, or starts with? Explicit operators remove ambiguity.

### 3. Different Response Structures per Resource Type

**Rejected:** Inconsistent. Clients would need different handling logic for each endpoint.

### 4. No Paging Object for Single Resources

**Rejected:** Inconsistent. Forces clients to check if `paging` exists before accessing it.

### 5. GraphQL

**Rejected for now:** Overkill for B2B billing use case. REST is sufficient. Consider for Phase 6+ if needed.

---

## References

- [JSON:API Specification](https://jsonapi.org/)
- [REST API Design Best Practices](https://stackoverflow.blog/2020/03/02/best-practices-for-rest-api-design/)
- [PostgreSQL LIMIT OFFSET](https://www.postgresql.org/docs/current/queries-limit.html)
- [NestJS Query Parameters](https://docs.nestjs.com/controllers#request-payloads)

---

## Related ADRs

- ADR-001: NestJS + Fastify + SWC Framework
- ADR-002: Jest + Supertest Testing Strategy
