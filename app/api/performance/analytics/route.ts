import { NextRequest, NextResponse } from 'next/server';
import { PerformanceMonitor } from '@/utils/performanceMonitor';
import { ImageProcessingOptimizer, BatchOperationOptimizer, DatabaseOptimizer } from '@/utils/performanceOptimizer';
import { ErrorHandler } from '@/utils/errorHandler';
import { ErrorCode } from '@/types/database';

export const runtime = 'edge'
export const dynamic = 'force-dynamic'
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get('timeRange');
    const includeRecommendations = searchParams.get('recommendations') === 'true';

    // 解析时间范围
    let dateRange: { start: Date; end: Date } | undefined;
    if (timeRange) {
      const [start, end] = timeRange.split(',');
      if (start && end) {
        dateRange = {
          start: new Date(start),
          end: new Date(end)
        };
      }
    }

    // 获取系统概览
    const systemOverview = PerformanceMonitor.getSystemOverview();

    // 获取详细性能报告
    const performanceReport = PerformanceMonitor.getPerformanceReport(dateRange);

    // 获取缓存统计
    const imageCacheStats = ImageProcessingOptimizer.getCacheStats();

    // 获取活跃批量任务
    const activeJobs = BatchOperationOptimizer.getAllActiveJobs();

    // 获取错误统计
    const errorStats = ErrorHandler.getErrorStats();

    const response = {
      timestamp: new Date().toISOString(),
      systemOverview,
      performanceReport: includeRecommendations ? performanceReport : {
        ...performanceReport,
        recommendations: undefined
      },
      cacheStats: {
        imageProcessing: imageCacheStats
      },
      activeJobs,
      errorStats,
      metadata: {
        timeRange: dateRange,
        includeRecommendations
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    const appError = ErrorHandler.handle(error, {
      url: request.url,
      method: request.method
    });

    return ErrorHandler.createResponse(appError);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, params } = body as { action: string; params: any };

    switch (action) {
      case 'cleanup':
        // 手动触发清理
        ImageProcessingOptimizer.cleanupCache();
        DatabaseOptimizer.cleanupQueryCache();
        
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        PerformanceMonitor.cleanup(oneHourAgo);
        
        return NextResponse.json({ 
          success: true, 
          message: '清理完成',
          timestamp: new Date().toISOString()
        });

      case 'resetStats':
        // 重置错误统计
        ErrorHandler.resetStats();
        
        return NextResponse.json({ 
          success: true, 
          message: '统计数据已重置',
          timestamp: new Date().toISOString()
        });

      case 'setThreshold':
        // 设置性能阈值
        const { metricName, warning, critical } = params;
        if (!metricName || typeof warning !== 'number' || typeof critical !== 'number') {
          throw new Error('Invalid threshold parameters');
        }
        
        PerformanceMonitor.setThreshold(metricName, { warning, critical });
        
        return NextResponse.json({ 
          success: true, 
          message: `已设置 ${metricName} 的阈值`,
          threshold: { metricName, warning, critical },
          timestamp: new Date().toISOString()
        });

      case 'cancelJob':
        // 取消批量任务
        const { jobId } = params;
        if (!jobId) {
          throw new Error('Job ID is required');
        }
        
        const cancelled = BatchOperationOptimizer.cancelJob(jobId);
        
        return NextResponse.json({ 
          success: cancelled, 
          message: cancelled ? '任务已取消' : '任务未找到或已完成',
          jobId,
          timestamp: new Date().toISOString()
        });

      default:
        throw new Error(`Unknown action: ${action}`);
    }

  } catch (error) {
    const appError = ErrorHandler.handle(error, {
      url: request.url,
      method: request.method
    });

    return ErrorHandler.createResponse(appError);
  }
}

// 获取实时性能指标
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { metricNames, limit = 100 } = body as { metricNames?: string[]; limit?: number };

    let metrics;
    if (metricNames && Array.isArray(metricNames)) {
      // 获取特定指标
      metrics = metricNames.reduce((acc: any, name: string) => {
        acc[name] = PerformanceMonitor.getStats(name);
        return acc;
      }, {});
    } else {
      // 获取最近的指标
      const recentMetrics = PerformanceMonitor.getRecentMetrics(limit);
      metrics = {
        recent: recentMetrics,
        summary: PerformanceMonitor.getSystemOverview()
      };
    }

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      metrics
    });

  } catch (error) {
    const appError = ErrorHandler.handle(error, {
      url: request.url,
      method: request.method
    });

    return ErrorHandler.createResponse(appError);
  }
}