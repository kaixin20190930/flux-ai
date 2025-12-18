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
    
    // 在实际应用中，这里应该从数据库获取告警数据
    // 这里生成一些模拟数据用于演示
    const mockAlerts = generateMockAlerts();
    
    return NextResponse.json({ alerts: mockAlerts });
  } catch (error) {
    const appError = ErrorHandler.handle(error);
    ErrorHandler.logError(appError);
    return ErrorHandler.createResponse(appError);
  }
}

// 生成模拟告警数据用于演示
function generateMockAlerts() {
  const now = new Date();
  
  return [
    {
      id: '1',
      level: 'error',
      message: '数据库连接失败，尝试重新连接',
      timestamp: new Date(now.getTime() - 35 * 60 * 1000).toISOString(),
      resolved: true
    },
    {
      id: '2',
      level: 'warning',
      message: 'CPU 使用率超过 80%，持续 15 分钟',
      timestamp: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
      resolved: true
    },
    {
      id: '3',
      level: 'warning',
      message: '内存使用率接近阈值 (90%)',
      timestamp: new Date(now.getTime() - 45 * 60 * 1000).toISOString(),
      resolved: false
    },
    {
      id: '4',
      level: 'info',
      message: '系统自动扩容已触发',
      timestamp: new Date(now.getTime() - 3 * 60 * 60 * 1000).toISOString(),
      resolved: true
    },
    {
      id: '5',
      level: 'error',
      message: 'API 响应时间异常，超过 2000ms',
      timestamp: new Date(now.getTime() - 20 * 60 * 1000).toISOString(),
      resolved: false
    }
  ];
}