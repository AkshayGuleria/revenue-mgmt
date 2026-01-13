import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHealth(): object {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'revenue-backend',
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
    };
  }
}
