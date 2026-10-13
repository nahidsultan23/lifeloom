var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
import { Controller, Get } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { ApiExcludeEndpoint, ApiTags } from '@nestjs/swagger';
import { Connection } from 'mongoose';
let AppController = class AppController {
    connection;
    constructor(connection) {
        this.connection = connection;
    }
    live() {
        return { status: 'ok' };
    }
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
};
__decorate([
    Get('health/live'),
    ApiExcludeEndpoint(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AppController.prototype, "live", null);
__decorate([
    Get('health/ready'),
    ApiExcludeEndpoint(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AppController.prototype, "ready", null);
AppController = __decorate([
    ApiTags('health'),
    Controller(),
    __param(0, InjectConnection()),
    __metadata("design:paramtypes", [Connection])
], AppController);
export { AppController };
//# sourceMappingURL=app.controller.js.map