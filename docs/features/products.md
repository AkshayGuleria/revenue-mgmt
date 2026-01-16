# Products API Feature

**Status:** Implemented
**Phase:** Phase 1 - Foundation
**Implementation Date:** January 2026
**ADR Compliance:** [ADR-003: REST API Response Structure & Query Parameters](../adrs/003-rest-api-response-structure.md)

## Overview

The Products API manages B2B SaaS product catalog with support for multiple pricing models including seat-based licensing, flat fees, and volume-tiered pricing. This feature is the foundation for contract line items and automated invoice generation.

## Business Context

In B2B SaaS, products represent the services or licenses sold to enterprise customers. The Products API supports:

- **Multiple Pricing Models** - Seat-based, flat fee, volume tiers, custom
- **Flexible Seat Configuration** - Min/max seats, seat increments
- **Volume Discounts** - Tiered pricing for bulk purchases
- **Addon Products** - Additional features or services
- **Multi-Currency Support** - Pricing in different currencies

## Database Schema

Located in: `packages/revenue-backend/prisma/schema.prisma`

```prisma
model Product {
  id              String    @id @default(uuid())
  name            String
  description     String?
  sku             String?   @unique
  pricingModel    String
  basePrice       Decimal?
  currency        String    @default("USD")
  minSeats        Int?      @default(1)
  maxSeats        Int?
  seatIncrement   Int?      @default(1)
  volumeTiers     Json?
  billingInterval String?
  active          Boolean   @default(true)
  isAddon         Boolean   @default(false)
  metadata        Json?
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
}
```

**Key Indices:**
- `sku` - Unique constraint for product identification
- `idx_products_active` on `active` - Filter active products
- `idx_products_pricing` on `pricingModel` - Group by pricing type

## API Endpoints

Base Path: `/api/products`

### 1. Create Product

**Endpoint:** `POST /api/products`

**Description:** Create a new product with pricing configuration. Supports seat-based, flat-fee, volume-tiered, and custom pricing models.

**Request Body:**

```typescript
{
  "name": "Enterprise Plan",
  "description": "Full-featured enterprise plan with unlimited seats",
  "sku": "ENT-PLAN-001",
  "pricingModel": "seat_based", // seat_based | flat_fee | volume_tiered | custom
  "basePrice": 99.99,
  "currency": "USD",
  "minSeats": 1,
  "maxSeats": 1000,
  "seatIncrement": 5,
  "volumeTiers": [
    { "minQuantity": 1, "maxQuantity": 10, "pricePerUnit": 99.99 },
    { "minQuantity": 11, "maxQuantity": 50, "pricePerUnit": 89.99 },
    { "minQuantity": 51, "maxQuantity": null, "pricePerUnit": 79.99 }
  ],
  "billingInterval": "monthly", // monthly | quarterly | semi_annual | annual
  "active": true,
  "isAddon": false,
  "metadata": {
    "category": "subscription",
    "features": ["feature1", "feature2"]
  }
}
```

**Response:** `201 Created`

```json
{
  "data": {
    "id": "product-550e8400-e29b-41d4-a716-446655440000",
    "name": "Enterprise Plan",
    "description": "Full-featured enterprise plan with unlimited seats",
    "sku": "ENT-PLAN-001",
    "pricingModel": "seat_based",
    "basePrice": "99.99",
    "currency": "USD",
    "minSeats": 1,
    "maxSeats": 1000,
    "seatIncrement": 5,
    "billingInterval": "monthly",
    "active": true,
    "isAddon": false,
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
- `400 Bad Request` - Invalid input data
- `409 Conflict` - Product with this SKU already exists

**Validations:**
- SKU must be unique (if provided)
- Numeric fields must be >= 0
- minSeats must be >= 1
- maxSeats must be >= minSeats

---

### 2. List Products

**Endpoint:** `GET /api/products`

**Description:** Retrieve paginated list of products with operator-based filtering.

**Query Parameters (ADR-003 Compliant):**

```bash
# Pagination (offset-based)
?offset[eq]=0&limit[eq]=20

# Filter by pricing model
?pricingModel[eq]=seat_based

# Filter active products only
?active[eq]=true

# Filter addon products
?isAddon[eq]=true

# Filter by price range
?basePrice[gte]=50&basePrice[lte]=200

