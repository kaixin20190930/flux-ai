import { NextRequest, NextResponse } from 'next/server';
import { ImageSearchDAO } from '@/utils/dao';
import { ErrorHandler } from '@/utils/errorHandler';
import { verifyJWT } from '@/utils/auth';
import { AppErrorClass, ErrorCode, Env } from '@/types/database';

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
export async function GET(request: NextRequest) {
  try {
    // 获取用户信息
    const token = request.cookies.get('token')?.value;
    
    if (!token) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: '需要登录才能查看搜索历史' } },
        { status: 401 }
      );
    }
    
    if (!process.env.JWT_SECRET) {
      return NextResponse.json(
        { error: { code: 'SERVER_ERROR', message: '服务器配置错误' } },
        { status: 500 }
      );
    }
    
    try {
      const decoded = await verifyJWT(token, process.env.JWT_SECRET);
      const userId = decoded.userId;
      
      // 获取分页参数
      const url = new URL(request.url);
      const page = parseInt(url.searchParams.get('page') || '1');
      const limit = parseInt(url.searchParams.get('limit') || '20');
      
      const env = createEnv(request);
      const searchDao = new ImageSearchDAO(env);
      
      // 获取用户搜索历史
      const result = await searchDao.getSearchHistory(userId, page, limit);
      
      return NextResponse.json(result);
      
    } catch (error) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: '无效的认证令牌' } },
        { status: 401 }
      );
    }
    
  } catch (error) {
    console.error('Error in search history API:', error);
    return NextResponse.json(
      { error: { code: 'SERVER_ERROR', message: '服务器内部错误' } },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // 获取用户信息
    const token = request.cookies.get('token')?.value;
    
    if (!token) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: '需要登录才能删除搜索历史' } },
        { status: 401 }
      );
    }
    
    if (!process.env.JWT_SECRET) {
      return NextResponse.json(
        { error: { code: 'SERVER_ERROR', message: '服务器配置错误' } },
        { status: 500 }
      );
    }
    
    try {
      const decoded = await verifyJWT(token, process.env.JWT_SECRET);
      const userId = decoded.userId;
      
      const { historyId }: { historyId: string } = await request.json();
      
      if (!historyId) {
        return NextResponse.json(
          { error: { code: 'VALIDATION_ERROR', message: '缺少历史记录ID' } },
          { status: 400 }
        );
      }
      
      const env = createEnv(request);
      const searchDao = new ImageSearchDAO(env);
      
      // 删除搜索历史记录
      await searchDao.deleteSearchHistory(historyId, userId);
      
      return NextResponse.json({ success: true });
      
    } catch (error) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: '无效的认证令牌' } },
        { status: 401 }
      );
    }
    
  } catch (error) {
    console.error('Error in delete search history API:', error);
    return NextResponse.json(
      { error: { code: 'SERVER_ERROR', message: '服务器内部错误' } },
      { status: 500 }
    );
  }
}