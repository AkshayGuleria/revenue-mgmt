# ADR-004: Product Pricing Model Enhancement — Charge Types, Categories & Setup Fees

**Status:** Accepted
**Date:** 2026-02-18
**Decision Makers:** tommi (Architecture Lead)
**Tags:** #products #pricing #recurring #subscription #billing-engine

---

## Context

The current Product model supports multiple pricing structures (`seat_based`, `flat_fee`, `volume_tiered`, `custom`) and billing intervals (`monthly`, `quarterly`, `annual`), but it lacks two critical dimensions that real-world B2B SaaS pricing requires:

1. **No charge type distinction** — The system cannot differentiate between a recurring subscription fee (billed every interval automatically) and a one-time fee (billed only on the first invoice, e.g. onboarding). A product with `billingInterval: monthly` is ambiguous: does it mean "auto-bill monthly forever" or "here's a monthly reference price"?

2. **No product category** — The catalog has no grouping mechanism. Real SaaS catalogs distinguish between core platform seats, add-on modules, professional services, and support tiers. This grouping is essential for invoice line item labeling, reporting, and billing engine routing.

3. **No setup fees** — Many SaaS products include a one-time setup or onboarding charge on top of the recurring subscription. There is no field to capture this without creating a separate product record, which is inelegant and makes invoice generation complex.

4. **No minimum commitment or trial periods** — The product model has no way to express "minimum 12-month commitment" or "14-day free trial," which are standard in enterprise SaaS contracts.

### Current State

```
Product {
  pricingModel: seat_based | flat_fee | volume_tiered | custom
  billingInterval: monthly | quarterly | semi_annual | annual
  isAddon: boolean   ← too coarse, only two categories
  // No: chargeType, category, setupFee, trialPeriodDays, minCommitmentMonths
}
```

### Impact of Status Quo

- Invoice generator cannot distinguish recurring vs. one-time products — results in wrong billing
- No way to build a realistic multi-product contract with mixed charge types
- Product catalog is not self-describing; billing rules must be hardcoded elsewhere
- Reporting cannot segment ARR (recurring) from non-recurring services revenue

---

## Decision

We will enhance the Product model with **Layers 1 and 2** of a three-layer pricing architecture. Layer 3 (ContractLineItems — multiple products per contract) is deferred to Phase 4.

### Layer 1: `chargeType` (Mandatory)

Add an explicit `chargeType` enum to every product:

| Value | Meaning | Billing Behaviour |
|---|---|---|
| `recurring` | Billed every `billingInterval` indefinitely | Auto-invoiced each period via billing engine |
| `one_time` | Charged once, on first invoice | Billed on contract activation; never again |
| `usage_based` | Billed based on consumption metrics | **Phase 6 — field added now, logic deferred** |

**Rules:**
- `billingInterval` is **required** when `chargeType = recurring`
- `billingInterval` is **ignored** when `chargeType = one_time`
- `usage_based` products are stored in the catalog but the billing engine skips them until Phase 6

### Layer 2: `category`, `setupFee`, `trialPeriodDays`, `minCommitmentMonths`

| Field | Type | Description |
|---|---|---|
| `category` | enum | Product grouping for invoice labeling and reporting |
| `setupFee` | Decimal? | One-time fee added to the **first** invoice for this product |
| `trialPeriodDays` | Int? | Days before billing begins (e.g. 14-day free trial) |
| `minCommitmentMonths` | Int? | Minimum months customer must commit to |

#### `category` values

| Value | Description | Examples |
|---|---|---|
| `platform` | Core platform access | Enterprise Plan, Professional Plan |
| `seats` | Per-user/per-license | Extra Seats Add-on |
| `addon` | Feature modules | Analytics Studio, AI Assistant |
| `support` | Support tiers | Premium Support, Dedicated CSM |
| `professional_services` | One-time delivery work | Onboarding, Data Migration, Training |
| `storage` | Data/infrastructure | Extra Storage (Phase 6) |
| `api` | API/integration access | API Access Pack (Phase 6) |

---

## Rejected Alternatives

### A. Store charge type in `metadata` JSON

**Rejected** because it makes the field non-queryable, non-validated, and invisible to the billing engine without parsing JSON. Schema fields are the right place for billing-critical data.

### B. Implement Layer 3 (ContractLineItems) simultaneously

**Deferred** to Phase 4. ContractLineItems require rethinking the contract model, the billing engine's invoice generation loop, and the frontend contract form. That scope is too large to bundle with a product model enhancement. The product fields added here are prerequisites for Layer 3, not duplicates of it.

### C. Use separate Product sub-types (tables)

**Rejected** — table-per-type inheritance adds joins without meaningful benefit at current scale. A single `products` table with nullable fields and a `category` discriminator is sufficient.

---

## Schema Changes

### Prisma Migration (additive — no breaking changes)

