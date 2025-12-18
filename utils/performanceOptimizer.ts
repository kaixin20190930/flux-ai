import { PerformanceMonitor } from './performanceMonitor';

// 图像处理优化
export class ImageProcessingOptimizer {
  private static cache = new Map<string, { data: any; timestamp: number }>();
  private static readonly CACHE_TTL = 30 * 60 * 1000; // 30分钟

  // 优化图像处理缓存
  static async processWithCache<T>(
    key: string,
    processor: () => Promise<T>,
    ttl: number = this.CACHE_TTL
  ): Promise<T> {
    return PerformanceMonitor.measureAsync(
      'image.processing_with_cache',
      async () => {
        // 检查缓存
        const cached = this.cache.get(key);
        if (cached && Date.now() - cached.timestamp < ttl) {
          PerformanceMonitor.recordCustomMetric('image.cache_hit', 1);
          return cached.data;
        }

        // 处理并缓存结果
        const result = await processor();
        this.cache.set(key, { data: result, timestamp: Date.now() });
        
        PerformanceMonitor.recordCustomMetric('image.cache_miss', 1);
        return result;
      },
      { cacheKey: key }
    );
  }

  // 批量图像处理优化
  static async processBatch<T>(
    items: any[],
    processor: (item: any) => Promise<T>,
    options: {
      concurrency?: number;
      batchSize?: number;
      onProgress?: (completed: number, total: number) => void;
    } = {}
  ): Promise<T[]> {
    const { concurrency = 3, batchSize = 10, onProgress } = options;
    
    return PerformanceMonitor.measureAsync(
      'image.batch_processing',
      async () => {
        const results: T[] = [];
        const batches = this.createBatches(items, batchSize);
        
        for (let i = 0; i < batches.length; i++) {
          const batch = batches[i];
          
          // 并发处理批次内的项目
          const batchPromises = batch.map(item => 
            this.processWithRetry(processor, item, 3)
          );
          
          const batchResults = await this.limitConcurrency(batchPromises, concurrency);
          results.push(...batchResults);
          
          // 报告进度
          if (onProgress) {
            onProgress(results.length, items.length);
          }
          
          // 记录批次完成指标
          PerformanceMonitor.recordCustomMetric(
            'image.batch_completed',
            1,
            'count',
            { batchIndex: i, batchSize: batch.length }
          );
        }
        
        return results;
      },
      { totalItems: items.length, concurrency, batchSize }
    );
  }

  // 限制并发数
  private static async limitConcurrency<T>(
    promises: Promise<T>[],
    limit: number
  ): Promise<T[]> {
    const results: T[] = [];
    const executing: Promise<void>[] = [];

    for (const promise of promises) {
      const p = promise.then(result => {
        results.push(result);
      });

      executing.push(p);

      if (executing.length >= limit) {
        await Promise.race(executing);
        executing.splice(executing.findIndex(p => p === promise), 1);
      }
    }

    await Promise.all(executing);
    return results;
  }

  // 重试机制
  private static async processWithRetry<T>(
    processor: (item: any) => Promise<T>,
    item: any,
    maxRetries: number
  ): Promise<T> {
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await processor(item);
      } catch (error) {
        lastError = error as Error;
        
        if (attempt < maxRetries) {
          // 指数退避
          const delay = Math.pow(2, attempt - 1) * 1000;
          await new Promise(resolve => setTimeout(resolve, delay));
          
          PerformanceMonitor.recordCustomMetric(
            'image.processing_retry',
            1,
            'count',
            { attempt, delay }
          );
        }
      }
    }
    
    throw lastError;
  }

  // 创建批次
  private static createBatches<T>(items: T[], batchSize: number): T[][] {
    const batches: T[][] = [];
    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize));
    }
    return batches;
  }

  // 清理过期缓存
  static cleanupCache(): void {
    const now = Date.now();
    let cleanedCount = 0;
    
    for (const [key, value] of Array.from(this.cache.entries())) {
      if (now - value.timestamp > this.CACHE_TTL) {
        this.cache.delete(key);
        cleanedCount++;
      }
    }
    
    PerformanceMonitor.recordCustomMetric(
      'image.cache_cleanup',
      cleanedCount,
      'count'
    );
  }

  // 获取缓存统计
  static getCacheStats(): {
    size: number;
    hitRate: number;
    memoryUsage: number;
  } {
    const size = this.cache.size;
    const memoryUsage = JSON.stringify(Array.from(this.cache.entries())).length;
    
    // 计算命中率（基于最近的指标）
    const recentMetrics = PerformanceMonitor.getRecentMetrics(100);
    const hits = recentMetrics.filter(m => m.name === 'image.cache_hit').length;
    const misses = recentMetrics.filter(m => m.name === 'image.cache_miss').length;
    const hitRate = hits + misses > 0 ? hits / (hits + misses) : 0;
    
    return { size, hitRate, memoryUsage };
  }
}

// 批量操作优化器
export class BatchOperationOptimizer {
  private static activeJobs = new Map<string, {
    startTime: number;
    progress: number;
    estimatedCompletion: number;
  }>();

