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
import { Body, Controller, Get, Injectable, Module, Patch, UseGuards, } from '@nestjs/common';
import { InjectModel, MongooseModule } from '@nestjs/mongoose';
import { ApiBearerAuth, ApiPropertyOptional, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { IsInt, IsObject, IsOptional, IsString, Matches, Max, MaxLength, Min, } from 'class-validator';
import { IANAZone } from 'luxon';
import { Model } from 'mongoose';
import { CurrentUser } from '../common/api.js';
import { User, UserSchema } from '../database/schemas.js';
export class UpdateProfileDto {
    displayName;
    birthDate;
    expectedLifespanYears;
    timeZone;
    locale;
    notificationPreferences;
}
__decorate([
    ApiPropertyOptional({ maxLength: 80 }),
    IsOptional(),
    IsString(),
    MaxLength(80),
    __metadata("design:type", String)
], UpdateProfileDto.prototype, "displayName", void 0);
__decorate([
    ApiPropertyOptional({ example: '1994-06-21' }),
    IsOptional(),
    Matches(/^\d{4}-\d{2}-\d{2}$/),
    __metadata("design:type", String)
], UpdateProfileDto.prototype, "birthDate", void 0);
__decorate([
    ApiPropertyOptional({ minimum: 1, maximum: 150, nullable: true }),
    IsOptional(),
    IsInt(),
    Min(1),
    Max(150),
    __metadata("design:type", Object)
], UpdateProfileDto.prototype, "expectedLifespanYears", void 0);
__decorate([
    ApiPropertyOptional({ example: 'Asia/Dhaka' }),
    IsOptional(),
    IsString(),
    MaxLength(100),
    __metadata("design:type", String)
], UpdateProfileDto.prototype, "timeZone", void 0);
__decorate([
    ApiPropertyOptional(),
    IsOptional(),
    IsString(),
    MaxLength(20),
    __metadata("design:type", String)
], UpdateProfileDto.prototype, "locale", void 0);
__decorate([
    ApiPropertyOptional({ type: Object }),
    IsOptional(),
    IsObject(),
    __metadata("design:type", Object)
], UpdateProfileDto.prototype, "notificationPreferences", void 0);
let UsersService = class UsersService {
    users;
    constructor(users) {
        this.users = users;
    }
    async get(ownerId) {
        const user = await this.users.findOne({ _id: ownerId, accountState: 'active' }).lean();
        if (!user)
            return null;
        const { googleSubject: _subject, ...safe } = user;
        return safe;
    }
    async update(ownerId, dto) {
        if (dto.timeZone && !IANAZone.isValidZone(dto.timeZone)) {
            throw Object.assign(new Error('Invalid timezone'), {
                status: 422,
            });
        }
        const update = { ...dto };
        if (dto.expectedLifespanYears === null) {
            delete update.expectedLifespanYears;
            return this.users
                .findOneAndUpdate({ _id: ownerId, accountState: 'active' }, { $set: update, $unset: { expectedLifespanYears: 1 } }, { new: true })
                .lean();
        }
        return this.users
            .findOneAndUpdate({ _id: ownerId, accountState: 'active' }, { $set: update }, { new: true })
            .select('-googleSubject')
            .lean();
    }
};
UsersService = __decorate([
    Injectable(),
    __param(0, InjectModel(User.name)),
    __metadata("design:paramtypes", [Model])
], UsersService);
export { UsersService };
let UsersController = class UsersController {
    users;
    constructor(users) {
        this.users = users;
    }
    me(user) {
        return this.users.get(user.id);
    }
    update(user, dto) {
        return this.users.update(user.id, dto);
    }
};
__decorate([
    Get(),
    __param(0, CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "me", null);
__decorate([
    Patch(),
    __param(0, CurrentUser()),
    __param(1, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, UpdateProfileDto]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "update", null);
UsersController = __decorate([
    ApiTags('profile'),
    ApiBearerAuth(),
    UseGuards(AuthGuard('jwt')),
    Controller('profile'),
    __metadata("design:paramtypes", [UsersService])
], UsersController);
export { UsersController };
let UsersModule = class UsersModule {
};
UsersModule = __decorate([
    Module({
        imports: [MongooseModule.forFeature([{ name: User.name, schema: UserSchema }])],
        controllers: [UsersController],
        providers: [UsersService],
        exports: [UsersService],
    })
], UsersModule);
export { UsersModule };
//# sourceMappingURL=users.module.js.map