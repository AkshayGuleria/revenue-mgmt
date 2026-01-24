import { Test, TestingModule } from '@nestjs/testing';
import { ValidationPipe, HttpStatus } from '@nestjs/common';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/common/prisma/prisma.service';
import { BillingFrequency } from '../src/modules/contracts/dto/create-contract.dto';

/**
 * Comprehensive E2E tests for query parameter filtering and path parameter validation
 * Tests all API endpoints: Accounts, Contracts, Products, Invoices
 */
describe('API Query Parameters & Path Validation (e2e)', () => {
  let app: NestFastifyApplication;
  let prisma: PrismaService;
  let testAccountId: string;
  let testContractId: string;
  let testProductId: string;
  let testInvoiceId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication<NestFastifyApplication>(
      new FastifyAdapter(),
    );
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );

    await app.init();
    await app.getHttpAdapter().getInstance().ready();

    prisma = moduleFixture.get<PrismaService>(PrismaService);

    // Create test data
    const testAccount = await prisma.account.create({
      data: {
        accountName: 'Query Test Account',
        primaryContactEmail: 'query-test@example.com',
        paymentTermsDays: 30,
        currency: 'USD',
        status: 'active',
        accountType: 'enterprise',
      },
    });
    testAccountId = testAccount.id;

    const testContract = await prisma.contract.create({
      data: {
        contractNumber: 'QRY-TST-001',
        accountId: testAccountId,
        startDate: new Date('2026-01-01'),
        endDate: new Date('2026-12-31'),
        contractValue: 120000,
        billingFrequency: BillingFrequency.QUARTERLY,
        seatCount: 100,
        committedSeats: 100,
        seatPrice: 300,
        status: 'active',
        autoRenew: true,
      },
    });
    testContractId = testContract.id;

    const testProduct = await prisma.product.create({
      data: {
        name: 'Query Test Product',
        sku: 'QRY-PROD-001',
        pricingModel: 'seat_based',
        basePrice: 100,
        billingInterval: 'monthly',
        active: true,
        isAddon: false,
      },
    });
    testProductId = testProduct.id;

    const testInvoice = await prisma.invoice.create({
      data: {
        invoiceNumber: 'QRY-INV-001',
        accountId: testAccountId,
        contractId: testContractId,
        issueDate: new Date('2026-01-01'),
        dueDate: new Date('2026-01-31'),
        subtotal: 10000,
        tax: 800,
        discount: 500,
        total: 10300,
        status: 'draft',
        billingType: 'recurring',
        currency: 'USD',
      },
    });
    testInvoiceId = testInvoice.id;
  });

  afterAll(async () => {
    // Clean up test data
    try {
      await prisma.invoice.deleteMany({
        where: { invoiceNumber: { contains: 'QRY-' } },
      });
      await prisma.product.deleteMany({
        where: { sku: { contains: 'QRY-' } },
      });
      await prisma.contract.deleteMany({
        where: { contractNumber: { contains: 'QRY-' } },
      });
      await prisma.account.deleteMany({
        where: { primaryContactEmail: { contains: 'query-test' } },
      });
    } finally {
      await prisma.$disconnect();
      await app.close();
    }
  }, 30000);

  describe('Accounts API - Query Parameters', () => {
    it('should filter by status[eq]', () => {
      return request(app.getHttpServer())
        .get('/api/accounts')
        .query({ 'status[eq]': 'active' })
        .expect(HttpStatus.OK)
        .expect((res) => {
          expect(res.body.data).toBeInstanceOf(Array);
          res.body.data.forEach((account) => {
            expect(account.status).toBe('active');
          });
        });
    });

    it('should filter by accountType[eq]', () => {
      return request(app.getHttpServer())
        .get('/api/accounts')
        .query({ 'accountType[eq]': 'enterprise' })
        .expect(HttpStatus.OK)
        .expect((res) => {
          res.body.data.forEach((account) => {
            expect(account.accountType).toBe('enterprise');
          });
        });
    });

    it('should search by accountName[like]', () => {
      return request(app.getHttpServer())
        .get('/api/accounts')
        .query({ 'accountName[like]': 'Query Test' })
        .expect(HttpStatus.OK)
        .expect((res) => {
          expect(res.body.data.length).toBeGreaterThan(0);
          expect(
            res.body.data.some((account) =>
              account.accountName.includes('Query Test'),
            ),
          ).toBe(true);
        });
    });

    it('should filter by status[in] multiple values', () => {
      return request(app.getHttpServer())
        .get('/api/accounts')
        .query({ 'status[in]': 'active,inactive' })
        .expect(HttpStatus.OK)
        .expect((res) => {
          res.body.data.forEach((account) => {
            expect(['active', 'inactive']).toContain(account.status);
          });
        });
    });

    it('should support pagination with offset[eq] and limit[eq]', () => {
      return request(app.getHttpServer())
        .get('/api/accounts')
        .query({ 'offset[eq]': 0, 'limit[eq]': 5 })
        .expect(HttpStatus.OK)
        .expect((res) => {
          expect(res.body.paging.offset).toBe(0);
          expect(res.body.paging.limit).toBe(5);
          expect(res.body.data.length).toBeLessThanOrEqual(5);
        });
    });

    it('should reject invalid query parameters', () => {
      return request(app.getHttpServer())
        .get('/api/accounts')
        .query({ invalidParam: 'test' })
        .expect(HttpStatus.BAD_REQUEST);
    });
  });

  describe('Contracts API - Query Parameters', () => {
    it('should filter by status[eq]', () => {
      return request(app.getHttpServer())
        .get('/api/contracts')
        .query({ 'status[eq]': 'active' })
        .expect(HttpStatus.OK)
        .expect((res) => {
          res.body.data.forEach((contract) => {
            expect(contract.status).toBe('active');
          });
        });
    });

    it('should filter by accountId[eq]', () => {
      return request(app.getHttpServer())
        .get('/api/contracts')
        .query({ 'accountId[eq]': testAccountId })
        .expect(HttpStatus.OK)
        .expect((res) => {
          expect(res.body.data.length).toBeGreaterThan(0);
          res.body.data.forEach((contract) => {
            expect(contract.accountId).toBe(testAccountId);
          });
        });
    });

    it('should search by contractNumber[like]', () => {
      return request(app.getHttpServer())
        .get('/api/contracts')
        .query({ 'contractNumber[like]': 'QRY-TST' })
        .expect(HttpStatus.OK)
        .expect((res) => {
          expect(res.body.data.length).toBeGreaterThan(0);
        });
    });

    it('should filter by contractValue[gte] and contractValue[lte]', () => {
      return request(app.getHttpServer())
        .get('/api/contracts')
        .query({ 'contractValue[gte]': 100000, 'contractValue[lte]': 150000 })
        .expect(HttpStatus.OK)
        .expect((res) => {
          res.body.data.forEach((contract) => {
            expect(parseFloat(contract.contractValue)).toBeGreaterThanOrEqual(
              100000,
            );
            expect(parseFloat(contract.contractValue)).toBeLessThanOrEqual(
              150000,
            );
          });
        });
    });

    it('should filter by autoRenew[eq] boolean', () => {
      return request(app.getHttpServer())
        .get('/api/contracts')
        .query({ 'autoRenew[eq]': 'true' })
        .expect(HttpStatus.OK)
        .expect((res) => {
          res.body.data.forEach((contract) => {
            expect(contract.autoRenew).toBe(true);
          });
        });
    });

    it('should filter by startDate[gte]', () => {
      return request(app.getHttpServer())
        .get('/api/contracts')
        .query({ 'startDate[gte]': '2026-01-01' })
        .expect(HttpStatus.OK)
        .expect((res) => {
          res.body.data.forEach((contract) => {
            expect(new Date(contract.startDate)).toBeInstanceOf(Date);
          });
        });
    });
  });

  describe('Products API - Query Parameters', () => {
    it('should filter by active[eq]', () => {
      return request(app.getHttpServer())
        .get('/api/products')
        .query({ 'active[eq]': 'true' })
        .expect(HttpStatus.OK)
        .expect((res) => {
          res.body.data.forEach((product) => {
            expect(product.active).toBe(true);
          });
        });
    });

    it('should search by name[like]', () => {
      return request(app.getHttpServer())
        .get('/api/products')
        .query({ 'name[like]': 'Query Test' })
        .expect(HttpStatus.OK)
        .expect((res) => {
          expect(res.body.data.length).toBeGreaterThan(0);
        });
    });

    it('should filter by pricingModel[eq]', () => {
      return request(app.getHttpServer())
        .get('/api/products')
        .query({ 'pricingModel[eq]': 'seat_based' })
        .expect(HttpStatus.OK)
        .expect((res) => {
          res.body.data.forEach((product) => {
            expect(product.pricingModel).toBe('seat_based');
          });
        });
    });

    it('should filter by basePrice[gt] and basePrice[lt]', () => {
      return request(app.getHttpServer())
        .get('/api/products')
        .query({ 'basePrice[gt]': 50, 'basePrice[lt]': 200 })
        .expect(HttpStatus.OK)
        .expect((res) => {
          res.body.data.forEach((product) => {
            if (product.basePrice) {
              expect(parseFloat(product.basePrice)).toBeGreaterThan(50);
              expect(parseFloat(product.basePrice)).toBeLessThan(200);
            }
          });
        });
    });

    it('should filter by isAddon[eq] boolean', () => {
      return request(app.getHttpServer())
        .get('/api/products')
        .query({ 'isAddon[eq]': 'false' })
        .expect(HttpStatus.OK)
        .expect((res) => {
          res.body.data.forEach((product) => {
            expect(product.isAddon).toBe(false);
          });
        });
    });
  });

  describe('Invoices API - Query Parameters', () => {
    it('should filter by status[eq]', () => {
      return request(app.getHttpServer())
        .get('/api/invoices')
        .query({ 'status[eq]': 'draft' })
        .expect(HttpStatus.OK)
        .expect((res) => {
          res.body.data.forEach((invoice) => {
            expect(invoice.status).toBe('draft');
          });
        });
    });

    it('should filter by accountId[eq]', () => {
      return request(app.getHttpServer())
        .get('/api/invoices')
        .query({ 'accountId[eq]': testAccountId })
        .expect(HttpStatus.OK)
        .expect((res) => {
          expect(res.body.data.length).toBeGreaterThan(0);
          res.body.data.forEach((invoice) => {
            expect(invoice.accountId).toBe(testAccountId);
          });
        });
    });

    it('should search by invoiceNumber[like]', () => {
      return request(app.getHttpServer())
        .get('/api/invoices')
        .query({ 'invoiceNumber[like]': 'QRY-INV' })
        .expect(HttpStatus.OK)
        .expect((res) => {
          expect(res.body.data.length).toBeGreaterThan(0);
        });
    });

    it('should filter by total[gte] and total[lte]', () => {
      return request(app.getHttpServer())
        .get('/api/invoices')
        .query({ 'total[gte]': 5000, 'total[lte]': 15000 })
        .expect(HttpStatus.OK)
        .expect((res) => {
          res.body.data.forEach((invoice) => {
            const total = parseFloat(invoice.total);
            expect(total).toBeGreaterThanOrEqual(5000);
            expect(total).toBeLessThanOrEqual(15000);
          });
        });
    });

    it('should filter by issueDate[gte] and issueDate[lte]', () => {
      return request(app.getHttpServer())
        .get('/api/invoices')
        .query({
          'issueDate[gte]': '2026-01-01',
          'issueDate[lte]': '2026-12-31',
        })
        .expect(HttpStatus.OK);
    });

    it('should filter by status[in] multiple values', () => {
      return request(app.getHttpServer())
        .get('/api/invoices')
        .query({ 'status[in]': 'draft,sent,paid' })
        .expect(HttpStatus.OK)
        .expect((res) => {
          res.body.data.forEach((invoice) => {
            expect(['draft', 'sent', 'paid']).toContain(invoice.status);
          });
        });
    });
  });

  describe('Path Parameter Validation', () => {
    it('should return 404 for invalid account UUID', () => {
      return request(app.getHttpServer())
        .get('/api/accounts/invalid-uuid')
        .expect(HttpStatus.NOT_FOUND);
    });

    it('should return 404 for non-existent account UUID', () => {
      return request(app.getHttpServer())
        .get('/api/accounts/00000000-0000-0000-0000-000000000000')
        .expect(HttpStatus.NOT_FOUND);
    });

    it('should return valid account for correct UUID', () => {
      return request(app.getHttpServer())
        .get(`/api/accounts/${testAccountId}`)
        .expect(HttpStatus.OK)
        .expect((res) => {
          expect(res.body.data.id).toBe(testAccountId);
        });
    });

    it('should return 404 for invalid contract UUID', () => {
      return request(app.getHttpServer())
        .get('/api/contracts/invalid-uuid')
        .expect(HttpStatus.NOT_FOUND);
    });

    it('should return valid contract for correct UUID', () => {
      return request(app.getHttpServer())
        .get(`/api/contracts/${testContractId}`)
        .expect(HttpStatus.OK)
        .expect((res) => {
          expect(res.body.data.id).toBe(testContractId);
        });
    });

    it('should return 404 for invalid product UUID', () => {
      return request(app.getHttpServer())
        .get('/api/products/invalid-uuid')
        .expect(HttpStatus.NOT_FOUND);
    });

    it('should return valid product for correct UUID', () => {
      return request(app.getHttpServer())
        .get(`/api/products/${testProductId}`)
        .expect(HttpStatus.OK)
        .expect((res) => {
          expect(res.body.data.id).toBe(testProductId);
        });
    });

    it('should return 404 for invalid invoice UUID', () => {
      return request(app.getHttpServer())
        .get('/api/invoices/invalid-uuid')
        .expect(HttpStatus.NOT_FOUND);
    });

    it('should return valid invoice for correct UUID', () => {
      return request(app.getHttpServer())
        .get(`/api/invoices/${testInvoiceId}`)
        .expect(HttpStatus.OK)
        .expect((res) => {
          expect(res.body.data.id).toBe(testInvoiceId);
        });
    });
  });

  describe('Combined Query Parameters', () => {
    it('should handle multiple filters with pagination', () => {
      return request(app.getHttpServer())
        .get('/api/invoices')
        .query({
          'status[eq]': 'draft',
          'total[gte]': 1000,
          'offset[eq]': 0,
          'limit[eq]': 10,
        })
        .expect(HttpStatus.OK)
        .expect((res) => {
          expect(res.body).toHaveProperty('data');
          expect(res.body).toHaveProperty('paging');
          expect(res.body.paging.offset).toBe(0);
          expect(res.body.paging.limit).toBe(10);
        });
    });

    it('should handle complex account query with multiple filters', () => {
      return request(app.getHttpServer())
        .get('/api/accounts')
        .query({
          'status[eq]': 'active',
          'accountType[eq]': 'enterprise',
          'offset[eq]': 0,
          'limit[eq]': 20,
        })
        .expect(HttpStatus.OK);
    });
  });
});
