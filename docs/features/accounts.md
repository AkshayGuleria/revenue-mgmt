# Accounts API Feature

**Status:** Implemented
**Phase:** Phase 1 - Foundation
**Implementation Date:** January 2026
**ADR Compliance:** [ADR-003: REST API Response Structure & Query Parameters](../adrs/003-rest-api-response-structure.md)

## Overview

The Accounts API manages enterprise B2B customer accounts with support for hierarchical account structures (parent-child relationships). This feature is the foundation for contract management, invoicing, and consolidated billing across account hierarchies.

## Business Context

In B2B SaaS, enterprise customers often have complex organizational structures with parent companies and multiple subsidiaries. The Accounts API supports:

- **Hierarchical Account Management** - Parent-child company relationships
- **Enterprise Account Types** - Enterprise, SMB, Startup segments
- **Flexible Payment Terms** - Net 30/60/90, Due on Receipt
- **Credit Management** - Credit limits and credit holds
- **Soft Deletion** - Preserve data integrity for historical records

## Database Schema

Located in: `packages/revenue-backend/prisma/schema.prisma`

```prisma
model Account {
  id                    String    @id @default(uuid())
  parentAccountId       String?
  accountName           String
  accountType           String    @default("enterprise")
  status                String    @default("active")
  primaryContactEmail   String    @unique
  billingContactName    String?
  billingContactEmail   String?
  billingAddressLine1   String?
  billingAddressLine2   String?
  billingCity           String?
  billingState          String?
  billingPostalCode     String?
  billingCountry        String?
  paymentTerms          String    @default("net_30")
  paymentTermsDays      Int       @default(30)
  currency              String    @default("USD")
  taxId                 String?
  creditLimit           Decimal?
  creditHold            Boolean   @default(false)
  metadata              Json?
  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @updatedAt
  deletedAt             DateTime?

  parent                Account?  @relation("AccountHierarchy", fields: [parentAccountId], references: [id])
  children              Account[] @relation("AccountHierarchy")
  contracts             Contract[]
  invoices              Invoice[]
}
```

**Key Indices:**
- `idx_accounts_parent` on `parentAccountId` - Optimize hierarchy queries
- `primaryContactEmail` - Unique constraint for email validation

## API Endpoints

Base Path: `/api/accounts`

### 1. Create Account

**Endpoint:** `POST /api/accounts`

**Description:** Create a new enterprise account with optional parent account for hierarchical structures.

**Request Body:**

```typescript
{
  "parentAccountId": "123e4567-e89b-12d3-a456-426614174000", // Optional
  "accountName": "Acme Corporation",
  "accountType": "enterprise", // enterprise | smb | startup
  "primaryContactEmail": "contact@acme.com",
  "billingContactName": "John Doe",
  "billingContactEmail": "billing@acme.com",
  "billingAddressLine1": "123 Main Street",
  "billingAddressLine2": "Suite 100",
  "billingCity": "San Francisco",
  "billingState": "CA",
  "billingPostalCode": "94105",
  "billingCountry": "USA",
  "paymentTerms": "net_30", // net_30 | net_60 | net_90 | due_on_receipt
  "paymentTermsDays": 30,
  "currency": "USD",
  "taxId": "US123456789",
  "creditLimit": 100000.00,
  "creditHold": false,
  "metadata": {
    "salesRep": "Jane Smith",
    "region": "West"
  }
}
```

**Response:** `201 Created`

```json
{
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "accountName": "Acme Corporation",
    "accountType": "enterprise",
    "status": "active",
    "primaryContactEmail": "contact@acme.com",
    "paymentTerms": "net_30",
    "currency": "USD",
    "createdAt": "2026-01-15T10:00:00Z"
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

**Error Responses:**
- `400 Bad Request` - Invalid input data or circular hierarchy detected
- `404 Not Found` - Parent account not found
- `409 Conflict` - Account with this email already exists

**Validations:**
- Parent account must exist if `parentAccountId` provided
- Prevents circular hierarchy references
- Unique constraint on `primaryContactEmail`

---

### 2. List Accounts

**Endpoint:** `GET /api/accounts`

**Description:** Retrieve paginated list of accounts with operator-based filtering and searching.

**Query Parameters (ADR-003 Compliant):**

```bash
# Pagination (offset-based)
?offset[eq]=0&limit[eq]=20

# Filter by account type
?accountType[eq]=enterprise

# Filter by status
?status[in]=active,trial

# Filter by credit limit range
?creditLimit[gte]=50000&creditLimit[lte]=200000

