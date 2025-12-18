/**
 * Cloudflare Worker 错误处理工具
 * Cloudflare Worker Error Handling Utility
 * 
 * 提供统一的错误处理和日志记录
 * Provides unified error handling and logging
 */

import { Env } from '../types';
import { WorkerConfigManager } from './workerConfig';

export interface WorkerError {
  code: string;
  message: string;
  details?: any;
  timestamp: string;
  requestId?: string;
}

export interface ErrorContext {
  operation: string;
  userId?: string;
  requestUrl?: string;
  userAgent?: string;
  ip?: string;
}

export class WorkerErrorHandler {
  private configManager: WorkerConfigManager;
  
  constructor(env: Env) {
    this.configManager = new WorkerConfigManager(env);
  }
  
  /**
   * 处理错误并返回标准化的错误对象
   */
  public handleError(
    error: any,
    context: ErrorContext,
    requestId?: string
  ): WorkerError {
    const timestamp = new Date().toISOString();
    
    // 记录错误日志
    this.logError(error, context, requestId);
    
    // 创建标准化错误响应
    const workerError: WorkerError = {
      code: this.extractErrorCode(error),
      message: this.getUserFriendlyMessage(error),
      timestamp,
      requestId
    };
    
    // 在开发环境中包含详细信息
    if (this.configManager.isDevelopment()) {
      workerError.details = {
        originalMessage: error.message,
        stack: error.stack,
        context
      };
    }
    
    return workerError;
  }
  
  /**
   * 记录错误日志
   */
  private logError(error: any, context: ErrorContext, requestId?: string): void {
    const logData = {
      timestamp: new Date().toISOString(),
      requestId,
      operation: context.operation,
      userId: context.userId,
      error: {
        message: error.message,
        code: this.extractErrorCode(error),
        stack: error.stack
      },
      context: {
        requestUrl: context.requestUrl,
        userAgent: context.userAgent,
        ip: context.ip
      }
    };
    
    this.configManager.log('error', 'Worker error occurred:', logData);
  }
  
  /**
   * 提取错误代码
   */
  private extractErrorCode(error: any): string {
    // 如果错误对象有 code 属性
    if (error.code) {
      return error.code;
    }
    
    // 根据错误类型和消息推断错误代码
    if (error.message) {
      const message = error.message.toLowerCase();
      
      if (message.includes('jwt') || message.includes('token')) {
        return 'TOKEN_ERROR';
      }
      
      if (message.includes('database') || message.includes('d1')) {
        return 'DATABASE_ERROR';
      }
      
      if (message.includes('network') || message.includes('fetch')) {
        return 'NETWORK_ERROR';
      }
      
      if (message.includes('validation') || message.includes('invalid')) {
        return 'VALIDATION_ERROR';
      }
      
      if (message.includes('permission') || message.includes('unauthorized')) {
        return 'PERMISSION_ERROR';
      }
      
      if (message.includes('not found')) {
        return 'NOT_FOUND';
      }
    }
    
    // 默认错误代码
    return 'INTERNAL_ERROR';
  }
  
  /**
   * 获取用户友好的错误消息
   */
  private getUserFriendlyMessage(error: any): string {
    const code = this.extractErrorCode(error);
    
    // 用户友好的错误消息映射
    const friendlyMessages: Record<string, string> = {
      'TOKEN_ERROR': '登录状态已过期，请重新登录',
      'DATABASE_ERROR': '数据库连接失败，请稍后重试',
      'NETWORK_ERROR': '网络连接失败，请检查网络连接',
      'VALIDATION_ERROR': '输入数据格式不正确',
      'PERMISSION_ERROR': '权限不足，无法执行此操作',
      'NOT_FOUND': '请求的资源不存在',
      'AUTHENTICATION_FAILED': '用户名或密码错误',
      'EMAIL_ALREADY_EXISTS': '该邮箱已被注册',
      'USER_NOT_FOUND': '用户不存在',
      'GOOGLE_AUTH_FAILED': 'Google登录失败，请重试',
      'RATE_LIMIT_EXCEEDED': '请求过于频繁，请稍后重试',
      'INTERNAL_ERROR': '服务器内部错误，请稍后重试'
    };
    
    return friendlyMessages[code] || error.message || '未知错误';
  }
  
  /**
   * 创建认证错误
   */
  public createAuthError(message: string, code: string = 'AUTHENTICATION_FAILED'): WorkerError {
    return {
      code,
      message,
      timestamp: new Date().toISOString()
    };
  }
  
  /**
   * 创建验证错误
   */
  public createValidationError(message: string, details?: any): WorkerError {
    const error: WorkerError = {
      code: 'VALIDATION_ERROR',
      message,
      timestamp: new Date().toISOString()
    };
    
    if (this.configManager.isDevelopment() && details) {
      error.details = details;
    }
    
    return error;
  }
  
  /**
   * 创建数据库错误
   */
  public createDatabaseError(message: string, originalError?: any): WorkerError {
    const error: WorkerError = {
      code: 'DATABASE_ERROR',
      message: '数据库操作失败',
      timestamp: new Date().toISOString()
    };
    
    if (this.configManager.isDevelopment() && originalError) {
      error.details = {
        originalMessage: message,
        originalError: originalError.message
      };
    }
    
    return error;
  }
  
  /**
   * 创建权限错误
   */
  public createPermissionError(message: string = '权限不足'): WorkerError {
    return {
      code: 'PERMISSION_ERROR',
      message,
      timestamp: new Date().toISOString()
    };
  }
  
  /**
   * 创建速率限制错误
   */
  public createRateLimitError(retryAfter?: number): WorkerError {
    const error: WorkerError = {
      code: 'RATE_LIMIT_EXCEEDED',
      message: '请求过于频繁，请稍后重试',
      timestamp: new Date().toISOString()
    };
    
    if (retryAfter) {
      error.details = { retryAfter };
    }
    
    return error;
  }
  
  /**
   * 检查是否为已知的错误类型
   */
  public isKnownError(error: any): boolean {
    const knownCodes = [
      'TOKEN_ERROR',
      'DATABASE_ERROR',
      'NETWORK_ERROR',
      'VALIDATION_ERROR',
      'PERMISSION_ERROR',
      'NOT_FOUND',
      'AUTHENTICATION_FAILED',
      'EMAIL_ALREADY_EXISTS',
      'USER_NOT_FOUND',
      'GOOGLE_AUTH_FAILED',
      'RATE_LIMIT_EXCEEDED'
    ];
    
    return knownCodes.includes(this.extractErrorCode(error));
  }
  
  /**
   * 生成请求ID
   */
  public generateRequestId(): string {
    return `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}