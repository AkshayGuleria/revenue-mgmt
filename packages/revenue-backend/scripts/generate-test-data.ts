#!/usr/bin/env ts-node
/**
 * Test Data Generator for Revenue Management System
 *
 * Generates:
 * - Product catalog (seat-based, flat fee, volume-tiered)
 * - Hierarchical accounts (parent-child relationships, 2-3 levels deep)
 * - Contracts for accounts with varying terms
 *
 * Usage:
 *   npm run generate-data
 *   npm run generate-data -- --clean  (clears existing data first)
 */

import axios, { AxiosInstance } from 'axios';

// Configuration
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:5177';
const CLEAN_FIRST = process.argv.includes('--clean');

// Types from DTOs
enum AccountType {
  ENTERPRISE = 'enterprise',
  SMB = 'smb',
  STARTUP = 'startup',
}

enum PaymentTerms {
  NET_30 = 'net_30',
  NET_60 = 'net_60',
  NET_90 = 'net_90',
  DUE_ON_RECEIPT = 'due_on_receipt',
}

enum PricingModel {
  SEAT_BASED = 'seat_based',
  FLAT_FEE = 'flat_fee',
  VOLUME_TIERED = 'volume_tiered',
  CUSTOM = 'custom',
}

enum ChargeType {
  RECURRING = 'recurring',
  ONE_TIME = 'one_time',
  USAGE_BASED = 'usage_based',
}

enum ProductCategory {
  PLATFORM = 'platform',
  SEATS = 'seats',
  ADDON = 'addon',
  SUPPORT = 'support',
  PROFESSIONAL_SERVICES = 'professional_services',
  STORAGE = 'storage',
  API = 'api',
}

enum BillingInterval {
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  SEMI_ANNUAL = 'semi_annual',
  ANNUAL = 'annual',
}

enum BillingFrequency {
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  SEMI_ANNUAL = 'semi_annual',
  ANNUAL = 'annual',
}

enum ContractStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled',
  RENEWED = 'renewed',
}

// API Client
class DataGenerator {
  private client: AxiosInstance;
  private generatedIds: {
    products: string[];
    accounts: string[];
    contracts: string[];
  };

