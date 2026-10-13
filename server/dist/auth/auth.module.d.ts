import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Model, Types } from 'mongoose';
import { Strategy } from 'passport-jwt';
import type { Request } from 'express';
import { type AuthUser } from '../common/api.js';
import { Session, User, type Doc } from '../database/schemas.js';
export declare class GoogleSignInDto {
    idToken: string;
}
export declare class RefreshDto {
    refreshToken: string;
}
declare const JwtStrategy_base: new (...args: [opt: import("passport-jwt").StrategyOptionsWithRequest] | [opt: import("passport-jwt").StrategyOptionsWithoutRequest]) => Strategy & {
    validate(...args: any[]): unknown;
};
export declare class JwtStrategy extends JwtStrategy_base {
    constructor(config: ConfigService);
    validate(payload: {
        sub: string;
        email: string;
        sid: string;
    }): AuthUser;
}
export declare class AuthService {
    private readonly users;
    private readonly sessions;
    private readonly jwt;
    private readonly config;
    private readonly google;
    constructor(users: Model<User>, sessions: Model<Session>, jwt: JwtService, config: ConfigService);
    private tokenHash;
    private issue;
    googleSignIn(dto: GoogleSignInDto, request: Request): Promise<{
        accessToken: string;
        refreshToken: string;
        accessTokenExpiresIn: string;
        user: {
            id: Types.ObjectId;
            email: string;
            displayName: string;
            birthDate: string | undefined;
            expectedLifespanYears: number | undefined;
            timeZone: string;
            locale: string;
        };
    }>;
    refresh(dto: RefreshDto, request: Request): Promise<{
        accessToken: string;
        refreshToken: string;
        accessTokenExpiresIn: string;
    }>;
    logout(user: AuthUser): Promise<{
        loggedOut: boolean;
    }>;
    publicUser(user: Doc<User>): {
        id: Types.ObjectId;
        email: string;
        displayName: string;
        birthDate: string | undefined;
        expectedLifespanYears: number | undefined;
        timeZone: string;
        locale: string;
    };
}
export declare class AuthController {
    private readonly auth;
    constructor(auth: AuthService);
    signIn(dto: GoogleSignInDto, req: Request): Promise<{
        accessToken: string;
        refreshToken: string;
        accessTokenExpiresIn: string;
        user: {
            id: Types.ObjectId;
            email: string;
            displayName: string;
            birthDate: string | undefined;
            expectedLifespanYears: number | undefined;
            timeZone: string;
            locale: string;
        };
    }>;
    refresh(dto: RefreshDto, req: Request): Promise<{
        accessToken: string;
        refreshToken: string;
        accessTokenExpiresIn: string;
    }>;
    logout(user: AuthUser): Promise<{
        loggedOut: boolean;
    }>;
}
export declare class AuthModule {
}
export {};
