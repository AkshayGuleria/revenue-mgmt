# Contracts API Feature

**Status:** Implemented
**Phase:** Phase 1 - Foundation
**Implementation Date:** January 2026
**ADR Compliance:** [ADR-003: REST API Response Structure & Query Parameters](../adrs/003-rest-api-response-structure.md)

## Overview

The Contracts API manages B2B enterprise contracts with support for multi-year commitments, seat-based licensing, and flexible billing frequencies. This feature is the foundation for automated invoice generation and contract-based revenue recognition.

## Business Context

In B2B SaaS, enterprise customers typically sign multi-year contracts with committed seat counts and predictable billing schedules. The Contracts API supports:

- **Multi-Year Commitments** - Annual, semi-annual, quarterly, or monthly contracts
- **Seat-Based Licensing** - Per-user/license pricing with committed seats
- **Flexible Billing** - Bill in advance or arrears with custom frequencies
- **Auto-Renewal Tracking** - Automated renewal notices and contract extensions
- **Contract Lifecycle Management** - Draft → Active → Expired/Renewed/Cancelled states

## Database Schema

Located in: `packages/revenue-backend/prisma/schema.prisma`

```prisma
model Contract {
  id                  String    @id @default(uuid())
  contractNumber      String    @unique
  accountId           String
  status              String    @default("draft")
  startDate           DateTime
  endDate             DateTime
  contractValue       Decimal
  billingFrequency    String    @default("annual")
  seatCount           Int?
  committedSeats      Int?
  seatPrice           Decimal?
  paymentTerms        String    @default("net_30")
  billingInAdvance    Boolean   @default(true)
  autoRenew           Boolean   @default(true)
  renewalNoticeDays   Int       @default(90)
  notes               String?
  metadata            Json?
  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt

  account             Account   @relation(fields: [accountId], references: [id])
  invoices            Invoice[]
}
```

**Key Indices:**
- `contractNumber` - Unique constraint for contract identification
- `idx_contracts_end_date` on `endDate` - Optimize renewal tracking queries
- `idx_contracts_account` on `accountId` - Fast account-based lookups
- Composite index on `(status, endDate)` - Renewal and expiration queries

## API Endpoints

Base Path: `/api/contracts`

### 1. Create Contract

**Endpoint:** `POST /api/contracts`

**Description:** Create a new contract for an account with seat-based terms and billing configuration.

**Request Body:**

```typescript
{
  "contractNumber": "CNT-2024-0001",
  "accountId": "123e4567-e89b-12d3-a456-426614174000",
  "status": "active", // draft | active | expired | cancelled | renewed
  "startDate": "2024-01-01",
  "endDate": "2024-12-31",
  "contractValue": 120000.00,
  "billingFrequency": "annual", // monthly | quarterly | semi_annual | annual
  "seatCount": 100,
  "committedSeats": 100,
  "seatPrice": 99.99,
  "paymentTerms": "net_30", // net_30 | net_60 | net_90 | due_on_receipt
  "billingInAdvance": true,
  "autoRenew": true,
  "renewalNoticeDays": 90,
  "notes": "Enterprise tier with volume discount",
  "metadata": {
    "salesRep": "Jane Smith",
    "discountApplied": "10%"
  }
}
```

**Response:** `201 Created`

```json
{
  "data": {
    "id": "contract-550e8400-e29b-41d4-a716-446655440000",
    "contractNumber": "CNT-2024-0001",
    "accountId": "123e4567-e89b-12d3-a456-426614174000",
    "status": "active",
    "startDate": "2024-01-01T00:00:00Z",
    "endDate": "2024-12-31T00:00:00Z",
    "contractValue": "120000.00",
    "billingFrequency": "annual",
    "seatCount": 100,
    "committedSeats": 100,
    "seatPrice": "99.99",
    "paymentTerms": "net_30",
    "billingInAdvance": true,
    "autoRenew": true,
    "renewalNoticeDays": 90,
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
- `400 Bad Request` - Invalid input data or end date before start date
- `404 Not Found` - Account not found
- `409 Conflict` - Contract number already exists

**Validations:**
- Account must exist
- End date must be after start date
- Contract number must be unique
- Numeric fields must be >= 0

---

### 2. List Contracts

**Endpoint:** `GET /api/contracts`

**Description:** Retrieve paginated list of contracts with operator-based filtering, including account details and invoice counts.

**Query Parameters (ADR-003 Compliant):**

```bash
# Pagination (offset-based)
?offset[eq]=0&limit[eq]=20

