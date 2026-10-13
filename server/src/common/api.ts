import {
  ArgumentsHost,
  CallHandler,
  Catch,
  createParamDecorator,
  ExceptionFilter,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { randomUUID } from 'node:crypto';
import { catchError, map, Observable, throwError } from 'rxjs';

export interface AuthUser {
  id: string;
  email: string;
  sessionId: string;
}

export interface AuthRequest extends Request {
  user: AuthUser;
  requestId: string;
}

export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthUser =>
    context.switchToHttp().getRequest<AuthRequest>().user,
);

@Injectable()
export class ApiEnvelopeInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<AuthRequest>();
    const response = context.switchToHttp().getResponse<Response>();
    request.requestId =
      request.header('x-request-id')?.slice(0, 100) ?? randomUUID();
    response.setHeader('x-request-id', request.requestId);

    return next.handle().pipe(
      map((value: unknown) => {
        if (value && typeof value === 'object' && '__raw' in value) {
          return (value as { __raw: unknown }).__raw;
        }
        return { success: true, data: value ?? null };
      }),
      catchError((error: unknown) => throwError(() => error)),
    );
  }
}

interface SafeError {
  code?: string;
  message?: string | string[];
  fieldErrors?: Record<string, string>;
}

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<AuthRequest>();
    const response = ctx.getResponse<Response>();
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;
    const raw =
      exception instanceof HttpException ? exception.getResponse() : undefined;
    const details: SafeError =
      typeof raw === 'object' && raw !== null ? (raw as SafeError) : {};
    const messages = Array.isArray(details.message)
      ? details.message
      : [details.message].filter(Boolean);
    const fieldErrors: Record<string, string> = details.fieldErrors ?? {};

    for (const message of messages) {
      const [field, ...rest] = String(message).split(' ');
      if (field && rest.length && !fieldErrors[field]) {
        fieldErrors[field] = rest.join(' ');
      }
    }

    const defaultCode: Record<number, string> = {
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
        code:
          details.code ??
          defaultCode[status] ??
          (status >= 500 ? 'INTERNAL_ERROR' : 'REQUEST_FAILED'),
        message:
          status >= 500
            ? 'An unexpected error occurred'
            : (messages[0] ?? 'Request failed'),
        fieldErrors,
        requestId: request.requestId,
      },
    });
  }
}

export function pageMeta(page: number, limit: number, total: number) {
  return {
    items: [] as unknown[],
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}
