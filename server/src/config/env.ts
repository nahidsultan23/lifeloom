import Joi from 'joi';

export type AppEnv = 'development' | 'staging' | 'production' | 'test';

const optionalWhenTest = Joi.string().when('APP_ENV', {
  is: 'test',
  then: Joi.optional().allow(''),
  otherwise: Joi.required(),
});

export const envSchema = Joi.object({
  APP_NAME: Joi.string().default('Lifeloom'),
  APP_ENV: Joi.string()
    .valid('development', 'staging', 'production', 'test')
    .default('development'),
  NODE_ENV: Joi.string().default('development'),
  APP_VERSION: Joi.string().default('0.1.0'),
  PORT: Joi.number().port().default(3000),
  HOST: Joi.string().default('0.0.0.0'),
  API_PREFIX: Joi.string().default('api/v1'),
  PUBLIC_API_URL: Joi.string().uri().default('http://localhost:3000'),
  CORS_ORIGINS: Joi.string().default(
    'http://localhost:19006,http://localhost:8081',
  ),
  MONGODB_URI: Joi.string().uri().required(),
  MONGODB_DB_NAME: Joi.string().default('lifeloom'),
  MONGODB_MAX_POOL_SIZE: Joi.number().integer().min(1).max(200).default(20),
  MONGODB_SERVER_SELECTION_TIMEOUT_MS: Joi.number()
    .integer()
    .min(100)
    .default(5000),
  GOOGLE_ALLOWED_AUDIENCES: optionalWhenTest,
  ACCESS_TOKEN_SECRET: Joi.string().min(32).required(),
  ACCESS_TOKEN_TTL: Joi.string().default('15m'),
  REFRESH_TOKEN_SECRET: Joi.string().min(32).required(),
  REFRESH_TOKEN_TTL: Joi.string().default('30d'),
  REQUEST_BODY_LIMIT_MB: Joi.number().integer().min(1).max(10).default(1),
  RATE_LIMIT_TTL_SECONDS: Joi.number().integer().min(1).default(60),
  RATE_LIMIT_MAX_REQUESTS: Joi.number().integer().min(1).default(100),
  AWS_REGION: Joi.string().default('ap-southeast-1'),
  AWS_S3_BUCKET: optionalWhenTest,
  AWS_S3_PREFIX: Joi.string().default('development/'),
  S3_ENDPOINT_URL: Joi.string().uri().allow(''),
  S3_FORCE_PATH_STYLE: Joi.boolean().default(false),
  S3_PRESIGNED_URL_TTL_SECONDS: Joi.number()
    .integer()
    .min(30)
    .max(900)
    .default(300),
  UPLOAD_TEMP_TTL_HOURS: Joi.number().integer().min(1).max(168).default(24),
  EMAIL_ENABLED: Joi.boolean().default(false),
  EMAIL_DELIVERY_MODE: Joi.string().valid('log', 'smtp').default('log'),
  SMTP_HOST: Joi.string().when('EMAIL_ENABLED', {
    is: true,
    then: Joi.required(),
    otherwise: Joi.allow(''),
  }),
  SMTP_PORT: Joi.number().port().default(587),
  SMTP_SECURE: Joi.boolean().default(false),
  SMTP_USER: Joi.string().when('EMAIL_ENABLED', {
    is: true,
    then: Joi.required(),
    otherwise: Joi.allow(''),
  }),
  SMTP_PASSWORD: Joi.string().when('EMAIL_ENABLED', {
    is: true,
    then: Joi.required(),
    otherwise: Joi.allow(''),
  }),
  SMTP_FROM_NAME: Joi.string().default('Lifeloom'),
  SMTP_FROM_EMAIL: Joi.string()
    .email()
    .when('EMAIL_ENABLED', {
      is: true,
      then: Joi.required(),
      otherwise: Joi.allow(''),
    }),
  FUTURE_LETTER_EMAIL_FORMAT: Joi.string()
    .valid('secure_link')
    .default('secure_link'),
  FCM_PROJECT_ID: Joi.string().when('PUSH_NOTIFICATIONS_ENABLED', {
    is: true,
    then: Joi.required(),
    otherwise: Joi.allow(''),
  }),
  FCM_CLIENT_EMAIL: Joi.string()
    .email()
    .when('PUSH_NOTIFICATIONS_ENABLED', {
      is: true,
      then: Joi.required(),
      otherwise: Joi.allow(''),
    }),
  FCM_PRIVATE_KEY: Joi.string().when('PUSH_NOTIFICATIONS_ENABLED', {
    is: true,
    then: Joi.required(),
    otherwise: Joi.allow(''),
  }),
  PUSH_NOTIFICATIONS_ENABLED: Joi.boolean().default(false),
  BACKGROUND_JOBS_ENABLED: Joi.boolean().default(false),
  SCHEDULER_POLL_INTERVAL_MS: Joi.number().integer().min(1000).default(5000),
  SCHEDULER_LEASE_SECONDS: Joi.number().integer().min(10).default(60),
  ANDROID_PACKAGE_ID: Joi.string().allow(''),
  ANDROID_STORE_URL: Joi.string().uri().allow(''),
  IOS_APP_STORE_ID: Joi.string().allow(''),
  IOS_STORE_URL: Joi.string().uri().allow(''),
  APP_UPDATE_CHECK_ENABLED: Joi.boolean().default(true),
  TRUST_PROXY: Joi.boolean().default(false),
  SHUTDOWN_TIMEOUT_MS: Joi.number().integer().min(1000).default(10000),
}).unknown(true);