# Filter by status
?status[eq]=active

# Filter by multiple statuses
?status[in]=active,draft

# Filter by account
?accountId[eq]=123e4567-e89b-12d3-a456-426614174000

# Filter by contract value range
?contractValue[gte]=100000&contractValue[lte]=500000

# Filter contracts ending soon (renewal tracking)
?endDate[gte]=2026-01-01&endDate[lte]=2026-03-31

# Filter contracts starting in range
?startDate[gte]=2024-01-01&startDate[lte]=2024-12-31

# Filter by billing frequency
?billingFrequency[eq]=annual

# Filter by auto-renew setting
?autoRenew[eq]=true

# Filter by seat count range
?seatCount[gte]=50&seatCount[lte]=200

# Search by contract number
?contractNumber[like]=CNT-2024
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
      "id": "contract-550e8400-e29b-41d4-a716-446655440000",
      "contractNumber": "CNT-2024-0001",
      "status": "active",
      "startDate": "2024-01-01T00:00:00Z",
      "endDate": "2024-12-31T00:00:00Z",
      "contractValue": "120000.00",
      "billingFrequency": "annual",
      "seatCount": 100,
      "account": {
        "id": "123e4567-e89b-12d3-a456-426614174000",
        "accountName": "Acme Corporation",
        "status": "active"
      },
      "_count": {
        "invoices": 12
      },
      "createdAt": "2026-01-15T10:00:00Z"
    }
  ],
  "paging": {
    "offset": 0,
    "limit": 20,
    "total": 45,
    "totalPages": 3,
    "hasNext": true,
    "hasPrev": false
  }
}
```

**Default Pagination:**
- `offset`: 0
- `limit`: 20 (max: 100)

**Includes:**
- Account details (ID, name, status)
- Invoice count

**Ordering:**
- Default: `createdAt DESC` (newest first)

---

### 3. Get Contract by ID

**Endpoint:** `GET /api/contracts/:id`

**Description:** Retrieve detailed contract information including account details and all associated invoices.

**Path Parameters:**
- `id` - Contract UUID

**Response:** `200 OK`

```json
{
  "data": {
    "id": "contract-550e8400-e29b-41d4-a716-446655440000",
    "contractNumber": "CNT-2024-0001",
    "status": "active",
    "startDate": "2024-01-01T00:00:00Z",
    "endDate": "2024-12-31T00:00:00Z",
    "contractValue": "120000.00",
    "billingFrequency": "annual",
    "seatCount": 100,
    "committedSeats": 100,
    "seatPrice": "99.99",
    "paymentTerms": "net_30",
    "billingInAdvance": true,
    "autoRenew": true,
    "renewalNoticeDays": 90,
    "notes": "Enterprise tier with volume discount",
    "account": {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "accountName": "Acme Corporation",
      "primaryContactEmail": "contact@acme.com",
      "status": "active"
    },
    "invoices": [
      {
        "id": "invoice-001",
        "invoiceNumber": "INV-2024-001",
        "status": "paid",
        "total": "10000.00",
        "issueDate": "2024-01-01T00:00:00Z",
        "dueDate": "2024-01-31T00:00:00Z"
      }
    ],
    "_count": {
      "invoices": 12
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
- `404 Not Found` - Contract not found

**Includes:**
- Account details (ID, name, email, status)
- All invoices (ordered by `issueDate DESC`)
- Invoice count

---

### 4. Update Contract

**Endpoint:** `PATCH /api/contracts/:id`

**Description:** Update contract information. Validates account and date ranges if changed.

**Path Parameters:**
- `id` - Contract UUID

**Request Body (partial update):**

```json
{
  "status": "active",
  "seatCount": 150,
  "contractValue": 150000.00,
  "autoRenew": false
}
```

**Response:** `200 OK`

```json
{
  "data": {
    "id": "contract-550e8400-e29b-41d4-a716-446655440000",
    "contractNumber": "CNT-2024-0001",
    "status": "active",
    "seatCount": 150,
    "contractValue": "150000.00",
    "autoRenew": false,
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
- `400 Bad Request` - Invalid data or end date before start date
- `404 Not Found` - Contract or account not found
- `409 Conflict` - Contract number conflict

**Validations:**
- Account must exist if `accountId` changed
- End date must be after start date if both are updated
- Contract number must be unique
- Numeric fields must be >= 0

---

### 5. Delete Contract

**Endpoint:** `DELETE /api/contracts/:id`

**Description:** Hard delete a contract from the system. Use with caution.

**Path Parameters:**
- `id` - Contract UUID

**Response:** `204 No Content`

**Error Responses:**
- `404 Not Found` - Contract not found

**Behavior:**
- Hard delete: Permanently removes contract from database
- **Warning:** This will cascade delete related invoices if foreign key constraints allow
- Use status = 'cancelled' for soft archival instead

---

## Implementation Details

### Project Structure

```
packages/revenue-backend/src/modules/contracts/
├── contracts.controller.ts      # REST endpoints
├── contracts.service.ts         # Business logic
├── contracts.module.ts          # NestJS module
├── contracts.service.spec.ts    # Unit tests (93%+ coverage)
└── dto/
    ├── create-contract.dto.ts   # Request validation for create
    ├── update-contract.dto.ts   # Request validation for update
    ├── query-contracts.dto.ts   # Query parameter validation
    └── index.ts                 # DTO exports
```

### Technology Stack

- **Framework:** NestJS (TypeScript)
- **Database:** PostgreSQL (via Prisma ORM)
- **Validation:** class-validator, class-transformer
- **API Documentation:** Swagger/OpenAPI (@nestjs/swagger)

### Key Features

#### 1. Contract Lifecycle States

Contracts progress through multiple states:

```typescript
export enum ContractStatus {
  DRAFT = 'draft',         // Not yet active, can be modified freely
  ACTIVE = 'active',       // Currently in effect
  EXPIRED = 'expired',     // Past end date, not renewed
  CANCELLED = 'cancelled', // Terminated early
  RENEWED = 'renewed',     // Successfully renewed (original contract)
}
```

**State Transitions:**
- `draft` → `active` (when contract starts)
- `active` → `expired` (when end date passes without renewal)
- `active` → `renewed` (when new contract created for renewal)
- Any state → `cancelled` (manual termination)

#### 2. Billing Frequency Options

Supports multiple billing cycles for enterprise flexibility:

```typescript
export enum BillingFrequency {
  MONTHLY = 'monthly',         // 12 invoices/year
  QUARTERLY = 'quarterly',     // 4 invoices/year
  SEMI_ANNUAL = 'semi_annual', // 2 invoices/year
  ANNUAL = 'annual',           // 1 invoice/year (most common for B2B)
}
```

**Invoice Generation (Phase 2):**
- Annual contract with quarterly billing → 4 invoices at $30k each
- Invoices generated in advance (default) or arrears
- Due date calculated based on `paymentTerms`

#### 3. Seat-Based Licensing

Enterprise contracts track seat counts and pricing:

```typescript
{
  "seatCount": 100,        // Current active seats
  "committedSeats": 100,   // Minimum seats committed in contract
  "seatPrice": 99.99,      // Price per seat
  "contractValue": 120000  // Total contract value (can include discounts)
}
```

**Overage Handling (Phase 2):**
- If `seatCount` > `committedSeats`, charge for overages
- Calculate: `(seatCount - committedSeats) × seatPrice × overageRate`

#### 4. Auto-Renewal Tracking

Contracts can automatically renew with configurable notice periods:

```typescript
{
  "autoRenew": true,
  "renewalNoticeDays": 90  // Send notice 90 days before expiration
}
```

**Renewal Workflow (Phase 5):**
- Job runs daily checking contracts expiring in `renewalNoticeDays`
- Send email notification to account billing contact
- Create new contract if `autoRenew = true`
- Update original contract status to `renewed`

#### 5. Date Range Validation

Service validates contract date integrity:

```typescript
// Located in: contracts.service.ts:36-41
const start = new Date(startDate);
const end = new Date(endDate);

if (end <= start) {
  throw new BadRequestException('End date must be after start date');
}
```

**Business Rules:**
- End date must be after start date
- Typical contract lengths: 1 year (most common), 2 years, 3 years
- Month-end alignment common for billing simplicity

#### 6. Operator-Based Query Filtering

The API uses the same query parser utility as Accounts API:

**Utility:** `src/common/utils/query-parser.ts`

```typescript
// Example query:
// GET /api/contracts?status[eq]=active&endDate[gte]=2026-01-01&endDate[lte]=2026-03-31

// Parsed to Prisma filter:
{
  status: { equals: 'active' },
  endDate: { gte: new Date('2026-01-01'), lte: new Date('2026-03-31') }
}
```

#### 7. Standard API Response Structure

All responses follow ADR-003 compliant structure:

**Utility:** `src/common/utils/response-builder.ts`

```typescript
// Single resource response
buildSingleResponse(contract)
// Returns: { data: {...}, paging: { all null } }

// Paginated list response
buildPaginatedListResponse(contracts, offset, limit, total)
// Returns: { data: [...], paging: { offset, limit, total, ... } }
```

## Testing

**Test File:** `src/modules/contracts/contracts.service.spec.ts`

**Coverage:** 93%+ (all service methods tested)

**Test Scenarios:**
- Create contract with valid data
- Create contract validation (account existence, date ranges, unique number)
- List contracts with filtering and pagination
- Get contract by ID with relations (account, invoices)
- Update contract (including account and date changes)
- Hard delete contract
- Error handling (not found, conflicts, bad requests)

**Run Tests:**

```bash
# Unit tests
npm run test contracts.service.spec

# Test coverage
npm run test:cov contracts.service.spec
```

## Usage Examples

### Example 1: Create Annual Enterprise Contract

```bash
curl -X POST http://localhost:5177/api/contracts \
  -H "Content-Type: application/json" \
  -d '{
    "contractNumber": "CNT-2024-0001",
    "accountId": "123e4567-e89b-12d3-a456-426614174000",
    "status": "active",
    "startDate": "2024-01-01",
    "endDate": "2024-12-31",
    "contractValue": 120000.00,
    "billingFrequency": "annual",
    "seatCount": 100,
    "committedSeats": 100,
    "seatPrice": 99.99,
    "paymentTerms": "net_30",
    "billingInAdvance": true,
    "autoRenew": true,
    "renewalNoticeDays": 90
  }'
```

### Example 2: Create Quarterly Billing Contract

```bash
curl -X POST http://localhost:5177/api/contracts \
  -H "Content-Type: application/json" \
  -d '{
    "contractNumber": "CNT-2024-0042",
    "accountId": "account-id-here",
    "status": "active",
    "startDate": "2024-01-01",
    "endDate": "2024-12-31",
    "contractValue": 48000.00,
    "billingFrequency": "quarterly",
    "seatCount": 50,
    "committedSeats": 50,
    "seatPrice": 199.99,
    "billingInAdvance": true
  }'
```

### Example 3: Find Contracts Expiring Soon

```bash
# Find contracts expiring in next 90 days (renewal tracking)
curl "http://localhost:5177/api/contracts?status[eq]=active&endDate[gte]=2026-01-15&endDate[lte]=2026-04-15"

# Find contracts with auto-renew disabled
curl "http://localhost:5177/api/contracts?autoRenew[eq]=false&status[eq]=active"
```

### Example 4: Find Large Contracts

```bash
# Find contracts worth $100k+
curl "http://localhost:5177/api/contracts?contractValue[gte]=100000"

# Find large enterprise contracts with 200+ seats
curl "http://localhost:5177/api/contracts?seatCount[gte]=200&status[eq]=active"
```

### Example 5: Update Contract Seats

```bash
# Increase seat count (overage scenario)
curl -X PATCH http://localhost:5177/api/contracts/contract-id-here \
  -H "Content-Type: application/json" \
  -d '{
    "seatCount": 150
  }'
