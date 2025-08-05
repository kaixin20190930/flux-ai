import { NextRequest, NextResponse } from 'next/server';
import { PerformanceMonitor } from '@/utils/performanceMonitor';
import { ImageProcessingOptimizer, BatchOperationOptimizer, DatabaseOptimizer } from '@/utils/performanceOptimizer';
import { ErrorHandler } from '@/utils/errorHandler';
import { ErrorCode } from '@/types/database';

// GET /api/performance/metrics - 获取性能指标
export const runtime = 'edge'
export const dynamic = 'force-dynamic'
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const metricName = searchParams.get('metric');
    const timeRange = searchParams.get('timeRange');
    const format = searchParams.get('format') || 'json';

    // 解析时间范围
    let parsedTimeRange: { start: Date; end: Date } | undefined;
    if (timeRange) {
      const [start, end] = timeRange.split(',');
      parsedTimeRange = {
        start: new Date(start),
        end: new Date(end)
      };
    }

    // 获取性能统计
    const stats = PerformanceMonitor.getStats(metricName || undefined, parsedTimeRange);
    const recentMetrics = PerformanceMonitor.getRecentMetrics(100);
    const systemOverview = PerformanceMonitor.getSystemOverview();

    // 获取缓存统计
    const imageCacheStats = ImageProcessingOptimizer.getCacheStats();
    const activeJobs = BatchOperationOptimizer.getAllActiveJobs();

    const response = {
      timestamp: new Date().toISOString(),
      stats,
      systemOverview,
      cacheStats: {
        imageProcessing: imageCacheStats
      },
      activeJobs,
      recentMetrics: format === 'detailed' ? recentMetrics : recentMetrics.slice(-10)
    };

    return NextResponse.json(response);
  } catch (error) {
    const appError = ErrorHandler.handle(error);
    ErrorHandler.logError(appError);
    return ErrorHandler.createResponse(appError);
  }
}

// POST /api/performance/metrics - 记录自定义性能指标
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, value, unit = 'count', context } = body as { name: string; value: number; unit?: string; context?: any };

    if (!name || typeof value !== 'number') {
      const error = new Error('Invalid metric data: name and numeric value are required');
      const appError = ErrorHandler.handle(error);
      return ErrorHandler.createResponse(appError);
    }

    // Validate unit type
    const validUnits = ['count', 'ms', 'bytes', 'percentage'] as const;
    const validatedUnit = validUnits.includes(unit as any) ? unit as typeof validUnits[number] : 'count';

    PerformanceMonitor.recordCustomMetric(name, value, validatedUnit, context);

    return NextResponse.json({
      success: true,
      message: 'Metric recorded successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    const appError = ErrorHandler.handle(error);
    ErrorHandler.logError(appError);
    return ErrorHandler.createResponse(appError);
  }
}

// DELETE /api/performance/metrics - 清理性能指标
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const olderThan = searchParams.get('olderThan');

    if (!olderThan) {
      const error = new Error('olderThan parameter is required');
      const appError = ErrorHandler.handle(error);
      return ErrorHandler.createResponse(appError);
    }

    const cutoffDate = new Date(olderThan);
    PerformanceMonitor.cleanup(cutoffDate);

    return NextResponse.json({
      success: true,
      message: 'Metrics cleaned up successfully',
      cutoffDate: cutoffDate.toISOString()
    });
  } catch (error) {
    const appError = ErrorHandler.handle(error);
    ErrorHandler.logError(appError);
    return ErrorHandler.createResponse(appError);
  }
}