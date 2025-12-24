/**
 * Google OAuth 错误类型和错误码定义
 * Google OAuth Error Types and Error Codes
 */

// 错误码枚举
export enum GoogleOAuthErrorCode {
  // Google Token 相关错误
  INVALID_GOOGLE_TOKEN = 'INVALID_GOOGLE_TOKEN',
  GOOGLE_TOKEN_EXPIRED = 'GOOGLE_TOKEN_EXPIRED',
  GOOGLE_AUTH_FAILED = 'GOOGLE_AUTH_FAILED',
  GOOGLE_TOKEN_INVALID = 'GOOGLE_TOKEN_INVALID',
  
  // 邮箱相关错误
  EMAIL_MISMATCH = 'EMAIL_MISMATCH',
  EMAIL_EXISTS = 'EMAIL_EXISTS',
  EMAIL_NOT_VERIFIED = 'EMAIL_NOT_VERIFIED',
  
  // 网络相关错误
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  
  // 服务器相关错误
  SERVER_ERROR = 'SERVER_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  
  // 用户相关错误
  USER_NOT_FOUND = 'USER_NOT_FOUND',
  USER_CANCELLED = 'USER_CANCELLED',
  
  // 未知错误
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

// 错误消息映射类型
export interface ErrorMessages {
  [key: string]: string;
}

// 获取错误消息的函数
export function getGoogleOAuthErrorMessage(
  errorCode: GoogleOAuthErrorCode | string,
  dictionary: any
): string {
  const errorMessages: ErrorMessages = {
    [GoogleOAuthErrorCode.INVALID_GOOGLE_TOKEN]: 
      dictionary.auth?.errors?.googleTokenInvalid || 'Invalid Google token. Please try again.',
    [GoogleOAuthErrorCode.GOOGLE_TOKEN_EXPIRED]: 
      dictionary.auth?.errors?.googleTokenExpired || 'Google token has expired. Please sign in again.',
    [GoogleOAuthErrorCode.GOOGLE_AUTH_FAILED]: 
      dictionary.auth?.errors?.googleAuthFailed || 'Google authentication failed. Please try again.',
    [GoogleOAuthErrorCode.GOOGLE_TOKEN_INVALID]: 
      dictionary.auth?.errors?.googleTokenInvalid || 'Invalid Google token. Please try again.',
    [GoogleOAuthErrorCode.EMAIL_MISMATCH]: 
      dictionary.auth?.errors?.emailMismatch || 'Email address does not match. Please try again.',
    [GoogleOAuthErrorCode.EMAIL_EXISTS]: 
      dictionary.auth?.errors?.emailExists || 'This email is already registered. Please sign in with password.',
    [GoogleOAuthErrorCode.EMAIL_NOT_VERIFIED]: 
      dictionary.auth?.errors?.emailNotVerified || 'Email address is not verified.',
    [GoogleOAuthErrorCode.NETWORK_ERROR]: 
      dictionary.auth?.errors?.networkError || 'Network connection failed. Please try again.',
    [GoogleOAuthErrorCode.TIMEOUT_ERROR]: 
      dictionary.auth?.errors?.timeoutError || 'Request timed out. Please try again.',
    [GoogleOAuthErrorCode.SERVER_ERROR]: 
      dictionary.auth?.errors?.serverError || 'Server error occurred. Please try again later.',
    [GoogleOAuthErrorCode.DATABASE_ERROR]: 
      dictionary.auth?.errors?.databaseError || 'Database error occurred. Please try again later.',
    [GoogleOAuthErrorCode.USER_NOT_FOUND]: 
      dictionary.auth?.errors?.userNotFound || 'User not found.',
    [GoogleOAuthErrorCode.USER_CANCELLED]: 
      dictionary.auth?.errors?.userCancelled || 'Sign in was cancelled.',
    [GoogleOAuthErrorCode.UNKNOWN_ERROR]: 
      dictionary.auth?.errors?.unexpected || 'An unexpected error occurred. Please try again.',
  };

  return errorMessages[errorCode] || errorMessages[GoogleOAuthErrorCode.UNKNOWN_ERROR];
}

// Google OAuth 错误类
export class GoogleOAuthError extends Error {
  code: GoogleOAuthErrorCode;
  originalError?: any;

  constructor(code: GoogleOAuthErrorCode, message?: string, originalError?: any) {
    super(message || code);
    this.name = 'GoogleOAuthError';
    this.code = code;
    this.originalError = originalError;
  }
}
