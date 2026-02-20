-- AlterTable: Add charge type, category, and subscription fields to products
-- All columns have DB-level defaults — zero downtime, non-breaking migration

ALTER TABLE "products"
  ADD COLUMN IF NOT EXISTS "charge_type" TEXT NOT NULL DEFAULT 'recurring',
  ADD COLUMN IF NOT EXISTS "category" TEXT NOT NULL DEFAULT 'platform',
  ADD COLUMN IF NOT EXISTS "setup_fee" DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS "trial_period_days" INTEGER,
  ADD COLUMN IF NOT EXISTS "min_commitment_months" INTEGER;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "products_charge_type_idx" ON "products"("charge_type");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "products_category_idx" ON "products"("category");