  constructor(baseURL: string) {
    this.client = axios.create({
      baseURL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
    this.generatedIds = {
      products: [],
      accounts: [],
      contracts: [],
    };
  }

  private log(message: string, ...args: any[]) {
    console.log(`[${new Date().toISOString()}] ${message}`, ...args);
  }

  private error(message: string, error: any) {
    console.error(`[${new Date().toISOString()}] ❌ ${message}`, error.response?.data || error.message);
  }

  private success(message: string) {
    console.log(`[${new Date().toISOString()}] ✅ ${message}`);
  }

  // Product Catalog Generation
  async generateProducts() {
    this.log('📦 Generating product catalog...');

    const products = [
      // ── Core Plans (recurring · platform · seat_based) ─────────────────────
      {
        name: 'Starter Plan',
        description: 'Ideal for small teams getting started with the platform.',
        sku: 'PLAN-STARTER',
        pricingModel: PricingModel.SEAT_BASED,
        chargeType: ChargeType.RECURRING,
        category: ProductCategory.PLATFORM,
        basePrice: 29.99,
        currency: 'EUR',
        billingInterval: BillingInterval.MONTHLY,
        trialPeriodDays: 14,
        minSeats: 1,
        active: true,
        isAddon: false,
      },
      {
        name: 'Professional Plan',
        description: 'Advanced features for growing teams.',
        sku: 'PLAN-PRO',
        pricingModel: PricingModel.SEAT_BASED,
        chargeType: ChargeType.RECURRING,
        category: ProductCategory.PLATFORM,
        basePrice: 79.99,
        currency: 'EUR',
        billingInterval: BillingInterval.MONTHLY,
        setupFee: 500.0,
        minSeats: 5,
        active: true,
        isAddon: false,
      },
      {
        name: 'Enterprise Plan',
        description: 'Full-featured enterprise plan with dedicated support and SLA.',
        sku: 'PLAN-ENT',
        pricingModel: PricingModel.VOLUME_TIERED,
        chargeType: ChargeType.RECURRING,
        category: ProductCategory.PLATFORM,
        basePrice: 149.99,
        currency: 'EUR',
        billingInterval: BillingInterval.ANNUAL,
        setupFee: 2000.0,
        minCommitmentMonths: 12,
        minSeats: 10,
        volumeTiers: [
          { minQuantity: 10, maxQuantity: 50, pricePerUnit: 149.99 },
          { minQuantity: 51, maxQuantity: 100, pricePerUnit: 129.99 },
          { minQuantity: 101, maxQuantity: 500, pricePerUnit: 109.99 },
          { minQuantity: 501, maxQuantity: null, pricePerUnit: 89.99 },
        ],
        active: true,
        isAddon: false,
      },
      // ── Platform Add-ons (recurring · addon · flat_fee) ─────────────────────
      {
        name: 'Advanced Analytics Module',
        description: 'In-depth analytics dashboards, custom reports, and data exports.',
        sku: 'ADDON-ANALYTICS',
        pricingModel: PricingModel.FLAT_FEE,
        chargeType: ChargeType.RECURRING,
        category: ProductCategory.ADDON,
        basePrice: 499.0,
        currency: 'EUR',
        billingInterval: BillingInterval.MONTHLY,
        active: true,
        isAddon: true,
      },
      {
        name: 'AI Assistant Module',
        description: 'AI-powered automation, recommendations, and workflow assistance.',
        sku: 'ADDON-AI',
        pricingModel: PricingModel.FLAT_FEE,
        chargeType: ChargeType.RECURRING,
        category: ProductCategory.ADDON,
        basePrice: 999.0,
        currency: 'EUR',
        billingInterval: BillingInterval.MONTHLY,
        active: true,
        isAddon: true,
      },
      {
        name: 'Premium API Access',
        description: 'Higher rate limits, dedicated API keys, and webhook support.',
        sku: 'ADDON-API',
        pricingModel: PricingModel.FLAT_FEE,
        chargeType: ChargeType.RECURRING,
        category: ProductCategory.ADDON,
        basePrice: 299.0,
        currency: 'EUR',
        billingInterval: BillingInterval.MONTHLY,
        active: true,
        isAddon: true,
      },
      {
        name: 'Custom SSO / SAML',
        description: 'Enterprise single sign-on with SAML 2.0 and SCIM provisioning.',
        sku: 'ADDON-SSO',
        pricingModel: PricingModel.FLAT_FEE,
        chargeType: ChargeType.RECURRING,
        category: ProductCategory.ADDON,
        basePrice: 199.0,
        currency: 'EUR',
        billingInterval: BillingInterval.MONTHLY,
        active: true,
        isAddon: true,
      },
      // ── Support Tiers (recurring · support · flat_fee) ──────────────────────
      {
        name: 'Premium Support',
        description: '24/7 priority support with 4-hour SLA response time.',
        sku: 'SUPPORT-PREMIUM',
        pricingModel: PricingModel.FLAT_FEE,
        chargeType: ChargeType.RECURRING,
        category: ProductCategory.SUPPORT,
        basePrice: 999.0,
        currency: 'EUR',
        billingInterval: BillingInterval.MONTHLY,
        active: true,
        isAddon: false,
      },
      {
        name: 'Dedicated Customer Success Manager',
        description: 'Dedicated CSM for onboarding, QBRs, and strategic guidance.',
        sku: 'SUPPORT-CSM',
        pricingModel: PricingModel.FLAT_FEE,
        chargeType: ChargeType.RECURRING,
        category: ProductCategory.SUPPORT,
        basePrice: 2500.0,
        currency: 'EUR',
        billingInterval: BillingInterval.MONTHLY,
        active: true,
        isAddon: false,
      },
      // ── One-Time Services (one_time · professional_services · flat_fee) ──────
      {
        name: 'Onboarding Package',
        description: 'Guided setup, configuration, and team training (up to 3 sessions).',
        sku: 'SVC-ONBOARDING',
        pricingModel: PricingModel.FLAT_FEE,
        chargeType: ChargeType.ONE_TIME,
        category: ProductCategory.PROFESSIONAL_SERVICES,
        basePrice: 5000.0,
        currency: 'EUR',
        active: true,
        isAddon: false,
      },
      {
        name: 'Data Migration',
        description: 'Full historical data migration from legacy systems.',
        sku: 'SVC-MIGRATION',
        pricingModel: PricingModel.FLAT_FEE,
        chargeType: ChargeType.ONE_TIME,
        category: ProductCategory.PROFESSIONAL_SERVICES,
        basePrice: 3000.0,
        currency: 'EUR',
        active: true,
        isAddon: false,
      },
      {
        name: 'Custom Integration',
        description: 'Bespoke integration with your existing ERP, CRM, or data warehouse.',
        sku: 'SVC-INTEGRATION',
        pricingModel: PricingModel.FLAT_FEE,
        chargeType: ChargeType.ONE_TIME,
        category: ProductCategory.PROFESSIONAL_SERVICES,
        basePrice: 15000.0,
        currency: 'EUR',
        active: true,
        isAddon: false,
      },
      {
        name: 'Training Workshop',
        description: 'Full-day on-site or virtual training workshop for your team.',
        sku: 'SVC-TRAINING',
        pricingModel: PricingModel.FLAT_FEE,
        chargeType: ChargeType.ONE_TIME,
        category: ProductCategory.PROFESSIONAL_SERVICES,
        basePrice: 2500.0,
        currency: 'EUR',
        active: true,
        isAddon: false,
      },
    ];

    for (const product of products) {
      try {
        const response = await this.client.post('/api/products', product);
        const productId = response.data.data.id;
        this.generatedIds.products.push(productId);
        this.success(`Created product: ${product.name} (ID: ${productId})`);
      } catch (error) {
        this.error(`Failed to create product: ${product.name}`, error);
      }
    }

    this.log(`✅ Created ${this.generatedIds.products.length} products`);
  }

  // Account Generation with Hierarchies
  async generateAccounts() {
    this.log('🏢 Generating hierarchical accounts...');

    // Parent Companies (Level 1)
    const parentCompanies = [
      {
        accountName: 'Acme Corporation',
        accountType: AccountType.ENTERPRISE,
        primaryContactEmail: 'contact@acme.corp',
        billingContactName: 'Jane Smith',
        billingContactEmail: 'billing@acme.corp',
        billingContactPhone: '+1-555-100-0001',
        billingAddressLine1: '123 Enterprise Blvd',
        billingAddressLine2: 'Suite 1000',
        billingCity: 'San Francisco',
        billingState: 'CA',
        billingPostalCode: '94105',
        billingCountry: 'USA',
        paymentTerms: PaymentTerms.NET_30,
        paymentTermsDays: 30,
        currency: 'EUR',
        taxId: 'US-TAX-ACME-001',
        creditLimit: 500000,
        creditHold: false,
        metadata: {
          industry: 'Technology',
          employeeCount: 5000,
          salesRep: 'John Doe',
          region: 'West',
        },
      },
      {
        accountName: 'GlobalTech Industries',
        accountType: AccountType.ENTERPRISE,
        primaryContactEmail: 'contact@globaltech.com',
        billingContactName: 'Robert Johnson',
        billingContactEmail: 'billing@globaltech.com',
        billingContactPhone: '+1-555-200-0001',
        billingAddressLine1: '456 Tech Park Drive',
        billingCity: 'Austin',
        billingState: 'TX',
        billingPostalCode: '78701',
        billingCountry: 'USA',
        paymentTerms: PaymentTerms.NET_60,
        paymentTermsDays: 60,
        currency: 'EUR',
        taxId: 'US-TAX-GLOBAL-001',
        creditLimit: 750000,
        creditHold: false,
        metadata: {
          industry: 'Manufacturing',
          employeeCount: 10000,
          salesRep: 'Sarah Williams',
          region: 'Central',
        },
      },
      {
        accountName: 'CloudScale Solutions',
        accountType: AccountType.ENTERPRISE,
        primaryContactEmail: 'contact@cloudscale.io',
        billingContactName: 'Emily Chen',
        billingContactEmail: 'billing@cloudscale.io',
        billingContactPhone: '+1-555-300-0001',
        billingAddressLine1: '789 Cloud Avenue',
        billingCity: 'Seattle',
        billingState: 'WA',
        billingPostalCode: '98101',
        billingCountry: 'USA',
        paymentTerms: PaymentTerms.NET_30,
        paymentTermsDays: 30,
        currency: 'EUR',
        taxId: 'US-TAX-CLOUD-001',
        creditLimit: 1000000,
        creditHold: false,
        metadata: {
          industry: 'Software',
          employeeCount: 2500,
          salesRep: 'Michael Brown',
          region: 'West',
        },
      },
    ];

    const parentIds: string[] = [];

    // Create parent accounts
    for (const parent of parentCompanies) {
      try {
        const response = await this.client.post('/api/accounts', parent);
        const accountId = response.data.data.id;
        this.generatedIds.accounts.push(accountId);
        parentIds.push(accountId);
        this.success(`Created parent account: ${parent.accountName} (ID: ${accountId})`);
      } catch (error) {
        this.error(`Failed to create parent account: ${parent.accountName}`, error);
      }
    }

    // Level 2: Subsidiaries
    const subsidiaries = [
      // Acme subsidiaries
      {
        parentAccountId: parentIds[0],
        accountName: 'Acme North America',
        accountType: AccountType.ENTERPRISE,
        primaryContactEmail: 'contact@acme-na.corp',
        billingContactEmail: 'billing@acme-na.corp',
        billingAddressLine1: '100 North Street',
        billingCity: 'New York',
        billingState: 'NY',
        billingPostalCode: '10001',
        billingCountry: 'USA',
        paymentTerms: PaymentTerms.NET_30,
        currency: 'EUR',
        creditLimit: 200000,
        metadata: { division: 'North America', parentCompany: 'Acme Corporation' },
      },
      {
        parentAccountId: parentIds[0],
        accountName: 'Acme Europe',
        accountType: AccountType.ENTERPRISE,
        primaryContactEmail: 'contact@acme-eu.corp',
        billingContactEmail: 'billing@acme-eu.corp',
        billingAddressLine1: '50 Europa Plaza',
        billingCity: 'London',
        billingCountry: 'UK',
        paymentTerms: PaymentTerms.NET_30,
        currency: 'GBP',
        creditLimit: 150000,
        metadata: { division: 'Europe', parentCompany: 'Acme Corporation' },
      },
      // GlobalTech subsidiaries
      {
        parentAccountId: parentIds[1],
        accountName: 'GlobalTech Manufacturing',
        accountType: AccountType.ENTERPRISE,
        primaryContactEmail: 'contact@globaltech-mfg.com',
        billingContactEmail: 'billing@globaltech-mfg.com',
        billingAddressLine1: '200 Factory Road',
        billingCity: 'Detroit',
        billingState: 'MI',
        billingPostalCode: '48201',
        billingCountry: 'USA',
        paymentTerms: PaymentTerms.NET_60,
        currency: 'EUR',
        creditLimit: 300000,
        metadata: { division: 'Manufacturing', parentCompany: 'GlobalTech Industries' },
      },
      {
        parentAccountId: parentIds[1],
        accountName: 'GlobalTech R&D',
        accountType: AccountType.ENTERPRISE,
        primaryContactEmail: 'contact@globaltech-rd.com',
        billingContactEmail: 'billing@globaltech-rd.com',
        billingAddressLine1: '300 Innovation Drive',
        billingCity: 'Boston',
        billingState: 'MA',
        billingPostalCode: '02101',
        billingCountry: 'USA',
        paymentTerms: PaymentTerms.NET_60,
        currency: 'EUR',
        creditLimit: 250000,
        metadata: { division: 'R&D', parentCompany: 'GlobalTech Industries' },
      },
      // CloudScale subsidiaries
      {
        parentAccountId: parentIds[2],
        accountName: 'CloudScale Enterprise',
        accountType: AccountType.ENTERPRISE,
        primaryContactEmail: 'contact@cloudscale-ent.io',
        billingContactEmail: 'billing@cloudscale-ent.io',
        billingAddressLine1: '400 Enterprise Way',
        billingCity: 'Portland',
        billingState: 'OR',
        billingPostalCode: '97201',
        billingCountry: 'USA',
        paymentTerms: PaymentTerms.NET_30,
        currency: 'EUR',
        creditLimit: 400000,
        metadata: { division: 'Enterprise', parentCompany: 'CloudScale Solutions' },
      },
    ];

    const level2Ids: string[] = [];

    for (const subsidiary of subsidiaries) {
      try {
        const response = await this.client.post('/api/accounts', subsidiary);
        const accountId = response.data.data.id;
        this.generatedIds.accounts.push(accountId);
        level2Ids.push(accountId);
        this.success(`Created subsidiary: ${subsidiary.accountName} (ID: ${accountId})`);
      } catch (error) {
        this.error(`Failed to create subsidiary: ${subsidiary.accountName}`, error);
      }
    }

    // Level 3: Regional offices / departments
    const departments = [
      // Acme North America departments
      {
        parentAccountId: level2Ids[0],
        accountName: 'Acme NA - West Coast',
        accountType: AccountType.SMB,
        primaryContactEmail: 'contact@acme-na-west.corp',
        billingAddressLine1: '500 West Office',
        billingCity: 'Los Angeles',
        billingState: 'CA',
        billingPostalCode: '90001',
        billingCountry: 'USA',
        currency: 'EUR',
        creditLimit: 50000,
        metadata: { region: 'West Coast', level: 3 },
      },
      {
        parentAccountId: level2Ids[0],
        accountName: 'Acme NA - East Coast',
        accountType: AccountType.SMB,
        primaryContactEmail: 'contact@acme-na-east.corp',
        billingAddressLine1: '600 East Office',
        billingCity: 'Miami',
        billingState: 'FL',
        billingPostalCode: '33101',
        billingCountry: 'USA',
        currency: 'EUR',
        creditLimit: 50000,
        metadata: { region: 'East Coast', level: 3 },
      },
      // GlobalTech Manufacturing departments
      {
        parentAccountId: level2Ids[2],
        accountName: 'GlobalTech MFG - Plant 1',
        accountType: AccountType.SMB,
        primaryContactEmail: 'contact@globaltech-plant1.com',
        billingAddressLine1: '700 Plant Road',
        billingCity: 'Detroit',
        billingState: 'MI',
        billingPostalCode: '48202',
        billingCountry: 'USA',
        currency: 'EUR',
        creditLimit: 75000,
        metadata: { facility: 'Plant 1', level: 3 },
      },
      // CloudScale Enterprise departments
      {
        parentAccountId: level2Ids[4],
        accountName: 'CloudScale Ent - Sales',
        accountType: AccountType.SMB,
        primaryContactEmail: 'contact@cloudscale-sales.io',
        billingAddressLine1: '800 Sales Tower',
        billingCity: 'Portland',
        billingState: 'OR',
        billingPostalCode: '97202',
        billingCountry: 'USA',
        currency: 'EUR',
        creditLimit: 100000,
        metadata: { department: 'Sales', level: 3 },
      },
    ];

    for (const dept of departments) {
      try {
        const response = await this.client.post('/api/accounts', dept);
        const accountId = response.data.data.id;
        this.generatedIds.accounts.push(accountId);
        this.success(`Created department: ${dept.accountName} (ID: ${accountId})`);
      } catch (error) {
        this.error(`Failed to create department: ${dept.accountName}`, error);
      }
    }

    // Create some standalone SMB and Startup accounts
    const standaloneAccounts = [
      {
        accountName: 'TechStart Inc',
        accountType: AccountType.STARTUP,
        primaryContactEmail: 'founder@techstart.io',
        billingContactEmail: 'billing@techstart.io',
        billingAddressLine1: '900 Startup Lane',
        billingCity: 'Palo Alto',
        billingState: 'CA',
        billingPostalCode: '94301',
        billingCountry: 'USA',
        paymentTerms: PaymentTerms.NET_30,
        currency: 'EUR',
        creditLimit: 25000,
        metadata: { stage: 'Series A', employees: 15 },
      },
      {
        accountName: 'MidMarket Solutions',
        accountType: AccountType.SMB,
        primaryContactEmail: 'contact@midmarket.com',
        billingContactEmail: 'billing@midmarket.com',
        billingAddressLine1: '1000 Business Park',
        billingCity: 'Chicago',
        billingState: 'IL',
        billingPostalCode: '60601',
        billingCountry: 'USA',
        paymentTerms: PaymentTerms.NET_30,
        currency: 'EUR',
        creditLimit: 75000,
        metadata: { employees: 150, industry: 'Consulting' },
      },
    ];

    for (const account of standaloneAccounts) {
      try {
        const response = await this.client.post('/api/accounts', account);
        const accountId = response.data.data.id;
        this.generatedIds.accounts.push(accountId);
        this.success(`Created standalone account: ${account.accountName} (ID: ${accountId})`);
      } catch (error) {
        this.error(`Failed to create standalone account: ${account.accountName}`, error);
      }
    }

    this.log(`✅ Created ${this.generatedIds.accounts.length} accounts`);
  }

  // Contract Generation
  async generateContracts() {
    this.log('📝 Generating contracts...');

    if (this.generatedIds.accounts.length === 0 || this.generatedIds.products.length === 0) {
      this.error('Cannot generate contracts: no accounts or products available', new Error());
      return;
    }

    const contractTemplates = [
      {
        billingFrequency: BillingFrequency.ANNUAL,
        contractValue: 120000,
        seatCount: 100,
        committedSeats: 100,
        seatPrice: 100,
        billingInAdvance: true,
        autoRenew: true,
        renewalNoticeDays: 90,
        notes: 'Enterprise annual contract with volume discount',
      },
      {
        billingFrequency: BillingFrequency.QUARTERLY,
        contractValue: 30000,
        seatCount: 50,
        committedSeats: 50,
        seatPrice: 150,
        billingInAdvance: true,
        autoRenew: true,
        renewalNoticeDays: 60,
        notes: 'Quarterly billing with standard terms',
      },
      {
        billingFrequency: BillingFrequency.MONTHLY,
        contractValue: 12000,
        seatCount: 20,
        committedSeats: 20,
        seatPrice: 50,
        billingInAdvance: false,
        autoRenew: false,
        renewalNoticeDays: 30,
        notes: 'Monthly billing in arrears',
      },
    ];

    let contractCounter = 1;

    // Create 1-2 contracts per account
    for (const accountId of this.generatedIds.accounts.slice(0, 10)) {
      const numContracts = Math.random() > 0.5 ? 2 : 1;

      for (let i = 0; i < numContracts; i++) {
        const template = contractTemplates[i % contractTemplates.length];
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - Math.floor(Math.random() * 90)); // Random start in last 90 days

        const endDate = new Date(startDate);
        endDate.setFullYear(endDate.getFullYear() + 1); // 1 year contract

        const contract = {
          contractNumber: `CNT-2024-${String(contractCounter).padStart(4, '0')}`,
          accountId,
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0],
          ...template,
          paymentTerms: PaymentTerms.NET_30,
          metadata: {
            generatedBy: 'data-generator',
            version: '1.0',
          },
        };

        try {
          const response = await this.client.post('/api/contracts', contract);
          const contractId = response.data.data.id;
          this.generatedIds.contracts.push(contractId);
          this.success(`Created contract: ${contract.contractNumber} for account ${accountId}`);
          contractCounter++;
        } catch (error) {
          this.error(`Failed to create contract: ${contract.contractNumber}`, error);
        }
      }
    }

    this.log(`✅ Created ${this.generatedIds.contracts.length} contracts`);
  }

