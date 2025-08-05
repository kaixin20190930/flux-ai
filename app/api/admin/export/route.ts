import { NextRequest, NextResponse } from 'next/server';
import { ErrorHandler } from '@/utils/errorHandler';
import { AppErrorClass, ErrorCode } from '@/types/database';
import { SystemMetricsDAO, UserAnalyticsDAO, GenerationHistoryDAO, BatchJobDAO } from '@/utils/dao';
import { Env } from '@/worker/types';
import { cookies } from 'next/headers';
import { verifyAdminAccess } from '@/utils/authUtils';

export const dynamic = 'force-dynamic'

// 强制使用 Edge Runtime (Cloudflare Pages 要求)
export const runtime = 'edge';

export async function POST(request: NextRequest) {
  try {
    // 获取当前会话
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
    
    // 解析请求体
    const body = await request.json();
    const { dataType, dateRange, format } = body as { dataType: string; dateRange: { start: string; end: string }; format: string };
    
    if (!dataType || !dateRange || !format) {
      throw new AppErrorClass({
        code: ErrorCode.VALIDATION_ERROR,
        message: '缺少必要参数',
        timestamp: new Date()
      });
    }
    
    // 解析日期范围
    const startDate = new Date(dateRange.start);
    const endDate = new Date(dateRange.end);
    
    // 根据数据类型获取相应数据
    let data;
    switch (dataType) {
      case 'user_stats':
        data = await exportUserStats(startDate, endDate);
        break;
      case 'system_metrics':
        data = await exportSystemMetrics(startDate, endDate);
        break;
      case 'generation_history':
        data = await exportGenerationHistory(startDate, endDate);
        break;
      case 'batch_jobs':
        data = await exportBatchJobs(startDate, endDate);
        break;
      default:
        throw new AppErrorClass({
          code: ErrorCode.VALIDATION_ERROR,
          message: '不支持的数据类型',
          timestamp: new Date()
        });
    }
    
    // 根据格式转换数据
    let formattedData;
    let contentType;
    let filename;
    
    switch (format) {
      case 'json':
        formattedData = JSON.stringify(data, null, 2);
        contentType = 'application/json';
        filename = `${dataType}_${formatDateForFilename(new Date())}.json`;
        break;
      case 'csv':
        formattedData = convertToCSV(data);
        contentType = 'text/csv';
        filename = `${dataType}_${formatDateForFilename(new Date())}.csv`;
        break;
      case 'excel':
        // 实际应用中可能需要使用库生成Excel文件
        // 这里简化为CSV格式
        formattedData = convertToCSV(data);
        contentType = 'text/csv';
        filename = `${dataType}_${formatDateForFilename(new Date())}.csv`;
        break;
      default:
        throw new AppErrorClass({
          code: ErrorCode.VALIDATION_ERROR,
          message: '不支持的导出格式',
          timestamp: new Date()
        });
    }
    
    // 返回数据
    return new NextResponse(formattedData, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`
      }
    });
  } catch (error) {
    const appError = ErrorHandler.handle(error);
    ErrorHandler.logError(appError);
    return ErrorHandler.createResponse(appError);
  }
}

// 导出用户统计数据
async function exportUserStats(startDate: Date, endDate: Date) {
  const userAnalyticsDAO = new UserAnalyticsDAO(process.env as unknown as Env);
  
  // 获取日期范围内的用户指标
  const metrics = await userAnalyticsDAO.getMetricsInRange([
    'total_users',
    'daily_active_users',
    'weekly_active_users',
    'monthly_active_users',
    'daily_new_users',
    'weekly_new_users',
    'monthly_new_users',
    'conversion_rate',
    'avg_session_duration',
    'retention_day1',
    'retention_day7',
    'retention_day30'
  ], startDate, endDate);
  
  return metrics;
}

// 导出系统指标数据
async function exportSystemMetrics(startDate: Date, endDate: Date) {
  const metricsDAO = new SystemMetricsDAO(process.env as unknown as Env);
  
  // 获取日期范围内的系统指标
  const metrics = await metricsDAO.getMetricsInRange([
    'cpu_usage',
    'memory_usage',
    'storage_usage',
    'network_usage',
    'database_usage',
    'response_time',
    'active_users',
    'queue_length',
    'error_rate'
  ], startDate, endDate);
  
  return metrics;
}

// 导出生成历史数据
async function exportGenerationHistory(startDate: Date, endDate: Date) {
  const historyDAO = new GenerationHistoryDAO(process.env as unknown as Env);
  
  // 获取日期范围内的生成历史
  const history = await historyDAO.getHistoryInRange(startDate, endDate);
  
  return history;
}

// 导出批量任务数据
async function exportBatchJobs(startDate: Date, endDate: Date) {
  const batchJobDAO = new BatchJobDAO(process.env as unknown as Env);
  
  // 获取日期范围内的批量任务
  const jobs = await batchJobDAO.getJobsInRange(startDate, endDate);
  
  return jobs;
}

// 将数据转换为CSV格式
function convertToCSV(data: any[]): string {
  if (!data || data.length === 0) {
    return '';
  }
  
  // 获取表头
  const headers = Object.keys(data[0]);
  
  // 生成CSV内容
  const csvRows = [
    headers.join(','), // 表头行
    ...data.map(row => {
      return headers.map(header => {
        const value = row[header];
        // 处理特殊字符和格式化
        if (value === null || value === undefined) {
          return '';
        } else if (typeof value === 'object') {
          return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
        } else {
          return `"${String(value).replace(/"/g, '""')}"`;
        }
      }).join(',');
    })
  ];
  
  return csvRows.join('\n');
}

// 格式化日期为文件名友好格式
function formatDateForFilename(date: Date): string {
  return date.toISOString().split('T')[0].replace(/-/g, '');
}