# Search by account name (case-insensitive)
?accountName[like]=acme

# Filter accounts with parent (hierarchy)
?parentAccountId[null]=false

# Filter top-level accounts (no parent)
?parentAccountId[null]=true
```

**Supported Operators:**
- `[eq]` - Equals
- `[ne]` - Not equals
- `[lt]`, `[lte]` - Less than (or equal)
- `[gt]`, `[gte]` - Greater than (or equal)
- `[in]`, `[nin]` - In / Not in list (comma-separated)
- `[like]` - Case-insensitive substring match
- `[null]` - Is null / not null (true/false)

**Response:** `200 OK`

```json
{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "accountName": "Acme Corporation",
      "accountType": "enterprise",
      "status": "active",
      "primaryContactEmail": "contact@acme.com",
      "parent": {
        "id": "123e4567-e89b-12d3-a456-426614174000",
        "accountName": "Acme Global Holdings"
      },
      "_count": {
        "children": 3,
        "contracts": 5,
        "invoices": 42
      },
      "createdAt": "2026-01-15T10:00:00Z"
    }
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

**Default Pagination:**
- `offset`: 0
- `limit`: 20 (max: 100)

**Includes:**
- Parent account (ID and name)
- Counts of children, contracts, and invoices

**Filters:**
- Automatically excludes soft-deleted accounts (`deletedAt IS NULL`)
- Ordered by `createdAt DESC`

---

### 3. Get Account by ID

**Endpoint:** `GET /api/accounts/:id`

**Description:** Retrieve detailed account information including parent, children, and active contracts.

**Path Parameters:**
- `id` - Account UUID

**Response:** `200 OK`

