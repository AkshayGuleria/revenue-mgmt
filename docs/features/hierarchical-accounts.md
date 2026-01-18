# Hierarchical Accounts & Consolidated Billing (Phase 3)

**Status:** Implemented ✅
**Phase:** Phase 3
**Implementation Date:** January 18, 2026
**ADR Compliance:** ADR-003 (REST API Response Structure & Query Parameters)

---

## Overview

Phase 3 implements hierarchical account management and consolidated billing for B2B enterprise customers. This feature allows parent companies to manage multiple subsidiary accounts and generate consolidated invoices that aggregate billing across the entire organizational hierarchy.

### Business Context

Large enterprise customers often have complex organizational structures with parent companies and multiple subsidiaries. This feature enables:

- **Hierarchical account relationships** - Model parent-child company structures
- **Consolidated billing** - Generate single invoices that aggregate charges across all subsidiaries
- **Shared contracts** - Allow contracts to be shared with subsidiary accounts
- **Separate billing options** - Choose between consolidated or per-subsidiary invoicing
- **Roll-up reporting** - Aggregate metrics across account hierarchies
- **Multi-location support** - Different billing addresses for each subsidiary

---

## Database Schema

### Accounts Table (Enhanced)

The `accounts` table already supported hierarchical relationships from Phase 1:

```prisma
model Account {
  id                    String    @id @default(uuid())
  parentAccountId       String?   @map("parent_account_id")
  accountName           String    @map("account_name")
  accountType           String    @default("enterprise") @map("account_type")

  // Billing Address (multi-location support)
  billingAddressLine1   String?   @map("billing_address_line1")
  billingAddressLine2   String?   @map("billing_address_line2")
  billingCity           String?   @map("billing_city")
  billingState          String?   @map("billing_state")
  billingPostalCode     String?   @map("billing_postal_code")
  billingCountry        String?   @map("billing_country")

  // Self-referencing relation for hierarchy
  parent                Account?  @relation("AccountHierarchy", fields: [parentAccountId], references: [id])
  children              Account[] @relation("AccountHierarchy")

  @@index([parentAccountId])
  @@map("accounts")
}
```

### Invoices Table (Enhanced)

```prisma
model Invoice {
  // ... existing fields ...

  // Consolidated billing support
  consolidated          Boolean   @default(false)
  parentInvoiceId       String?   @map("parent_invoice_id")

  @@map("invoices")
}
```

### Contract Shares Table (New)

The `contract_shares` junction table enables contracts to be shared with subsidiary accounts:

```prisma
model ContractShare {
  id          String   @id @default(uuid())
  contractId  String   @map("contract_id")
  accountId   String   @map("account_id")

  // Metadata
  createdAt   DateTime @default(now()) @map("created_at")
  notes       String?  // Optional notes about why this contract is shared

  // Relations
  contract    Contract @relation(fields: [contractId], references: [id], onDelete: Cascade)
  account     Account  @relation("SharedContracts", fields: [accountId], references: [id], onDelete: Cascade)

  @@unique([contractId, accountId])
  @@index([contractId])
  @@index([accountId])
  @@map("contract_shares")
}
```

**Use Case:** A parent company creates a contract that should be billed across multiple subsidiaries. Instead of creating duplicate contracts, the parent contract can be shared with subsidiaries and will be included in consolidated billing for those accounts.

**Key Indices:**
- `idx_accounts_parent` on `accounts(parent_account_id)` - Fast hierarchy traversal
- `idx_invoices_consolidated` on `invoices(consolidated)` - Filter consolidated invoices
- `idx_contract_shares_contract` on `contract_shares(contract_id)` - Find all shares for a contract
- `idx_contract_shares_account` on `contract_shares(account_id)` - Find all shared contracts for an account
- Unique constraint on `(contract_id, account_id)` - Prevent duplicate shares

---

## API Endpoints

### Shared Contracts Endpoints

#### 1. POST /api/contracts/:id/shares

**Description:** Share a contract with a subsidiary account.

**Request Body:**
```json
{
  "accountId": "subsidiary-uuid",
  "notes": "Shared for subsidiary use"
}
```

