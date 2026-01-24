import { PrismaClient } from '@prisma/client';

/**
 * Global teardown for E2E tests
 * Clean up after all tests complete
 */

const prisma = new PrismaClient();

async function globalTeardown() {
  try {
    console.log('🧹 Cleaning up E2E test environment...');

    await prisma.$connect();

    // Clean up all test data
    await prisma.invoiceItem.deleteMany();
    await prisma.invoice.deleteMany();
    await prisma.contractShare.deleteMany();
    await prisma.contract.deleteMany();
    await prisma.product.deleteMany();
    await prisma.account.deleteMany();

    console.log('✅ Cleanup completed');

    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ E2E teardown failed:', error);
    await prisma.$disconnect();
  }
}

export default globalTeardown;
