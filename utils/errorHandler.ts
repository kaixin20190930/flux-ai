import { AppErrorClass, ErrorCode } from '@/types/database';
import { PerformanceMonitor } from './performanceMonitor';

// 错误严重程度
export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

// 错误分类
export enum ErrorCategory {
  USER_INPUT = 'user_input',
  SYSTEM = 'system',
  NETWORK = 'network',
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  BUSINESS_LOGIC = 'business_logic',
  EXTERNAL_SERVICE = 'external_service'
}

// 错误上下文接口
export interface ErrorContext {
  userId?: string;
  sessionId?: string;
  requestId?: string;
  userAgent?: string;
  ip?: string;
  url?: string;
  method?: string;
  timestamp: Date;
  stackTrace?: string;
  additionalData?: Record<string, any>;
}

export class ErrorHandler {
  private static errorCounts = new Map<ErrorCode, number>();
  private static lastErrorReset = Date.now();
  private static readonly ERROR_RATE_WINDOW = 60 * 1000; // 1分钟窗口

  static handle(error: unknown, context?: Partial<ErrorContext>): AppErrorClass {
    let appError: AppErrorClass;

    if (error instanceof AppErrorClass) {
      appError = error;
    } else if (error instanceof Error) {
      appError = new AppErrorClass({
        code: this.inferErrorCode(error),
        message: error.message,
        details: { 
          originalError: error.name,
          stackTrace: error.stack 
        },
        timestamp: new Date()
      });
    } else {
      appError = new AppErrorClass({
        code: ErrorCode.DATABASE_ERROR,
        message: 'Unknown error occurred',
        details: { error: String(error) },
        timestamp: new Date()
      });
    }

    // 增强错误上下文
    if (context) {
      appError.details = {
        ...appError.details,
        context: {
          ...context,
          timestamp: new Date()
        }
      };
    }

    // 记录错误
    this.logError(appError);
    
    // 发送到监控系统
    this.sendToMonitoring(appError);
    
    // 更新错误统计
    this.updateErrorStats(appError.code);

    return appError;
  }

