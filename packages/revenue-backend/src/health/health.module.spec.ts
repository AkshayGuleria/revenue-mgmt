import { Test, TestingModule } from '@nestjs/testing';
import { HealthModule } from './health.module';
import { HealthController } from './health.controller';
import { TerminusModule } from '@nestjs/terminus';
import { PrismaModule } from '../common/prisma/prisma.module';

describe('HealthModule', () => {
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [HealthModule],
    }).compile();
  });

  it('should be defined', () => {
    expect(module).toBeDefined();
  });

  it('should provide HealthController', () => {
    const healthController = module.get<HealthController>(HealthController);
    expect(healthController).toBeDefined();
  });

  it('should import TerminusModule', async () => {
    const testModule = await Test.createTestingModule({
      imports: [TerminusModule, PrismaModule],
      controllers: [HealthController],
    }).compile();

    expect(testModule).toBeDefined();
  });
});
