import { ErrorHandler } from './errorHandler';
import { ErrorCode } from '@/types/database';

// 性能指标类型
export interface PerformanceMetric {
  name: string;
  value: number;
  unit: 'ms' | 'bytes' | 'count' | 'percentage';
  timestamp: Date;
  context?: Record<string, any>;
}

export interface PerformanceThreshold {
  warning: number;
  critical: number;
}

export interface PerformanceConfig {
  [key: string]: PerformanceThreshold;
}

// 默认性能阈值配置
const DEFAULT_THRESHOLDS: PerformanceConfig = {
  'api.response_time': { warning: 1000, critical: 3000 }, // ms
  'image.processing_time': { warning: 5000, critical: 15000 }, // ms
  'batch.processing_time': { warning: 30000, critical: 120000 }, // ms
  'database.query_time': { warning: 500, critical: 2000 }, // ms
  'memory.usage': { warning: 80, critical: 95 }, // percentage
  'error.rate': { warning: 5, critical: 10 }, // percentage
};

export class PerformanceMonitor {
  private static metrics: PerformanceMetric[] = [];
  private static thresholds: PerformanceConfig = DEFAULT_THRESHOLDS;
  private static maxMetricsHistory = 1000;

  // 记录性能指标
  static recordMetric(metric: PerformanceMetric): void {
    try {
      // 添加到内存缓存
      this.metrics.push(metric);
      
      // 保持历史记录在限制范围内
      if (this.metrics.length > this.maxMetricsHistory) {
        this.metrics = this.metrics.slice(-this.maxMetricsHistory);
      }

      // 检查阈值
      this.checkThreshold(metric);

      // 异步保存到数据库（如果需要持久化）
      this.persistMetric(metric).catch(error => {
        console.error('Failed to persist performance metric:', error);
      });
    } catch (error) {
      console.error('Failed to record performance metric:', error);
    }
  }