```json
{
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "accountName": "Acme Corporation",
    "accountType": "enterprise",
    "status": "active",
    "primaryContactEmail": "contact@acme.com",
    "billingContactName": "John Doe",
    "billingContactEmail": "billing@acme.com",
    "billingAddressLine1": "123 Main Street",
    "billingCity": "San Francisco",
    "billingState": "CA",
    "billingPostalCode": "94105",
    "billingCountry": "USA",
    "paymentTerms": "net_30",
    "paymentTermsDays": 30,
    "currency": "USD",
    "creditLimit": 100000.00,
    "creditHold": false,
    "parent": {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "accountName": "Acme Global Holdings"
    },
    "children": [
      {
        "id": "789e4567-e89b-12d3-a456-426614174111",
        "accountName": "Acme Europe GmbH",
        "status": "active"
      }
    ],
    "contracts": [
      {
        "id": "contract-001",
        "contractNumber": "CN-2026-001",
        "status": "active",
        "startDate": "2026-01-01",
        "endDate": "2027-01-01"
      }
    ],
    "_count": {
      "children": 3,
      "contracts": 5,
      "invoices": 42
    },
    "createdAt": "2026-01-15T10:00:00Z",
    "updatedAt": "2026-01-15T10:00:00Z"
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

**Error Responses:**
- `404 Not Found` - Account not found or soft-deleted

**Includes:**
- Parent account (ID and name)
- Child accounts (ID, name, status)
- Active contracts only
- Counts of children, contracts, and invoices

---

### 4. Update Account

**Endpoint:** `PATCH /api/accounts/:id`

**Description:** Update account information. Validates hierarchy changes to prevent circular references.

**Path Parameters:**
- `id` - Account UUID

**Request Body (partial update):**

```json
{
  "accountName": "Acme Corporation Inc.",
  "creditLimit": 150000.00,
  "creditHold": false,
  "parentAccountId": "new-parent-id" // Optional: change parent
}
```

**Response:** `200 OK`

```json
{
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "accountName": "Acme Corporation Inc.",
    "creditLimit": 150000.00,
    "creditHold": false,
    "updatedAt": "2026-01-15T11:00:00Z"
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

**Error Responses:**
- `400 Bad Request` - Invalid data or circular hierarchy detected
- `404 Not Found` - Account or parent account not found
- `409 Conflict` - Email conflict with existing account

**Validations:**
- Parent account must exist if `parentAccountId` changed
- Prevents self-referencing (account cannot be its own parent)
- Prevents circular hierarchy (checks parent chain)
- Unique constraint on `primaryContactEmail`

---

### 5. Delete Account

**Endpoint:** `DELETE /api/accounts/:id`

**Description:** Soft delete an account (sets `deletedAt` and status to `inactive`). Preserves historical data.

**Path Parameters:**
- `id` - Account UUID

**Response:** `204 No Content`

**Error Responses:**
- `404 Not Found` - Account not found

**Behavior:**
- Soft delete: Sets `deletedAt` timestamp and `status = 'inactive'`
- Account remains in database for audit trail and historical reporting
- Deleted accounts excluded from list queries automatically
- Related contracts and invoices remain accessible

---

## Implementation Details

### Project Structure

```
packages/revenue-backend/src/modules/accounts/
├── accounts.controller.ts      # REST endpoints
├── accounts.service.ts         # Business logic
├── accounts.module.ts          # NestJS module
├── accounts.service.spec.ts    # Unit tests (93%+ coverage)
└── dto/
    ├── create-account.dto.ts   # Request validation for create
    ├── update-account.dto.ts   # Request validation for update
    ├── query-accounts.dto.ts   # Query parameter validation
    └── index.ts                # DTO exports
```

### Technology Stack

- **Framework:** NestJS (TypeScript)
- **Database:** PostgreSQL (via Prisma ORM)
- **Validation:** class-validator, class-transformer
- **API Documentation:** Swagger/OpenAPI (@nestjs/swagger)

### Key Features

#### 1. Hierarchical Account Support

Accounts can have parent-child relationships for enterprise organizational structures:

```typescript
// Example hierarchy:
// Acme Global Holdings (parent)
//   ├── Acme Corporation (child)
//   │   └── Acme West Division (grandchild)
//   └── Acme Europe GmbH (child)
```

**Circular Hierarchy Prevention:**

The service implements a `checkCircularHierarchy()` method that traverses the parent chain to prevent circular references:

```typescript
// Located in: accounts.service.ts:218-244
private async checkCircularHierarchy(
  accountId: string,
  newParentId: string,
): Promise<void> {
  let currentId = newParentId;
  const visited = new Set<string>([accountId]);

  while (currentId) {
    if (visited.has(currentId)) {
      throw new BadRequestException(
        'Cannot create circular account hierarchy',
      );
    }
    visited.add(currentId);

    const parent = await this.prisma.account.findUnique({
      where: { id: currentId },
      select: { parentAccountId: true },
    });

    currentId = parent?.parentAccountId || null;
  }
}
```

#### 2. Operator-Based Query Filtering

The API uses a custom query parser utility to convert operator-based query parameters into Prisma filters:

**Utility:** `src/common/utils/query-parser.ts`

```typescript
// Example query:
// GET /api/accounts?accountType[eq]=enterprise&creditLimit[gte]=50000

// Parsed to Prisma filter:
{
  accountType: { equals: 'enterprise' },
  creditLimit: { gte: 50000 }
}
```

#### 3. Standard API Response Structure

All responses follow ADR-003 compliant structure:

**Utility:** `src/common/utils/response-builder.ts`

```typescript
// Single resource response
buildSingleResponse(account)
// Returns: { data: {...}, paging: { all null } }

// Paginated list response
buildPaginatedListResponse(accounts, offset, limit, total)
// Returns: { data: [...], paging: { offset, limit, total, ... } }
```

#### 4. Soft Deletion

Accounts are soft-deleted to preserve historical data:

```typescript
// Located in: accounts.service.ts:204-216
async remove(id: string): Promise<void> {
  await this.prisma.account.update({
    where: { id },
    data: {
      deletedAt: new Date(),
      status: 'inactive',
    },
  });
}
```

**Automatic Filtering:**
All list queries automatically exclude soft-deleted accounts:

```typescript
// Located in: accounts.service.ts:68-71
const where: Prisma.AccountWhereInput = {
  ...parsedWhere,
  deletedAt: null, // Always exclude soft-deleted accounts
};
```

## Testing

**Test File:** `src/modules/accounts/accounts.service.spec.ts`

**Coverage:** 93%+ (all service methods tested)

**Test Scenarios:**
- Create account with and without parent
- Create account validation (email uniqueness, parent existence)
- Circular hierarchy prevention
- List accounts with filtering and pagination
- Get account by ID with relations
- Update account (including parent changes)
- Soft delete account
- Error handling (not found, conflicts, bad requests)

**Run Tests:**

```bash
# Unit tests
npm run test accounts.service.spec

# Test coverage
npm run test:cov accounts.service.spec
```

## Usage Examples

### Example 1: Create Enterprise Account

```bash
curl -X POST http://localhost:5177/api/accounts \
  -H "Content-Type: application/json" \
  -d '{
    "accountName": "Acme Corporation",
    "accountType": "enterprise",
    "primaryContactEmail": "contact@acme.com",
    "billingContactEmail": "billing@acme.com",
    "paymentTerms": "net_30",
    "creditLimit": 100000.00,
    "currency": "USD"
  }'
```

### Example 2: Create Child Account

```bash
curl -X POST http://localhost:5177/api/accounts \
  -H "Content-Type: application/json" \
  -d '{
    "parentAccountId": "550e8400-e29b-41d4-a716-446655440000",
    "accountName": "Acme Europe GmbH",
    "accountType": "enterprise",
    "primaryContactEmail": "eu@acme.com",
    "currency": "EUR"
  }'
```

### Example 3: Search Accounts

```bash
# Find all enterprise accounts with credit limit >= $50k
curl "http://localhost:5177/api/accounts?accountType[eq]=enterprise&creditLimit[gte]=50000"

# Search accounts by name (case-insensitive)
curl "http://localhost:5177/api/accounts?accountName[like]=acme"

# Get top-level accounts (no parent)
curl "http://localhost:5177/api/accounts?parentAccountId[null]=true"
```

### Example 4: Update Account

```bash
curl -X PATCH http://localhost:5177/api/accounts/550e8400-e29b-41d4-a716-446655440000 \
  -H "Content-Type: application/json" \
  -d '{
    "creditLimit": 150000.00,
    "creditHold": false
  }'
```

## Performance Considerations

### Database Optimization

1. **Indices:**
   - `idx_accounts_parent` on `parentAccountId` - Optimize hierarchy queries
   - Unique index on `primaryContactEmail`

2. **Query Optimization:**
   - Use `select` to limit returned fields for parent/children
   - Use `_count` for efficient counting of relations
   - Filter soft-deleted accounts at query level

3. **Pagination:**
   - Offset-based pagination (SQL-friendly: `LIMIT x OFFSET y`)
   - Default limit: 20, max: 100
   - Always include total count for client-side pagination UI

### Caching Strategy (Future Phase)

```typescript
// Recommended for Phase 3+ (Hierarchical Accounts)
// Cache account hierarchy (15 min TTL)
// Invalidate on update/delete
```

## Security Considerations

1. **Input Validation:**
   - All DTOs use class-validator decorators
   - Email format validation
   - Enum validation for accountType, paymentTerms
   - Minimum value validation for numeric fields

2. **Hierarchy Protection:**
   - Circular reference detection
   - Self-reference prevention
   - Parent existence validation

3. **Data Integrity:**
   - Unique email constraint
   - Soft deletion preserves audit trail
   - Foreign key constraints on parent relationships

4. **Error Handling:**
   - Specific error messages for validation failures
   - 404 for not found resources
   - 409 for conflicts (duplicate email)
   - 400 for validation errors

## Future Enhancements

### Phase 3: Hierarchical Accounts (Weeks 5-6)

1. **Recursive Hierarchy Queries:**
   - Implement recursive CTEs for multi-level hierarchy traversal
   - Add `GET /api/accounts/:id/hierarchy` endpoint
   - Return full parent chain and descendant tree

2. **Consolidated Billing:**
   - Roll-up invoices across account hierarchies
   - Parent account aggregated billing

3. **Hierarchy Depth Limits:**
   - Enforce maximum 5 levels to prevent infinite recursion
   - Add validation in create/update operations

4. **Materialized Path Pattern:**
   - Consider for deep hierarchies (>3 levels)
   - Store full path for faster queries: `/parent/child/grandchild/`

### Phase 5: Analytics & Optimization (Weeks 10-12)

1. **Account Health Metrics:**
   - ARR/MRR per account
   - Payment history scoring
   - Credit utilization tracking

2. **Advanced Filtering:**
   - Full-text search on account name and metadata
   - Geographic filtering (city, state, country)
   - Date range filtering (createdAt, updatedAt)

## Related Features

- **Contracts API** - Link contracts to accounts (`docs/features/contracts.md`)
- **Products API** - Products referenced in contract line items (`docs/features/products.md`)
- **Invoices API** (Phase 1) - Generate invoices for accounts
- **Consolidated Billing** (Phase 3) - Roll-up billing across hierarchies

## API Reference

**Swagger Documentation:** http://localhost:5177/api/docs

## Contact

For questions or issues related to the Accounts API, please refer to:
- **Feature Specification:** `docs/feature-spec.md` (Phase 1, Task Group 1.1)
- **ADR:** `docs/adrs/003-rest-api-response-structure.md`
- **Project Instructions:** `.claude/CLAUDE.md`
