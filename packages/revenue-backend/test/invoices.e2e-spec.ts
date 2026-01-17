import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus, ValidationPipe } from '@nestjs/common';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/common/prisma/prisma.service';

describe('InvoicesController (e2e)', () => {
  let app: NestFastifyApplication;
  let prisma: PrismaService;
  let createdAccountId: string;
  let createdContractId: string;
  let createdInvoiceId: string;

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
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await app.init();
    await app.getHttpAdapter().getInstance().ready();

    prisma = app.get<PrismaService>(PrismaService);

    // Clean up any existing test data
    await prisma.invoiceItem.deleteMany({});
    await prisma.invoice.deleteMany({});
    await prisma.contract.deleteMany({});
    await prisma.account.deleteMany({
      where: { primaryContactEmail: { contains: 'invoice-test' } },
    });
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.invoiceItem.deleteMany({});
    await prisma.invoice.deleteMany({});
    await prisma.contract.deleteMany({});
    await prisma.account.deleteMany({
      where: { primaryContactEmail: { contains: 'invoice-test' } },
    });

    await app.close();
  });

  describe('POST /api/invoices', () => {
    it('should create a new invoice', async () => {
      // First create an account
      const accountResponse = await request(app.getHttpServer())
        .post('/api/accounts')
        .send({
          accountName: 'Acme Corporation Invoice Test',
          primaryContactEmail: 'invoice-test@acme.com',
          accountType: 'enterprise',
        });

      createdAccountId = accountResponse.body.data.id;

      // Create invoice
      const response = await request(app.getHttpServer())
        .post('/api/invoices')
        .send({
          invoiceNumber: 'INV-E2E-0001',
          accountId: createdAccountId,
          issueDate: '2024-01-01',
          dueDate: '2024-01-31',
          subtotal: 10000,
          tax: 800,
          discount: 500,
          total: 10300,
          currency: 'USD',
          status: 'draft',
        })
        .expect(HttpStatus.CREATED);

      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toMatchObject({
        invoiceNumber: 'INV-E2E-0001',
        accountId: createdAccountId,
        subtotal: '10000.00',
        tax: '800.00',
        discount: '500.00',
        total: '10300.00',
        status: 'draft',
      });

      // Check paging object structure
      expect(response.body.paging).toEqual({
        offset: null,
        limit: null,
        total: null,
        totalPages: null,
        hasNext: null,
        hasPrev: null,
      });

      createdInvoiceId = response.body.data.id;
    });

    it('should create invoice with line items', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/invoices')
        .send({
          invoiceNumber: 'INV-E2E-0002',
          accountId: createdAccountId,
          issueDate: '2024-02-01',
          dueDate: '2024-02-28',
          subtotal: 9999,
          tax: 0,
          discount: 0,
          total: 9999,
          items: [
            {
              description: 'Enterprise Plan - 100 seats',
              quantity: 100,
              unitPrice: 99.99,
              amount: 9999,
            },
          ],
        })
        .expect(HttpStatus.CREATED);

      expect(response.body.data.items).toHaveLength(1);
      expect(response.body.data.items[0]).toMatchObject({
        description: 'Enterprise Plan - 100 seats',
        quantity: '100.00',
        unitPrice: '99.99',
        amount: '9999.00',
      });
    });

    it('should create invoice with contract reference', async () => {
      // First create a contract
      const contractResponse = await request(app.getHttpServer())
        .post('/api/contracts')
        .send({
          contractNumber: 'CNT-E2E-INV-001',
          accountId: createdAccountId,
          startDate: '2024-01-01',
          endDate: '2024-12-31',
          contractValue: 120000,
        });

      createdContractId = contractResponse.body.data.id;

      const response = await request(app.getHttpServer())
        .post('/api/invoices')
        .send({
          invoiceNumber: 'INV-E2E-0003',
          accountId: createdAccountId,
          contractId: createdContractId,
          issueDate: '2024-03-01',
          dueDate: '2024-03-31',
          subtotal: 10000,
          total: 10000,
        })
        .expect(HttpStatus.CREATED);

      expect(response.body.data.contractId).toBe(createdContractId);
    });

    it('should fail if account does not exist', async () => {
      await request(app.getHttpServer())
        .post('/api/invoices')
        .send({
          invoiceNumber: 'INV-E2E-FAIL-001',
          accountId: 'non-existent-account-id',
          issueDate: '2024-01-01',
          dueDate: '2024-01-31',
          subtotal: 10000,
          total: 10000,
        })
        .expect(HttpStatus.NOT_FOUND);
    });

    it('should fail if due date is before issue date', async () => {
      await request(app.getHttpServer())
        .post('/api/invoices')
        .send({
          invoiceNumber: 'INV-E2E-FAIL-002',
          accountId: createdAccountId,
          issueDate: '2024-01-31',
          dueDate: '2024-01-01', // Before issue date
          subtotal: 10000,
          total: 10000,
        })
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('should fail if total does not match calculation', async () => {
      await request(app.getHttpServer())
        .post('/api/invoices')
        .send({
          invoiceNumber: 'INV-E2E-FAIL-003',
          accountId: createdAccountId,
          issueDate: '2024-01-01',
          dueDate: '2024-01-31',
          subtotal: 10000,
          tax: 800,
          discount: 500,
          total: 99999, // Wrong total
        })
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('should fail if invoice number already exists', async () => {
      await request(app.getHttpServer())
        .post('/api/invoices')
        .send({
          invoiceNumber: 'INV-E2E-0001', // Duplicate
          accountId: createdAccountId,
          issueDate: '2024-01-01',
          dueDate: '2024-01-31',
          subtotal: 10000,
          total: 10000,
        })
        .expect(HttpStatus.CONFLICT);
    });
  });

  describe('GET /api/invoices', () => {
    it('should return paginated list of invoices', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/invoices')
        .query({ 'offset[eq]': 0, 'limit[eq]': 20 })
        .expect(HttpStatus.OK);

      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('paging');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.paging).toMatchObject({
        offset: 0,
        limit: 20,
        hasNext: expect.any(Boolean),
        hasPrev: expect.any(Boolean),
      });

      // Check includes
      if (response.body.data.length > 0) {
        expect(response.body.data[0]).toHaveProperty('account');
        expect(response.body.data[0]).toHaveProperty('_count');
      }
    });

    it('should filter by status', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/invoices')
        .query({ 'status[eq]': 'draft' })
        .expect(HttpStatus.OK);

      expect(response.body.data.every((inv) => inv.status === 'draft')).toBe(
        true,
      );
    });

    it('should filter by account', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/invoices')
        .query({ 'accountId[eq]': createdAccountId })
        .expect(HttpStatus.OK);

      expect(
        response.body.data.every((inv) => inv.accountId === createdAccountId),
      ).toBe(true);
    });

    it('should filter by total amount range', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/invoices')
        .query({ 'total[gte]': 5000, 'total[lte]': 15000 })
        .expect(HttpStatus.OK);

      expect(
        response.body.data.every(
          (inv) =>
            parseFloat(inv.total) >= 5000 && parseFloat(inv.total) <= 15000,
        ),
      ).toBe(true);
    });

    it('should search by invoice number', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/invoices')
        .query({ 'invoiceNumber[like]': 'INV-E2E' })
        .expect(HttpStatus.OK);

      expect(
        response.body.data.every((inv) =>
          inv.invoiceNumber.includes('INV-E2E'),
        ),
      ).toBe(true);
    });
  });

  describe('GET /api/invoices/:id', () => {
    it('should return invoice details with relations', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/invoices/${createdInvoiceId}`)
        .expect(HttpStatus.OK);

      expect(response.body.data).toMatchObject({
        id: createdInvoiceId,
        invoiceNumber: 'INV-E2E-0001',
      });

      // Check relations
      expect(response.body.data).toHaveProperty('account');
      expect(response.body.data.account).toHaveProperty('accountName');
      expect(response.body.data).toHaveProperty('items');
      expect(response.body.data).toHaveProperty('_count');

      // Check paging object
      expect(response.body.paging).toEqual({
        offset: null,
        limit: null,
        total: null,
        totalPages: null,
        hasNext: null,
        hasPrev: null,
      });
    });

    it('should return 404 for non-existent invoice', async () => {
      await request(app.getHttpServer())
        .get('/api/invoices/non-existent-id')
        .expect(HttpStatus.NOT_FOUND);
    });
  });

  describe('PATCH /api/invoices/:id', () => {
    it('should update invoice status', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/api/invoices/${createdInvoiceId}`)
        .send({
          status: 'sent',
        })
        .expect(HttpStatus.OK);

      expect(response.body.data.status).toBe('sent');
    });

    it('should update invoice amounts', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/api/invoices/${createdInvoiceId}`)
        .send({
          paidAmount: 10300,
          paidDate: '2024-01-15',
          status: 'paid',
        })
        .expect(HttpStatus.OK);

      expect(response.body.data.paidAmount).toBe('10300.00');
      expect(response.body.data.status).toBe('paid');
    });

    it('should return 404 for non-existent invoice', async () => {
      await request(app.getHttpServer())
        .patch('/api/invoices/non-existent-id')
        .send({ status: 'paid' })
        .expect(HttpStatus.NOT_FOUND);
    });

    it('should fail if invoice number already exists', async () => {
      // Create second invoice
      const secondInvoice = await request(app.getHttpServer())
        .post('/api/invoices')
        .send({
          invoiceNumber: 'INV-E2E-UNIQUE',
          accountId: createdAccountId,
          issueDate: '2024-04-01',
          dueDate: '2024-04-30',
          subtotal: 5000,
          total: 5000,
        });

      // Try to update first invoice with second invoice's number
      await request(app.getHttpServer())
        .patch(`/api/invoices/${createdInvoiceId}`)
        .send({
          invoiceNumber: 'INV-E2E-UNIQUE',
        })
        .expect(HttpStatus.CONFLICT);
    });
  });

  describe('POST /api/invoices/:id/items', () => {
    it('should add line item to invoice', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/invoices/${createdInvoiceId}/items`)
        .send({
          description: 'Additional Service',
          quantity: 10,
          unitPrice: 50,
          amount: 500,
        })
        .expect(HttpStatus.CREATED);

      expect(response.body.data).toMatchObject({
        description: 'Additional Service',
        quantity: '10.00',
        unitPrice: '50.00',
        amount: '500.00',
      });
      expect(response.body.data.invoiceId).toBe(createdInvoiceId);
    });

    it('should return 404 for non-existent invoice', async () => {
      await request(app.getHttpServer())
        .post('/api/invoices/non-existent-id/items')
        .send({
          description: 'Test Item',
          quantity: 1,
          unitPrice: 100,
          amount: 100,
        })
        .expect(HttpStatus.NOT_FOUND);
    });
  });

  describe('DELETE /api/invoices/:id/items/:itemId', () => {
    let itemIdToDelete: string;

    beforeAll(async () => {
      // Add an item to delete
      const response = await request(app.getHttpServer())
        .post(`/api/invoices/${createdInvoiceId}/items`)
        .send({
          description: 'Item to Delete',
          quantity: 1,
          unitPrice: 100,
          amount: 100,
        });

      itemIdToDelete = response.body.data.id;
    });

    it('should remove line item from invoice', async () => {
      await request(app.getHttpServer())
        .delete(`/api/invoices/${createdInvoiceId}/items/${itemIdToDelete}`)
        .expect(HttpStatus.NO_CONTENT);

      // Verify item is deleted
      const invoice = await request(app.getHttpServer()).get(
        `/api/invoices/${createdInvoiceId}`,
      );

      expect(
        invoice.body.data.items.find((item) => item.id === itemIdToDelete),
      ).toBeUndefined();
    });

    it('should return 404 for non-existent item', async () => {
      await request(app.getHttpServer())
        .delete(
          `/api/invoices/${createdInvoiceId}/items/non-existent-item-id`,
        )
        .expect(HttpStatus.NOT_FOUND);
    });

    it('should return 404 for non-existent invoice', async () => {
      await request(app.getHttpServer())
        .delete('/api/invoices/non-existent-id/items/some-item-id')
        .expect(HttpStatus.NOT_FOUND);
    });
  });

  describe('DELETE /api/invoices/:id', () => {
    it('should delete invoice', async () => {
      // Create a new invoice to delete
      const invoiceToDelete = await request(app.getHttpServer())
        .post('/api/invoices')
        .send({
          invoiceNumber: 'INV-E2E-TO-DELETE',
          accountId: createdAccountId,
          issueDate: '2024-05-01',
          dueDate: '2024-05-31',
          subtotal: 1000,
          total: 1000,
        });

      const invoiceId = invoiceToDelete.body.data.id;

      await request(app.getHttpServer())
        .delete(`/api/invoices/${invoiceId}`)
        .expect(HttpStatus.NO_CONTENT);

      // Verify invoice is deleted
      await request(app.getHttpServer())
        .get(`/api/invoices/${invoiceId}`)
        .expect(HttpStatus.NOT_FOUND);
    });

    it('should return 404 for non-existent invoice', async () => {
      await request(app.getHttpServer())
        .delete('/api/invoices/non-existent-id')
        .expect(HttpStatus.NOT_FOUND);
    });
  });

  describe('ADR-003 Compliance', () => {
    it('should follow ADR-003 response structure for single resource', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/invoices/${createdInvoiceId}`)
        .expect(HttpStatus.OK);

      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('paging');
      expect(typeof response.body.data).toBe('object');
      expect(Array.isArray(response.body.data)).toBe(false);
      expect(response.body.paging).toEqual({
        offset: null,
        limit: null,
        total: null,
        totalPages: null,
        hasNext: null,
        hasPrev: null,
      });
    });

    it('should follow ADR-003 response structure for paginated list', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/invoices')
        .query({ 'offset[eq]': 0, 'limit[eq]': 20 })
        .expect(HttpStatus.OK);

      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('paging');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.paging).toMatchObject({
        offset: 0,
        limit: 20,
        total: expect.any(Number),
        totalPages: expect.any(Number),
        hasNext: expect.any(Boolean),
        hasPrev: expect.any(Boolean),
      });
    });

    it('should support operator-based query parameters', async () => {
      // Test [eq] operator
      const eqResponse = await request(app.getHttpServer())
        .get('/api/invoices')
        .query({ 'status[eq]': 'paid' })
        .expect(HttpStatus.OK);

      expect(eqResponse.body.data.every((inv) => inv.status === 'paid')).toBe(
        true,
      );

      // Test [gte] operator
      const gteResponse = await request(app.getHttpServer())
        .get('/api/invoices')
        .query({ 'total[gte]': 5000 })
        .expect(HttpStatus.OK);

      expect(
        gteResponse.body.data.every((inv) => parseFloat(inv.total) >= 5000),
      ).toBe(true);

      // Test [like] operator
      const likeResponse = await request(app.getHttpServer())
        .get('/api/invoices')
        .query({ 'invoiceNumber[like]': 'E2E' })
        .expect(HttpStatus.OK);

      expect(
        likeResponse.body.data.every((inv) =>
          inv.invoiceNumber.includes('E2E'),
        ),
      ).toBe(true);
    });
  });
});
