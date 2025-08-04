import { PerformanceCleanupService } from './performanceOptimizer';
import { PerformanceOptimizationService } from './performanceOptimizationService';
import { ClientErrorHandler } from './clientErrorHandler';

// 初始化性能监控系统
export function initializePerformanceMonitoring() {
  // 启动自动清理服务
  PerformanceCleanupService.startCleanup();
  
  // 启动自动优化服务
  PerformanceOptimizationService.startOptimizationService();
  
  // 设置全局错误处理
  if (typeof window !== 'undefined') {
    // 设置客户端错误处理器
    ClientErrorHandler.setupGlobalErrorHandlers();

    // 记录页面性能指标
    window.addEventListener('load', () => {
      setTimeout(() => {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        if (navigation) {
          // 记录页面加载时间
          fetch('/api/performance/metrics', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: 'client.page_load_time',
              value: navigation.loadEventEnd - navigation.fetchStart,
              unit: 'ms',
              context: {
                url: window.location.pathname,
                userAgent: navigator.userAgent
              }
            })
          }).catch(() => {
            // 静默处理指标记录失败
          });

          // 记录DOM内容加载时间
          fetch('/api/performance/metrics', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: 'client.dom_content_loaded',
              value: navigation.domContentLoadedEventEnd - navigation.fetchStart,
              unit: 'ms',
              context: {
                url: window.location.pathname
              }
            })
          }).catch(() => {
            // 静默处理指标记录失败
          });
        }
      }, 0);
    });
  }
}

// 清理性能监控系统
export function cleanupPerformanceMonitoring() {
  PerformanceCleanupService.stopCleanup();
  PerformanceOptimizationService.stopOptimizationService();
}

// 在应用启动时自动初始化
if (typeof window === 'undefined') {
  // 服务器端初始化
  initializePerformanceMonitoring();
}