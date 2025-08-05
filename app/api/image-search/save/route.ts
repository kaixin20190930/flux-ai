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

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export async function POST(request: NextRequest) {
  try {
    const { imageUrl, saved }: { imageUrl: string; saved: boolean } = await request.json();
    
    if (!imageUrl) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: '缺少图片URL' } },
        { status: 400 }
      );
    }
    
    // 统一的认证检查
    const authResult = await authenticateRequest(request);
    if (!authResult.success) {
      return createAuthErrorResponse(authResult.error);
    }
    const userId = authResult.userId!;
    
    const env = createEnv(request);
    const searchDao = new ImageSearchDAO(env);
    
    // 更新图片保存状态
    await searchDao.toggleSavedStatusByUserId(imageUrl, userId, saved);
    
    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error('Error in save image API:', error);
    return NextResponse.json(
      { error: { code: 'SERVER_ERROR', message: '服务器内部错误' } },
      { status: 500 }
    );
  }
}