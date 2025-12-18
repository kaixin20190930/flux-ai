import { NextRequest, NextResponse } from 'next/server';
import { ErrorHandler } from '@/utils/errorHandler';
import { AppErrorClass, ErrorCode } from '@/types/database';

// 管理员用户ID列表，实际应用中应该从数据库或环境变量中获取
const ADMIN_USER_IDS = process.env.ADMIN_USER_IDS ? process.env.ADMIN_USER_IDS.split(',') : [];

export const dynamic = 'force-dynamic'

// 强制使用 Edge Runtime (Cloudflare Pages 要求)
export const runtime = 'edge';

export async function GET(request: NextRequest) {
  try {
    // 获取当前会话
    // const session = await getServerSession(); // 需要手动实现认证
    const session: any = null; // 临时禁用认证 - Edge Runtime 兼容
    
    if (!session || !session?.user || !session?.user?.id) {
      throw new AppErrorClass({
        code: ErrorCode.UNAUTHORIZED,
        message: 'Authentication required',
        timestamp: new Date()
      });
    }
    
    // 检查用户是否为管理员
    const isAdmin = ADMIN_USER_IDS.includes((session.user as any).id);
    
    if (!isAdmin) {
      throw new AppErrorClass({
        code: ErrorCode.ADMIN_ACCESS_DENIED,
        message: 'Admin access denied',
        timestamp: new Date()
      });
    }
    
    return NextResponse.json({ isAdmin: true });
  } catch (error) {
    const appError = ErrorHandler.handle(error);
    ErrorHandler.logError(appError);
    return ErrorHandler.createResponse(appError);
  }
}