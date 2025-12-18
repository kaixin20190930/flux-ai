import { NextRequest, NextResponse } from 'next/server';
import { ErrorHandler } from '@/utils/errorHandler';
import { AppErrorClass, ErrorCode } from '@/types/database';
import { SystemMetricsDAO } from '@/utils/dao';
import { Env } from '@/worker/types';

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
    
    // 获取最新的系统指标
    const metricsDAO = new SystemMetricsDAO(process.env as unknown as Env);
    const metricNames = [
      'cpu_usage',
      'memory_usage',
      'storage_usage',
      'network_usage',
      'database_usage',
      'response_time',
      'active_users',
      'queue_length',
      'error_rate',
      'total_memory'
    ];
    
    const metrics = await metricsDAO.getLatestMetrics(metricNames);
    
    // 如果没有真实数据，生成模拟数据用于演示
    if (metrics.length === 0) {
      const mockMetrics = generateMockMetrics(metricNames);
      return NextResponse.json({ metrics: mockMetrics });
    }
    
    return NextResponse.json({ metrics });
  } catch (error) {
    const appError = ErrorHandler.handle(error);
    ErrorHandler.logError(appError);
    return ErrorHandler.createResponse(appError);
  }
}

// 生成模拟数据用于演示
function generateMockMetrics(metricNames: string[]) {
  const now = new Date();
  
  return metricNames.map(name => {
    let value: number;
    
    switch (name) {
      case 'cpu_usage':
        value = Math.random() * 30 + 40; // 40-70%
        break;
      case 'memory_usage':
        value = Math.random() * 20 + 60; // 60-80%
        break;
      case 'storage_usage':
        value = Math.random() * 15 + 45; // 45-60%
        break;
      case 'network_usage':
        value = Math.random() * 40 + 30; // 30-70%
        break;
      case 'database_usage':
        value = Math.random() * 25 + 50; // 50-75%
        break;
      case 'response_time':
        value = Math.random() * 300 + 100; // 100-400ms
        break;
      case 'active_users':
        value = Math.floor(Math.random() * 100 + 50); // 50-150 users
        break;
      case 'queue_length':
        value = Math.floor(Math.random() * 10); // 0-10 jobs
        break;
      case 'error_rate':
        value = Math.random() * 2; // 0-2%
        break;
      case 'total_memory':
        value = 8 * 1024 * 1024 * 1024; // 8GB
        break;
      default:
        value = Math.random() * 100;
    }
    
    return {
      id: crypto.randomUUID(),
      metricName: name,
      metricValue: value,
      recordedAt: now.toISOString()
    };
  });
}