```

## Performance Considerations

### Database Optimization

1. **Indices:**
   - `idx_contracts_end_date` on `endDate` - Optimize renewal tracking queries
   - `idx_contracts_account` on `accountId` - Fast account-based lookups
   - Composite index on `(status, endDate)` - Frequently used in renewal jobs
   - Unique index on `contractNumber`

2. **Query Optimization:**
   - Use `select` to limit returned fields for account relation
   - Use `_count` for efficient counting of invoices
   - Filter by status and date range for renewal queries

3. **Pagination:**
   - Offset-based pagination (SQL-friendly: `LIMIT x OFFSET y`)
   - Default limit: 20, max: 100
   - Always include total count for client-side pagination UI

### Caching Strategy (Future Phase)

```typescript
// Recommended for Phase 2+ (Contract-Based Billing)
// Cache active contracts by account (5 min TTL)
// Invalidate on contract update
```

### Renewal Job Performance (Phase 5)

```sql
-- Optimized renewal tracking query
SELECT * FROM contracts
WHERE status = 'active'
  AND auto_renew = true
  AND end_date BETWEEN NOW() AND NOW() + INTERVAL '90 days'
ORDER BY end_date ASC
LIMIT 500;
```

**Batch Processing:**
- Process 500 contracts per renewal job
- Run daily at off-peak hours
- Send renewal notifications via BullMQ email queue

## Security Considerations

1. **Input Validation:**
   - All DTOs use class-validator decorators
   - Date format validation (`IsDateString`)
   - Enum validation for status, billingFrequency, paymentTerms
   - Minimum value validation for numeric fields

2. **Date Integrity:**
   - End date must be after start date
   - Prevents invalid date ranges

3. **Account Relationship:**
   - Foreign key constraint on `accountId`
   - Validates account exists before creating contract

4. **Error Handling:**
   - Specific error messages for validation failures
   - 404 for not found resources
   - 409 for conflicts (duplicate contract number)
   - 400 for validation errors

## Future Enhancements

### Phase 2: Contract-Based Billing (Weeks 3-4)

1. **Automated Invoice Generation:**
   - `POST /api/billing/generate` - Generate invoices from contracts
   - BullMQ job for scheduled billing based on `billingFrequency`
   - Respect `billingInAdvance` setting
   - Calculate seat overages if `seatCount > committedSeats`

2. **Billing Preview:**
   - `GET /api/contracts/:id/billing-preview` - Preview next invoice
   - Show breakdown: base contract amount, overage charges, discounts, taxes

3. **Contract Amendment Support:**
   - `POST /api/contracts/:id/amend` - Create contract amendment
   - Track historical changes (seat count, pricing, terms)
   - Link to original contract

### Phase 5: Analytics & Optimization (Weeks 10-12)

1. **Renewal Tracking:**
   - `GET /api/contracts/renewals` - List contracts expiring soon
   - Filter by `renewalNoticeDays` threshold
   - Email notifications via BullMQ queue

2. **Contract Analytics:**
   - ARR (Annual Recurring Revenue) calculation
   - MRR (Monthly Recurring Revenue) calculation
   - Expansion revenue (seat count increases)
   - Churn tracking (cancelled contracts)

3. **Contract Templates:**
   - Predefined contract templates for common deal types
   - Standardize enterprise, SMB, startup terms

4. **Contract Approval Workflow:**
   - Multi-step approval for large deals (>$100k)
   - Integration with external approval tools

### Advanced Features (Phase 6+)

1. **Multi-Currency Support:**
   - Store contract value in original currency
   - Exchange rate tracking for reporting

2. **Contract Line Items:**
   - Link to Products API for itemized contracts
   - Support multiple products per contract
   - Volume-based pricing tiers

3. **Usage-Based Components:**
   - Hybrid contracts: base commitment + usage overages
   - Integrate with metering system (B2C phase)

## Related Features

- **Accounts API** - Contracts belong to accounts (`docs/features/accounts.md`)
- **Products API** - Products referenced in contract line items (`docs/features/products.md`)
- **Invoices API** (Phase 1) - Generate invoices from contracts
- **Billing Engine** (Phase 2) - Automated invoice generation from contracts

## Common Workflows

### Workflow 1: New Enterprise Deal

1. Create account (`POST /api/accounts`)
2. Create contract (`POST /api/contracts`) with:
   - Annual commitment
   - Quarterly billing
   - 100 committed seats
   - Auto-renew enabled
3. Contract billing job generates 4 invoices throughout the year

### Workflow 2: Contract Renewal

1. Renewal job detects contract expiring in 90 days
2. Send email notification to account billing contact
3. If `autoRenew = true`:
   - Create new contract with same terms
   - Update original contract status to `renewed`
4. If `autoRenew = false`:
   - Manual renewal required
   - Sales team engages customer

### Workflow 3: Mid-Contract Seat Increase

1. Customer requests 50 additional seats
2. Update contract (`PATCH /api/contracts/:id`) with new `seatCount`
3. Next billing cycle calculates overage:
   - Base: 100 seats × $99.99 = $9,999
   - Overage: 50 seats × $99.99 = $4,999.50
   - Total: $14,998.50

## API Reference

**Swagger Documentation:** http://localhost:5177/api/docs

## Contact

For questions or issues related to the Contracts API, please refer to:
- **Feature Specification:** `docs/feature-spec.md` (Phase 1, Task Group 1.2)
- **ADR:** `docs/adrs/003-rest-api-response-structure.md`
- **Project Instructions:** `.claude/CLAUDE.md`
