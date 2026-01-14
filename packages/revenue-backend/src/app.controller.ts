import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AppService } from './app.service';

@ApiTags('General')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({
    summary: 'API root endpoint',
    description: 'Returns basic API information and status',
  })
  @ApiResponse({
    status: 200,
    description: 'API is responding',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'ok' },
        service: { type: 'string', example: 'revenue-backend' },
        version: { type: 'string', example: '1.0.0' },
        timestamp: { type: 'string', example: '2026-01-14T20:00:00.000Z' },
      },
    },
  })
  getStatus(): object {
    return this.appService.getHealth();
  }
}
