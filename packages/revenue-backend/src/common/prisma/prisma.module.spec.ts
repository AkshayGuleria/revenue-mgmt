import { Test, TestingModule } from '@nestjs/testing';
import { PrismaModule } from './prisma.module';
import { PrismaService } from './prisma.service';

describe('PrismaModule', () => {
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [PrismaModule],
    }).compile();
  });

  it('should be defined', () => {
    expect(module).toBeDefined();
  });

  it('should provide PrismaService', () => {
    const prismaService = module.get<PrismaService>(PrismaService);
    expect(prismaService).toBeDefined();
  });

  it('should export PrismaService', async () => {
    const testModule = await Test.createTestingModule({
      imports: [PrismaModule],
    }).compile();

    const prismaService = testModule.get<PrismaService>(PrismaService);
    expect(prismaService).toBeInstanceOf(PrismaService);
  });
});
