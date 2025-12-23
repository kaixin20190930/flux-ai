/**
 * Cloudflare Worker 主入口 - Hono 框架版本
 * Main entry point for Cloudflare Worker - Hono Framework Version
 * 
 * 使用 Hono 框架重构，提供更好的路由管理和中间件支持
 * Refactored with Hono framework for better routing and middleware support
 */

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { prettyJSON } from 'hono/pretty-json';
import { Env } from './types';

// 导入路由
import authRoutes from './routes/auth';
import pointsRoutes from './routes/points';
import generationRoutes from './routes/generation';
import transactionRoutes from './routes/transaction';
import toolsRoutes from './routes/tools';

// 创建 Hono 应用
const app = new Hono<{ Bindings: Env }>();

// 全局中间件
app.use('*', logger());
app.use('*', prettyJSON());

// CORS 配置
app.use('*', cors({
  origin: (origin) => {
    // 允许的来源列表
    const allowedOrigins = [
      'http://localhost:3000',
      'http://10.124.124.163:3000',
      'https://flux-ai-img.com',
      'https://www.flux-ai-img.com',
    ];
    
    // 如果是本地文件（file://）或者在允许列表中，则允许
    if (!origin || origin === 'null' || allowedOrigins.includes(origin)) {
      return origin || '*';
    }
    
    // 开发环境允许所有 localhost
    if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
      return origin;
    }
    
    return allowedOrigins[0];
  },
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'x-fingerprint-hash', 'x-real-ip', 'x-forwarded-for'],
  exposeHeaders: ['Content-Length', 'X-Request-Id'],
  credentials: true,
  maxAge: 86400,
}));

// 健康检查
app.get('/', (c) => {
  return c.json({
    message: 'Flux AI Cloudflare Worker - Hono Edition',
    version: '2.0.0',
    environment: c.env.ENVIRONMENT || 'production',
    timestamp: new Date().toISOString(),
    status: 'healthy',
  });
});

// 挂载路由
app.route('/auth', authRoutes);
app.route('/points', pointsRoutes);
app.route('/generation', generationRoutes);
app.route('/transaction', transactionRoutes);
app.route('/tools', toolsRoutes);

// 404 处理
app.notFound((c) => {
  return c.json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: 'The requested resource was not found',
      path: c.req.path,
    },
  }, 404);
});

// 错误处理
app.onError((err, c) => {
  console.error('Worker error:', err);
  
  return c.json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: c.env.ENVIRONMENT === 'development' 
        ? err.message 
        : 'An internal error occurred',
      ...(c.env.ENVIRONMENT === 'development' && { stack: err.stack }),
    },
  }, 500);
});

// 导出为 Cloudflare Worker 格式
export default app;
