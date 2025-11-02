import { Controller, Get } from '@nestjs/common';
import { ApiResponse } from './common/dto/api-response.dto';

@Controller()
export class AppController {
  @Get('health')
  health() {
    return ApiResponse.success({ status: 'ok', timestamp: new Date().toISOString() });
  }
}

