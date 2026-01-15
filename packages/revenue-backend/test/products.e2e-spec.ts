import { Test, TestingModule } from '@nestjs/testing';
import { ValidationPipe } from '@nestjs/common';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/common/prisma/prisma.service';
import {
  PricingModel,
  BillingInterval,
} from '../src/modules/products/dto/create-product.dto';

describe('Products API (e2e)', () => {
  let app: NestFastifyApplication;
  let prisma: PrismaService;

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

    // Clean up existing test products
    await prisma.product.deleteMany({
      where: {
        name: { contains: 'Test Product' },
      },
    });
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.product.deleteMany({
      where: {
        name: { contains: 'Test Product' },
      },
    });

    await app.close();
  });

  describe('POST /api/products', () => {
    it('should create a new product successfully', () => {
      return request(app.getHttpServer())
        .post('/api/products')
        .send({
          name: 'Test Product Enterprise',
          pricingModel: PricingModel.SEAT_BASED,
          basePrice: 99.99,
          minSeats: 1,
          maxSeats: 1000,
          seatIncrement: 5,
          billingInterval: BillingInterval.MONTHLY,
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('data');
          expect(res.body.data).toMatchObject({
            name: 'Test Product Enterprise',
            pricingModel: 'seat_based',
            currency: 'USD',
            active: true,
            isAddon: false,
          });
          expect(res.body).toHaveProperty('paging');
          expect(res.body.paging).toEqual({
            offset: null,
            limit: null,
            total: null,
            totalPages: null,
            hasNext: null,
            hasPrev: null,
          });
        });
    });

    it('should create product with volume tiers', () => {
      return request(app.getHttpServer())
        .post('/api/products')
        .send({
          name: 'Test Product Volume Tiered',
          pricingModel: PricingModel.VOLUME_TIERED,
          volumeTiers: [
            { minQuantity: 1, maxQuantity: 10, pricePerUnit: 99.99 },
            { minQuantity: 11, maxQuantity: 50, pricePerUnit: 89.99 },
            { minQuantity: 51, maxQuantity: null, pricePerUnit: 79.99 },
          ],
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.data.volumeTiers).toBeDefined();
          expect(Array.isArray(res.body.data.volumeTiers)).toBe(true);
        });
    });

    it('should create product with minimal required fields', () => {
      return request(app.getHttpServer())
        .post('/api/products')
        .send({
          name: 'Test Product Minimal',
          pricingModel: PricingModel.FLAT_FEE,
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.data.name).toBe('Test Product Minimal');
          expect(res.body.data.pricingModel).toBe('flat_fee');
        });
    });

    it('should return 400 when required fields are missing', () => {
      return request(app.getHttpServer())
        .post('/api/products')
        .send({
          name: 'Test Product Invalid',
          // Missing pricingModel
        })
        .expect(400);
    });

    it('should return 409 when SKU already exists', async () => {
      const sku = `TEST-SKU-${Date.now()}`;

      // First request should succeed
      await request(app.getHttpServer())
        .post('/api/products')
        .send({
          name: 'Test Product With SKU 1',
          sku,
          pricingModel: PricingModel.FLAT_FEE,
        })
        .expect(201);

      // Second request with same SKU should fail
      return request(app.getHttpServer())
        .post('/api/products')
        .send({
          name: 'Test Product With SKU 2',
          sku,
          pricingModel: PricingModel.FLAT_FEE,
        })
        .expect(409)
        .expect((res) => {
          expect(res.body.message).toContain('already exists');
        });
    });

    it('should create addon product', () => {
      return request(app.getHttpServer())
        .post('/api/products')
        .send({
          name: 'Test Product Addon',
          pricingModel: PricingModel.FLAT_FEE,
          basePrice: 49.99,
          isAddon: true,
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.data.isAddon).toBe(true);
        });
    });
  });

  describe('GET /api/products', () => {
    beforeAll(async () => {
      // Create test products with different attributes
      await prisma.product.createMany({
        data: [
          {
            name: 'Test Product List Enterprise',
            pricingModel: 'seat_based',
            basePrice: 99.99,
            active: true,
            isAddon: false,
          },
          {
            name: 'Test Product List Pro',
            pricingModel: 'flat_fee',
            basePrice: 49.99,
            active: true,
            isAddon: false,
          },
          {
            name: 'Test Product List Inactive',
            pricingModel: 'seat_based',
            basePrice: 29.99,
            active: false,
            isAddon: false,
          },
        ],
      });
    });

    it('should return paginated list of products', () => {
      return request(app.getHttpServer())
        .get('/api/products')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('data');
          expect(Array.isArray(res.body.data)).toBe(true);
          expect(res.body).toHaveProperty('paging');
          expect(res.body.paging).toMatchObject({
            offset: 0,
            limit: 20,
            total: expect.any(Number),
            totalPages: expect.any(Number),
            hasNext: expect.any(Boolean),
            hasPrev: false,
          });
        });
    });

    it('should filter by pricing model using eq operator', () => {
      return request(app.getHttpServer())
        .get('/api/products?pricingModel[eq]=seat_based')
        .expect(200)
        .expect((res) => {
          expect(res.body.data.length).toBeGreaterThan(0);
          expect(
            res.body.data.every((p: any) => p.pricingModel === 'seat_based'),
          ).toBe(true);
        });
    });

    it('should filter by name using like operator', () => {
      return request(app.getHttpServer())
        .get('/api/products?name[like]=Enterprise')
        .expect(200)
        .expect((res) => {
          expect(res.body.data.length).toBeGreaterThan(0);
          expect(
            res.body.data.some((p: any) => p.name.includes('Enterprise')),
          ).toBe(true);
        });
    });

    it('should filter by active status', () => {
      return request(app.getHttpServer())
        .get('/api/products?active[eq]=true')
        .expect(200)
        .expect((res) => {
          expect(res.body.data.every((p: any) => p.active === true)).toBe(true);
        });
    });

    it('should filter by multiple pricing models using in operator', () => {
      return request(app.getHttpServer())
        .get('/api/products?pricingModel[in]=seat_based,flat_fee')
        .expect(200)
        .expect((res) => {
          expect(
            res.body.data.every(
              (p: any) =>
                p.pricingModel === 'seat_based' || p.pricingModel === 'flat_fee',
            ),
          ).toBe(true);
        });
    });
  });

  describe('GET /api/products/:id', () => {
    let testProductId: string;

    beforeAll(async () => {
      const product = await prisma.product.create({
        data: {
          name: 'Test Product Single',
          pricingModel: 'seat_based',
          basePrice: 79.99,
          active: true,
        },
      });
      testProductId = product.id;
    });

    it('should return product details by ID', () => {
      return request(app.getHttpServer())
        .get(`/api/products/${testProductId}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('data');
          expect(res.body.data.id).toBe(testProductId);
          expect(res.body.data.name).toBe('Test Product Single');
          expect(res.body).toHaveProperty('paging');
          expect(res.body.paging).toEqual({
            offset: null,
            limit: null,
            total: null,
            totalPages: null,
            hasNext: null,
            hasPrev: null,
          });
        });
    });

    it('should return 404 for non-existent product', () => {
      return request(app.getHttpServer())
        .get('/api/products/00000000-0000-0000-0000-000000000000')
        .expect(404);
    });
  });

  describe('PATCH /api/products/:id', () => {
    let testProductId: string;

    beforeEach(async () => {
      const product = await prisma.product.create({
        data: {
          name: `Test Product Update ${Date.now()}`,
          pricingModel: 'seat_based',
          basePrice: 69.99,
        },
      });
      testProductId = product.id;
    });

    it('should update product successfully', () => {
      return request(app.getHttpServer())
        .patch(`/api/products/${testProductId}`)
        .send({
          basePrice: 89.99,
          maxSeats: 500,
        })
        .expect(200)
        .expect((res) => {
          expect(parseFloat(res.body.data.basePrice)).toBe(89.99);
          expect(res.body.data.maxSeats).toBe(500);
        });
    });

    it('should update product to inactive', () => {
      return request(app.getHttpServer())
        .patch(`/api/products/${testProductId}`)
        .send({
          active: false,
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.data.active).toBe(false);
        });
    });

    it('should update volume tiers', () => {
      return request(app.getHttpServer())
        .patch(`/api/products/${testProductId}`)
        .send({
          pricingModel: PricingModel.VOLUME_TIERED,
          volumeTiers: [
            { minQuantity: 1, maxQuantity: 25, pricePerUnit: 99.99 },
            { minQuantity: 26, maxQuantity: null, pricePerUnit: 79.99 },
          ],
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.data.volumeTiers).toBeDefined();
          expect(res.body.data.pricingModel).toBe('volume_tiered');
        });
    });

    it('should return 404 when updating non-existent product', () => {
      return request(app.getHttpServer())
        .patch('/api/products/00000000-0000-0000-0000-000000000000')
        .send({
          basePrice: 100,
        })
        .expect(404);
    });
  });

  describe('DELETE /api/products/:id', () => {
    let testProductId: string;

    beforeEach(async () => {
      const product = await prisma.product.create({
        data: {
          name: `Test Product Delete ${Date.now()}`,
          pricingModel: 'flat_fee',
          basePrice: 39.99,
        },
      });
      testProductId = product.id;
    });

    it('should delete product successfully', async () => {
      await request(app.getHttpServer())
        .delete(`/api/products/${testProductId}`)
        .expect(204);

      // Verify product is deleted
      return request(app.getHttpServer())
        .get(`/api/products/${testProductId}`)
        .expect(404);
    });

    it('should return 404 when deleting non-existent product', () => {
      return request(app.getHttpServer())
        .delete('/api/products/00000000-0000-0000-0000-000000000000')
        .expect(404);
    });
  });
});