  // 优化批量任务调度
  static async scheduleBatchJob<T>(
    jobId: string,
    items: any[],
    processor: (item: any, index: number) => Promise<T>,
    options: {
      priority?: 'low' | 'normal' | 'high';
      maxConcurrency?: number;
      onProgress?: (progress: number, eta: number) => void;
    } = {}
  ): Promise<T[]> {
    const { priority = 'normal', maxConcurrency = 5, onProgress } = options;
    
    return PerformanceMonitor.measureAsync(
      'batch.job_execution',
      async () => {
        const startTime = Date.now();
        this.activeJobs.set(jobId, {
          startTime,
          progress: 0,
          estimatedCompletion: 0
        });

        try {
          const results: T[] = [];
          const semaphore = new Semaphore(maxConcurrency);
          
          const promises = items.map(async (item, index) => {
            await semaphore.acquire();
            
            try {
              const result = await processor(item, index);
              
              // 更新进度
              const completed = index + 1;
              const progress = completed / items.length;
              const elapsed = Date.now() - startTime;
              const eta = elapsed / progress - elapsed;
              
              this.activeJobs.set(jobId, {
                startTime,
                progress,
                estimatedCompletion: eta
              });
              
              if (onProgress) {
                onProgress(progress, eta);
              }
              
              PerformanceMonitor.recordCustomMetric(
                'batch.item_completed',
                1,
                'count',
                { jobId, index, progress }
              );
              
              return result;
            } finally {
              semaphore.release();
            }
          });
          
          const allResults = await Promise.all(promises);
          results.push(...allResults);
          
          return results;
        } finally {
          this.activeJobs.delete(jobId);
        }
      },
      { jobId, itemCount: items.length, priority }
    );
  }

  // 获取活跃任务状态
  static getActiveJobStatus(jobId: string): {
    progress: number;
    estimatedCompletion: number;
    elapsedTime: number;
  } | null {
    const job = this.activeJobs.get(jobId);
    if (!job) return null;
    
    return {
      progress: job.progress,
      estimatedCompletion: job.estimatedCompletion,
      elapsedTime: Date.now() - job.startTime
    };
  }

  // 获取所有活跃任务
  static getAllActiveJobs(): Array<{
    jobId: string;
    progress: number;
    estimatedCompletion: number;
    elapsedTime: number;
  }> {
    return Array.from(this.activeJobs.entries()).map(([jobId, job]) => ({
      jobId,
      progress: job.progress,
      estimatedCompletion: job.estimatedCompletion,
      elapsedTime: Date.now() - job.startTime
    }));
  }

  // 取消批量任务
  static cancelJob(jobId: string): boolean {
    return this.activeJobs.delete(jobId);
  }
}

// 信号量实现用于控制并发
class Semaphore {
  private permits: number;
  private waitQueue: Array<() => void> = [];

  constructor(permits: number) {
    this.permits = permits;
  }

  async acquire(): Promise<void> {
    if (this.permits > 0) {
      this.permits--;
      return Promise.resolve();
    }

    return new Promise<void>(resolve => {
      this.waitQueue.push(resolve);
    });
  }

  release(): void {
    this.permits++;
    if (this.waitQueue.length > 0) {
      const resolve = this.waitQueue.shift()!;
      this.permits--;
      resolve();
    }
  }
}

// 数据库查询优化器
export class DatabaseOptimizer {
  private static queryCache = new Map<string, {
    result: any;
    timestamp: number;
    ttl: number;
  }>();

  // 缓存查询结果
  static async cacheQuery<T>(
    key: string,
    query: () => Promise<T>,
    ttl: number = 5 * 60 * 1000 // 5分钟默认TTL
  ): Promise<T> {
    return PerformanceMonitor.measureAsync(
      'database.cached_query',
      async () => {
        const cached = this.queryCache.get(key);
        if (cached && Date.now() - cached.timestamp < cached.ttl) {
          PerformanceMonitor.recordCustomMetric('database.cache_hit', 1);
          return cached.result;
        }

        const result = await query();
        this.queryCache.set(key, {
          result,
          timestamp: Date.now(),
          ttl
        });

        PerformanceMonitor.recordCustomMetric('database.cache_miss', 1);
        return result;
      },
      { cacheKey: key, ttl }
    );
  }

  // 批量查询优化
  static async batchQuery<T>(
    queries: Array<() => Promise<T>>,
    maxConcurrency: number = 10
  ): Promise<T[]> {
    return PerformanceMonitor.measureAsync(
      'database.batch_query',
      async () => {
        const results: T[] = [];
        const semaphore = new Semaphore(maxConcurrency);

        const promises = queries.map(async query => {
          await semaphore.acquire();
          try {
            return await query();
          } finally {
            semaphore.release();
          }
        });

        return Promise.all(promises);
      },
      { queryCount: queries.length, maxConcurrency }
    );
  }

  // 清理查询缓存
  static cleanupQueryCache(): void {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [key, value] of Array.from(this.queryCache.entries())) {
      if (now - value.timestamp > value.ttl) {
        this.queryCache.delete(key);
        cleanedCount++;
      }
    }

    PerformanceMonitor.recordCustomMetric(
      'database.cache_cleanup',
      cleanedCount,
      'count'
    );
  }
}

// 自动清理任务
export class PerformanceCleanupService {
  private static cleanupInterval: NodeJS.Timeout | null = null;

  // 启动自动清理
  static startCleanup(intervalMs: number = 10 * 60 * 1000): void { // 10分钟
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }

    this.cleanupInterval = setInterval(() => {
      try {
        ImageProcessingOptimizer.cleanupCache();
        DatabaseOptimizer.cleanupQueryCache();
        
        // 清理旧的性能指标
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        PerformanceMonitor.cleanup(oneHourAgo);
        
        PerformanceMonitor.recordCustomMetric('performance.cleanup_completed', 1);
      } catch (error) {
        console.error('Performance cleanup failed:', error);
      }
    }, intervalMs);
  }

  // 停止自动清理
  static stopCleanup(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }
}