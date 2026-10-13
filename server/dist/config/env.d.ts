import Joi from 'joi';
export type AppEnv = 'development' | 'staging' | 'production' | 'test';
export declare const envSchema: Joi.ObjectSchema<any>;
