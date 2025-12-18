import { NextResponse } from 'next/server';
import { getErrorResponse } from '@/utils/errorHandler';
import { UserAnalyticsDAO } from '@/utils/dao';
import { ErrorCode, AppErrorClass } from '@/types/database';
import { cookies } from 'next/headers';
import { verifyAdminAccess } from '@/utils/authUtils';

export const dynamic = 'force-dynamic'

// 强制使用 Edge Runtime (Cloudflare Pages 要求)
export const runtime = 'edge';

export async function GET(request: Request) {
  try {
    // 获取用户会话和验证管理员权限
    const cookieStore = cookies();
    const sessionToken = cookieStore.get('session_token')?.value;
    
    if (!sessionToken) {
      throw new AppErrorClass({
        code: ErrorCode.UNAUTHORIZED,
        message: '未授权访问',
        timestamp: new Date()
      });
    }
    
    // 验证管理员权限
    const isAdmin = await verifyAdminAccess(sessionToken);
    if (!isAdmin) {
      throw new AppErrorClass({
        code: ErrorCode.ADMIN_ACCESS_DENIED,
        message: '需要管理员权限',
        timestamp: new Date()
      });
    }
    
    // 获取查询参数
    const { searchParams } = new URL(request.url);
    const range = searchParams.get('range') || 'month';
    
    // 初始化 DAO 并获取用户分析数据
    const userAnalyticsDAO = new UserAnalyticsDAO({
      DB: process.env.DB as any,
      JWT_SECRET: process.env.JWT_SECRET || '',
      ENVIRONMENT: process.env.NODE_ENV || 'development'
    } as any);
    
    const analytics = await userAnalyticsDAO.getUserAnalytics(range);
    return NextResponse.json({ analytics });
  } catch (error) {
    return getErrorResponse(error);
  }
}