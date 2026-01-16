import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from './health.controller';
import {
  HealthCheckService,
  PrismaHealthIndicator,
  MemoryHealthIndicator,
  DiskHealthIndicator,
} from '@nestjs/terminus';
import { PrismaService } from '../common/prisma/prisma.service';

describe('HealthController', () => {
  let controller: HealthController;
  let healthCheckService: HealthCheckService;
  let prismaHealthIndicator: PrismaHealthIndicator;
  let memoryHealthIndicator: MemoryHealthIndicator;
  let diskHealthIndicator: DiskHealthIndicator;
  let prismaService: PrismaService;

  const mockHealthCheckService = {
    check: jest.fn(),
  };

  const mockPrismaHealthIndicator = {
    pingCheck: jest.fn(),
  };

  const mockMemoryHealthIndicator = {
    checkHeap: jest.fn(),
    checkRSS: jest.fn(),
  };

  const mockDiskHealthIndicator = {
    checkStorage: jest.fn(),
  };

  const mockPrismaService = {
    $queryRaw: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        {
          provide: HealthCheckService,
          useValue: mockHealthCheckService,
        },
        {
          provide: PrismaHealthIndicator,
          useValue: mockPrismaHealthIndicator,
        },
        {
          provide: MemoryHealthIndicator,
          useValue: mockMemoryHealthIndicator,
        },
        {
          provide: DiskHealthIndicator,
          useValue: mockDiskHealthIndicator,
        },
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    controller = module.get<HealthController>(HealthController);
    healthCheckService = module.get<HealthCheckService>(HealthCheckService);
    prismaHealthIndicator = module.get<PrismaHealthIndicator>(
      PrismaHealthIndicator,
    );
    memoryHealthIndicator = module.get<MemoryHealthIndicator>(
      MemoryHealthIndicator,
    );
    diskHealthIndicator = module.get<DiskHealthIndicator>(DiskHealthIndicator);
    prismaService = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getLiveness', () => {
    it('should return ok status', () => {
      const result = controller.getLiveness();

      expect(result).toHaveProperty('status', 'ok');
      expect(result).toHaveProperty('timestamp');
    });

    it('should return valid ISO timestamp', () => {
      const result = controller.getLiveness();
      const timestamp = new Date(result.timestamp);

      expect(timestamp).toBeInstanceOf(Date);
      expect(timestamp.toISOString()).toBe(result.timestamp);
    });
  });

  describe('getReadiness', () => {
    it('should return healthy status when all checks pass', async () => {
      const mockHealthResult = {
        status: 'ok',
        info: {
          database: { status: 'up', responseTime: 5 },
          memory_heap: { status: 'up' },
          memory_rss: { status: 'up' },
          storage: { status: 'up' },
        },
        error: {},
        details: {
          database: { status: 'up', responseTime: 5 },
          memory_heap: { status: 'up' },
          memory_rss: { status: 'up' },
          storage: { status: 'up' },
        },
      };

      mockHealthCheckService.check.mockResolvedValue(mockHealthResult);

      const result = await controller.getReadiness();

      expect(result.status).toBe('ok');
      expect(healthCheckService.check).toHaveBeenCalledTimes(1);
      expect(healthCheckService.check).toHaveBeenCalledWith(
        expect.arrayContaining([expect.any(Function)]),
      );
    });

    it('should call all health indicators', async () => {
      mockPrismaHealthIndicator.pingCheck.mockResolvedValue({
        database: { status: 'up' },
      });
      mockMemoryHealthIndicator.checkHeap.mockReturnValue({
        memory_heap: { status: 'up' },
      });
      mockMemoryHealthIndicator.checkRSS.mockReturnValue({
        memory_rss: { status: 'up' },
      });
      mockDiskHealthIndicator.checkStorage.mockReturnValue({
        storage: { status: 'up' },
      });

      // Mock the health check to actually execute the functions
      mockHealthCheckService.check.mockImplementation(async (checks) => {
        for (const check of checks) {
          await check();
        }
        return {
          status: 'ok',
          info: {},
          error: {},
          details: {},
        };
      });

      await controller.getReadiness();

      expect(prismaHealthIndicator.pingCheck).toHaveBeenCalledWith(
        'database',
        prismaService,
      );
      expect(memoryHealthIndicator.checkHeap).toHaveBeenCalledWith(
        'memory_heap',
        300 * 1024 * 1024,
      );
      expect(memoryHealthIndicator.checkRSS).toHaveBeenCalledWith(
        'memory_rss',
        500 * 1024 * 1024,
      );
      expect(diskHealthIndicator.checkStorage).toHaveBeenCalledWith('storage', {
        path: '/',
        thresholdPercent: 0.9,
      });
    });

    it('should include database response time in result', async () => {
      mockPrismaHealthIndicator.pingCheck.mockResolvedValue({
        database: { status: 'up' },
      });
      mockMemoryHealthIndicator.checkHeap.mockReturnValue({
        memory_heap: { status: 'up' },
      });
      mockMemoryHealthIndicator.checkRSS.mockReturnValue({
        memory_rss: { status: 'up' },
      });
      mockDiskHealthIndicator.checkStorage.mockReturnValue({
        storage: { status: 'up' },
      });

      let capturedResult: any;
      mockHealthCheckService.check.mockImplementation(async (checks) => {
        capturedResult = await checks[0]();
        return {
          status: 'ok',
          info: { database: capturedResult.database },
          error: {},
          details: { database: capturedResult.database },
        };
      });

      await controller.getReadiness();

      expect(capturedResult).toHaveProperty('database');
      expect(capturedResult.database).toHaveProperty('status', 'up');
      expect(capturedResult.database).toHaveProperty('responseTime');
      expect(typeof capturedResult.database.responseTime).toBe('number');
    });

    it('should handle health check failures', async () => {
      const mockErrorResult = {
        status: 'error',
        info: {},
        error: {
          database: { status: 'down', error: 'Connection refused' },
        },
        details: {
          database: { status: 'down', error: 'Connection refused' },
        },
      };

      mockHealthCheckService.check.mockResolvedValue(mockErrorResult);

      const result = await controller.getReadiness();

      expect(result.status).toBe('error');
      expect(result.error).toBeDefined();
    });
  });
});