  // 测量函数执行时间
  static async measureAsync<T>(
    name: string,
    fn: () => Promise<T>,
    context?: Record<string, any>
  ): Promise<T> {
    const startTime = performance.now();
    const startMemory = this.getMemoryUsage();

    try {
      const result = await fn();
      const endTime = performance.now();
      const endMemory = this.getMemoryUsage();

      // 记录执行时间
      this.recordMetric({
        name: `${name}.execution_time`,
        value: endTime - startTime,
        unit: 'ms',
        timestamp: new Date(),
        context: {
          ...context,
          memoryDelta: endMemory - startMemory,
          success: true
        }
      });

      return result;
    } catch (error) {
      const endTime = performance.now();
      
      // 记录失败的执行时间
      this.recordMetric({
        name: `${name}.execution_time`,
        value: endTime - startTime,
        unit: 'ms',
        timestamp: new Date(),
        context: {
          ...context,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      });

      throw error;
    }
  }

  // 测量同步函数执行时间
  static measure<T>(
    name: string,
    fn: () => T,
    context?: Record<string, any>
  ): T {
    const startTime = performance.now();
    const startMemory = this.getMemoryUsage();

    try {
      const result = fn();
      const endTime = performance.now();
      const endMemory = this.getMemoryUsage();

      this.recordMetric({
        name: `${name}.execution_time`,
        value: endTime - startTime,
        unit: 'ms',
        timestamp: new Date(),
        context: {
          ...context,
          memoryDelta: endMemory - startMemory,
          success: true
        }
      });

      return result;
    } catch (error) {
      const endTime = performance.now();
      
      this.recordMetric({
        name: `${name}.execution_time`,
        value: endTime - startTime,
        unit: 'ms',
        timestamp: new Date(),
        context: {
          ...context,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      });

      throw error;
    }
  }

  // 记录自定义指标
  static recordCustomMetric(
    name: string,
    value: number,
    unit: PerformanceMetric['unit'] = 'count',
    context?: Record<string, any>
  ): void {
    this.recordMetric({
      name,
      value,
      unit,
      timestamp: new Date(),
      context
    });
  }

  // 获取性能统计
  static getStats(metricName?: string, timeRange?: { start: Date; end: Date }): {
    count: number;
    average: number;
    min: number;
    max: number;
    p95: number;
    p99: number;
  } {
    let filteredMetrics = this.metrics;

    if (metricName) {
      filteredMetrics = filteredMetrics.filter(m => m.name === metricName);
    }

    if (timeRange) {
      filteredMetrics = filteredMetrics.filter(m => 
        m.timestamp >= timeRange.start && m.timestamp <= timeRange.end
      );
    }

    if (filteredMetrics.length === 0) {
      return { count: 0, average: 0, min: 0, max: 0, p95: 0, p99: 0 };
    }

    const values = filteredMetrics.map(m => m.value).sort((a, b) => a - b);
    const count = values.length;
    const sum = values.reduce((a, b) => a + b, 0);

    return {
      count,
      average: sum / count,
      min: values[0],
      max: values[count - 1],
      p95: values[Math.floor(count * 0.95)],
      p99: values[Math.floor(count * 0.99)]
    };
  }

  // 获取最近的指标
  static getRecentMetrics(limit: number = 100): PerformanceMetric[] {
    return this.metrics.slice(-limit);
  }

  // 清理旧指标
  static cleanup(olderThan: Date): void {
    this.metrics = this.metrics.filter(m => m.timestamp > olderThan);
  }

  // 检查阈值并发出警告
  private static checkThreshold(metric: PerformanceMetric): void {
    const threshold = this.thresholds[metric.name];
    if (!threshold) return;

    if (metric.value >= threshold.critical) {
      console.error(`🚨 CRITICAL: ${metric.name} = ${metric.value}${metric.unit} (threshold: ${threshold.critical}${metric.unit})`);
      this.recordAlert('critical', metric);
    } else if (metric.value >= threshold.warning) {
      console.warn(`⚠️  WARNING: ${metric.name} = ${metric.value}${metric.unit} (threshold: ${threshold.warning}${metric.unit})`);
      this.recordAlert('warning', metric);
    }
  }

  // 记录告警
  private static recordAlert(level: 'warning' | 'critical', metric: PerformanceMetric): void {
    // 这里可以集成到告警系统，如发送邮件、Slack通知等
    console.log(`Alert recorded: ${level} for ${metric.name}`);
  }

  // 获取内存使用情况
  private static getMemoryUsage(): number {
    if (typeof process !== 'undefined' && process.memoryUsage) {
      return process.memoryUsage().heapUsed;
    }
    return 0;
  }

  // 持久化指标到数据库
  private static async persistMetric(metric: PerformanceMetric): Promise<void> {
    // 这里可以实现将指标保存到数据库的逻辑
    // 为了避免影响性能，这应该是异步的
  }

  // 设置自定义阈值
  static setThreshold(metricName: string, threshold: PerformanceThreshold): void {
    this.thresholds[metricName] = threshold;
  }

  // 获取系统性能概览
  static getSystemOverview(): {
    totalMetrics: number;
    recentErrors: number;
    averageResponseTime: number;
    memoryUsage: number;
    topSlowOperations: Array<{ name: string; averageTime: number }>;
    performanceScore: number;
    healthStatus: 'healthy' | 'warning' | 'critical';
    recommendations: string[];
  } {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    const recentMetrics = this.metrics.filter(m => m.timestamp > oneHourAgo);
    const errorMetrics = recentMetrics.filter(m => 
      m.context?.success === false || m.name.includes('error')
    );

    const responseTimeMetrics = recentMetrics.filter(m => 
      m.name.includes('response_time') || m.name.includes('execution_time')
    );

    const avgResponseTime = responseTimeMetrics.length > 0
      ? responseTimeMetrics.reduce((sum, m) => sum + m.value, 0) / responseTimeMetrics.length
      : 0;

    // 计算最慢的操作
    const operationTimes = new Map<string, number[]>();
    responseTimeMetrics.forEach(m => {
      const baseName = m.name.replace('.execution_time', '');
      if (!operationTimes.has(baseName)) {
        operationTimes.set(baseName, []);
      }
      operationTimes.get(baseName)!.push(m.value);
    });

    const topSlowOperations = Array.from(operationTimes.entries())
      .map(([name, times]) => ({
        name,
        averageTime: times.reduce((sum, time) => sum + time, 0) / times.length
      }))
      .sort((a, b) => b.averageTime - a.averageTime)
      .slice(0, 5);

    // 计算性能分数和健康状态
    const performanceAnalysis = this.calculatePerformanceScore(recentMetrics);

    return {
      totalMetrics: this.metrics.length,
      recentErrors: errorMetrics.length,
      averageResponseTime: avgResponseTime,
      memoryUsage: this.getMemoryUsage(),
      topSlowOperations,
      performanceScore: performanceAnalysis.score,
      healthStatus: performanceAnalysis.status,
      recommendations: performanceAnalysis.recommendations
    };
  }

  // 计算性能分数
  private static calculatePerformanceScore(metrics: PerformanceMetric[]): {
    score: number;
    status: 'healthy' | 'warning' | 'critical';
    recommendations: string[];
  } {
    let score = 100;
    const recommendations: string[] = [];

    // 检查响应时间
    const responseTimeMetrics = metrics.filter(m => m.name.includes('response_time'));
    if (responseTimeMetrics.length > 0) {
      const avgResponseTime = responseTimeMetrics.reduce((sum, m) => sum + m.value, 0) / responseTimeMetrics.length;
      if (avgResponseTime > 3000) {
        score -= 30;
        recommendations.push('API响应时间过长，建议优化数据库查询和缓存策略');
      } else if (avgResponseTime > 1000) {
        score -= 15;
        recommendations.push('API响应时间偏高，建议检查性能瓶颈');
      }
    }

    // 检查错误率
    const errorMetrics = metrics.filter(m => m.name.includes('error'));
    const totalRequests = metrics.filter(m => m.name.includes('response_time')).length;
    if (totalRequests > 0) {
      const errorRate = (errorMetrics.length / totalRequests) * 100;
      if (errorRate > 10) {
        score -= 40;
        recommendations.push('错误率过高，需要立即检查系统稳定性');
      } else if (errorRate > 5) {
        score -= 20;
        recommendations.push('错误率偏高，建议检查错误日志');
      }
    }

    // 检查内存使用
    const memoryUsage = this.getMemoryUsage();
    if (memoryUsage > 0) {
      const memoryMB = memoryUsage / (1024 * 1024);
      if (memoryMB > 500) {
        score -= 20;
        recommendations.push('内存使用量过高，建议优化内存管理');
      } else if (memoryMB > 300) {
        score -= 10;
        recommendations.push('内存使用量偏高，建议监控内存泄漏');
      }
    }

    // 检查图像处理性能
    const imageMetrics = metrics.filter(m => m.name.includes('image.processing'));
    if (imageMetrics.length > 0) {
      const avgImageTime = imageMetrics.reduce((sum, m) => sum + m.value, 0) / imageMetrics.length;
      if (avgImageTime > 15000) {
        score -= 25;
        recommendations.push('图像处理时间过长，建议优化处理算法或增加缓存');
      } else if (avgImageTime > 8000) {
        score -= 10;
        recommendations.push('图像处理时间偏长，建议检查处理效率');
      }
    }

    // 检查批量操作性能
    const batchMetrics = metrics.filter(m => m.name.includes('batch.'));
    if (batchMetrics.length > 0) {
      const avgBatchTime = batchMetrics.reduce((sum, m) => sum + m.value, 0) / batchMetrics.length;
      if (avgBatchTime > 120000) {
        score -= 20;
        recommendations.push('批量操作时间过长，建议优化并发处理');
      }
    }

    // 确保分数在0-100范围内
    score = Math.max(0, Math.min(100, score));

    // 确定健康状态
    let status: 'healthy' | 'warning' | 'critical';
    if (score >= 80) {
      status = 'healthy';
    } else if (score >= 60) {
      status = 'warning';
    } else {
      status = 'critical';
    }

    return { score, status, recommendations };
  }

  // 获取详细的性能分析报告
  static getPerformanceReport(timeRange?: { start: Date; end: Date }): {
    summary: {
      totalRequests: number;
      averageResponseTime: number;
      errorRate: number;
      throughput: number;
    };
    trends: {
      responseTimeTrend: Array<{ time: Date; value: number }>;
      errorRateTrend: Array<{ time: Date; value: number }>;
      throughputTrend: Array<{ time: Date; value: number }>;
    };
    bottlenecks: Array<{
      operation: string;
      averageTime: number;
      count: number;
      impact: 'high' | 'medium' | 'low';
    }>;
    recommendations: string[];
  } {
    let filteredMetrics = this.metrics;

    if (timeRange) {
      filteredMetrics = filteredMetrics.filter(m => 
        m.timestamp >= timeRange.start && m.timestamp <= timeRange.end
      );
    }

    // 计算摘要统计
    const responseTimeMetrics = filteredMetrics.filter(m => m.name.includes('response_time'));
    const errorMetrics = filteredMetrics.filter(m => m.name.includes('error'));
    
    const totalRequests = responseTimeMetrics.length;
    const averageResponseTime = totalRequests > 0 
      ? responseTimeMetrics.reduce((sum, m) => sum + m.value, 0) / totalRequests 
      : 0;
    const errorRate = totalRequests > 0 ? (errorMetrics.length / totalRequests) * 100 : 0;
    
    // 计算吞吐量（每分钟请求数）
    const timeSpanMinutes = timeRange 
      ? (timeRange.end.getTime() - timeRange.start.getTime()) / (1000 * 60)
      : 60; // 默认1小时
    const throughput = totalRequests / timeSpanMinutes;

    // 计算趋势数据
    const trends = this.calculateTrends(filteredMetrics);

    // 识别性能瓶颈
    const bottlenecks = this.identifyBottlenecks(filteredMetrics);

    // 生成建议
    const recommendations = this.generateRecommendations(filteredMetrics);

    return {
      summary: {
        totalRequests,
        averageResponseTime,
        errorRate,
        throughput
      },
      trends,
      bottlenecks,
      recommendations
    };
  }

  // 计算趋势数据
  private static calculateTrends(metrics: PerformanceMetric[]): {
    responseTimeTrend: Array<{ time: Date; value: number }>;
    errorRateTrend: Array<{ time: Date; value: number }>;
    throughputTrend: Array<{ time: Date; value: number }>;
  } {
    // 按5分钟间隔分组数据
    const intervalMs = 5 * 60 * 1000; // 5分钟
    const groups = new Map<number, PerformanceMetric[]>();

    metrics.forEach(metric => {
      const intervalKey = Math.floor(metric.timestamp.getTime() / intervalMs) * intervalMs;
      if (!groups.has(intervalKey)) {
        groups.set(intervalKey, []);
      }
      groups.get(intervalKey)!.push(metric);
    });

    const responseTimeTrend: Array<{ time: Date; value: number }> = [];
    const errorRateTrend: Array<{ time: Date; value: number }> = [];
    const throughputTrend: Array<{ time: Date; value: number }> = [];

    Array.from(groups.entries()).sort(([a], [b]) => a - b).forEach(([timestamp, groupMetrics]) => {
      const time = new Date(timestamp);
      
      // 响应时间趋势
      const responseMetrics = groupMetrics.filter(m => m.name.includes('response_time'));
      if (responseMetrics.length > 0) {
        const avgResponseTime = responseMetrics.reduce((sum, m) => sum + m.value, 0) / responseMetrics.length;
        responseTimeTrend.push({ time, value: avgResponseTime });
      }

      // 错误率趋势
      const errorMetrics = groupMetrics.filter(m => m.name.includes('error'));
      const errorRate = responseMetrics.length > 0 ? (errorMetrics.length / responseMetrics.length) * 100 : 0;
      errorRateTrend.push({ time, value: errorRate });

      // 吞吐量趋势
      const throughput = responseMetrics.length / 5; // 每分钟请求数
      throughputTrend.push({ time, value: throughput });
    });

    return { responseTimeTrend, errorRateTrend, throughputTrend };
  }

  // 识别性能瓶颈
  private static identifyBottlenecks(metrics: PerformanceMetric[]): Array<{
    operation: string;
    averageTime: number;
    count: number;
    impact: 'high' | 'medium' | 'low';
  }> {
    const operationStats = new Map<string, { times: number[]; count: number }>();

    metrics.filter(m => m.name.includes('execution_time') || m.name.includes('processing_time'))
      .forEach(metric => {
        const operation = metric.name.replace(/\.(execution_time|processing_time)$/, '');
        if (!operationStats.has(operation)) {
          operationStats.set(operation, { times: [], count: 0 });
        }
        const stats = operationStats.get(operation)!;
        stats.times.push(metric.value);
        stats.count++;
      });

    return Array.from(operationStats.entries())
      .map(([operation, stats]) => {
        const averageTime = stats.times.reduce((sum, time) => sum + time, 0) / stats.times.length;
        let impact: 'high' | 'medium' | 'low';
        
        if (averageTime > 5000 && stats.count > 10) {
          impact = 'high';
        } else if (averageTime > 2000 || stats.count > 50) {
          impact = 'medium';
        } else {
          impact = 'low';
        }

        return {
          operation,
          averageTime,
          count: stats.count,
          impact
        };
      })
      .sort((a, b) => {
        // 按影响程度和平均时间排序
        const impactWeight = { high: 3, medium: 2, low: 1 };
        return (impactWeight[b.impact] * b.averageTime) - (impactWeight[a.impact] * a.averageTime);
      })
      .slice(0, 10); // 返回前10个瓶颈
  }

  // 生成性能优化建议
  private static generateRecommendations(metrics: PerformanceMetric[]): string[] {
    const recommendations: string[] = [];
    
    // 分析缓存命中率
    const cacheHits = metrics.filter(m => m.name.includes('cache_hit')).length;
    const cacheMisses = metrics.filter(m => m.name.includes('cache_miss')).length;
    if (cacheHits + cacheMisses > 0) {
      const hitRate = cacheHits / (cacheHits + cacheMisses);
      if (hitRate < 0.7) {
        recommendations.push('缓存命中率较低，建议优化缓存策略或增加缓存时间');
      }
    }

    // 分析数据库查询性能
    const dbMetrics = metrics.filter(m => m.name.includes('database'));
    if (dbMetrics.length > 0) {
      const avgDbTime = dbMetrics.reduce((sum, m) => sum + m.value, 0) / dbMetrics.length;
      if (avgDbTime > 1000) {
        recommendations.push('数据库查询时间过长，建议添加索引或优化查询语句');
      }
    }

    // 分析并发处理
    const batchMetrics = metrics.filter(m => m.name.includes('batch'));
    if (batchMetrics.length > 0) {
      const avgBatchTime = batchMetrics.reduce((sum, m) => sum + m.value, 0) / batchMetrics.length;
      if (avgBatchTime > 60000) {
        recommendations.push('批量处理时间过长，建议增加并发数或优化处理逻辑');
      }
    }

    // 分析错误模式
    const errorMetrics = metrics.filter(m => m.name.includes('error'));
    if (errorMetrics.length > 0) {
      const errorTypes = new Map<string, number>();
      errorMetrics.forEach(m => {
        const errorType = m.context?.code || 'unknown';
        errorTypes.set(errorType, (errorTypes.get(errorType) || 0) + 1);
      });
      
      const topError = Array.from(errorTypes.entries())
        .sort(([,a], [,b]) => b - a)[0];
      
      if (topError && topError[1] > 5) {
        recommendations.push(`频繁出现 ${topError[0]} 错误，建议重点排查此类问题`);
      }
    }

    return recommendations;
  }
}

// 装饰器用于自动性能监控
export function monitor(metricName?: string) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    const name = metricName || `${target.constructor.name}.${propertyKey}`;

    descriptor.value = async function (...args: any[]) {
      return PerformanceMonitor.measureAsync(name, () => originalMethod.apply(this, args));
    };

    return descriptor;
  };
}

// 中间件用于API性能监控
export function createPerformanceMiddleware() {
  return (req: Request, res: Response, next: () => void) => {
    const startTime = performance.now();
    const url = new URL(req.url).pathname;

    // 监听响应完成
    if ('on' in res) {
      (res as any).on('finish', () => {
        const endTime = performance.now();
        const responseTime = endTime - startTime;

        PerformanceMonitor.recordMetric({
          name: 'api.response_time',
          value: responseTime,
          unit: 'ms',
          timestamp: new Date(),
          context: {
            method: req.method,
          url,
          status: res.status,
          userAgent: req.headers.get('user-agent')
        }
      });
      });
    }

    next();
  };
}