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
    
    // 获取查询参数
    const searchParams = request.nextUrl.searchParams;
    const metricName = searchParams.get('name');
    const timeRange = searchParams.get('range') || '24h';
    
    if (!metricName) {
      throw new AppErrorClass({
        code: ErrorCode.VALIDATION_ERROR,
        message: 'Metric name is required',
        timestamp: new Date()
      });
    }
    
    // 计算时间范围
    const endDate = new Date();
    let startDate: Date;
    
    switch (timeRange) {
      case '1h':
        startDate = new Date(endDate.getTime() - 60 * 60 * 1000);
        break;
      case '7d':
        startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '24h':
      default:
        startDate = new Date(endDate.getTime() - 24 * 60 * 60 * 1000);
        break;
    }
    
    // 获取指标历史数据
    const metricsDAO = new SystemMetricsDAO(process.env as unknown as Env);
    const history = await metricsDAO.getMetricHistory(metricName, startDate, endDate);
    
    // 如果没有真实数据，生成模拟数据用于演示
    if (history.length === 0) {
      const mockHistory = generateMockHistory(metricName, startDate, endDate, timeRange);
      return NextResponse.json({ history: mockHistory });
    }
    
    return NextResponse.json({ history });
  } catch (error) {
    const appError = ErrorHandler.handle(error);
    ErrorHandler.logError(appError);
    return ErrorHandler.createResponse(appError);
  }
}

// 生成模拟历史数据用于演示
function generateMockHistory(metricName: string, startDate: Date, endDate: Date, timeRange: string) {
  const history = [];
  const totalPoints = timeRange === '1h' ? 60 : timeRange === '7d' ? 168 : 24; // 每小时一个点或每天一个点
  const interval = (endDate.getTime() - startDate.getTime()) / totalPoints;
  
  let baseValue: number;
  let fluctuation: number;
  
  switch (metricName) {
    case 'cpu_usage':
      baseValue = 50;
      fluctuation = 20;
      break;
    case 'memory_usage':
      baseValue = 70;
      fluctuation = 15;
      break;
    case 'storage_usage':
      baseValue = 55;
      fluctuation = 10;
      break;
    case 'network_usage':
      baseValue = 45;
      fluctuation = 25;
      break;
    case 'database_usage':
      baseValue = 60;
      fluctuation = 15;
      break;
    case 'response_time':
      baseValue = 200;
      fluctuation = 100;
      break;
    case 'active_users':
      baseValue = 100;
      fluctuation = 50;
      break;
    default:
      baseValue = 50;
      fluctuation = 20;
  }
  
  for (let i = 0; i < totalPoints; i++) {
    const timestamp = new Date(startDate.getTime() + interval * i);
    
    // 添加一些周期性变化和随机波动
    const periodicComponent = Math.sin(i / (totalPoints / 6) * Math.PI * 2) * (fluctuation / 2);
    const randomComponent = (Math.random() - 0.5) * fluctuation;
    let value = baseValue + periodicComponent + randomComponent;
    
    // 确保百分比值在0-100之间
    if (['cpu_usage', 'memory_usage', 'storage_usage', 'network_usage', 'database_usage'].includes(metricName)) {
      value = Math.max(0, Math.min(100, value));
    }
    
    // 确保数值为正
    value = Math.max(0, value);
    
    history.push({
      id: crypto.randomUUID(),
      metricName,
      metricValue: value,
      recordedAt: timestamp.toISOString()
    });
  }
  
  return history;
}