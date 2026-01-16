# Invoices API Feature

**Status:** Implemented
**Phase:** Phase 1 - Foundation
**Implementation Date:** January 2026
**ADR Compliance:** [ADR-003: REST API Response Structure & Query Parameters](../adrs/003-rest-api-response-structure.md)

## Overview

The Invoices API manages B2B enterprise invoicing with support for manual invoice creation, line item management, and flexible billing configurations. This feature completes Phase 1 and enables automated billing in Phase 2.

## Business Context

In B2B SaaS, invoices represent billing events for services rendered to enterprise customers. The Invoices API supports:

- **Manual Invoice Creation** - For one-time charges and custom billing
- **Contract-Linked Invoices** - Associate invoices with multi-year contracts
- **Line Item Management** - Add/remove itemized charges dynamically
- **Multiple Invoice States** - Draft, sent, paid, overdue, cancelled, void
- **Purchase Order Tracking** - Enterprise procurement workflow support
- **Billing Period Tracking** - Track service periods for subscription billing
- **Amount Validation** - Automatic validation of subtotal + tax - discount = total

## Database Schema

Located in: `packages/revenue-backend/prisma/schema.prisma`

```prisma
model Invoice {
  id                    String    @id @default(uuid())
  invoiceNumber         String    @unique
  accountId             String
  contractId            String?
  purchaseOrderNumber   String?

  issueDate             DateTime  @db.Date
  dueDate               DateTime  @db.Date
  periodStart           DateTime? @db.Date
  periodEnd             DateTime? @db.Date

  subtotal              Decimal   @default(0) @db.Decimal(12, 2)
  tax                   Decimal   @default(0) @db.Decimal(12, 2)
  discount              Decimal   @default(0) @db.Decimal(12, 2)
  total                 Decimal   @default(0) @db.Decimal(12, 2)
  currency              String    @default("USD")

  status                String    @default("draft")
  paidAmount            Decimal   @default(0) @db.Decimal(12, 2)
  paidDate              DateTime? @db.Date

  billingType           String    @default("recurring")
  consolidated          Boolean   @default(false)
  parentInvoiceId       String?

  notes                 String?
  internalNotes         String?
  metadata              Json?

  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @updatedAt

  account               Account   @relation(fields: [accountId], references: [id])
  contract              Contract? @relation(fields: [contractId], references: [id])
  items                 InvoiceItem[]
}

model InvoiceItem {
  id          String   @id @default(uuid())
  invoiceId   String
  description String
  quantity    Decimal  @db.Decimal(10, 2)
  unitPrice   Decimal  @db.Decimal(10, 2)
  amount      Decimal  @db.Decimal(10, 2)
  createdAt   DateTime @default(now())

  invoice     Invoice  @relation(fields: [invoiceId], references: [id], onDelete: Cascade)
}
```

**Key Indices:**
- `invoiceNumber` - Unique constraint for invoice identification
- `idx_invoices_account` on `accountId` - Fast account-based lookups
- `idx_invoices_contract` on `contractId` - Contract-based queries
- `idx_invoices_status` on `status` - Filter by status
- `idx_invoices_due_date` on `dueDate` - Overdue invoice tracking
- `idx_invoices_po` on `purchaseOrderNumber` - PO number lookups

## API Endpoints

Base Path: `/api/invoices`

### 1. Create Invoice

**Endpoint:** `POST /api/invoices`

**Description:** Create a new invoice for an account with optional contract reference and line items.

**Request Body:**