  static createResponse(error: AppErrorClass, includeDetails: boolean = false): Response {
    const statusCode = this.getStatusCode(error.code);
    const userMessage = this.getUserFriendlyMessage(error.code);
    
    const responseBody: any = {
      error: {
        code: error.code,
        message: userMessage,
        timestamp: error.timestamp
      }
    };

    // 在开发环境或管理员请求中包含详细信息
    if (includeDetails || process.env.NODE_ENV === 'development') {
      responseBody.error.details = error.details;
      responseBody.error.originalMessage = error.message;
    }

    return new Response(JSON.stringify(responseBody), {
      status: statusCode,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  private static getStatusCode(errorCode: ErrorCode): number {
    switch (errorCode) {
      case ErrorCode.UNAUTHORIZED:
        return 401;
      case ErrorCode.ADMIN_ACCESS_DENIED:
        return 403;
      case ErrorCode.HISTORY_NOT_FOUND:
        return 404;
      case ErrorCode.VALIDATION_ERROR:
        return 400;
      case ErrorCode.BATCH_LIMIT_EXCEEDED:
        return 429;
      case ErrorCode.EDIT_OPERATION_FAILED:
      case ErrorCode.SHARE_PLATFORM_ERROR:
      case ErrorCode.IMAGE_SEARCH_API_ERROR:
        return 422;
      case ErrorCode.NETWORK_ERROR:
        return 503;
      case ErrorCode.MOBILE_OPTIMIZATION_ERROR:
      case ErrorCode.DATABASE_ERROR:
      default:
        return 500;
    }
  }

  private static getUserFriendlyMessage(code: ErrorCode): string {
    const messages = {
      [ErrorCode.HISTORY_NOT_FOUND]: '未找到历史记录',
      [ErrorCode.NOT_FOUND]: '未找到相关内容',
      [ErrorCode.BATCH_LIMIT_EXCEEDED]: '批量生成数量超出限制，请减少数量或升级账户',
      [ErrorCode.EDIT_OPERATION_FAILED]: '图像编辑操作失败，请重试',
      [ErrorCode.SHARE_PLATFORM_ERROR]: '分享到社交平台失败，请检查网络连接',
      [ErrorCode.MOBILE_OPTIMIZATION_ERROR]: '移动端加载出现问题，请刷新页面',
      [ErrorCode.ADMIN_ACCESS_DENIED]: '您没有管理员权限',
      [ErrorCode.IMAGE_SEARCH_API_ERROR]: '图片搜索服务暂时不可用，请稍后重试',
      [ErrorCode.NETWORK_ERROR]: '网络连接错误，请检查您的网络设置',
      [ErrorCode.DATABASE_ERROR]: '系统暂时不可用，请稍后重试',
      [ErrorCode.UNAUTHORIZED]: '请先登录',
      [ErrorCode.VALIDATION_ERROR]: '输入信息有误，请检查后重试'
    };
    return messages[code] || '发生未知错误，请联系客服';
  }

  private static getErrorSeverity(code: ErrorCode): ErrorSeverity {
    switch (code) {
      case ErrorCode.VALIDATION_ERROR:
      case ErrorCode.HISTORY_NOT_FOUND:
        return ErrorSeverity.LOW;
      case ErrorCode.BATCH_LIMIT_EXCEEDED:
      case ErrorCode.EDIT_OPERATION_FAILED:
      case ErrorCode.SHARE_PLATFORM_ERROR:
      case ErrorCode.MOBILE_OPTIMIZATION_ERROR:
        return ErrorSeverity.MEDIUM;
      case ErrorCode.UNAUTHORIZED:
      case ErrorCode.ADMIN_ACCESS_DENIED:
      case ErrorCode.IMAGE_SEARCH_API_ERROR:
      case ErrorCode.NETWORK_ERROR:
        return ErrorSeverity.HIGH;
      case ErrorCode.DATABASE_ERROR:
      default:
        return ErrorSeverity.CRITICAL;
    }
  }

  private static getErrorCategory(code: ErrorCode): ErrorCategory {
    switch (code) {
      case ErrorCode.VALIDATION_ERROR:
        return ErrorCategory.USER_INPUT;
      case ErrorCode.UNAUTHORIZED:
        return ErrorCategory.AUTHENTICATION;
      case ErrorCode.ADMIN_ACCESS_DENIED:
        return ErrorCategory.AUTHORIZATION;
      case ErrorCode.BATCH_LIMIT_EXCEEDED:
      case ErrorCode.HISTORY_NOT_FOUND:
        return ErrorCategory.BUSINESS_LOGIC;
      case ErrorCode.NETWORK_ERROR:
        return ErrorCategory.NETWORK;
      case ErrorCode.IMAGE_SEARCH_API_ERROR:
      case ErrorCode.SHARE_PLATFORM_ERROR:
        return ErrorCategory.EXTERNAL_SERVICE;
      case ErrorCode.DATABASE_ERROR:
      case ErrorCode.EDIT_OPERATION_FAILED:
      case ErrorCode.MOBILE_OPTIMIZATION_ERROR:
      default:
        return ErrorCategory.SYSTEM;
    }
  }

  private static inferErrorCode(error: Error): ErrorCode {
    const message = error.message.toLowerCase();
    
    // 检查是否是 Next.js 构建时的动态服务器使用错误
    if (message.includes('dynamic server usage') || 
        message.includes("couldn't be rendered statically") ||
        message.includes('used `headers`') ||
        message.includes('used `cookies`') ||
        message.includes('used `request.')) {
      // 这些是构建时错误，不是真正的数据库错误
      console.warn('Next.js build-time dynamic usage detected:', message);
      return ErrorCode.VALIDATION_ERROR; // 使用较轻的错误级别
    }
    
    if (message.includes('unauthorized') || message.includes('authentication')) {
      return ErrorCode.UNAUTHORIZED;
    }
    if (message.includes('forbidden') || message.includes('access denied')) {
      return ErrorCode.ADMIN_ACCESS_DENIED;
    }
    if (message.includes('not found')) {
      return ErrorCode.HISTORY_NOT_FOUND;
    }
    if (message.includes('validation') || message.includes('invalid')) {
      return ErrorCode.VALIDATION_ERROR;
    }
    if (message.includes('network') || message.includes('connection')) {
      return ErrorCode.NETWORK_ERROR;
    }
    if (message.includes('limit') || message.includes('quota')) {
      return ErrorCode.BATCH_LIMIT_EXCEEDED;
    }
    
    return ErrorCode.DATABASE_ERROR;
  }

  static logError(error: AppErrorClass): void {
    const severity = this.getErrorSeverity(error.code);
    const category = this.getErrorCategory(error.code);
    
    const logData = {
      code: error.code,
      message: error.message,
      severity,
      category,
      details: error.details,
      timestamp: error.timestamp
    };

    // 根据严重程度使用不同的日志级别
    switch (severity) {
      case ErrorSeverity.CRITICAL:
        console.error('🚨 CRITICAL ERROR:', logData);
        break;
      case ErrorSeverity.HIGH:
        console.error('❌ HIGH ERROR:', logData);
        break;
      case ErrorSeverity.MEDIUM:
        console.warn('⚠️ MEDIUM ERROR:', logData);
        break;
      case ErrorSeverity.LOW:
        console.info('ℹ️ LOW ERROR:', logData);
        break;
    }
  }

  private static sendToMonitoring(error: AppErrorClass): void {
    try {
      const severity = this.getErrorSeverity(error.code);
      const category = this.getErrorCategory(error.code);

      // 记录错误指标
      PerformanceMonitor.recordCustomMetric(
        'error.count',
        1,
        'count',
        {
          code: error.code,
          severity,
          category,
          message: error.message
        }
      );

      // 记录错误率
      const errorRate = this.calculateErrorRate();
      PerformanceMonitor.recordCustomMetric(
        'error.rate',
        errorRate,
        'percentage',
        {
          window: this.ERROR_RATE_WINDOW,
          timestamp: new Date()
        }
      );

      // 对于严重错误，发送告警
      if (severity === ErrorSeverity.CRITICAL || severity === ErrorSeverity.HIGH) {
        this.sendAlert(error, severity);
      }

    } catch (monitoringError) {
      console.error('Failed to send error to monitoring:', monitoringError);
    }
  }

  private static updateErrorStats(code: ErrorCode): void {
    // 重置计数器如果超过时间窗口
    const now = Date.now();
    if (now - this.lastErrorReset > this.ERROR_RATE_WINDOW) {
      this.errorCounts.clear();
      this.lastErrorReset = now;
    }

    // 更新错误计数
    const currentCount = this.errorCounts.get(code) || 0;
    this.errorCounts.set(code, currentCount + 1);
  }

  private static calculateErrorRate(): number {
    const totalErrors = Array.from(this.errorCounts.values()).reduce((sum, count) => sum + count, 0);
    // 假设在时间窗口内有一定数量的总请求，这里简化处理
    const estimatedTotalRequests = Math.max(totalErrors * 10, 100);
    return (totalErrors / estimatedTotalRequests) * 100;
  }

  private static sendAlert(error: AppErrorClass, severity: ErrorSeverity): void {
    // 这里可以集成到告警系统，如发送邮件、Slack通知等
    console.log(`🚨 ALERT: ${severity} error occurred`, {
      code: error.code,
      message: error.message,
      timestamp: error.timestamp
    });

    // 可以在这里添加实际的告警逻辑，比如：
    // - 发送邮件给管理员
    // - 发送Slack消息
    // - 调用第三方监控服务API
  }

  // 获取错误统计信息
  static getErrorStats(): {
    totalErrors: number;
    errorsByCode: Record<string, number>;
    errorRate: number;
    topErrors: Array<{ code: ErrorCode; count: number }>;
  } {
    const totalErrors = Array.from(this.errorCounts.values()).reduce((sum, count) => sum + count, 0);
    const errorsByCode: Record<string, number> = {};
    
    this.errorCounts.forEach((count, code) => {
      errorsByCode[code] = count;
    });

    const topErrors = Array.from(this.errorCounts.entries())
      .map(([code, count]) => ({ code, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      totalErrors,
      errorsByCode,
      errorRate: this.calculateErrorRate(),
      topErrors
    };
  }

  // 创建带有上下文的错误处理中间件
  static createErrorMiddleware() {
    return (error: unknown, request?: Request) => {
      const context: Partial<ErrorContext> = {};
      
      if (request) {
        context.url = request.url;
        context.method = request.method;
        context.userAgent = request.headers.get('user-agent') || undefined;
        // 可以从请求中提取更多上下文信息
      }

      return this.handle(error, context);
    };
  }

  // 重置错误统计
  static resetStats(): void {
    this.errorCounts.clear();
    this.lastErrorReset = Date.now();
  }
}

// 导出便捷函数
export function getErrorResponse(error: unknown, context?: Partial<ErrorContext>, includeDetails?: boolean): Response {
  const appError = ErrorHandler.handle(error, context);
  return ErrorHandler.createResponse(appError, includeDetails);
}

export function handleApiError(error: unknown, request?: Request): Response {
  const context: Partial<ErrorContext> = {};
  
  if (request) {
    context.url = request.url;
    context.method = request.method;
    context.userAgent = request.headers.get('user-agent') || undefined;
  }

  return getErrorResponse(error, context, process.env.NODE_ENV === 'development');
}

// 验证工具
export class ValidationUtils {
  static validateUUID(id: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(id);
  }

  static validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  static validatePrompt(prompt: string): boolean {
    return prompt.length > 0 && prompt.length <= 2000;
  }

  static validatePagination(page?: number, limit?: number): { page: number, limit: number } {
    const validPage = Math.max(1, page || 1);
    const validLimit = Math.min(100, Math.max(1, limit || 20));
    
    return { page: validPage, limit: validLimit };
  }
}