```prisma
model Product {
  id                   String    @id @default(uuid())
  name                 String
  description          String?
  sku                  String?   @unique

  // Pricing Model
  pricingModel         String    @map("pricing_model")
  basePrice            Decimal?  @map("base_price") @db.Decimal(10, 2)
  currency             String    @default("USD")

  // NEW: Charge Type & Category
  chargeType           String    @default("recurring") @map("charge_type")
  category             String    @default("platform") @map("category")

  // Seat-Based Configuration
  minSeats             Int       @default(1) @map("min_seats")
  maxSeats             Int?      @map("max_seats")
  seatIncrement        Int       @default(1) @map("seat_increment")

  // Volume Discount Tiers
  volumeTiers          Json?     @map("volume_tiers")

  // Billing Configuration
  billingInterval      String?   @map("billing_interval")

  // NEW: Subscription & Commitment Fields
  setupFee             Decimal?  @map("setup_fee") @db.Decimal(10, 2)
  trialPeriodDays      Int?      @map("trial_period_days")
  minCommitmentMonths  Int?      @map("min_commitment_months")

  // Product Status
  active               Boolean   @default(true)
  isAddon              Boolean   @default(false) @map("is_addon")

  // Metadata
  metadata             Json?
  createdAt            DateTime  @default(now()) @map("created_at")
  updatedAt            DateTime  @updatedAt @map("updated_at")

  @@index([pricingModel])
  @@index([chargeType])        // NEW
  @@index([category])          // NEW
  @@index([active])
  @@map("products")
}
```

### New Enums (backend DTO)

```typescript
export enum ChargeType {
  RECURRING = 'recurring',
  ONE_TIME  = 'one_time',
  USAGE_BASED = 'usage_based',   // Phase 6
}

export enum ProductCategory {
  PLATFORM              = 'platform',
  SEATS                 = 'seats',
  ADDON                 = 'addon',
  SUPPORT               = 'support',
  PROFESSIONAL_SERVICES = 'professional_services',
  STORAGE               = 'storage',   // Phase 6
  API                   = 'api',       // Phase 6
}
```

---

## Billing Engine Implications

When generating invoices from a contract, the engine must now:

1. **Skip** `usage_based` products (no billing logic yet)
2. **For `one_time` products with a `setupFee`:** Add to invoice only if this is the **first** billing period of the contract (check `periodStart == contract.startDate`)
3. **For `recurring` products:** Continue normal interval-based billing
4. **Respect `trialPeriodDays`:** If `today < contract.startDate + trialPeriodDays`, do not generate an invoice

These changes are **backward-compatible**: existing products without `chargeType` default to `recurring`, so all existing contracts continue billing normally.

---

## Updated Product Catalog (Seed Data)

### Core Plans — `recurring`, `platform`, `seat_based`

| Name | SKU | Price | Interval | Setup Fee | Trial | Min Commit |
|---|---|---|---|---|---|---|
| Starter Plan | PLAN-STARTER | $29.99/seat | monthly | — | 14 days | — |
| Professional Plan | PLAN-PRO | $79.99/seat | monthly | $500 | — | — |
| Enterprise Plan | PLAN-ENT | $149.99/seat | annual | $2,000 | — | 12 months |

### Platform Add-ons — `recurring`, `addon`, `flat_fee`

| Name | SKU | Price | Interval |
|---|---|---|---|
| Advanced Analytics Module | ADDON-ANALYTICS | $499/mo | monthly |
| AI Assistant Module | ADDON-AI | $999/mo | monthly |
| Premium API Access | ADDON-API | $299/mo | monthly |
| Custom SSO/SAML | ADDON-SSO | $199/mo | monthly |

### Support Tiers — `recurring`, `support`, `flat_fee`

| Name | SKU | Price | Interval |
|---|---|---|---|
| Premium Support | SUPPORT-PREMIUM | $999/mo | monthly |
| Dedicated CSM | SUPPORT-CSM | $2,500/mo | monthly |

### One-Time Services — `one_time`, `professional_services`

| Name | SKU | Price |
|---|---|---|
| Onboarding Package | SVC-ONBOARDING | $5,000 |
| Data Migration | SVC-MIGRATION | $3,000 |
| Custom Integration | SVC-INTEGRATION | $15,000 |
| Training Workshop | SVC-TRAINING | $2,500 |

---

## Consequences

### Positive
- Product catalog becomes self-describing — billing engine reads charge type from the product, not hardcoded rules
- Enables accurate ARR/MRR reporting (filter by `chargeType = recurring`)
- `setupFee` enables realistic first-invoice generation without separate product records
- `category` enables invoice line item grouping and revenue segmentation by type
- All changes are **additive** — zero breaking changes to existing API contracts

### Negative
- Billing engine needs updates to honour `chargeType`, `setupFee`, and `trialPeriodDays`
- Existing products need backfilled `chargeType` and `category` values (safe defaults applied)
- Frontend product form needs conditional field display logic

### Neutral
- `isAddon` boolean becomes redundant (superseded by `category`), kept for backward compatibility

---

## Related Documents

- [Feature Spec: Product Pricing Enhancement](../features/product-pricing-enhancement.md)
- [ADR-003: REST API Response Structure](./003-rest-api-response-structure.md)
- [Feature: Products API](../features/products.md)
- [Feature: Billing Engine](../features/billing.md)
- **Phase 4 (Future):** ADR-005 — ContractLineItems & CPQ-Style Multi-Product Contracts