# Filter by seat range
?minSeats[gte]=1&maxSeats[lte]=500

# Filter by billing interval
?billingInterval[eq]=monthly

# Filter by currency
?currency[eq]=USD

# Search by product name (case-insensitive)
?name[like]=enterprise

# Search by SKU
?sku[like]=ENT-
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
      "id": "product-550e8400-e29b-41d4-a716-446655440000",
      "name": "Enterprise Plan",
      "sku": "ENT-PLAN-001",
      "pricingModel": "seat_based",
      "basePrice": "99.99",
      "currency": "USD",
      "minSeats": 1,
      "maxSeats": 1000,
      "seatIncrement": 5,
      "billingInterval": "monthly",
      "active": true,
      "isAddon": false,
      "createdAt": "2026-01-15T10:00:00Z"
    }
  ],
  "paging": {
    "offset": 0,
    "limit": 20,
    "total": 25,
    "totalPages": 2,
    "hasNext": true,
    "hasPrev": false
  }
}
```

**Default Pagination:**
- `offset`: 0
- `limit`: 20 (max: 100)

**Ordering:**
- Default: `createdAt DESC` (newest first)

---

### 3. Get Product by ID

**Endpoint:** `GET /api/products/:id`

**Description:** Retrieve detailed product information including pricing configuration and volume tiers.

**Path Parameters:**
- `id` - Product UUID

**Response:** `200 OK`

```json
{
  "data": {
    "id": "product-550e8400-e29b-41d4-a716-446655440000",
    "name": "Enterprise Plan",
    "description": "Full-featured enterprise plan with unlimited seats",
    "sku": "ENT-PLAN-001",
    "pricingModel": "seat_based",
    "basePrice": "99.99",
    "currency": "USD",
    "minSeats": 1,
    "maxSeats": 1000,
    "seatIncrement": 5,
    "volumeTiers": [
      {
        "minQuantity": 1,
        "maxQuantity": 10,
        "pricePerUnit": 99.99
      },
      {
        "minQuantity": 11,
        "maxQuantity": 50,
        "pricePerUnit": 89.99
      },
      {
        "minQuantity": 51,
        "maxQuantity": null,
        "pricePerUnit": 79.99
      }
    ],
    "billingInterval": "monthly",
    "active": true,
    "isAddon": false,
    "metadata": {
      "category": "subscription",
      "features": ["feature1", "feature2"]
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
- `404 Not Found` - Product not found

---

### 4. Update Product

**Endpoint:** `PATCH /api/products/:id`

**Description:** Update product information including pricing, seats, and configuration.

**Path Parameters:**
- `id` - Product UUID

**Request Body (partial update):**

```json
{
  "basePrice": 109.99,
  "maxSeats": 2000,
  "active": true
}
```

**Response:** `200 OK`

```json
{
  "data": {
    "id": "product-550e8400-e29b-41d4-a716-446655440000",
    "name": "Enterprise Plan",
    "basePrice": "109.99",
    "maxSeats": 2000,
    "active": true,
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
- `404 Not Found` - Product not found
- `409 Conflict` - SKU conflict with existing product

**Validations:**
- SKU must be unique (if changed)
- Numeric fields must be >= 0

---

### 5. Delete Product

**Endpoint:** `DELETE /api/products/:id`

**Description:** Hard delete a product from the system. Use with caution.

**Path Parameters:**
- `id` - Product UUID

**Response:** `204 No Content`

**Error Responses:**
- `404 Not Found` - Product not found

**Behavior:**
- Hard delete: Permanently removes product from database
- **Warning:** This may affect existing contracts referencing this product
- Consider setting `active = false` for soft archival instead

---

## Implementation Details

### Project Structure

```
packages/revenue-backend/src/modules/products/
├── products.controller.ts      # REST endpoints
├── products.service.ts         # Business logic
├── products.module.ts          # NestJS module
├── products.service.spec.ts    # Unit tests (93%+ coverage)
└── dto/
    ├── create-product.dto.ts   # Request validation for create
    ├── update-product.dto.ts   # Request validation for update
    ├── query-products.dto.ts   # Query parameter validation
    └── index.ts                # DTO exports
```

### Technology Stack

- **Framework:** NestJS (TypeScript)
- **Database:** PostgreSQL (via Prisma ORM)
- **Validation:** class-validator, class-transformer
- **API Documentation:** Swagger/OpenAPI (@nestjs/swagger)

### Key Features

#### 1. Pricing Models

The Products API supports four pricing models:

```typescript
export enum PricingModel {
  SEAT_BASED = 'seat_based',       // Per-user/license pricing
  FLAT_FEE = 'flat_fee',           // Fixed price regardless of usage
  VOLUME_TIERED = 'volume_tiered', // Price breaks based on quantity
  CUSTOM = 'custom',               // Custom pricing logic (Phase 5)
}
```

**Use Cases:**

**1. Seat-Based Pricing** (Most common for B2B SaaS)
```json
{
  "pricingModel": "seat_based",
  "basePrice": 99.99,
  "minSeats": 1,
  "maxSeats": 1000,
  "seatIncrement": 5
}
```
- Price calculation: `seatCount × basePrice`
- Example: 50 seats × $99.99 = $4,999.50/month

**2. Flat Fee Pricing**
```json
{
  "pricingModel": "flat_fee",
  "basePrice": 9999.00
}
```
- Fixed price regardless of seats/usage
- Example: $9,999/month for unlimited seats

**3. Volume-Tiered Pricing**
```json
{
  "pricingModel": "volume_tiered",
  "volumeTiers": [
    { "minQuantity": 1, "maxQuantity": 10, "pricePerUnit": 99.99 },
    { "minQuantity": 11, "maxQuantity": 50, "pricePerUnit": 89.99 },
    { "minQuantity": 51, "maxQuantity": null, "pricePerUnit": 79.99 }
  ]
}
```
- Price breaks at quantity thresholds
- Example: 60 seats → 60 × $79.99 = $4,799.40/month

**4. Custom Pricing**
```json
{
  "pricingModel": "custom",
  "metadata": {
    "pricingLogic": "See contract for pricing details"
  }
}
```
- Requires manual pricing calculation (Phase 5)
- Used for complex enterprise deals

#### 2. Volume Tiers Configuration

Volume tiers enable bulk discounts for large customers:

```typescript
// volumeTiers JSON structure
[
  {
    "minQuantity": 1,      // Tier starts at 1 seat
    "maxQuantity": 10,     // Tier ends at 10 seats
    "pricePerUnit": 99.99  // Price per seat in this tier
  },
  {
    "minQuantity": 11,     // Next tier starts
    "maxQuantity": 50,
    "pricePerUnit": 89.99  // 10% discount
  },
  {
    "minQuantity": 51,
    "maxQuantity": null,   // null = no upper limit
    "pricePerUnit": 79.99  // 20% discount
  }
]
```

**Pricing Calculation (Phase 2):**
```typescript
function calculateTieredPrice(quantity: number, tiers: VolumeTier[]): number {
  const tier = tiers.find(t =>
    quantity >= t.minQuantity &&
    (t.maxQuantity === null || quantity <= t.maxQuantity)
  );
  return quantity * (tier?.pricePerUnit || 0);
}
```

#### 3. Seat Configuration

Seat-based products have flexible configuration:

```typescript
{
  "minSeats": 1,         // Minimum seats required
  "maxSeats": 1000,      // Maximum seats allowed (null = unlimited)
  "seatIncrement": 5     // Seats must be purchased in multiples of 5
}
```

**Validation (Phase 2):**
- Seat count must be >= `minSeats`
- Seat count must be <= `maxSeats` (if set)
- Seat count must be divisible by `seatIncrement`

**Example:**
```typescript
// Valid: 5, 10, 15, 20, ... 1000
// Invalid: 3, 7, 12 (not divisible by 5)
// Invalid: 1500 (exceeds maxSeats)
```

#### 4. Billing Intervals

Products can specify default billing intervals:

```typescript
export enum BillingInterval {
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  SEMI_ANNUAL = 'semi_annual',
  ANNUAL = 'annual',
}
```

**Usage:**
- Product defines default interval
- Contract can override on per-customer basis
- Invoice generation respects contract's billing frequency

#### 5. Addon Products

Products can be marked as addons:

```typescript
{
  "isAddon": true,
  "name": "Advanced Analytics Module",
  "pricingModel": "flat_fee",
  "basePrice": 499.00
}
```

**Use Cases:**
- Optional features or modules
- Add-on services (training, support)
- Can only be purchased with base product (Phase 2 validation)

#### 6. Operator-Based Query Filtering

The API uses the same query parser utility as other APIs:

**Utility:** `src/common/utils/query-parser.ts`

```typescript
// Example query:
// GET /api/products?pricingModel[eq]=seat_based&active[eq]=true&basePrice[lte]=100

// Parsed to Prisma filter:
{
  pricingModel: { equals: 'seat_based' },
  active: { equals: true },
  basePrice: { lte: 100 }
}
```

#### 7. Standard API Response Structure

All responses follow ADR-003 compliant structure:

**Utility:** `src/common/utils/response-builder.ts`

```typescript
// Single resource response
buildSingleResponse(product)
// Returns: { data: {...}, paging: { all null } }

// Paginated list response
buildPaginatedListResponse(products, offset, limit, total)
// Returns: { data: [...], paging: { offset, limit, total, ... } }
```

## Testing

**Test File:** `src/modules/products/products.service.spec.ts`

**Coverage:** 93%+ (all service methods tested)

**Test Scenarios:**
- Create product with different pricing models
- Create product validation (SKU uniqueness)
- List products with filtering and pagination
- Get product by ID
- Update product (including price and seat changes)
- Hard delete product
- Error handling (not found, conflicts)

**Run Tests:**

```bash
# Unit tests
npm run test products.service.spec

# Test coverage
npm run test:cov products.service.spec
```

## Usage Examples

### Example 1: Create Seat-Based Product

```bash
curl -X POST http://localhost:5177/api/products \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Enterprise Plan",
    "sku": "ENT-PLAN-001",
    "pricingModel": "seat_based",
    "basePrice": 99.99,
    "currency": "USD",
    "minSeats": 1,
    "maxSeats": 1000,
    "seatIncrement": 5,
    "billingInterval": "monthly",
    "active": true
  }'
```

### Example 2: Create Volume-Tiered Product

```bash
curl -X POST http://localhost:5177/api/products \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Professional Plan",
    "sku": "PRO-PLAN-001",
    "pricingModel": "volume_tiered",
    "currency": "USD",
    "volumeTiers": [
      { "minQuantity": 1, "maxQuantity": 10, "pricePerUnit": 149.99 },
      { "minQuantity": 11, "maxQuantity": 50, "pricePerUnit": 129.99 },
      { "minQuantity": 51, "maxQuantity": null, "pricePerUnit": 99.99 }
    ],
    "billingInterval": "monthly",
    "active": true
  }'
```

### Example 3: Create Flat Fee Product

```bash
curl -X POST http://localhost:5177/api/products \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Unlimited Plan",
    "sku": "UNLIM-001",
    "pricingModel": "flat_fee",
    "basePrice": 9999.00,
    "currency": "USD",
    "billingInterval": "annual",
    "active": true
  }'