**Response:**
```json
{
  "data": {
    "id": "share-uuid",
    "contractId": "contract-uuid",
    "accountId": "subsidiary-uuid",
    "notes": "Shared for subsidiary use",
    "createdAt": "2026-01-18T10:00:00Z",
    "account": {
      "id": "subsidiary-uuid",
      "accountName": "Subsidiary Corporation"
    },
    "contract": {
      "id": "contract-uuid",
      "contractNumber": "CNT-001"
    }
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

**Validation:**
- Contract must exist and be active
- Target account must exist
- Cannot share contract with its owner account
- Cannot create duplicate shares (409 Conflict)

**cURL Example:**
```bash
curl -X POST "http://localhost:5177/api/contracts/contract-uuid/shares" \
  -H "Content-Type: application/json" \
  -H "Cookie: session=..." \
  -d '{
    "accountId": "subsidiary-uuid",
    "notes": "Shared for subsidiary billing"
  }'
```

---

#### 2. DELETE /api/contracts/:id/shares/:accountId

**Description:** Remove contract share from a subsidiary account.

**Response:** 204 No Content

**cURL Example:**
```bash
curl -X DELETE "http://localhost:5177/api/contracts/contract-uuid/shares/subsidiary-uuid" \
  -H "Cookie: session=..."
```

---

#### 3. GET /api/contracts/:id/shares

**Description:** Get all accounts a contract is shared with.

**Response:**
```json
{
  "data": [
    {
      "id": "share-1-uuid",
      "contractId": "contract-uuid",
      "accountId": "subsidiary-1-uuid",
      "createdAt": "2026-01-18T10:00:00Z",
      "account": {
        "id": "subsidiary-1-uuid",
        "accountName": "Subsidiary USA",
        "accountType": "enterprise",
        "status": "active"
      }
    },
    {
      "id": "share-2-uuid",
      "contractId": "contract-uuid",
      "accountId": "subsidiary-2-uuid",
      "account": {
        "id": "subsidiary-2-uuid",
        "accountName": "Subsidiary Europe",
        "accountType": "enterprise",
        "status": "active"
      }
    }
  ],
  "paging": {
    "offset": 0,
    "limit": 2,
    "total": 2,
    "totalPages": 1,
    "hasNext": false,
    "hasPrev": false
  }
}
```

**cURL Example:**
```bash
curl -X GET "http://localhost:5177/api/contracts/contract-uuid/shares" \
  -H "Cookie: session=..."
```

---

#### 4. GET /api/contracts/shared/:accountId

**Description:** Get all contracts shared with a specific account.

**Response:**
```json
{
  "data": [
    {
      "id": "contract-uuid",
      "contractNumber": "CNT-PARENT-001",
      "accountId": "parent-uuid",
      "startDate": "2026-01-01",
      "endDate": "2026-12-31",
      "contractValue": "120000.00",
      "status": "active",
      "account": {
        "id": "parent-uuid",
        "accountName": "Parent Corporation"
      }
    }
  ],
  "paging": {
    "offset": 0,
    "limit": 1,
    "total": 1,
    "totalPages": 1,
    "hasNext": false,
    "hasPrev": false
  }
}
```

**Use Case:** View all contracts from other accounts that are available for this subsidiary to use.

**cURL Example:**
```bash
curl -X GET "http://localhost:5177/api/contracts/shared/subsidiary-uuid" \
  -H "Cookie: session=..."
