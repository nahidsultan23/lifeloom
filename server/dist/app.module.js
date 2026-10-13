var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
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
let AppModule = class AppModule {
};
AppModule = __decorate([
    Module({
        imports: [
            ConfigModule.forRoot({
                isGlobal: true,
                cache: true,
                validationSchema: envSchema,
            }),
            MongooseModule.forRootAsync({
                inject: [ConfigService],
                useFactory: (config) => ({
                    uri: config.getOrThrow('MONGODB_URI'),
                    dbName: config.get('MONGODB_DB_NAME', 'lifeloom'),
                    maxPoolSize: config.get('MONGODB_MAX_POOL_SIZE', 20),
                    serverSelectionTimeoutMS: config.get('MONGODB_SERVER_SELECTION_TIMEOUT_MS', 5000),
                }),
            }),
            ThrottlerModule.forRootAsync({
                inject: [ConfigService],
                useFactory: (config) => ({
                    throttlers: [
                        {
                            ttl: config.get('RATE_LIMIT_TTL_SECONDS', 60) * 1000,
                            limit: config.get('RATE_LIMIT_MAX_REQUESTS', 100),
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
], AppModule);
export { AppModule };
//# sourceMappingURL=app.module.js.map