import { Controller, Get } from '@nestjs/common';
import {
  HealthCheckService,
  HealthCheck,
  PrismaHealthIndicator,
  MemoryHealthIndicator,
  DiskHealthIndicator,
} from '@nestjs/terminus';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PrismaService } from '../common/prisma/prisma.service';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private prismaHealth: PrismaHealthIndicator,
    private memory: MemoryHealthIndicator,
    private disk: DiskHealthIndicator,
    private prisma: PrismaService,
  ) {}

  @Get('liveness')
  @ApiOperation({
    summary: 'Liveness probe',
    description:
      'Simple health check that returns 200 OK if the service is responding. ' +
      'Used by Kubernetes to determine if the pod should be restarted.',
  })
  @ApiResponse({
    status: 200,
    description: 'Service is alive',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'ok' },
        timestamp: { type: 'string', example: '2026-01-14T20:00:00.000Z' },
      },
    },
  })
  getLiveness() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('readiness')
  @HealthCheck()
  @ApiOperation({
    summary: 'Readiness probe',
    description:
      'Comprehensive health check including database connectivity, memory usage, ' +
      'and response time. Used by Kubernetes to determine if the pod can receive traffic.',
  })
  @ApiResponse({
    status: 200,
    description: 'Service is ready',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'ok' },
        info: {
          type: 'object',
          properties: {
            database: {
              type: 'object',
              properties: {
                status: { type: 'string', example: 'up' },
                responseTime: { type: 'number', example: 5 },
              },
            },
            memory_heap: {
              type: 'object',
              properties: {
                status: { type: 'string', example: 'up' },
              },
            },
            memory_rss: {
              type: 'object',
              properties: {
                status: { type: 'string', example: 'up' },
              },
            },
          },
        },
        error: { type: 'object' },
        details: {
          type: 'object',
          properties: {
            database: {
              type: 'object',
              properties: {
                status: { type: 'string', example: 'up' },
                responseTime: { type: 'number', example: 5 },
              },
            },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 503,
    description: 'Service is not ready (database unavailable or unhealthy)',
  })
  async getReadiness() {
    return this.health.check([
      // Database health check with response time
      async () => {
        const dbStartTime = Date.now();
        const result = await this.prismaHealth.pingCheck(
          'database',
          this.prisma,
        );
        const responseTime = Date.now() - dbStartTime;

        return {
          database: {
            status: result.database.status,
            responseTime,
          },
        };
      },
      // Memory heap check (should not exceed 300MB)
      () => this.memory.checkHeap('memory_heap', 300 * 1024 * 1024),
      // Memory RSS check (should not exceed 500MB)
      () => this.memory.checkRSS('memory_rss', 500 * 1024 * 1024),
      // Disk storage check (should have at least 10% free space)
      () =>
        this.disk.checkStorage('storage', {
          path: '/',
          thresholdPercent: 0.9, // Alert if > 90% used
        }),
    ]);
  }
}