```typescript
{
  "invoiceNumber": "INV-2024-0001",
  "accountId": "123e4567-e89b-12d3-a456-426614174000",
  "contractId": "123e4567-e89b-12d3-a456-426614174000", // Optional
  "purchaseOrderNumber": "PO-2024-1234", // Optional
  "issueDate": "2024-01-01",
  "dueDate": "2024-01-31",
  "periodStart": "2024-01-01", // Optional
  "periodEnd": "2024-01-31", // Optional
  "subtotal": 10000.00,
  "tax": 800.00,
  "discount": 500.00,
  "total": 10300.00,
  "currency": "USD",
  "status": "draft", // draft | sent | paid | overdue | cancelled | void
  "paidAmount": 0.00,
  "paidDate": "2024-01-15", // Optional
  "billingType": "recurring", // recurring | one_time
  "consolidated": false,
  "parentInvoiceId": "parent-invoice-id", // Optional
  "notes": "Thank you for your business",
  "internalNotes": "Applied 5% discount",
  "items": [ // Optional line items
    {
      "description": "Enterprise Plan - 100 seats",
      "quantity": 100,
      "unitPrice": 99.99,
      "amount": 9999.00
    }
  ],
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
    "id": "invoice-550e8400-e29b-41d4-a716-446655440000",
    "invoiceNumber": "INV-2024-0001",
    "accountId": "123e4567-e89b-12d3-a456-426614174000",
    "contractId": "123e4567-e89b-12d3-a456-426614174000",
    "purchaseOrderNumber": "PO-2024-1234",
    "issueDate": "2024-01-01T00:00:00Z",
    "dueDate": "2024-01-31T00:00:00Z",
    "periodStart": "2024-01-01T00:00:00Z",
    "periodEnd": "2024-01-31T00:00:00Z",
    "subtotal": "10000.00",
    "tax": "800.00",
    "discount": "500.00",
    "total": "10300.00",
    "currency": "USD",
    "status": "draft",
    "paidAmount": "0.00",
    "billingType": "recurring",
    "items": [
      {
        "id": "item-001",
        "description": "Enterprise Plan - 100 seats",
        "quantity": "100.00",
        "unitPrice": "99.99",
        "amount": "9999.00"
      }
    ],
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
- `400 Bad Request` - Invalid input, due date before issue date, or total amount mismatch
- `404 Not Found` - Account or contract not found
- `409 Conflict` - Invoice number already exists

**Validations:**
- Account must exist
- Contract must exist and belong to account (if provided)
- Due date must be after issue date
- Period end must be after period start (if both provided)
- Total must equal: `subtotal + tax - discount` (within 1 cent tolerance)
- Invoice number must be unique

---

### 2. List Invoices

**Endpoint:** `GET /api/invoices`

**Description:** Retrieve paginated list of invoices with operator-based filtering.

**Query Parameters (ADR-003 Compliant):**

```bash
# Pagination (offset-based)
?offset[eq]=0&limit[eq]=20

# Filter by status
?status[eq]=paid

# Filter by multiple statuses
?status[in]=draft,sent

# Filter by account
?accountId[eq]=123e4567-e89b-12d3-a456-426614174000

# Filter by contract
?contractId[eq]=123e4567-e89b-12d3-a456-426614174000

# Filter by total amount range
?total[gte]=5000&total[lte]=15000

# Filter by due date range (find overdue invoices)
?dueDate[lt]=2026-01-15&status[ne]=paid

# Filter by issue date range
?issueDate[gte]=2024-01-01&issueDate[lte]=2024-12-31

# Search by invoice number
?invoiceNumber[like]=INV-2024

# Search by purchase order number
?purchaseOrderNumber[like]=PO-2024

# Filter by billing type
?billingType[eq]=recurring

