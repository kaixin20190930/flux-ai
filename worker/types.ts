import {D1Database} from '@cloudflare/workers-types';

export interface Env {
    DB?: D1Database;      // 生产环境
    'DB-DEV'?: D1Database; // 本地开发环境
    JWT_SECRET: string;
    ENVIRONMENT: 'production' | 'development';
}
