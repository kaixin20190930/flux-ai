import { D1Database, R2Bucket, KVNamespace } from '@cloudflare/workers-types';

export interface Env {
    // 数据库绑定
    DB: D1Database;
    
    // R2 存储绑定
    R2: R2Bucket;
    
    // KV 缓存绑定
    KV: KVNamespace;
    
    // 认证配置
    JWT_SECRET: string;
    
    // 环境配置
    ENVIRONMENT: 'production' | 'development';
    
    // Google OAuth 配置
    GOOGLE_CLIENT_ID?: string;
    GOOGLE_CLIENT_SECRET?: string;
    
    // Replicate API 配置
    REPLICATE_API_TOKEN?: string;
    
    // Stripe 配置
    STRIPE_SECRET_KEY?: string;
    STRIPE_WEBHOOK_SECRET?: string;
    
    // 管理员配置
    ADMIN_USER_IDS?: string;
    
    // 其他配置
    CORS_ORIGINS?: string;
    LOG_LEVEL?: 'debug' | 'info' | 'warn' | 'error';
}
