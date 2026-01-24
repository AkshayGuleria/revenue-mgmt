import { Test, TestingModule } from '@nestjs/testing';
import { ValidationPipe } from '@nestjs/common';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/common/prisma/prisma.service';

describe('Hierarchical Accounts (E2E)', () => {
  let app: NestFastifyApplication;
  let prisma: PrismaService;

  let parentAccount: any;
  let child1Account: any;
  let child2Account: any;
  let grandchildAccount: any;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication<NestFastifyApplication>(
      new FastifyAdapter(),
    );
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    await app.init();
    await app.getHttpAdapter().getInstance().ready();

    prisma = moduleFixture.get<PrismaService>(PrismaService);
  });

  afterAll(async () => {
    await app.close();
    await new Promise((resolve) => setTimeout(resolve, 500));
  });

  beforeEach(async () => {
    // Clean up database
    await prisma.contractShare.deleteMany();
    await prisma.invoiceItem.deleteMany();
    await prisma.invoice.deleteMany();
    await prisma.contract.deleteMany();
    await prisma.account.deleteMany();
  });

  describe('Account Hierarchy Creation', () => {
    it('should create a parent account', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/accounts')
        .send({
          accountName: 'Parent Corporation',
          accountType: 'enterprise',
          primaryContactEmail: 'contact@parent.com',
          paymentTerms: 'net_30',
        })
        .expect(201);

      parentAccount = response.body.data;
      expect(parentAccount).toBeDefined();
      expect(parentAccount.accountName).toBe('Parent Corporation');
      expect(parentAccount.parentAccountId).toBeNull();
    });

    it('should create child accounts under parent', async () => {
      // Create parent first
      const parentResponse = await request(app.getHttpServer())
        .post('/api/accounts')
        .send({
          accountName: 'Parent Corporation',
          accountType: 'enterprise',
          primaryContactEmail: 'contact@parent.com',
        })
        .expect(201);

      parentAccount = parentResponse.body.data;

      // Create child 1
      const child1Response = await request(app.getHttpServer())
        .post('/api/accounts')
        .send({
          accountName: 'Subsidiary USA',
          accountType: 'enterprise',
          primaryContactEmail: 'contact@usa.com',
          parentAccountId: parentAccount.id,
        })
        .expect(201);

      child1Account = child1Response.body.data;
      expect(child1Account.parentAccountId).toBe(parentAccount.id);

      // Create child 2
      const child2Response = await request(app.getHttpServer())
        .post('/api/accounts')
        .send({
          accountName: 'Subsidiary Europe',
          accountType: 'enterprise',
          primaryContactEmail: 'contact@europe.com',
          parentAccountId: parentAccount.id,
        })
        .expect(201);

      child2Account = child2Response.body.data;
      expect(child2Account.parentAccountId).toBe(parentAccount.id);
    });

    it('should create grandchild accounts (3-level hierarchy)', async () => {
      // Create parent
      const parentResponse = await request(app.getHttpServer())
        .post('/api/accounts')
        .send({
          accountName: 'Parent Corporation',
          accountType: 'enterprise',
          primaryContactEmail: 'contact@parent.com',
        })
        .expect(201);

      parentAccount = parentResponse.body.data;

      // Create child
      const childResponse = await request(app.getHttpServer())
        .post('/api/accounts')
        .send({
          accountName: 'Subsidiary USA',
          accountType: 'enterprise',
          primaryContactEmail: 'contact@usa.com',
          parentAccountId: parentAccount.id,
        })
        .expect(201);

      child1Account = childResponse.body.data;

      // Create grandchild
      const grandchildResponse = await request(app.getHttpServer())
        .post('/api/accounts')
        .send({
          accountName: 'Branch California',
          accountType: 'enterprise',
          primaryContactEmail: 'contact@california.com',
          parentAccountId: child1Account.id,
        })
        .expect(201);

      grandchildAccount = grandchildResponse.body.data;
      expect(grandchildAccount.parentAccountId).toBe(child1Account.id);
    });

    it('should prevent circular hierarchy', async () => {
      // Create two accounts
      const account1Response = await request(app.getHttpServer())
        .post('/api/accounts')
        .send({
          accountName: 'Account A',
          accountType: 'enterprise',
          primaryContactEmail: 'contact@a.com',
        })
        .expect(201);

      const account1 = account1Response.body.data;

      const account2Response = await request(app.getHttpServer())
        .post('/api/accounts')
        .send({
          accountName: 'Account B',
          accountType: 'enterprise',
          primaryContactEmail: 'contact@b.com',
          parentAccountId: account1.id,
        })
        .expect(201);

      const account2 = account2Response.body.data;

      // Try to set account1's parent to account2 (would create A -> B -> A cycle)
      await request(app.getHttpServer())
        .patch(`/api/accounts/${account1.id}`)
        .send({
          parentAccountId: account2.id,
        })
        .expect(400);
    });
  });

  describe('GET /api/accounts/:id/hierarchy', () => {
    beforeEach(async () => {
      // Create 3-level hierarchy
      const parentResponse = await request(app.getHttpServer())
        .post('/api/accounts')
        .send({
          accountName: 'Parent Corporation',
          accountType: 'enterprise',
          primaryContactEmail: 'contact@parent.com',
        });
      parentAccount = parentResponse.body.data;

      const child1Response = await request(app.getHttpServer())
        .post('/api/accounts')
        .send({
          accountName: 'Subsidiary USA',
          accountType: 'enterprise',
          primaryContactEmail: 'contact@usa.com',
          parentAccountId: parentAccount.id,
        });
      child1Account = child1Response.body.data;

      const child2Response = await request(app.getHttpServer())
        .post('/api/accounts')
        .send({
          accountName: 'Subsidiary Europe',
          accountType: 'enterprise',
          primaryContactEmail: 'contact@europe.com',
          parentAccountId: parentAccount.id,
        });
      child2Account = child2Response.body.data;

      const grandchildResponse = await request(app.getHttpServer())
        .post('/api/accounts')
        .send({
          accountName: 'Branch California',
          accountType: 'enterprise',
          primaryContactEmail: 'contact@california.com',
          parentAccountId: child1Account.id,
        });
      grandchildAccount = grandchildResponse.body.data;
    });

    it('should return full hierarchy tree', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/accounts/${parentAccount.id}/hierarchy`)
        .expect(200);

      const tree = response.body.data;
      expect(tree.id).toBe(parentAccount.id);
      expect(tree.children).toHaveLength(2);
      expect(tree.depth).toBe(0);

      // Find USA subsidiary
      const usaSubsidiary = tree.children.find(
        (c: any) => c.id === child1Account.id,
      );
      expect(usaSubsidiary).toBeDefined();
      expect(usaSubsidiary.children).toHaveLength(1);
      expect(usaSubsidiary.children[0].id).toBe(grandchildAccount.id);
    });

    it('should return empty children array for leaf node', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/accounts/${grandchildAccount.id}/hierarchy`)
        .expect(200);

      const tree = response.body.data;
      expect(tree.id).toBe(grandchildAccount.id);
      expect(tree.children).toEqual([]);
    });
  });

  describe('GET /api/accounts/:id/children', () => {
    beforeEach(async () => {
      const parentResponse = await request(app.getHttpServer())
        .post('/api/accounts')
        .send({
          accountName: 'Parent Corporation',
          accountType: 'enterprise',
          primaryContactEmail: 'contact@parent.com',
        });
      parentAccount = parentResponse.body.data;

      const child1Response = await request(app.getHttpServer())
        .post('/api/accounts')
        .send({
          accountName: 'Subsidiary USA',
          accountType: 'enterprise',
          primaryContactEmail: 'contact@usa.com',
          parentAccountId: parentAccount.id,
        });
      child1Account = child1Response.body.data;

      const child2Response = await request(app.getHttpServer())
        .post('/api/accounts')
        .send({
          accountName: 'Subsidiary Europe',
          accountType: 'enterprise',
          primaryContactEmail: 'contact@europe.com',
          parentAccountId: parentAccount.id,
        });
      child2Account = child2Response.body.data;
    });

    it('should return direct children only', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/accounts/${parentAccount.id}/children`)
        .expect(200);

      expect(response.body.data).toHaveLength(2);
      expect(response.body.paging.total).toBe(2);

      const childIds = response.body.data.map((c: any) => c.id);
      expect(childIds).toContain(child1Account.id);
      expect(childIds).toContain(child2Account.id);
    });

    it('should return empty array if no children', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/accounts/${child1Account.id}/children`)
        .expect(200);

      expect(response.body.data).toEqual([]);
      expect(response.body.paging.total).toBe(0);
    });
  });

  describe('GET /api/accounts/:id/ancestors', () => {
    beforeEach(async () => {
      const parentResponse = await request(app.getHttpServer())
        .post('/api/accounts')
        .send({
          accountName: 'Parent Corporation',
          accountType: 'enterprise',
          primaryContactEmail: 'contact@parent.com',
        });
      parentAccount = parentResponse.body.data;

      const child1Response = await request(app.getHttpServer())
        .post('/api/accounts')
        .send({
          accountName: 'Subsidiary USA',
          accountType: 'enterprise',
          primaryContactEmail: 'contact@usa.com',
          parentAccountId: parentAccount.id,
        });
      child1Account = child1Response.body.data;

      const grandchildResponse = await request(app.getHttpServer())
        .post('/api/accounts')
        .send({
          accountName: 'Branch California',
          accountType: 'enterprise',
          primaryContactEmail: 'contact@california.com',
          parentAccountId: child1Account.id,
        });
      grandchildAccount = grandchildResponse.body.data;
    });

    it('should return all ancestors from root to parent', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/accounts/${grandchildAccount.id}/ancestors`)
        .expect(200);

      expect(response.body.data).toHaveLength(2);
      expect(response.body.paging.total).toBe(2);

      // Should be ordered from root (top) to immediate parent (bottom)
      expect(response.body.data[0].id).toBe(parentAccount.id);
      expect(response.body.data[1].id).toBe(child1Account.id);
    });

    it('should return empty array for root account', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/accounts/${parentAccount.id}/ancestors`)
        .expect(200);

      expect(response.body.data).toEqual([]);
      expect(response.body.paging.total).toBe(0);
    });
  });

  describe('GET /api/accounts/:id/descendants', () => {
    beforeEach(async () => {
      const parentResponse = await request(app.getHttpServer())
        .post('/api/accounts')
        .send({
          accountName: 'Parent Corporation',
          accountType: 'enterprise',
          primaryContactEmail: 'contact@parent.com',
        });
      parentAccount = parentResponse.body.data;

      const child1Response = await request(app.getHttpServer())
        .post('/api/accounts')
        .send({
          accountName: 'Subsidiary USA',
          accountType: 'enterprise',
          primaryContactEmail: 'contact@usa.com',
          parentAccountId: parentAccount.id,
        });
      child1Account = child1Response.body.data;

      const child2Response = await request(app.getHttpServer())
        .post('/api/accounts')
        .send({
          accountName: 'Subsidiary Europe',
          accountType: 'enterprise',
          primaryContactEmail: 'contact@europe.com',
          parentAccountId: parentAccount.id,
        });
      child2Account = child2Response.body.data;

      const grandchildResponse = await request(app.getHttpServer())
        .post('/api/accounts')
        .send({
          accountName: 'Branch California',
          accountType: 'enterprise',
          primaryContactEmail: 'contact@california.com',
          parentAccountId: child1Account.id,
        });
      grandchildAccount = grandchildResponse.body.data;
    });

    it('should return all descendants as flat list', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/accounts/${parentAccount.id}/descendants`)
        .expect(200);

      expect(response.body.data).toHaveLength(3);
      expect(response.body.paging.total).toBe(3);

      const descendantIds = response.body.data.map((d: any) => d.id);
      expect(descendantIds).toContain(child1Account.id);
      expect(descendantIds).toContain(child2Account.id);
      expect(descendantIds).toContain(grandchildAccount.id);
    });

    it('should return empty array for leaf node', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/accounts/${grandchildAccount.id}/descendants`)
        .expect(200);

      expect(response.body.data).toEqual([]);
      expect(response.body.paging.total).toBe(0);
    });
  });
});