# Filter by currency
?currency[eq]=USD
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
      "id": "invoice-550e8400-e29b-41d4-a716-446655440000",
      "invoiceNumber": "INV-2024-0001",
      "status": "paid",
      "total": "10300.00",
      "issueDate": "2024-01-01T00:00:00Z",
      "dueDate": "2024-01-31T00:00:00Z",
      "account": {
        "id": "123e4567-e89b-12d3-a456-426614174000",
        "accountName": "Acme Corporation",
        "status": "active"
      },
      "contract": {
        "id": "contract-123",
        "contractNumber": "CNT-2024-001",
        "status": "active"
      },
      "_count": {
        "items": 3
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
- Account details (ID, name, status)
- Contract details (ID, number, status) if linked
- Line item count

**Ordering:**
- Default: `createdAt DESC` (newest first)

---

### 3. Get Invoice by ID

**Endpoint:** `GET /api/invoices/:id`

**Description:** Retrieve detailed invoice information including account, contract, and all line items.

**Path Parameters:**
- `id` - Invoice UUID

**Response:** `200 OK`

```json
{
  "data": {
    "id": "invoice-550e8400-e29b-41d4-a716-446655440000",
    "invoiceNumber": "INV-2024-0001",
    "accountId": "123e4567-e89b-12d3-a456-426614174000",
    "contractId": "123e4567-e89b-12d3-a456-426614174000",
    "purchaseOrderNumber": "PO-2024-1234",
    "issueDate": "2024-01-01T00:00:00Z",
    "dueDate": "2024-01-31T00:00:00Z",
    "periodStart": "2024-01-01T00:00:00Z",
    "periodEnd": "2024-01-31T00:00:00Z",
    "subtotal": "10000.00",
    "tax": "800.00",
    "discount": "500.00",
    "total": "10300.00",
    "currency": "USD",
    "status": "paid",
    "paidAmount": "10300.00",
    "paidDate": "2024-01-15T00:00:00Z",
    "billingType": "recurring",
    "notes": "Thank you for your business",
    "internalNotes": "Applied 5% discount",
    "account": {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "accountName": "Acme Corporation",
      "primaryContactEmail": "contact@acme.com",
      "billingContactEmail": "billing@acme.com",
      "status": "active"
    },
    "contract": {
      "id": "contract-123",
      "contractNumber": "CNT-2024-001",
      "status": "active",
      "startDate": "2024-01-01",
      "endDate": "2024-12-31"
    },
    "items": [
      {
        "id": "item-001",
        "description": "Enterprise Plan - 100 seats",
        "quantity": "100.00",
        "unitPrice": "99.99",
        "amount": "9999.00",
        "createdAt": "2026-01-15T10:00:00Z"
      }
    ],
    "_count": {
      "items": 1
    },
    "createdAt": "2026-01-15T10:00:00Z",
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
- `404 Not Found` - Invoice not found

**Includes:**
- Account details (ID, name, emails, status)
- Contract details (ID, number, status, dates) if linked
- All line items (ordered by `createdAt ASC`)
- Line item count

---

### 4. Update Invoice

**Endpoint:** `PATCH /api/invoices/:id`

**Description:** Update invoice information. Validates account and contract if changed.

**Path Parameters:**
- `id` - Invoice UUID

**Request Body (partial update):**

```json
{
  "status": "sent",
  "paidAmount": 10300.00,
  "paidDate": "2024-01-15"
}
```

**Response:** `200 OK`

```json
{
  "data": {
    "id": "invoice-550e8400-e29b-41d4-a716-446655440000",
    "invoiceNumber": "INV-2024-0001",
    "status": "sent",
    "paidAmount": "10300.00",
    "paidDate": "2024-01-15T00:00:00Z",
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
- `400 Bad Request` - Invalid data or date validation failed
- `404 Not Found` - Invoice, account, or contract not found
- `409 Conflict` - Invoice number conflict

**Validations:**
- Account must exist if `accountId` changed
- Contract must exist and belong to account if `contractId` changed
- Due date must be after issue date if both updated
- Period end must be after period start if both updated
- Invoice number must be unique if changed

---

### 5. Delete Invoice

**Endpoint:** `DELETE /api/invoices/:id`

**Description:** Hard delete an invoice from the system. Cascade deletes all line items.

**Path Parameters:**
- `id` - Invoice UUID

**Response:** `204 No Content`

**Error Responses:**
- `404 Not Found` - Invoice not found

**Behavior:**
- Hard delete: Permanently removes invoice from database
- Cascade delete: All line items are automatically deleted
- **Warning:** Use with caution - this operation cannot be undone

---

### 6. Add Line Item to Invoice

**Endpoint:** `POST /api/invoices/:id/items`

**Description:** Add a new line item to an existing invoice.

**Path Parameters:**
- `id` - Invoice UUID

**Request Body:**

```json
{
  "description": "Additional Service - Premium Support",
  "quantity": 1,
  "unitPrice": 500.00,
  "amount": 500.00
}
```

**Response:** `201 Created`

```json
{
  "data": {
    "id": "item-002",
    "invoiceId": "invoice-550e8400-e29b-41d4-a716-446655440000",
    "description": "Additional Service - Premium Support",
    "quantity": "1.00",
    "unitPrice": "500.00",
    "amount": "500.00",
    "createdAt": "2026-01-15T12:00:00Z"
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
- `404 Not Found` - Invoice not found

**Note:** Adding line items does NOT automatically update invoice totals. You must manually update `subtotal` and `total` via `PATCH /api/invoices/:id`.

---

### 7. Remove Line Item from Invoice

**Endpoint:** `DELETE /api/invoices/:id/items/:itemId`

**Description:** Remove a line item from an invoice.

**Path Parameters:**
- `id` - Invoice UUID
- `itemId` - Invoice item UUID

**Response:** `204 No Content`

**Error Responses:**
- `404 Not Found` - Invoice or line item not found
- `400 Bad Request` - Line item does not belong to invoice

**Validations:**
- Invoice must exist
- Line item must exist
- Line item must belong to the specified invoice

**Note:** Removing line items does NOT automatically update invoice totals. You must manually update `subtotal` and `total` via `PATCH /api/invoices/:id`.

---

## Implementation Details

### Project Structure

```
packages/revenue-backend/src/modules/invoices/
├── invoices.controller.ts      # REST endpoints
├── invoices.service.ts         # Business logic
├── invoices.module.ts          # NestJS module
├── invoices.service.spec.ts    # Unit tests (100% coverage)
└── dto/
    ├── create-invoice.dto.ts   # Request validation for create
    ├── update-invoice.dto.ts   # Request validation for update
    ├── query-invoices.dto.ts   # Query parameter validation
    ├── create-invoice-item.dto.ts # Line item validation
    └── index.ts                # DTO exports
```

### Technology Stack

- **Framework:** NestJS (TypeScript)
- **Database:** PostgreSQL (via Prisma ORM)
- **Validation:** class-validator, class-transformer
- **API Documentation:** Swagger/OpenAPI (@nestjs/swagger)

### Key Features

#### 1. Invoice Lifecycle States

Invoices progress through multiple states:

```typescript
export enum InvoiceStatus {
  DRAFT = 'draft',         // Not yet finalized
  SENT = 'sent',          // Sent to customer
  PAID = 'paid',          // Fully paid
  OVERDUE = 'overdue',    // Past due date, unpaid
  CANCELLED = 'cancelled', // Cancelled before payment
  VOID = 'void',          // Voided after creation
}
```

**State Transitions:**
- `draft` → `sent` (invoice sent to customer)
- `sent` → `paid` (payment received)
- `sent` → `overdue` (past due date, system/job updates)
- Any state → `cancelled` (manual cancellation)
- Any state → `void` (manual voiding for corrections)

#### 2. Amount Validation

The service automatically validates invoice totals:

```typescript
// Located in: invoices.service.ts:64-72
const calculatedTotal = data.subtotal + (data.tax || 0) - (data.discount || 0);
const tolerance = 0.01; // Allow 1 cent tolerance for rounding

if (Math.abs(calculatedTotal - data.total) > tolerance) {
  throw new BadRequestException(
    `Total amount ${data.total} does not match calculated total ${calculatedTotal.toFixed(2)}`,
  );
}
```

**Business Rule:**
```
total = subtotal + tax - discount
```

#### 3. Contract-Account Validation

When linking an invoice to a contract, the service validates ownership:

```typescript
// Located in: invoices.service.ts:48-56
if (contractId) {
  const contract = await this.prisma.contract.findUnique({
    where: { id: contractId },
  });

  if (contract.accountId !== accountId) {
    throw new BadRequestException(
      'Contract does not belong to the specified account',
    );
  }
}
```

#### 4. Date Range Validation

The service validates logical date relationships:

```typescript
// Due date validation
if (new Date(dueDate) <= new Date(issueDate)) {
  throw new BadRequestException('Due date must be after issue date');
}

// Period date validation
if (periodStart && periodEnd) {
  if (new Date(periodEnd) <= new Date(periodStart)) {
    throw new BadRequestException(
      'Period end date must be after period start date',
    );
  }
}
```

#### 5. Nested Line Item Creation

Invoices can be created with line items in a single transaction:

```typescript
// Located in: invoices.service.ts:74-92
const invoice = await this.prisma.invoice.create({
  data: {
    ...invoiceData,
    items: items ? {
      create: items, // Nested create
    } : undefined,
  },
  include: {
    items: true,
  },
});
```

**Benefits:**
- Atomic operation (all-or-nothing)
- Single database round trip
- Automatic relationship linking

#### 6. Cascade Delete

Line items are cascade deleted when invoice is deleted:

```prisma
// In schema.prisma
invoice Invoice @relation(fields: [invoiceId], references: [id], onDelete: Cascade)
```

**Behavior:**
- Delete invoice → All line items automatically deleted
- No orphaned line items
- Database-level enforcement

#### 7. Operator-Based Query Filtering

The API uses the same query parser utility:

**Utility:** `src/common/utils/query-parser.ts`

```typescript
// Example query:
// GET /api/invoices?status[eq]=paid&total[gte]=5000

// Parsed to Prisma filter:
{
  status: { equals: 'paid' },
  total: { gte: 5000 }
}
```

#### 8. Standard API Response Structure

All responses follow ADR-003 compliant structure:

**Utility:** `src/common/utils/response-builder.ts`

```typescript
// Single resource response
buildSingleResponse(invoice)
// Returns: { data: {...}, paging: { all null } }

// Paginated list response
buildPaginatedListResponse(invoices, offset, limit, total)
// Returns: { data: [...], paging: { offset, limit, total, ... } }
```

## Testing

**Test Files:**
- `src/modules/invoices/invoices.service.spec.ts` - Unit tests
- `test/invoices.e2e-spec.ts` - E2E tests

**Coverage:** 94%+ (all service methods tested)

**Unit Test Scenarios:**
- Create invoice with/without line items
- Create invoice with contract reference
- Account and contract validation
- Date range validation
- Amount calculation validation
- List invoices with filtering and pagination
- Get invoice by ID with relations
- Update invoice (including amounts and status)
- Hard delete invoice
- Add/remove line items
- Error handling (not found, conflicts, bad requests)

**E2E Test Scenarios:**
- Full CRUD operations with real database
- Nested line item operations
- ADR-003 compliance verification
- Operator-based query parameter testing
- Relationship validation
- Cascade delete behavior

**Run Tests:**

```bash
# Unit tests
npm run test invoices.service.spec

# E2E tests
npm run test:e2e invoices

# Test coverage
npm run test:cov invoices.service.spec
```

## Usage Examples

### Example 1: Create Simple Invoice

```bash
curl -X POST http://localhost:5177/api/invoices \
  -H "Content-Type: application/json" \
  -d '{
    "invoiceNumber": "INV-2024-0001",
    "accountId": "123e4567-e89b-12d3-a456-426614174000",
    "issueDate": "2024-01-01",
    "dueDate": "2024-01-31",
    "subtotal": 10000.00,
    "tax": 800.00,
    "discount": 500.00,
    "total": 10300.00,
    "currency": "USD"
  }'
```

### Example 2: Create Invoice with Line Items

```bash
curl -X POST http://localhost:5177/api/invoices \
  -H "Content-Type: application/json" \
  -d '{
    "invoiceNumber": "INV-2024-0002",
    "accountId": "account-id-here",
    "issueDate": "2024-02-01",
    "dueDate": "2024-02-28",
    "subtotal": 9999.00,
    "total": 9999.00,
    "items": [
      {
        "description": "Enterprise Plan - 100 seats",
        "quantity": 100,
        "unitPrice": 99.99,
        "amount": 9999.00
      }
    ]
  }'
```

### Example 3: Create Invoice Linked to Contract

```bash
curl -X POST http://localhost:5177/api/invoices \
  -H "Content-Type: application/json" \
  -d '{
    "invoiceNumber": "INV-2024-0003",
    "accountId": "account-id-here",
    "contractId": "contract-id-here",
    "purchaseOrderNumber": "PO-2024-1234",
    "issueDate": "2024-03-01",
    "dueDate": "2024-03-31",
    "periodStart": "2024-03-01",
    "periodEnd": "2024-03-31",
    "subtotal": 10000.00,
    "total": 10000.00,
    "billingType": "recurring"
  }'
