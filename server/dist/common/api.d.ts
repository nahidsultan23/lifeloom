import { ArgumentsHost, CallHandler, ExceptionFilter, ExecutionContext, NestInterceptor } from '@nestjs/common';
import type { Request } from 'express';
import { Observable } from 'rxjs';
export interface AuthUser {
    id: string;
    email: string;
    sessionId: string;
}
export interface AuthRequest extends Request {
    user: AuthUser;
    requestId: string;
}
export declare const CurrentUser: (...dataOrPipes: unknown[]) => ParameterDecorator;
export declare class ApiEnvelopeInterceptor implements NestInterceptor {
    intercept(context: ExecutionContext, next: CallHandler): Observable<unknown>;
}
export declare class GlobalExceptionFilter implements ExceptionFilter {
    catch(exception: unknown, host: ArgumentsHost): void;
}
export declare function pageMeta(page: number, limit: number, total: number): {
    items: unknown[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
};