```

### Example 4: Create Addon Product

```bash
curl -X POST http://localhost:5177/api/products \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Advanced Analytics Module",
    "sku": "ADDON-ANALYTICS",
    "pricingModel": "flat_fee",
    "basePrice": 499.00,
    "currency": "USD",
    "billingInterval": "monthly",
    "active": true,
    "isAddon": true
  }'
```

### Example 5: Search Products

```bash
# Find all active seat-based products
curl "http://localhost:5177/api/products?pricingModel[eq]=seat_based&active[eq]=true"

# Find products under $100/month
curl "http://localhost:5177/api/products?basePrice[lte]=100&active[eq]=true"

# Find addon products
curl "http://localhost:5177/api/products?isAddon[eq]=true"

# Search by name
curl "http://localhost:5177/api/products?name[like]=enterprise"
```

### Example 6: Update Product Price

```bash
curl -X PATCH http://localhost:5177/api/products/product-id-here \
  -H "Content-Type: application/json" \
  -d '{
    "basePrice": 109.99
  }'
```

## Performance Considerations

### Database Optimization

1. **Indices:**
   - `sku` - Unique constraint for product identification
   - `idx_products_active` on `active` - Filter active products
   - `idx_products_pricing` on `pricingModel` - Group by pricing type

2. **Query Optimization:**
   - No complex joins (standalone product catalog)
   - Fast lookups by SKU or ID
   - Efficient filtering by pricing model and active status

3. **Pagination:**
   - Offset-based pagination (SQL-friendly: `LIMIT x OFFSET y`)
   - Default limit: 20, max: 100
   - Always include total count for client-side pagination UI

### Caching Strategy (Future Phase)

```typescript
// Recommended for Phase 2+ (Contract-Based Billing)
// Cache product catalog (1 hour TTL)
// Cache volume discount tiers (1 hour TTL)
// Invalidate on product update
```

**Benefits:**
- Reduce database queries during invoice generation
- Faster contract creation with product lookups
- Consistent pricing across billing cycles

## Security Considerations

1. **Input Validation:**
   - All DTOs use class-validator decorators
   - Enum validation for pricingModel, billingInterval
   - Minimum value validation for numeric fields
   - JSON validation for volumeTiers and metadata

2. **SKU Uniqueness:**
   - Unique constraint prevents duplicate SKUs
   - Case-sensitive SKU matching

3. **Error Handling:**
   - Specific error messages for validation failures
   - 404 for not found resources
   - 409 for conflicts (duplicate SKU)
   - 400 for validation errors

## Future Enhancements

### Phase 2: Contract-Based Billing (Weeks 3-4)

1. **Price Calculation Engine:**
   - Implement seat-based price calculation
   - Volume tier price calculation
   - Overage charge calculation
   - Discount application

2. **Product-Contract Linking:**
   - Contract line items reference products
   - Multi-product contracts
   - Quantity tracking per product

### Phase 5: Analytics & Optimization (Weeks 10-12)

1. **Product Analytics:**
   - Revenue by product
   - Seat utilization per product
   - Popular product combinations
   - Product attach rate (base vs addons)

2. **Dynamic Pricing:**
   - Time-based pricing (promotional periods)
   - Customer segment pricing
   - Geographic pricing

3. **Product Bundles:**
   - Bundle multiple products together
   - Bundle-level discounts
   - Required vs optional products in bundle

### Advanced Features (Phase 6+)

1. **Usage-Based Pricing:**
   - Metered usage tracking
   - Overage charges beyond committed usage
   - Hybrid: base commitment + usage

2. **Multi-Currency:**
   - Exchange rate management
   - Currency-specific pricing
   - Automatic currency conversion

3. **Product Lifecycle:**
   - Product versioning (v1, v2, etc.)
   - Deprecated products (no new sales, support existing)
   - Migration paths between products

4. **Contract Templates:**
   - Predefined product packages (Starter, Growth, Enterprise)
   - Quick contract creation from templates

## Related Features

- **Contracts API** - Contracts reference products (`docs/features/contracts.md`)
- **Accounts API** - Products sold to accounts (`docs/features/accounts.md`)
- **Invoices API** (Phase 1) - Invoice line items reference products
- **Billing Engine** (Phase 2) - Price calculation using product pricing models

## Common Workflows

### Workflow 1: Product Catalog Setup

1. Create base product (`POST /api/products`) with seat-based pricing
2. Create addon products for optional features
3. Set volume tiers for bulk discounts
4. Mark products as active

### Workflow 2: Contract Creation with Products

1. Customer selects "Enterprise Plan" (100 seats)
2. Add "Advanced Analytics" addon
3. Create contract referencing products
4. Invoice generation uses product pricing

### Workflow 3: Price Increase

1. Update product (`PATCH /api/products/:id`) with new `basePrice`
2. Existing contracts retain old pricing (grandfathered)
3. New contracts use updated pricing
4. Renewal notices include price change notification

### Workflow 4: Volume Tier Calculation

**Scenario:** Customer purchases 60 seats of volume-tiered product

**Volume Tiers:**
- 1-10 seats: $99.99/seat
- 11-50 seats: $89.99/seat
- 51+ seats: $79.99/seat

**Calculation:**
- 60 seats × $79.99 = $4,799.40/month

## API Reference

**Swagger Documentation:** http://localhost:5177/api/docs

## Contact

For questions or issues related to the Products API, please refer to:
- **Feature Specification:** `docs/feature-spec.md` (Phase 1, Task Group 1.3)
- **ADR:** `docs/adrs/003-rest-api-response-structure.md`
- **Project Instructions:** `.claude/CLAUDE.md`
