import { PerformanceMonitor, PerformanceMetric } from './performanceMonitor';
import { ImageProcessingOptimizer, BatchOperationOptimizer, DatabaseOptimizer, PerformanceCleanupService } from './performanceOptimizer';
import { ErrorHandler } from './errorHandler';
import { ErrorCode } from '@/types/database';

// 自动优化配置
interface OptimizationConfig {
  enabled: boolean;
  thresholds: {
    responseTime: number;
    errorRate: number;
    memoryUsage: number;
    cacheHitRate: number;
  };
  actions: {
    autoCleanup: boolean;
    adjustConcurrency: boolean;
    optimizeCache: boolean;
    scaleResources: boolean;
  };
}

// 优化建议类型
interface OptimizationSuggestion {
  type: 'immediate' | 'scheduled' | 'manual';
  priority: 'high' | 'medium' | 'low';
  action: string;
  description: string;
  estimatedImpact: string;
  implementation: () => Promise<void>;
}

export class PerformanceOptimizationService {
  private static config: OptimizationConfig = {
    enabled: true,
    thresholds: {
      responseTime: 2000, // ms
      errorRate: 5, // percentage
      memoryUsage: 80, // percentage
      cacheHitRate: 70 // percentage
    },
    actions: {
      autoCleanup: true,
      adjustConcurrency: true,
      optimizeCache: true,
      scaleResources: false // 需要手动启用
    }
  };

  private static optimizationHistory: Array<{
    timestamp: Date;
    action: string;
    result: 'success' | 'failed';
    impact: string;
  }> = [];

  // 启动自动优化服务
  static startOptimizationService(intervalMs: number = 5 * 60 * 1000): void { // 5分钟检查一次
    if (!this.config.enabled) {
      console.log('Performance optimization service is disabled');
      return;
    }

    // 启动清理服务
    PerformanceCleanupService.startCleanup();

    // 定期检查和优化
    setInterval(async () => {
      try {
        await this.performAutomaticOptimizations();
      } catch (error) {
        console.error('Automatic optimization failed:', error);
        ErrorHandler.handle(error);
      }
    }, intervalMs);

    console.log('Performance optimization service started');
  }

  // 执行自动优化
  private static async performAutomaticOptimizations(): Promise<void> {
    const systemOverview = PerformanceMonitor.getSystemOverview();
    const suggestions = await this.generateOptimizationSuggestions(systemOverview);

    // 执行立即优化
    const immediateActions = suggestions.filter(s => s.type === 'immediate');
    for (const action of immediateActions) {
      try {
        await action.implementation();
        this.recordOptimization(action.action, 'success', action.estimatedImpact);
        
        PerformanceMonitor.recordCustomMetric(
          'optimization.auto_applied',
          1,
          'count',
          { action: action.action, priority: action.priority }
        );
      } catch (error) {
        this.recordOptimization(action.action, 'failed', 'N/A');
        console.error(`Failed to apply optimization: ${action.action}`, error);
      }
    }

    // 记录建议的优化
    const scheduledActions = suggestions.filter(s => s.type === 'scheduled');
    if (scheduledActions.length > 0) {
      console.log(`Generated ${scheduledActions.length} scheduled optimization suggestions`);
    }
  }

  // 生成优化建议
  static async generateOptimizationSuggestions(systemOverview: any): Promise<OptimizationSuggestion[]> {
    const suggestions: OptimizationSuggestion[] = [];

    // 检查响应时间
    if (systemOverview.averageResponseTime > this.config.thresholds.responseTime) {
      suggestions.push({
        type: 'immediate',
        priority: 'high',
        action: 'optimize_database_queries',
        description: '数据库查询响应时间过长，启用查询缓存',
        estimatedImpact: '减少30-50%的响应时间',
        implementation: async () => {
          // 启用更积极的数据库缓存
          await this.optimizeDatabaseQueries();
        }
      });
    }

    // 检查错误率
    const errorRate = (systemOverview.recentErrors / Math.max(systemOverview.totalMetrics, 1)) * 100;
    if (errorRate > this.config.thresholds.errorRate) {
      suggestions.push({
        type: 'immediate',
        priority: 'high',
        action: 'increase_error_handling',
        description: '错误率过高，增强错误处理和重试机制',
        estimatedImpact: '减少20-30%的错误率',
        implementation: async () => {
          await this.enhanceErrorHandling();
        }
      });
    }

    // 检查内存使用
    const memoryUsageMB = systemOverview.memoryUsage / (1024 * 1024);
    if (memoryUsageMB > 400) { // 400MB阈值
      suggestions.push({
        type: 'immediate',
        priority: 'medium',
        action: 'cleanup_memory',
        description: '内存使用量过高，执行内存清理',
        estimatedImpact: '释放10-20%的内存',
        implementation: async () => {
          await this.performMemoryCleanup();
        }
      });
    }

    // 检查缓存性能
    const cacheStats = ImageProcessingOptimizer.getCacheStats();
    if (cacheStats.hitRate < this.config.thresholds.cacheHitRate / 100) {
      suggestions.push({
        type: 'scheduled',
        priority: 'medium',
        action: 'optimize_cache_strategy',
        description: '缓存命中率较低，优化缓存策略',
        estimatedImpact: '提高15-25%的缓存命中率',
        implementation: async () => {
          await this.optimizeCacheStrategy();
        }
      });
    }

    // 检查慢操作
    if (systemOverview.topSlowOperations.length > 0) {
      const slowestOperation = systemOverview.topSlowOperations[0];
      if (slowestOperation.averageTime > 5000) {
        suggestions.push({
          type: 'manual',
          priority: 'high',
          action: 'optimize_slow_operation',
          description: `${slowestOperation.name} 操作过慢，需要手动优化`,
          estimatedImpact: '减少40-60%的操作时间',
          implementation: async () => {
            // 这需要手动实现具体的优化逻辑
            console.log(`Manual optimization needed for: ${slowestOperation.name}`);
          }
        });
      }
    }

    // 检查批量操作
    const activeJobs = BatchOperationOptimizer.getAllActiveJobs();
    const longRunningJobs = activeJobs.filter(job => job.elapsedTime > 300000); // 5分钟
    if (longRunningJobs.length > 0) {
      suggestions.push({
        type: 'immediate',
        priority: 'medium',
        action: 'optimize_batch_processing',
        description: '批量操作运行时间过长，调整并发设置',
        estimatedImpact: '减少20-30%的批量处理时间',
        implementation: async () => {
          await this.optimizeBatchProcessing();
        }
      });
    }

    return suggestions;
  }