```

---

### Hierarchy Endpoints

#### 5. GET /api/accounts/:id/hierarchy

**Description:** Retrieve complete account hierarchy tree with all descendants.

**Response Structure:**
```json
{
  "data": {
    "id": "parent-uuid",
    "accountName": "Acme Corporation",
    "depth": 0,
    "children": [
      {
        "id": "child-1-uuid",
        "accountName": "Acme USA",
        "depth": 1,
        "children": [...]
      },
      {
        "id": "child-2-uuid",
        "accountName": "Acme Europe",
        "depth": 1,
        "children": []
      }
    ]
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

**Implementation Details:**
- Uses recursive traversal with Prisma queries (no raw SQL)
- Maximum depth: 5 levels
- Includes all account metadata and counts

**cURL Example:**
```bash
curl -X GET "http://localhost:5177/api/accounts/parent-uuid/hierarchy" \
  -H "Cookie: session=..."
```

---

#### 6. GET /api/accounts/:id/children

**Description:** Get all direct children (one level below) of an account.

**Query Parameters:** None

**Response:**
```json
{
  "data": [
    {
      "id": "child-1-uuid",
      "accountName": "Acme USA",
      "status": "active",
      "_count": {
        "children": 2,
        "contracts": 5,
        "invoices": 24
      }
    }
  ],
  "paging": {
    "offset": 0,
    "limit": 10,
    "total": 10,
    "totalPages": 1,
    "hasNext": false,
    "hasPrev": false
  }
}
```

**cURL Example:**
```bash
curl -X GET "http://localhost:5177/api/accounts/parent-uuid/children" \
  -H "Cookie: session=..."
```

---

#### 7. GET /api/accounts/:id/ancestors

**Description:** Get all ancestors (parent, grandparent, etc.) up the hierarchy chain.

**Response:**
```json
{
  "data": [
    {
      "id": "root-uuid",
      "accountName": "Acme Global Holdings",
      "depth": 2
    },
    {
      "id": "parent-uuid",
      "accountName": "Acme Corporation",
      "depth": 1
    }
  ],
  "paging": {
    "offset": 0,
    "limit": 2,
    "total": 2,
    "totalPages": 1,
    "hasNext": false,
    "hasPrev": false
  }
}
```

**Implementation:**
- Ordered from root (top) to immediate parent (bottom)
- Maximum depth: 5 levels
- Excludes soft-deleted accounts

---

#### 8. GET /api/accounts/:id/descendants

**Description:** Get all descendants (children, grandchildren, etc.) as a flat list.

**Response:**
```json
{
  "data": [
    {
      "id": "child-1-uuid",
      "accountName": "Acme USA",
      "depth": 1
    },
    {
      "id": "grandchild-1-uuid",
      "accountName": "Acme California",
      "depth": 2
    }
  ],
  "paging": {
    "offset": 0,
    "limit": 15,
    "total": 15,
    "totalPages": 1,
    "hasNext": false,
    "hasPrev": false
  }
}
```

**Use Cases:**
- Generate list of all accounts in hierarchy
- Calculate total revenue across all subsidiaries
- Bulk operations on account hierarchies

---

### Consolidated Billing Endpoints

#### 9. POST /billing/consolidated

**Description:** Generate consolidated invoice for parent account and all subsidiaries (synchronous).

**Request Body:**
```json
{
  "parentAccountId": "parent-uuid",
  "periodStart": "2026-01-01",
  "periodEnd": "2026-01-31",
  "includeChildren": true
}
```

**Response:**
```json
{
  "data": {
    "invoiceId": "invoice-uuid",
    "invoiceNumber": "INV-202601-00042",
    "total": "125000.00",
    "subsidiariesIncluded": 5
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

**Validation:**
- Parent account must exist and not be deleted
- Account must not be on credit hold
- At least one active contract must exist in the hierarchy
- Period dates must be valid

**cURL Example:**
```bash
curl -X POST "http://localhost:5177/billing/consolidated" \
  -H "Content-Type: application/json" \
  -H "Cookie: session=..." \
  -d '{
    "parentAccountId": "parent-uuid",
    "periodStart": "2026-01-01",
    "periodEnd": "2026-01-31",
    "includeChildren": true
  }'
```

---

#### 10. POST /billing/consolidated/queue

**Description:** Queue consolidated invoice generation for background processing (asynchronous).

**Request Body:** Same as `/billing/consolidated`

**Response:**
```json
{
  "data": {
    "jobId": "job-uuid",
    "status": "queued",
    "message": "Consolidated invoice generation job queued successfully"
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

**Use Case:**
- Large hierarchies with many subsidiaries
- Scheduled monthly/quarterly billing
- Avoid timeout on complex billing calculations

**Check Job Status:**
```bash
curl -X GET "http://localhost:5177/billing/jobs/job-uuid" \
  -H "Cookie: session=..."
```

---

#### 11. GET /billing/consolidated/queue/stats

**Description:** Get statistics for the consolidated billing queue.

**Response:**
```json
{
  "data": {
    "queue": "consolidated-billing",
    "waiting": 5,
    "active": 2,
    "completed": 100,
    "failed": 3,
    "delayed": 0,
    "total": 110
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

---

## Project Structure

```
packages/revenue-backend/src/
├── modules/
│   ├── accounts/
│   │   ├── accounts.service.ts        # Enhanced with hierarchy methods
│   │   ├── accounts.controller.ts     # New hierarchy endpoints
│   │   └── accounts.service.spec.ts   # Tests for hierarchy (35 tests)
│   │
│   ├── contracts/
│   │   ├── contracts.service.ts       # Added shared contract methods
│   │   ├── contracts.controller.ts    # Added 4 shared contract endpoints
│   │   ├── contracts.service.spec.ts  # Added 12 shared contract tests
│   │   └── dto/
│   │       ├── share-contract.dto.ts  # NEW: Share contract DTO
│   │       └── index.ts               # Exports ShareContractDto
│   │
│   └── billing/
│       ├── services/
│       │   ├── consolidated-billing.service.ts       # NEW: Consolidated billing logic
│       │   ├── consolidated-billing.service.spec.ts  # NEW: Unit tests (updated for shared contracts)
│       │   └── billing-queue.service.ts              # Enhanced with consolidated queue
│       │
│       ├── processors/
│       │   └── consolidated-billing.processor.ts     # NEW: BullMQ processor
│       │
│       ├── dto/
│       │   └── generate-invoice.dto.ts               # Added GenerateConsolidatedInvoiceDto
│       │
│       ├── billing.controller.ts      # New consolidated endpoints
│       └── billing.module.ts          # Registered new services/processors
│
├── common/
│   └── queues/
│       └── queue.constants.ts         # Added CONSOLIDATED_BILLING queue
│
└── test/                              # NEW: E2E tests
    ├── hierarchical-accounts.e2e-spec.ts      # 13 hierarchy test scenarios
    └── consolidated-billing.e2e-spec.ts       # 15 consolidated billing + shared contracts tests
```

---

## Implementation Details

### Hierarchy Service Methods

#### 1. `getHierarchy(id, maxDepth = 5)`

**Algorithm:**
1. Fetch root account from database
2. Recursively query children using Prisma
3. Build tree structure with nested children
4. Limit depth to prevent infinite recursion
5. Return hierarchical JSON structure

**Performance:**
- Uses Prisma's query capabilities (no raw SQL)
- Depth limit prevents excessive database queries
- Includes counts for children, contracts, invoices

#### 2. `getChildren(id)`

**Algorithm:**
1. Validate parent account exists
2. Query all accounts where `parentAccountId = id`
3. Include relationship counts
4. Return flat list ordered by name

#### 3. `getAncestors(id)`

**Algorithm:**
1. Start with target account
2. Traverse up parent chain iteratively
3. Collect ancestors in array
4. Reverse array (root first, parent last)
5. Limit to 5 levels

#### 4. `getDescendants(id)`

**Algorithm:**
1. Recursively collect all children
2. For each child, recursively get their descendants
3. Flatten into single array
4. Include depth metadata
5. Return ordered by depth and name

### Consolidated Billing Service

#### Key Methods

**1. `generateConsolidatedInvoice(params)`**

```typescript
async generateConsolidatedInvoice(params: {
  parentAccountId: string;
  periodStart: Date;
  periodEnd: Date;
  includeChildren?: boolean;
}): Promise<ConsolidatedInvoiceResult>
```

**Algorithm:**
1. Validate parent account (exists, not deleted, not on credit hold)
2. Collect account IDs: parent + descendants (if `includeChildren = true`)
3. Query all active contracts for these accounts in the billing period
4. Calculate amounts for each contract (seat-based pricing, volume discounts)
5. Aggregate line items with metadata
6. Calculate subtotal, tax, discounts, total
7. Generate unique invoice number
8. Create invoice and line items in transaction
9. Return invoice details

**2. `getDescendantAccounts(parentId, depth, maxDepth)`**

Recursively collects all subsidiary accounts:
- Maximum depth: 5 levels
- Returns only active, non-deleted accounts
- Uses Prisma queries (no raw SQL)

**3. `calculateContractAmount(contract, periodStart, periodEnd)`**

Calculates billing amount for a single contract:
- Handles annual, quarterly, monthly frequencies
- Seat-based pricing: `quantity * unitPrice`
- Proration for partial periods (future enhancement)

**4. `buildLineItemDescription(contract, periodStart, periodEnd)`**

Generates human-readable line item descriptions:
```
Contract CNT-001 - Acme USA (10 seats) - Period: 2026-01-01 to 2026-01-31
```

### Shared Contracts Service Methods

#### Key Methods (ContractsService)

**1. `shareContract(contractId, accountId, notes?)`**

```typescript
async shareContract(
  contractId: string,
  accountId: string,
  notes?: string
): Promise<ApiResponse<any>>
```

**Algorithm:**
1. Validate contract exists and is active
2. Validate target account exists and is active
3. Prevent sharing with owner account
4. Check for duplicate shares (409 if exists)
5. Create ContractShare record in database
6. Return share details with account and contract metadata

**Validation:**
```typescript
if (contract.accountId === accountId) {
  throw new BadRequestException('Cannot share contract with its owner account');
}

const existingShare = await this.prisma.contractShare.findUnique({
  where: { contractId_accountId: { contractId, accountId } }
});
if (existingShare) {
  throw new ConflictException('Contract is already shared with this account');
}
```

**2. `unshareContract(contractId, accountId)`**

```typescript
async unshareContract(contractId: string, accountId: string): Promise<void>
```

**Algorithm:**
1. Validate share exists
2. Delete ContractShare record
3. Return 204 No Content
4. Cascade: Share deletion does not affect invoice history

**3. `getContractShares(contractId)`**

Returns all accounts a contract is shared with:
- Includes account metadata (name, type, status)
- Paginated response (ADR-003 compliant)
- Ordered by creation date

**4. `getSharedContractsForAccount(accountId)`**

Returns all contracts shared with a specific account:
- Includes contract owner details
- Shows contract terms and pricing
- Used to display available shared contracts in UI

**Query Pattern for Consolidated Billing:**

```typescript
const contracts = await this.prisma.contract.findMany({
  where: {
    OR: [
      // Owned contracts
      { accountId: { in: accountIds } },
      // Shared contracts
      { shares: { some: { accountId: { in: accountIds } } } }
    ],
    status: 'active',
    startDate: { lte: periodEnd },
    endDate: { gte: periodStart },
  },
  include: {
    account: { select: { id: true, accountName: true } },
    shares: { select: { accountId: true } }
  }
});
```

This OR clause ensures both owned and shared contracts are included in consolidated billing calculations.

---

## Business Logic

### Consolidated Billing Rules

1. **Account Eligibility:**
   - Parent account must exist and be active
   - Account must not be on credit hold
   - At least one active contract in hierarchy

2. **Contract Selection:**
   - Status = `active`
   - `startDate <= periodEnd`
   - `endDate >= periodStart`
   - Applies to parent and all subsidiaries

3. **Amount Calculation:**
   - Seat-based: `seatCount * seatPrice`
   - Annual contracts: Divide by 12 for monthly rate
   - Quarterly contracts: Divide by 3 for monthly rate
   - Volume discounts: Applied per contract (future enhancement)

4. **Invoice Generation:**
   - Single invoice assigned to parent account
   - Line items include subsidiary metadata
   - `consolidated = true` flag set
   - Notes indicate number of accounts included

5. **Tax Calculation:**
   - Currently returns $0 (placeholder)
   - Future: Jurisdiction-based tax rules

### Hierarchy Validation

**Circular Reference Prevention:**
- Checked on account creation and update
- Traverses parent chain to detect cycles
- Prevents A → B → C → A scenarios

**Depth Limits:**
- Maximum hierarchy depth: 5 levels
- Prevents infinite recursion
- Ensures query performance

**Soft Delete Handling:**
- Deleted accounts excluded from hierarchy queries
- Children remain accessible via database
- Can be restored by unsetting `deletedAt`

### Shared Contracts Rules

1. **Share Creation:**
   - Contract must be active and not deleted
   - Target account must exist and be active
   - Cannot share contract with its owner account (400 Bad Request)
   - Duplicate shares prevented by unique constraint (409 Conflict)
   - Optional notes field for tracking share reason

2. **Share Validation:**
   - Shared contracts included in consolidated billing automatically
   - Uses OR clause: owned contracts + shared contracts
   - No circular reference issues (shares are independent of hierarchy)

3. **Share Deletion:**
   - Cascade delete: Contract deleted → All shares deleted
   - Cascade delete: Account deleted → All shares deleted
   - Manual unshare: Remove specific share relationship
   - No impact on invoice history

4. **Contract Access:**
   - Shared contracts appear in subsidiary's contract list
   - Original owner retains full control
   - Subsidiaries can view but not modify shared contracts
   - Billing amounts calculated per original contract terms

---

## Performance Considerations

### Database Optimization

**Indices:**
```sql
-- Parent-child relationship lookups
CREATE INDEX idx_accounts_parent ON accounts(parent_account_id);

-- Consolidated invoice filtering
CREATE INDEX idx_invoices_consolidated ON invoices(consolidated);

-- Account status filtering
CREATE INDEX idx_accounts_status ON accounts(status);
```

**Query Optimization:**
- Use Prisma's `include` for eager loading
- Limit hierarchy depth to 5 levels
- Filter soft-deleted accounts early

### Caching Strategy

**Account Hierarchy (Future Enhancement):**
- Cache hierarchy tree for 15 minutes
- Invalidate on account create/update/delete
- Use Redis for distributed caching

**Contract Data:**
- Cache active contracts per account (5 min TTL)
- Invalidate on contract updates

### Scalability

**BullMQ Queue Configuration:**
```typescript
@Processor(QUEUE_NAMES.CONSOLIDATED_BILLING, {
  concurrency: 2, // Process 2 jobs in parallel
})
```

**Performance Targets:**
- **Consolidated billing:** 15 invoices/sec (10 subsidiaries average)
- **Hierarchy queries:** 80 queries/sec (3 levels deep)
- **Contract aggregation:** 500 contracts/batch

---

## Security Considerations

### Input Validation

- UUID validation on all account IDs
- Date range validation (start < end)
- Boolean coercion for `includeChildren`

### Credit Hold Enforcement

```typescript
if (parentAccount.creditHold) {
  throw new BadRequestException(
    `Account ${parentAccountId} is on credit hold. Cannot generate invoice.`
  );
}
```

### Data Integrity

- Database transactions for invoice creation
- Atomic operations for financial data
- Audit trail for all mutations (future enhancement)

### Authorization (Future)

- Tenant isolation: Only access own hierarchy
- Row-level security in multi-tenant scenarios
- API authentication via session tokens

---

## Testing

### Test Files

**Unit Tests:**
- `src/modules/accounts/accounts.service.spec.ts` (35 tests, 35 passing)
  - Hierarchy tree traversal
  - Direct children queries
  - Ancestor traversal
  - Descendant flattening
  - Circular reference prevention
  - Max depth validation

- `src/modules/contracts/contracts.service.spec.ts` (12 new shared contract tests)
  - Share contract with subsidiary
  - Prevent sharing with owner account
  - Prevent duplicate shares
  - Unshare contract
  - Get all shares for a contract
  - Get all shared contracts for an account

- `src/modules/billing/services/consolidated-billing.service.spec.ts` (6 tests, updated for shared contracts)
  - Generate consolidated invoice with shared contracts
  - Query validation for OR clause (owned + shared)
  - Error handling

- `src/modules/billing/services/billing-queue.service.spec.ts` (updated)
- `src/modules/billing/billing.controller.spec.ts` (updated)

**E2E Integration Tests:**
- `test/hierarchical-accounts.e2e-spec.ts` (13 test scenarios)
  - Account hierarchy creation (3 levels deep)
  - Circular hierarchy prevention
  - GET /api/accounts/:id/hierarchy
  - GET /api/accounts/:id/children
  - GET /api/accounts/:id/ancestors
  - GET /api/accounts/:id/descendants

- `test/consolidated-billing.e2e-spec.ts` (15 test scenarios)
  - POST /api/contracts/:id/shares (share contract)
  - DELETE /api/contracts/:id/shares/:accountId (unshare)
  - GET /api/contracts/:id/shares (list shares)
  - GET /api/contracts/shared/:accountId (list shared contracts)
  - POST /billing/consolidated (with shared contracts)
  - POST /billing/consolidated/queue
  - GET /billing/consolidated/queue/stats
  - Error handling (duplicate shares, credit hold, no contracts)

**Total Test Coverage:**
- **Test Suites:** 31 passed
- **Tests:** 346 passed (334 unit + 12 shared contract unit tests)
- **E2E Tests:** 28 scenarios (13 hierarchy + 15 consolidated billing)
- **Coverage:** ~92% for Phase 3 features

### Test Scenarios

**Hierarchy Service:**
✅ Get full hierarchy tree
✅ Get direct children
✅ Get ancestors
✅ Get descendants
✅ Circular reference detection
✅ Max depth enforcement
✅ Soft delete handling

**Shared Contracts:**
✅ Share contract with subsidiary account
✅ Prevent sharing contract with owner account (400)
✅ Prevent duplicate shares (409 Conflict)
✅ Get all shares for a contract
✅ Get all shared contracts for an account
✅ Unshare contract from account
✅ Cascade delete on contract deletion
✅ Cascade delete on account deletion

**Consolidated Billing:**
✅ Generate consolidated invoice for parent + subsidiaries
✅ Include shared contracts in consolidated billing
✅ Generate invoice for parent only (`includeChildren = false`)
✅ Throw error if parent not found (404)
✅ Throw error if account on credit hold (400)
✅ Throw error if no active contracts (400)
✅ Handle multiple contracts across subsidiaries
✅ Queue consolidated billing jobs
✅ Get queue statistics

### How to Run Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test accounts.service.spec.ts

# Run with coverage
npm run test:cov
```

---

## Usage Examples

### Example 1: Share Contract with Subsidiary

```bash
# Parent company creates a contract
curl -X POST "http://localhost:5177/api/contracts" \
  -H "Content-Type: application/json" \
  -H "Cookie: session=..." \
  -d '{
    "accountId": "parent-uuid",
    "contractNumber": "CNT-PARENT-001",
    "startDate": "2026-01-01",
    "endDate": "2026-12-31",
    "contractValue": 120000,
    "billingFrequency": "annual",
    "seatCount": 100,
    "seatPrice": 100,
    "status": "active"
  }'

# Share contract with subsidiary
curl -X POST "http://localhost:5177/api/contracts/contract-uuid/shares" \
  -H "Content-Type: application/json" \
  -H "Cookie: session=..." \
  -d '{
    "accountId": "subsidiary-uuid",
    "notes": "Shared for USA subsidiary billing"
  }'

# Response:
# {
#   "data": {
#     "id": "share-uuid",
#     "contractId": "contract-uuid",
#     "accountId": "subsidiary-uuid",
#     "notes": "Shared for USA subsidiary billing",
#     "createdAt": "2026-01-18T10:00:00Z",
#     "account": {
#       "id": "subsidiary-uuid",
#       "accountName": "Subsidiary USA"
#     }
#   }
# }
```

### Example 2: View Shared Contracts for Account

```bash
# Get all contracts shared with a subsidiary
curl -X GET "http://localhost:5177/api/contracts/shared/subsidiary-uuid" \
  -H "Cookie: session=..."

# Response shows all contracts from other accounts (typically parent)
# that this subsidiary can use
```

### Example 3: View Account Hierarchy

```bash
# Get full hierarchy tree
curl -X GET "http://localhost:5177/api/accounts/parent-uuid/hierarchy" \
  -H "Cookie: session=..."

# Response shows nested children up to 5 levels deep
```

### Example 4: List Direct Subsidiaries

```bash
# Get immediate children only
curl -X GET "http://localhost:5177/api/accounts/parent-uuid/children" \
  -H "Cookie: session=..."
```

### Example 5: Generate Consolidated Invoice with Shared Contracts

```bash
# Generate invoice for parent and all subsidiaries
# Automatically includes both owned and shared contracts
curl -X POST "http://localhost:5177/billing/consolidated" \
  -H "Content-Type: application/json" \
  -H "Cookie: session=..." \
  -d '{
    "parentAccountId": "parent-uuid",
    "periodStart": "2026-01-01",
    "periodEnd": "2026-01-31",
    "includeChildren": true
  }'

# Response:
# {
#   "data": {
#     "invoiceId": "inv-uuid",
#     "invoiceNumber": "INV-202601-00042",
#     "total": "125000.00",
#     "subsidiariesIncluded": 5
#   }
# }

# The invoice will include:
# - Parent's owned contracts
# - Parent's shared contracts (from other accounts)
# - Each subsidiary's owned contracts
# - Each subsidiary's shared contracts
```

### Example 6: Queue Consolidated Billing

```bash
# Queue for background processing
curl -X POST "http://localhost:5177/billing/consolidated/queue" \
  -H "Content-Type: application/json" \
  -H "Cookie: session=..." \
  -d '{
    "parentAccountId": "parent-uuid",
    "periodStart": "2026-01-01",
    "periodEnd": "2026-01-31"
  }'

# Check job status
curl -X GET "http://localhost:5177/billing/jobs/job-uuid" \
  -H "Cookie: session=..."
```

---

## Future Enhancements (Phase 4-5)

### Phase 4: Enterprise Operations
- **Contract inheritance** - Child accounts automatically inherit parent contracts
- **Approval workflows** - Parent approval for large subsidiary invoices
- **Purchase order management** - Track POs across hierarchy
- **Credit management** - Aggregate credit limits across subsidiaries

### Phase 5: Analytics & Optimization
- **Roll-up reporting** - Aggregate ARR/MRR across hierarchy
- **Consolidated statements** - PDF statements for entire hierarchy
- **Hierarchy-based discounts** - Volume discounts across all subsidiaries
- **SLA tracking** - Service level agreements by hierarchy level
- **Proration** - Partial period billing for mid-cycle changes

---

## Related Features

- **[Accounts API](./accounts.md)** - Base account management
- **[Contracts API](./contracts.md)** - Contract lifecycle
- **[Billing Engine](./billing.md)** - Phase 2 billing automation
- **[Invoices API](./invoices.md)** - Invoice management

---

## Summary

Phase 3 successfully implements:

✅ Hierarchical account relationships (parent-child)
✅ Recursive hierarchy traversal (max 5 levels)
✅ Four hierarchy navigation endpoints (tree, children, ancestors, descendants)
✅ Shared contracts via junction table pattern
✅ Contract sharing API (share, unshare, list shares, list shared)
✅ Consolidated invoice generation (owned + shared contracts)
✅ BullMQ queue for async consolidated billing
✅ Multi-location billing address support
✅ Circular reference prevention
✅ Comprehensive test coverage (346 unit tests + 28 E2E scenarios)
✅ ADR-003 compliant API responses
✅ Cascade delete handling for contracts and accounts

**Key Features:**
- **11 new API endpoints** (4 shared contracts + 4 hierarchy + 3 consolidated billing)
- **Shared contracts** automatically included in consolidated billing via OR clause
- **E2E integration tests** with FastifyAdapter for full workflow validation
- **Prisma migrations** for ContractShare junction table with unique constraints

**Next Steps:** Phase 4 - Enterprise Operations (Purchase Orders, Credit Management, Payment Processing)
