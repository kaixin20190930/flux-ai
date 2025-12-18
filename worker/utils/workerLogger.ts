/**
 * Cloudflare Worker 日志工具
 * Cloudflare Worker Logging Utility
 * 
 * 提供结构化的日志记录功能
 * Provides structured logging functionality
 */

import { Env } from '../types';

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  data?: any;
  requestId?: string;
  userId?: string;
  operation?: string;
  duration?: number;
}

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export class WorkerLogger {
  private environment: 'development' | 'production';
  private logLevel: LogLevel;
  
  constructor(env: Env) {
    this.environment = env.ENVIRONMENT;
    this.logLevel = (env.LOG_LEVEL as LogLevel) || (env.ENVIRONMENT === 'production' ? 'warn' : 'debug');
  }
  
  /**
   * 记录调试日志
   */
  public debug(message: string, data?: any, context?: Partial<LogEntry>): void {
    this.log('debug', message, data, context);
  }
  
  /**
   * 记录信息日志
   */
  public info(message: string, data?: any, context?: Partial<LogEntry>): void {
    this.log('info', message, data, context);
  }
  
  /**
   * 记录警告日志
   */
  public warn(message: string, data?: any, context?: Partial<LogEntry>): void {
    this.log('warn', message, data, context);
  }
  
  /**
   * 记录错误日志
   */
  public error(message: string, data?: any, context?: Partial<LogEntry>): void {
    this.log('error', message, data, context);
  }
  
  /**
   * 记录请求开始
   */
  public requestStart(requestId: string, method: string, url: string, userId?: string): void {
    this.info('Request started', {
      method,
      url,
      userId
    }, {
      requestId,
      operation: 'request-start'
    });
  }
  
  /**
   * 记录请求结束
   */
  public requestEnd(
    requestId: string,
    method: string,
    url: string,
    status: number,
    duration: number,
    userId?: string
  ): void {
    const level: LogLevel = status >= 500 ? 'error' : status >= 400 ? 'warn' : 'info';
    
    this.log(level, 'Request completed', {
      method,
      url,
      status,
      userId
    }, {
      requestId,
      operation: 'request-end',
      duration
    });
  }
  
  /**
   * 记录认证事件
   */
  public authEvent(
    event: 'login' | 'register' | 'logout' | 'token-verify',
    success: boolean,
    userId?: string,
    requestId?: string,
    details?: any
  ): void {
    const level: LogLevel = success ? 'info' : 'warn';
    
    this.log(level, `Auth event: ${event}`, {
      success,
      ...details
    }, {
      requestId,
      userId,
      operation: `auth-${event}`
    });
  }
  
  /**
   * 记录数据库操作
   */
  public dbOperation(
    operation: string,
    success: boolean,
    duration: number,
    requestId?: string,
    details?: any
  ): void {
    const level: LogLevel = success ? 'debug' : 'error';
    
    this.log(level, `Database operation: ${operation}`, {
      success,
      ...details
    }, {
      requestId,
      operation: `db-${operation}`,
      duration
    });
  }
  
  /**
   * 记录性能指标
   */
  public performance(
    operation: string,
    duration: number,
    requestId?: string,
    metadata?: any
  ): void {
    this.info(`Performance: ${operation}`, {
      duration,
      ...metadata
    }, {
      requestId,
      operation: `perf-${operation}`,
      duration
    });
  }
  
  /**
   * 核心日志记录方法
   */
  private log(level: LogLevel, message: string, data?: any, context?: Partial<LogEntry>): void {
    // 检查日志级别
    if (!this.shouldLog(level)) {
      return;
    }
    
    const logEntry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      data,
      ...context
    };
    
    // 格式化日志输出
    const formattedLog = this.formatLog(logEntry);
    
    // 输出日志
    switch (level) {
      case 'error':
        console.error(formattedLog);
        break;
      case 'warn':
        console.warn(formattedLog);
        break;
      case 'info':
        console.info(formattedLog);
        break;
      case 'debug':
      default:
        console.log(formattedLog);
        break;
    }
  }
  
  /**
   * 检查是否应该记录此级别的日志
   */
  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
    const currentLevelIndex = levels.indexOf(this.logLevel);
    const messageLevelIndex = levels.indexOf(level);
    
    return messageLevelIndex >= currentLevelIndex;
  }
  
  /**
   * 格式化日志输出
   */
  private formatLog(entry: LogEntry): string {
    const parts: string[] = [
      `[${entry.timestamp}]`,
      `[${entry.level.toUpperCase()}]`
    ];
    
    if (entry.requestId) {
      parts.push(`[${entry.requestId}]`);
    }
    
    if (entry.operation) {
      parts.push(`[${entry.operation}]`);
    }
    
    if (entry.userId) {
      parts.push(`[user:${entry.userId}]`);
    }
    
    if (entry.duration !== undefined) {
      parts.push(`[${entry.duration}ms]`);
    }
    
    parts.push(entry.message);
    
    let logString = parts.join(' ');
    
    // 在开发环境中包含数据
    if (this.environment === 'development' && entry.data) {
      logString += '\n' + JSON.stringify(entry.data, null, 2);
    }
    
    return logString;
  }
  
  /**
   * 创建子日志器（带有固定的上下文）
   */
  public createChild(context: Partial<LogEntry>): WorkerLogger {
    const childLogger = Object.create(this);
    const originalLog = this.log.bind(this);
    
    childLogger.log = (level: LogLevel, message: string, data?: any, additionalContext?: Partial<LogEntry>) => {
      const mergedContext = { ...context, ...additionalContext };
      originalLog(level, message, data, mergedContext);
    };
    
    return childLogger;
  }
  
  /**
   * 测量执行时间
   */
  public async measureTime<T>(
    operation: string,
    fn: () => Promise<T>,
    requestId?: string
  ): Promise<T> {
    const startTime = Date.now();
    
    try {
      const result = await fn();
      const duration = Date.now() - startTime;
      
      this.performance(operation, duration, requestId, { success: true });
      
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      
      this.performance(operation, duration, requestId, { 
        success: false,
        error: error instanceof Error ? error.message : String(error)
      });
      
      throw error;
    }
  }
  
  /**
   * 批量日志记录（用于性能优化）
   */
  public batch(entries: Array<{ level: LogLevel; message: string; data?: any; context?: Partial<LogEntry> }>): void {
    entries.forEach(entry => {
      this.log(entry.level, entry.message, entry.data, entry.context);
    });
  }
}