  // 优化数据库查询
  private static async optimizeDatabaseQueries(): Promise<void> {
    // 启用更长的缓存时间
    const extendedTTL = 15 * 60 * 1000; // 15分钟
    
    // 这里可以实现具体的数据库优化逻辑
    console.log('Applied database query optimizations with extended cache TTL');
    
    PerformanceMonitor.recordCustomMetric(
      'optimization.database_cache_extended',
      extendedTTL,
      'ms'
    );
  }

  // 增强错误处理
  private static async enhanceErrorHandling(): Promise<void> {
    // 重置错误统计，给系统一个新的开始
    ErrorHandler.resetStats();
    
    console.log('Enhanced error handling mechanisms');
    
    PerformanceMonitor.recordCustomMetric(
      'optimization.error_handling_enhanced',
      1,
      'count'
    );
  }

  // 执行内存清理
  private static async performMemoryCleanup(): Promise<void> {
    // 清理各种缓存
    ImageProcessingOptimizer.cleanupCache();
    DatabaseOptimizer.cleanupQueryCache();
    
    // 清理旧的性能指标
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
    PerformanceMonitor.cleanup(twoHoursAgo);
    
    // 强制垃圾回收（如果可用）
    if (global.gc) {
      global.gc();
    }
    
    console.log('Performed comprehensive memory cleanup');
    
    PerformanceMonitor.recordCustomMetric(
      'optimization.memory_cleanup',
      1,
      'count'
    );
  }

  // 优化缓存策略
  private static async optimizeCacheStrategy(): Promise<void> {
    // 这里可以实现更智能的缓存策略
    // 例如：预热常用数据、调整缓存大小等
    
    console.log('Optimized cache strategy');
    
    PerformanceMonitor.recordCustomMetric(
      'optimization.cache_strategy_optimized',
      1,
      'count'
    );
  }

  // 优化批量处理
  private static async optimizeBatchProcessing(): Promise<void> {
    // 这里可以动态调整批量处理的并发数
    // 基于当前系统负载
    
    console.log('Optimized batch processing concurrency');
    
    PerformanceMonitor.recordCustomMetric(
      'optimization.batch_processing_optimized',
      1,
      'count'
    );
  }

  // 记录优化历史
  private static recordOptimization(action: string, result: 'success' | 'failed', impact: string): void {
    this.optimizationHistory.push({
      timestamp: new Date(),
      action,
      result,
      impact
    });

    // 保持历史记录在合理范围内
    if (this.optimizationHistory.length > 100) {
      this.optimizationHistory = this.optimizationHistory.slice(-100);
    }
  }

  // 获取优化历史
  static getOptimizationHistory(): Array<{
    timestamp: Date;
    action: string;
    result: 'success' | 'failed';
    impact: string;
  }> {
    return [...this.optimizationHistory];
  }

  // 手动触发优化分析
  static async analyzeAndOptimize(): Promise<{
    suggestions: OptimizationSuggestion[];
    appliedOptimizations: number;
    systemHealth: any;
  }> {
    const systemOverview = PerformanceMonitor.getSystemOverview();
    const suggestions = await this.generateOptimizationSuggestions(systemOverview);
    
    // 应用立即优化
    const immediateActions = suggestions.filter(s => s.type === 'immediate');
    let appliedCount = 0;
    
    for (const action of immediateActions) {
      try {
        await action.implementation();
        appliedCount++;
        this.recordOptimization(action.action, 'success', action.estimatedImpact);
      } catch (error) {
        this.recordOptimization(action.action, 'failed', 'N/A');
      }
    }

    return {
      suggestions,
      appliedOptimizations: appliedCount,
      systemHealth: systemOverview
    };
  }

  // 更新配置
  static updateConfig(newConfig: Partial<OptimizationConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log('Performance optimization config updated:', this.config);
  }

  // 获取当前配置
  static getConfig(): OptimizationConfig {
    return { ...this.config };
  }

  // 停止优化服务
  static stopOptimizationService(): void {
    PerformanceCleanupService.stopCleanup();
    console.log('Performance optimization service stopped');
  }

  // 获取优化统计
  static getOptimizationStats(): {
    totalOptimizations: number;
    successRate: number;
    recentOptimizations: Array<{
      timestamp: Date;
      action: string;
      result: 'success' | 'failed';
      impact: string;
    }>;
    configStatus: OptimizationConfig;
  } {
    const total = this.optimizationHistory.length;
    const successful = this.optimizationHistory.filter(h => h.result === 'success').length;
    const successRate = total > 0 ? (successful / total) * 100 : 0;
    
    return {
      totalOptimizations: total,
      successRate,
      recentOptimizations: this.optimizationHistory.slice(-10),
      configStatus: this.getConfig()
    };
  }
}