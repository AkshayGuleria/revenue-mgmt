import { Controller, Get } from '@nestjs/common';
import { AppConfigService } from './app-config.service';
import { buildSingleResponse } from '../../common/utils/response-builder';
import { ApiResponse } from '../../common/interfaces';
import { AppConfigDto } from './app-config.service';

@Controller('api/config')
export class AppConfigController {
  constructor(private readonly appConfigService: AppConfigService) {}

  @Get()
  getConfig(): ApiResponse<AppConfigDto> {
    const config = this.appConfigService.getConfig();
    return buildSingleResponse(config);
  }
}
