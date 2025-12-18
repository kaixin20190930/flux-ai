/**
 * Worker 日志工具函数
 * Worker Logging Utilities
 */

/**
 * 带时间戳的日志
 */
export function logWithTimestamp(...args: any[]): void {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}]`, ...args);
}
