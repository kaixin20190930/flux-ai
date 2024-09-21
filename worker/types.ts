import {D1Database} from '@cloudflare/workers-types';

export interface Env {
    DB: D1Database;
    JWT_SECRET: string;
    ENVIRONMENT: 'production' | 'development';

}