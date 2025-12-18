import { NextRequest, NextResponse } from 'next/server';
import { ImageSearchDAO } from '@/utils/dao';
import { Env } from '@/types/database';
import { auth } from '@/lib/auth';

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
// 注意：不使用 edge runtime，因为 NextAuth database sessions 需要 Prisma
// Prisma 不支持 Edge Runtime
export async function POST(request: NextRequest) {
  try {
    const { imageUrl, saved }: { imageUrl: string; saved: boolean } = await request.json();
    
    if (!imageUrl) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: '缺少图片URL' } },
        { status: 400 }
      );
    }
    
    // Check authentication using NextAuth
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }
    
    const userId = session.user.id;
    
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