  // Clean existing data
  async clean() {
    this.log('🧹 Cleaning existing data...');

    const endpoints = [
      { url: '/api/contracts', name: 'contracts' },
      { url: '/api/accounts', name: 'accounts' },
      { url: '/api/products', name: 'products' },
    ];

    for (const endpoint of endpoints) {
      try {
        this.log(`Fetching all ${endpoint.name}...`);
        const response = await this.client.get(endpoint.url);
        const items = response.data.data || [];

        if (!Array.isArray(items)) {
          this.log(`No ${endpoint.name} found to delete`);
          continue;
        }

        for (const item of items) {
          try {
            await this.client.delete(`${endpoint.url}/${item.id}`);
            this.success(`Deleted ${endpoint.name} with ID: ${item.id}`);
          } catch (error) {
            this.error(`Failed to delete ${endpoint.name} ${item.id}`, error);
          }
        }

        this.success(`Cleaned all ${endpoint.name}`);
      } catch (error) {
        this.error(`Failed to fetch ${endpoint.name}`, error);
      }
    }

    this.success('Data cleanup completed');
  }

  // Summary Report
  printSummary() {
    console.log('\n' + '='.repeat(60));
    console.log('📊 DATA GENERATION SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Products created:  ${this.generatedIds.products.length}`);
    console.log(`✅ Accounts created:  ${this.generatedIds.accounts.length}`);
    console.log(`✅ Contracts created: ${this.generatedIds.contracts.length}`);
    console.log('='.repeat(60));
    console.log('\n💡 You can now view the data at:');
    console.log(`   - Swagger UI: ${API_BASE_URL}/api/docs`);
    console.log(`   - Frontend:   http://localhost:3000`);
    console.log('\n');
  }

  // Main execution
  async run() {
    console.log('🚀 Starting data generation...\n');
    console.log(`API Base URL: ${API_BASE_URL}`);
    console.log(`Clean first:  ${CLEAN_FIRST ? 'Yes' : 'No'}\n`);

    try {
      // Health check
      this.log('🏥 Checking API health...');
      await this.client.get('/health/liveness');
      this.success('API is healthy');

      // Clean existing data if requested
      if (CLEAN_FIRST) {
        await this.clean();
      }

      // Generate data
      await this.generateProducts();
      await this.generateAccounts();
      await this.generateContracts();

      // Summary
      this.printSummary();
    } catch (error: any) {
      this.error('Data generation failed', error);
      process.exit(1);
    }
  }
}

// Execute
const generator = new DataGenerator(API_BASE_URL);
generator.run().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
