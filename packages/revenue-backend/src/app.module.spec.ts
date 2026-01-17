import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from './app.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaService } from './common/prisma/prisma.service';
import { AccountsService } from './modules/accounts/accounts.service';
import { ContractsService } from './modules/contracts/contracts.service';
import { ProductsService } from './modules/products/products.service';
import { InvoicesService } from './modules/invoices/invoices.service';
import { HealthController } from './health/health.controller';
import { getQueueToken } from '@nestjs/bullmq';
import { QUEUE_NAMES } from './common/queues';
import { Queue } from 'bullmq';

describe('AppModule', () => {
  let module: TestingModule;
  let contractBillingQueue: Queue;
  let consoleLogSpy: jest.SpyInstance;

  beforeAll(async () => {
    // Suppress Prisma connection logs during tests
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();

    module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    // Get BullMQ queue for cleanup
    contractBillingQueue = module.get<Queue>(
      getQueueToken(QUEUE_NAMES.CONTRACT_BILLING),
    );
  });

  afterAll(async () => {
    // Close connections once after all tests complete
    try {
      if (contractBillingQueue) {
        await contractBillingQueue.close();
      }
      if (module) {
        await module.close();
      }
    } catch (error) {
      console.error('Error during cleanup:', error);
    } finally {
      // Restore console.log
      if (consoleLogSpy) {
        consoleLogSpy.mockRestore();
      }
    }
  });

  it('should be defined', () => {
    expect(module).toBeDefined();
  });

  it('should provide AppController', () => {
    const appController = module.get<AppController>(AppController);
    expect(appController).toBeDefined();
  });

  it('should provide AppService', () => {
    const appService = module.get<AppService>(AppService);
    expect(appService).toBeDefined();
  });

  it('should provide PrismaService', () => {
    const prismaService = module.get<PrismaService>(PrismaService);
    expect(prismaService).toBeDefined();
  });

  it('should provide AccountsService', () => {
    const accountsService = module.get<AccountsService>(AccountsService);
    expect(accountsService).toBeDefined();
  });

  it('should provide ContractsService', () => {
    const contractsService = module.get<ContractsService>(ContractsService);
    expect(contractsService).toBeDefined();
  });

  it('should provide ProductsService', () => {
    const productsService = module.get<ProductsService>(ProductsService);
    expect(productsService).toBeDefined();
  });

  it('should provide InvoicesService', () => {
    const invoicesService = module.get<InvoicesService>(InvoicesService);
    expect(invoicesService).toBeDefined();
  });

  it('should provide HealthController', () => {
    const healthController = module.get<HealthController>(HealthController);
    expect(healthController).toBeDefined();
  });
});