```

### Example 4: Find Overdue Invoices

```bash
# Find all unpaid invoices past due date
curl "http://localhost:5177/api/invoices?dueDate[lt]=2026-01-15&status[in]=sent,overdue"
```

### Example 5: Find Invoices by Account

```bash
# Find all invoices for a specific account
curl "http://localhost:5177/api/invoices?accountId[eq]=123e4567-e89b-12d3-a456-426614174000"
```

### Example 6: Update Invoice Status to Paid

```bash
curl -X PATCH http://localhost:5177/api/invoices/invoice-id-here \
  -H "Content-Type: application/json" \
  -d '{
    "status": "paid",
    "paidAmount": 10300.00,
    "paidDate": "2024-01-15"
  }'
```

### Example 7: Add Line Item to Existing Invoice

```bash
curl -X POST http://localhost:5177/api/invoices/invoice-id-here/items \
  -H "Content-Type: application/json" \
  -d '{
    "description": "Additional Service",
    "quantity": 1,
    "unitPrice": 500.00,
    "amount": 500.00
  }'
```

## Performance Considerations

### Database Optimization

1. **Indices:**
   - `invoiceNumber` - Unique constraint for fast lookups
   - `idx_invoices_account` on `accountId` - Account-based queries
   - `idx_invoices_contract` on `contractId` - Contract-based queries
   - `idx_invoices_status` on `status` - Status filtering
   - `idx_invoices_due_date` on `dueDate` - Overdue tracking
   - `idx_invoices_po` on `purchaseOrderNumber` - PO lookups

2. **Query Optimization:**
   - Use `select` to limit returned fields for relations
   - Use `_count` for efficient counting of line items
   - Nested includes for related data (account, contract, items)
   - Parallel queries: `findMany` + `count` in `Promise.all()`

3. **Pagination:**
   - Offset-based pagination (SQL-friendly: `LIMIT x OFFSET y`)
   - Default limit: 20, max: 100
   - Always include total count for client-side pagination UI

### Caching Strategy (Future Phase)

```typescript
// Recommended for Phase 2+ (Contract-Based Billing)
// Cache invoice summaries by account (5 min TTL)
// Cache aging reports (15 min TTL)
// Invalidate on invoice create/update
```

### Batch Operations (Phase 2)

```sql
-- Invoice generation batch query
SELECT * FROM contracts
WHERE status = 'active'
  AND billing_frequency = 'monthly'
  AND start_date <= NOW()
  AND end_date >= NOW()
