-- AlterTable
ALTER TABLE "accounts" ALTER COLUMN "currency" SET DEFAULT 'EUR';

-- AlterTable
ALTER TABLE "invoices" ALTER COLUMN "currency" SET DEFAULT 'EUR';

-- AlterTable
ALTER TABLE "products" ALTER COLUMN "currency" SET DEFAULT 'EUR';
