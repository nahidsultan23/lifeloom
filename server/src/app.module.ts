import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { MongooseModule } from '@nestjs/mongoose';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller.js';
import { AuthModule } from './auth/auth.module.js';
import { envSchema } from './config/env.js';
import { DeliveryModule } from './delivery/delivery.module.js';
import { PlanningModule } from './planning/planning.module.js';
import { PrivacyModule } from './privacy/privacy.module.js';
import { UploadsModule } from './uploads/uploads.module.js';
import { UsersModule } from './users/users.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      validationSchema: envSchema,
    }),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri: config.getOrThrow<string>('MONGODB_URI'),
        dbName: config.get<string>('MONGODB_DB_NAME', 'lifeloom'),
        maxPoolSize: config.get<number>('MONGODB_MAX_POOL_SIZE', 20),
        serverSelectionTimeoutMS: config.get<number>(
          'MONGODB_SERVER_SELECTION_TIMEOUT_MS',
          5000,
        ),
      }),
    }),
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        throttlers: [
          {
            ttl: config.get<number>('RATE_LIMIT_TTL_SECONDS', 60) * 1000,
            limit: config.get<number>('RATE_LIMIT_MAX_REQUESTS', 100),
          },
        ],
      }),
    }),
    AuthModule,
    UsersModule,
    PlanningModule,
    UploadsModule,
    DeliveryModule,
    PrivacyModule,
  ],
  controllers: [AppController],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
