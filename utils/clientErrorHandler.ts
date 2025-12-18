import { ErrorCode } from '@/types/database';

// 客户端错误处理类型
export interface ClientError {
  code: ErrorCode;
  message: string;
  userMessage: string;
  timestamp: Date;
  context?: Record<string, any>;
}

// 错误显示类型
export type ErrorDisplayType = 'toast' | 'modal' | 'inline' | 'banner';

// 错误通知接口
export interface ErrorNotification {
  id: string;
  type: ErrorDisplayType;
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'error' | 'success';
  duration?: number;
  actions?: Array<{
    label: string;
    action: () => void;
    primary?: boolean;
  }>;
}

export class ClientErrorHandler {
  private static notifications: ErrorNotification[] = [];
  private static listeners: Array<(notifications: ErrorNotification[]) => void> = [];
  private static retryCallbacks = new Map<string, () => Promise<void>>();

  // 处理API错误响应
  static async handleApiError(response: Response, retryCallback?: () => Promise<void>): Promise<ClientError> {
    let errorData: any;
    
    try {
      errorData = await response.json();
    } catch {
      errorData = {
        error: {
          code: ErrorCode.NETWORK_ERROR,
          message: '网络请求失败',
          timestamp: new Date()
        }
      };
    }

    const clientError: ClientError = {
      code: errorData.error?.code || ErrorCode.DATABASE_ERROR,
      message: errorData.error?.originalMessage || errorData.error?.message || '未知错误',
      userMessage: errorData.error?.message || this.getUserFriendlyMessage(errorData.error?.code),
      timestamp: new Date(errorData.error?.timestamp || Date.now()),
      context: {
        status: response.status,
        url: response.url,
        ...errorData.error?.details
      }
    };

    // 显示错误通知
    this.showErrorNotification(clientError, retryCallback);

    return clientError;
  }

  // 处理JavaScript错误
  static handleJavaScriptError(error: Error, context?: Record<string, any>): ClientError {
    const clientError: ClientError = {
      code: ErrorCode.DATABASE_ERROR,
      message: error.message,
      userMessage: '页面出现错误，请刷新后重试',
      timestamp: new Date(),
      context: {
        stack: error.stack,
        name: error.name,
        ...context
      }
    };

    this.showErrorNotification(clientError);
    
    // 发送错误到服务器进行记录
    this.reportErrorToServer(clientError).catch(() => {
      // 静默失败，避免无限循环
    });

    return clientError;
  }

