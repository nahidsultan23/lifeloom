var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Catch, createParamDecorator, HttpException, HttpStatus, Injectable, } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { catchError, map, throwError } from 'rxjs';
export const CurrentUser = createParamDecorator((_data, context) => context.switchToHttp().getRequest().user);
let ApiEnvelopeInterceptor = class ApiEnvelopeInterceptor {
    intercept(context, next) {
        const request = context.switchToHttp().getRequest();
        const response = context.switchToHttp().getResponse();
        request.requestId = request.header('x-request-id')?.slice(0, 100) ?? randomUUID();
        response.setHeader('x-request-id', request.requestId);
        return next.handle().pipe(map((value) => {
            if (value && typeof value === 'object' && '__raw' in value) {
                return value.__raw;
            }
            return { success: true, data: value ?? null };
        }), catchError((error) => throwError(() => error)));
    }
};
ApiEnvelopeInterceptor = __decorate([
    Injectable()
], ApiEnvelopeInterceptor);
export { ApiEnvelopeInterceptor };
let GlobalExceptionFilter = class GlobalExceptionFilter {
    catch(exception, host) {
        const ctx = host.switchToHttp();
        const request = ctx.getRequest();
        const response = ctx.getResponse();
        const status = exception instanceof HttpException
            ? exception.getStatus()
            : HttpStatus.INTERNAL_SERVER_ERROR;
        const raw = exception instanceof HttpException ? exception.getResponse() : undefined;
        const details = typeof raw === 'object' && raw !== null ? raw : {};
        const messages = Array.isArray(details.message)
            ? details.message
            : [details.message].filter(Boolean);
        const fieldErrors = details.fieldErrors ?? {};
        for (const message of messages) {
            const [field, ...rest] = String(message).split(' ');
            if (field && rest.length && !fieldErrors[field]) {
                fieldErrors[field] = rest.join(' ');
            }
        }
        const defaultCode = {
            400: 'MALFORMED_REQUEST',
            401: 'UNAUTHENTICATED',
            403: 'FORBIDDEN',
            404: 'RESOURCE_NOT_FOUND',
            409: 'CONFLICT',
            422: 'VALIDATION_ERROR',
            429: 'RATE_LIMITED',
            503: 'DEPENDENCY_UNAVAILABLE',
        };
        response.status(status).json({
            success: false,
            error: {
                code: details.code ??
                    defaultCode[status] ??
                    (status >= 500 ? 'INTERNAL_ERROR' : 'REQUEST_FAILED'),
                message: status >= 500
                    ? 'An unexpected error occurred'
                    : (messages[0] ?? 'Request failed'),
                fieldErrors,
                requestId: request.requestId,
            },
        });
    }
};
GlobalExceptionFilter = __decorate([
    Catch()
], GlobalExceptionFilter);
export { GlobalExceptionFilter };
export function pageMeta(page, limit, total) {
    return {
        items: [],
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        },
    };
}
//# sourceMappingURL=api.js.map