LIMIT 500;
```

**Batch Processing:**
- Process 500 invoices per batch
- Run during off-peak hours
- Use BullMQ for job queuing
- Monitor failure rate and retry

## Security Considerations

1. **Input Validation:**
   - All DTOs use class-validator decorators
   - Date format validation (`IsDateString`)
   - Enum validation for status, billingType
   - Minimum value validation for numeric fields
   - Nested validation for line items

2. **Business Logic Validation:**
   - Account existence check
   - Contract ownership validation
   - Amount calculation validation (subtotal + tax - discount)
   - Date range validation (due date, period dates)

3. **Data Integrity:**
   - Foreign key constraints on accountId, contractId
   - Unique constraint on invoiceNumber
   - Cascade delete for line items
   - Transaction support for nested operations

4. **Error Handling:**
   - Specific error messages for validation failures
   - 404 for not found resources
   - 409 for conflicts (duplicate invoice number)
   - 400 for validation errors
   - Proper exception hierarchy

## Future Enhancements

### Phase 2: Contract-Based Billing (Weeks 3-4)

1. **Automated Invoice Generation:**
   - `POST /api/billing/generate` - Generate invoice from contract
   - BullMQ job for scheduled billing
   - Calculate seat overages and volume discounts
   - Apply product pricing models
   - Respect billing frequency and advance/arrears settings

2. **Invoice PDF Generation:**
   - Generate branded PDF invoices
   - Worker threads for parallel processing
   - S3/cloud storage integration
   - Email delivery with PDF attachment

3. **Payment Integration:**
   - Stripe payment intent creation
   - ACH payment processing
   - Payment reconciliation
   - Automatic status updates (sent → paid)

### Phase 3: Hierarchical Accounts (Weeks 5-6)

1. **Consolidated Invoices:**
   - `POST /api/billing/consolidated` - Roll-up invoices across subsidiaries
   - Parent invoice with child invoice references
   - Aggregate billing across account hierarchy

2. **Invoice Hierarchy:**
   - Parent-child invoice relationships
   - Drill-down from consolidated to individual invoices

### Phase 4: Enterprise Operations (Weeks 7-9)

1. **Credit Hold Enforcement:**
   - Validate credit limit before invoice creation
   - Prevent new invoices if account on credit hold
   - Credit utilization tracking

2. **Dunning Workflow:**
   - Automated overdue notifications
   - Escalation rules (7, 14, 30 days overdue)
   - Payment reminder emails

3. **Multi-Currency Support:**
   - Currency conversion at invoice creation
   - Exchange rate tracking
   - Multi-currency reporting

### Phase 5: Analytics & Optimization (Weeks 10-12)

1. **Invoice Analytics:**
   - Days Sales Outstanding (DSO)
   - Aging reports (30/60/90 days)
   - Collection metrics
   - Revenue recognition

2. **Invoice Approval Workflow:**
   - Large invoice approval (>$10k)
   - Multi-level approval chains
   - Approval history tracking

3. **Invoice Templates:**
   - Customizable invoice layouts
   - Branding configuration
   - Terms and conditions

## Related Features

- **Accounts API** - Invoices belong to accounts (`docs/features/accounts.md`)
- **Contracts API** - Invoices can reference contracts (`docs/features/contracts.md`)
- **Products API** - Line items reference products (Phase 2) (`docs/features/products.md`)
- **Billing Engine** (Phase 2) - Automated invoice generation from contracts

## Common Workflows

### Workflow 1: Manual Invoice Creation

1. Customer requests custom service
2. Create invoice (`POST /api/invoices`) with line items
3. Set status to `draft` for internal review
4. Update status to `sent` (`PATCH /api/invoices/:id`)
5. Customer pays
6. Update status to `paid` with `paidAmount` and `paidDate`

### Workflow 2: Contract-Based Billing (Phase 2)

1. Contract billing job runs (monthly/quarterly/annually)
2. Generate invoice from contract terms
3. Calculate seat overages
4. Apply volume discounts
5. Create invoice with line items
6. Generate PDF
7. Send email with PDF attachment
8. Set status to `sent`

### Workflow 3: Purchase Order Workflow

1. Customer provides PO number
2. Create invoice with `purchaseOrderNumber`
3. Customer's procurement system matches PO
4. Payment approved
5. Update invoice status to `paid`

### Workflow 4: Overdue Invoice Management

1. Daily job checks invoices past due date
2. Update status from `sent` to `overdue`
3. Send dunning email (7 days overdue)
4. Escalate to collections (30 days overdue)
5. Apply late fees (if configured)

## API Reference

**Swagger Documentation:** http://localhost:5177/api/docs

## Contact

For questions or issues related to the Invoices API, please refer to:
- **Feature Specification:** `docs/feature-spec.md` (Phase 1, Task Group 1.4)
- **ADR:** `docs/adrs/003-rest-api-response-structure.md`
- **Project Instructions:** `.claude/CLAUDE.md`
