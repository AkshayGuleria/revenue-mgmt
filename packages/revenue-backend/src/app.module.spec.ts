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

describe('AppModule', () => {
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
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
