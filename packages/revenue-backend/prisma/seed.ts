/**
 * Prisma Seed — Product Catalog (Phase 3.5)
 *
 * 13 products across 4 categories:
 *   - Core Plans (recurring · platform · seat_based)
 *   - Platform Add-ons (recurring · addon · flat_fee)
 *   - Support Tiers (recurring · support · flat_fee)
 *   - One-Time Services (one_time · professional_services · flat_fee)
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding product catalog...');

  // Clear existing products
  await prisma.product.deleteMany();

  // ── Core Plans ────────────────────────────────────────────────────────────
  await prisma.product.createMany({
    data: [
      {
        name: 'Starter Plan',
        sku: 'PLAN-STARTER',
        description: 'Ideal for small teams getting started with the platform.',
        pricingModel: 'seat_based',
        chargeType: 'recurring',
        category: 'platform',
        basePrice: 29.99,
        currency: 'USD',
        billingInterval: 'monthly',
        setupFee: null,
        trialPeriodDays: 14,
        minCommitmentMonths: null,
        minSeats: 1,
        active: true,
        isAddon: false,
      },
      {
        name: 'Professional Plan',
        sku: 'PLAN-PRO',
        description: 'Advanced features for growing teams.',
        pricingModel: 'seat_based',
        chargeType: 'recurring',
        category: 'platform',
        basePrice: 79.99,
        currency: 'USD',
        billingInterval: 'monthly',
        setupFee: 500.0,
        trialPeriodDays: null,
        minCommitmentMonths: null,
        minSeats: 5,
        active: true,
        isAddon: false,
      },
      {
        name: 'Enterprise Plan',
        sku: 'PLAN-ENT',
        description: 'Full-featured enterprise plan with dedicated support and SLA.',
        pricingModel: 'seat_based',
        chargeType: 'recurring',
        category: 'platform',
        basePrice: 149.99,
        currency: 'USD',
        billingInterval: 'annual',
        setupFee: 2000.0,
        trialPeriodDays: null,
        minCommitmentMonths: 12,
        minSeats: 10,
        active: true,
        isAddon: false,
      },
    ],
  });

  // ── Platform Add-ons ──────────────────────────────────────────────────────
  await prisma.product.createMany({
    data: [
      {
        name: 'Advanced Analytics Module',
        sku: 'ADDON-ANALYTICS',
        description: 'In-depth analytics dashboards, custom reports, and data exports.',
        pricingModel: 'flat_fee',
        chargeType: 'recurring',
        category: 'addon',
        basePrice: 499.0,
        currency: 'USD',
        billingInterval: 'monthly',
        active: true,
        isAddon: true,
      },
      {
        name: 'AI Assistant Module',
        sku: 'ADDON-AI',
        description: 'AI-powered automation, recommendations, and workflow assistance.',
        pricingModel: 'flat_fee',
        chargeType: 'recurring',
        category: 'addon',
        basePrice: 999.0,
        currency: 'USD',
        billingInterval: 'monthly',
        active: true,
        isAddon: true,
      },
      {
        name: 'Premium API Access',
        sku: 'ADDON-API',
        description: 'Higher rate limits, dedicated API keys, and webhook support.',
        pricingModel: 'flat_fee',
        chargeType: 'recurring',
        category: 'addon',
        basePrice: 299.0,
        currency: 'USD',
        billingInterval: 'monthly',
        active: true,
        isAddon: true,
      },
      {
        name: 'Custom SSO / SAML',
        sku: 'ADDON-SSO',
        description: 'Enterprise single sign-on with SAML 2.0 and SCIM provisioning.',
        pricingModel: 'flat_fee',
        chargeType: 'recurring',
        category: 'addon',
        basePrice: 199.0,
        currency: 'USD',
        billingInterval: 'monthly',
        active: true,
        isAddon: true,
      },
    ],
  });

  // ── Support Tiers ─────────────────────────────────────────────────────────
  await prisma.product.createMany({
    data: [
      {
        name: 'Premium Support',
        sku: 'SUPPORT-PREMIUM',
        description: '24/7 priority support with 4-hour SLA response time.',
        pricingModel: 'flat_fee',
        chargeType: 'recurring',
        category: 'support',
        basePrice: 999.0,
        currency: 'USD',
        billingInterval: 'monthly',
        active: true,
        isAddon: false,
      },
      {
        name: 'Dedicated Customer Success Manager',
        sku: 'SUPPORT-CSM',
        description: 'Dedicated CSM for onboarding, QBRs, and strategic guidance.',
        pricingModel: 'flat_fee',
        chargeType: 'recurring',
        category: 'support',
        basePrice: 2500.0,
        currency: 'USD',
        billingInterval: 'monthly',
        active: true,
        isAddon: false,
      },
    ],
  });

  // ── One-Time Services ─────────────────────────────────────────────────────
  await prisma.product.createMany({
    data: [
      {
        name: 'Onboarding Package',
        sku: 'SVC-ONBOARDING',
        description: 'Guided setup, configuration, and team training (up to 3 sessions).',
        pricingModel: 'flat_fee',
        chargeType: 'one_time',
        category: 'professional_services',
        basePrice: 5000.0,
        currency: 'USD',
        billingInterval: null,
        active: true,
        isAddon: false,
      },
      {
        name: 'Data Migration',
        sku: 'SVC-MIGRATION',
        description: 'Full historical data migration from legacy systems.',
        pricingModel: 'flat_fee',
        chargeType: 'one_time',
        category: 'professional_services',
        basePrice: 3000.0,
        currency: 'USD',
        billingInterval: null,
        active: true,
        isAddon: false,
      },
      {
        name: 'Custom Integration',
        sku: 'SVC-INTEGRATION',
        description: 'Bespoke integration with your existing ERP, CRM, or data warehouse.',
        pricingModel: 'flat_fee',
        chargeType: 'one_time',
        category: 'professional_services',
        basePrice: 15000.0,
        currency: 'USD',
        billingInterval: null,
        active: true,
        isAddon: false,
      },
      {
        name: 'Training Workshop',
        sku: 'SVC-TRAINING',
        description: 'Full-day on-site or virtual training workshop for your team.',
        pricingModel: 'flat_fee',
        chargeType: 'one_time',
        category: 'professional_services',
        basePrice: 2500.0,
        currency: 'USD',
        billingInterval: null,
        active: true,
        isAddon: false,
      },
    ],
  });

  const count = await prisma.product.count();
  console.log(`✓ Seeded ${count} products.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
