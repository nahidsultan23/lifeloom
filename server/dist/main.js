import { Logger, RequestMethod, UnprocessableEntityException, ValidationPipe, } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import { json, urlencoded } from 'express';
import helmet from 'helmet';
import { AppModule } from './app.module.js';
import { ApiEnvelopeInterceptor, GlobalExceptionFilter, } from './common/api.js';
function validationException(errors) {
    const fieldErrors = {};
    const visit = (items, prefix = '') => {
        for (const error of items) {
            const path = prefix ? `${prefix}.${error.property}` : error.property;
            const message = Object.values(error.constraints ?? {})[0];
            if (message)
                fieldErrors[path] = message.replace(`${error.property} `, '');
            visit(error.children ?? [], path);
        }
    };
    visit(errors);
    return new UnprocessableEntityException({
        code: 'VALIDATION_ERROR',
        message: 'One or more fields are invalid',
        fieldErrors,
    });
}
async function bootstrap() {
    const app = await NestFactory.create(AppModule, {
        bodyParser: false,
    });
    const config = app.get(ConfigService);
    const limit = `${config.get('REQUEST_BODY_LIMIT_MB', 1)}mb`;
    app.use(helmet());
    app.use(cookieParser());
    app.use(json({ limit }));
    app.use(urlencoded({ limit, extended: true }));
    app.enableCors({
        origin: config
            .get('CORS_ORIGINS', '')
            .split(',')
            .map((origin) => origin.trim())
            .filter(Boolean),
        credentials: true,
        methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    });
    app.setGlobalPrefix(config.get('API_PREFIX', 'api/v1'), {
        exclude: [
            { path: 'health/live', method: RequestMethod.GET },
            { path: 'health/ready', method: RequestMethod.GET },
        ],
    });
    app.useGlobalPipes(new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
        exceptionFactory: validationException,
    }));
    app.useGlobalInterceptors(new ApiEnvelopeInterceptor());
    app.useGlobalFilters(new GlobalExceptionFilter());
    app.enableShutdownHooks();
    const appEnv = config.get('APP_ENV');
    if (appEnv === 'development' || appEnv === 'staging') {
        const swaggerConfig = new DocumentBuilder()
            .setTitle('Lifeloom API')
            .setDescription('Private life-planning and reflection API')
            .setVersion(config.get('APP_VERSION', '0.1.0'))
            .addBearerAuth()
            .build();
        const document = SwaggerModule.createDocument(app, swaggerConfig);
        SwaggerModule.setup('docs', app, document, {
            jsonDocumentUrl: 'docs-json',
        });
    }
    const port = config.get('PORT', 3000);
    const host = config.get('HOST', '0.0.0.0');
    await app.listen(port, host);
    Logger.log(`Lifeloom API listening on ${host}:${port}`, 'Bootstrap');
}
await bootstrap();
//# sourceMappingURL=main.js.map