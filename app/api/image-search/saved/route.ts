import { NextRequest, NextResponse } from 'next/server';
import { ImageSearchDAO } from '@/utils/dao';
import { authenticateRequest, createAuthErrorResponse } from '@/utils/authHelpers';
import { Env } from '@/types/database';

// Helper function to create environment object
function createEnv(request: NextRequest): Env {
  return {
    DB: request.nextUrl.hostname === 'localhost' ? undefined : (request as any).cf?.d1,
    'DB-DEV': request.nextUrl.hostname === 'localhost' ? (request as any).cf?.d1 : undefined,
    JWT_SECRET: process.env.JWT_SECRET as string,
    ENVIRONMENT: process.env.NODE_ENV === 'production' ? 'production' : 'development'
  };
}

export async function GET(request: NextRequest) {
  try {
    // 统一的认证检查
    const authResult = await authenticateRequest(request);
    if (!authResult.success) {
      return createAuthErrorResponse(authResult.error);
    }
    const userId = authResult.userId!;
    
    // 获取分页参数
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '20');
    
    const env = createEnv(request);
    const searchDao = new ImageSearchDAO(env);
    
    // 获取用户保存的图片
    const result = await searchDao.getSavedImages(userId, page, limit);
    
    return NextResponse.json(result);
    
  } catch (error) {
    console.error('Error in saved images API:', error);
    return NextResponse.json(
      { error: { code: 'SERVER_ERROR', message: '服务器内部错误' } },
      { status: 500 }
    );
  }
}