  // 显示错误通知
  private static showErrorNotification(error: ClientError, retryCallback?: () => Promise<void>): void {
    const notification: ErrorNotification = {
      id: `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: this.getDisplayType(error.code),
      title: this.getErrorTitle(error.code),
      message: error.userMessage,
      severity: this.getErrorSeverity(error.code),
      duration: this.getDisplayDuration(error.code),
      actions: this.getErrorActions(error, retryCallback)
    };

    this.addNotification(notification);
  }

  private static getDisplayType(code: ErrorCode): ErrorDisplayType {
    switch (code) {
      case ErrorCode.NETWORK_ERROR:
      case ErrorCode.DATABASE_ERROR:
        return 'banner';
      case ErrorCode.UNAUTHORIZED:
      case ErrorCode.ADMIN_ACCESS_DENIED:
        return 'modal';
      case ErrorCode.VALIDATION_ERROR:
        return 'inline';
      default:
        return 'toast';
    }
  }

  private static getErrorTitle(code: ErrorCode): string {
    const titles = {
      [ErrorCode.NETWORK_ERROR]: '网络错误',
      [ErrorCode.DATABASE_ERROR]: '系统错误',
      [ErrorCode.UNAUTHORIZED]: '登录过期',
      [ErrorCode.ADMIN_ACCESS_DENIED]: '权限不足',
      [ErrorCode.VALIDATION_ERROR]: '输入错误',
      [ErrorCode.BATCH_LIMIT_EXCEEDED]: '操作限制',
      [ErrorCode.EDIT_OPERATION_FAILED]: '编辑失败',
      [ErrorCode.SHARE_PLATFORM_ERROR]: '分享失败',
      [ErrorCode.IMAGE_SEARCH_API_ERROR]: '搜索失败',
      [ErrorCode.MOBILE_OPTIMIZATION_ERROR]: '加载错误',
      [ErrorCode.HISTORY_NOT_FOUND]: '数据不存在',
      [ErrorCode.NOT_FOUND]: '未找到'
    };
    return titles[code] || '错误';
  }

  private static getErrorSeverity(code: ErrorCode): ErrorNotification['severity'] {
    switch (code) {
      case ErrorCode.VALIDATION_ERROR:
      case ErrorCode.HISTORY_NOT_FOUND:
        return 'warning';
      case ErrorCode.NETWORK_ERROR:
      case ErrorCode.DATABASE_ERROR:
      case ErrorCode.UNAUTHORIZED:
      case ErrorCode.ADMIN_ACCESS_DENIED:
        return 'error';
      default:
        return 'warning';
    }
  }

  private static getDisplayDuration(code: ErrorCode): number {
    switch (code) {
      case ErrorCode.VALIDATION_ERROR:
        return 3000;
      case ErrorCode.NETWORK_ERROR:
      case ErrorCode.DATABASE_ERROR:
        return 0; // 不自动消失
      default:
        return 5000;
    }
  }

  private static getErrorActions(error: ClientError, retryCallback?: () => Promise<void>): ErrorNotification['actions'] {
    const actions: ErrorNotification['actions'] = [];

    // 添加重试按钮
    if (retryCallback && this.isRetryableError(error.code)) {
      const retryId = `retry-${error.timestamp.getTime()}`;
      this.retryCallbacks.set(retryId, retryCallback);
      
      actions.push({
        label: '重试',
        action: () => this.handleRetry(retryId),
        primary: true
      });
    }

    // 添加刷新页面按钮
    if (this.isPageRefreshNeeded(error.code)) {
      actions.push({
        label: '刷新页面',
        action: () => window.location.reload()
      });
    }

    // 添加登录按钮
    if (error.code === ErrorCode.UNAUTHORIZED) {
      actions.push({
        label: '重新登录',
        action: () => window.location.href = '/auth',
        primary: true
      });
    }

    return actions.length > 0 ? actions : undefined;
  }

  private static isRetryableError(code: ErrorCode): boolean {
    return [
      ErrorCode.NETWORK_ERROR,
      ErrorCode.IMAGE_SEARCH_API_ERROR,
      ErrorCode.SHARE_PLATFORM_ERROR,
      ErrorCode.EDIT_OPERATION_FAILED
    ].includes(code);
  }

  private static isPageRefreshNeeded(code: ErrorCode): boolean {
    return [
      ErrorCode.DATABASE_ERROR,
      ErrorCode.MOBILE_OPTIMIZATION_ERROR
    ].includes(code);
  }

  private static async handleRetry(retryId: string): Promise<void> {
    const retryCallback = this.retryCallbacks.get(retryId);
    if (retryCallback) {
      try {
        await retryCallback();
        // 重试成功，移除错误通知
        this.removeNotificationsByType('error');
      } catch (error) {
        // 重试失败，显示新的错误
        if (error instanceof Error) {
          this.handleJavaScriptError(error, { retry: true });
        }
      } finally {
        this.retryCallbacks.delete(retryId);
      }
    }
  }

  // 通知管理
  private static addNotification(notification: ErrorNotification): void {
    this.notifications.push(notification);
    this.notifyListeners();

    // 自动移除通知
    if (notification.duration && notification.duration > 0) {
      setTimeout(() => {
        this.removeNotification(notification.id);
      }, notification.duration);
    }
  }

  static removeNotification(id: string): void {
    this.notifications = this.notifications.filter(n => n.id !== id);
    this.notifyListeners();
  }

  private static removeNotificationsByType(severity: ErrorNotification['severity']): void {
    this.notifications = this.notifications.filter(n => n.severity !== severity);
    this.notifyListeners();
  }

  static clearAllNotifications(): void {
    this.notifications = [];
    this.notifyListeners();
  }

  static getNotifications(): ErrorNotification[] {
    return [...this.notifications];
  }

  // 监听器管理
  static addListener(listener: (notifications: ErrorNotification[]) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private static notifyListeners(): void {
    this.listeners.forEach(listener => {
      try {
        listener([...this.notifications]);
      } catch (error) {
        console.error('Error in notification listener:', error);
      }
    });
  }

  // 获取用户友好的错误消息
  private static getUserFriendlyMessage(code?: ErrorCode): string {
    if (!code) return '发生未知错误';
    
    const messages = {
      [ErrorCode.HISTORY_NOT_FOUND]: '未找到相关记录',
      [ErrorCode.NOT_FOUND]: '未找到相关内容',
      [ErrorCode.BATCH_LIMIT_EXCEEDED]: '操作数量超出限制，请减少数量或升级账户',
      [ErrorCode.EDIT_OPERATION_FAILED]: '编辑操作失败，请重试',
      [ErrorCode.SHARE_PLATFORM_ERROR]: '分享失败，请检查网络连接',
      [ErrorCode.MOBILE_OPTIMIZATION_ERROR]: '页面加载出现问题，请刷新重试',
      [ErrorCode.ADMIN_ACCESS_DENIED]: '您没有执行此操作的权限',
      [ErrorCode.IMAGE_SEARCH_API_ERROR]: '搜索服务暂时不可用，请稍后重试',
      [ErrorCode.NETWORK_ERROR]: '网络连接失败，请检查网络设置',
      [ErrorCode.DATABASE_ERROR]: '系统暂时不可用，请稍后重试',
      [ErrorCode.UNAUTHORIZED]: '登录已过期，请重新登录',
      [ErrorCode.VALIDATION_ERROR]: '输入信息有误，请检查后重试'
    };
    
    return messages[code] || '发生未知错误，请联系客服';
  }

  // 发送错误到服务器
  private static async reportErrorToServer(error: ClientError): Promise<void> {
    try {
      await fetch('/api/performance/metrics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: 'client.error.count',
          value: 1,
          unit: 'count',
          context: {
            code: error.code,
            message: error.message,
            userAgent: navigator.userAgent,
            url: window.location.href,
            timestamp: error.timestamp,
            ...error.context
          }
        })
      });
    } catch {
      // 静默失败
    }
  }

  // 全局错误处理器设置
  static setupGlobalErrorHandlers(): void {
    // 处理未捕获的JavaScript错误
    window.addEventListener('error', (event) => {
      this.handleJavaScriptError(event.error || new Error(event.message), {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      });
    });

    // 处理未捕获的Promise拒绝
    window.addEventListener('unhandledrejection', (event) => {
      const error = event.reason instanceof Error 
        ? event.reason 
        : new Error(String(event.reason));
      
      this.handleJavaScriptError(error, {
        type: 'unhandledrejection'
      });
    });
  }

  // 创建API调用包装器
  static wrapApiCall<T>(
    apiCall: () => Promise<T>,
    retryCallback?: () => Promise<T>
  ): Promise<T> {
    return apiCall().catch(async (error) => {
      if (error instanceof Response) {
        await this.handleApiError(error, retryCallback as any);
        throw error;
      } else if (error instanceof Error) {
        this.handleJavaScriptError(error, { apiCall: true });
        throw error;
      } else {
        const jsError = new Error(String(error));
        this.handleJavaScriptError(jsError, { apiCall: true });
        throw jsError;
      }
    });
  }
}

// React Hook for error notifications (to be used in React components)
// Note: Import React in the component that uses this hook
export function useErrorNotifications() {
  // This will be implemented in the component that uses it
  // since we can't import React in a utility file
  return {
    notifications: [],
    removeNotification: ClientErrorHandler.removeNotification,
    clearAll: ClientErrorHandler.clearAllNotifications
  };
}