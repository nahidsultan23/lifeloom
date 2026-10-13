import { Controller, Get } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { ApiExcludeEndpoint, ApiTags } from '@nestjs/swagger';
import { Connection } from 'mongoose';

@ApiTags('health')
@Controller()
export class AppController {
  constructor(@InjectConnection() private readonly connection: Connection) {}

  @Get('health/live')
  @ApiExcludeEndpoint()
  live() {
    return { status: 'ok' };
  }

  @Get('health/ready')
  @ApiExcludeEndpoint()
  ready() {
    if (this.connection.readyState !== 1) {
      return {
        __raw: {
          success: false,
          error: {
            code: 'DEPENDENCY_UNAVAILABLE',
            message: 'Service is not ready',
            fieldErrors: {},
          },
        },
      };
    }
    return { status: 'ready', database: 'available' };
  }
}
