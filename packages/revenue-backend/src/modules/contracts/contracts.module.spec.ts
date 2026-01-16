import { Test, TestingModule } from '@nestjs/testing';
import { ContractsModule } from './contracts.module';
import { ContractsService } from './contracts.service';
import { ContractsController } from './contracts.controller';
import { PrismaModule } from '../../common/prisma/prisma.module';

describe('ContractsModule', () => {
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [ContractsModule, PrismaModule],
    }).compile();
  });

  it('should be defined', () => {
    expect(module).toBeDefined();
  });

  it('should provide ContractsService', () => {
    const contractsService = module.get<ContractsService>(ContractsService);
    expect(contractsService).toBeDefined();
  });

  it('should provide ContractsController', () => {
    const contractsController =
      module.get<ContractsController>(ContractsController);
    expect(contractsController).toBeDefined();
  });

  it('should export ContractsService', async () => {
    const testModule = await Test.createTestingModule({
      imports: [ContractsModule, PrismaModule],
    }).compile();

    const contractsService = testModule.get<ContractsService>(ContractsService);
    expect(contractsService).toBeInstanceOf(ContractsService);
  });
});
