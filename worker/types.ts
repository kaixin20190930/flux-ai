import { D1Database } from '@cloudflare/workers-types';

export interface Env {
    // 数据库绑定
    DB?: D1Database;      // 生产环境
    'DB-DEV'?: D1Database; // 本地开发环境
    
    // 认证配置
    JWT_SECRET: string;
    
    // 环境配置
    ENVIRONMENT: 'production' | 'development';
    
    // Google OAuth 配置（可选）
    GOOGLE_CLIENT_ID?: string;
    GOOGLE_CLIENT_SECRET?: string;
    
    // 管理员配置
    ADMIN_USER_IDS?: string;
    
    // 其他配置
    CORS_ORIGINS?: string;
    LOG_LEVEL?: 'debug' | 'info' | 'warn' | 'error';
}
