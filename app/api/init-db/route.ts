import { NextRequest, NextResponse } from 'next/server';
import { runDatabaseMigrations } from '@/utils/migrations';
import { ErrorHandler } from '@/utils/errorHandler';
import { Env } from '@/types/database';

// Helper function to create environment object
function createEnv(request: NextRequest): any {
  return {
    DB: request.nextUrl.hostname === 'localhost' ? undefined : (request as any).cf?.d1,
    'DB-DEV': request.nextUrl.hostname === 'localhost' ? (request as any).cf?.d1 : undefined,
    JWT_SECRET: process.env.JWT_SECRET as string,
    ENVIRONMENT: process.env.NODE_ENV === 'production' ? 'production' : 'development'
  };
}

export const dynamic = 'force-dynamic'

// 强制使用 Edge Runtime (Cloudflare Pages 要求)
export const runtime = 'edge';

export async function POST(request: NextRequest) {
  try {
    const env = createEnv(request);
    
    // 运行数据库迁移
    await runDatabaseMigrations(env);
    
    return NextResponse.json({
      success: true,
      message: '数据库初始化完成'
    });
    
  } catch (error) {
    const appError = ErrorHandler.handle(error, {
      url: request.url,
      method: request.method
    });

    return ErrorHandler.createResponse(appError);
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: '使用 POST 方法来初始化数据库',
    usage: 'POST /api/init-db'
  });
}