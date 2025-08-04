import { NextRequest } from 'next/server';
import { verifyJWT } from '@/utils/auth';

export interface AuthResult {
  success: boolean;
  userId?: string;
  error?: {
    code: string;
    message: string;
    status: number;
  };
}

/**
 * 统一的认证检查函数
 * @param request NextRequest对象
 * @returns 认证结果
 */
export async function authenticateRequest(request: NextRequest): Promise<AuthResult> {
  try {
    // 获取token
    const token = request.cookies.get('token')?.value;
    
    if (!token) {
      return {
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: '需要登录才能访问此功能',
          status: 401
        }
      };
    }
    
    // 检查JWT_SECRET
    if (!process.env.JWT_SECRET) {
      return {
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: '服务器配置错误',
          status: 500
        }
      };
    }
    
    // 验证JWT token
    try {
      const decoded = await verifyJWT(token, process.env.JWT_SECRET);
      
      if (!decoded.userId) {
        return {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: '无效的用户信息',
            status: 401
          }
        };
      }
      
      return {
        success: true,
        userId: decoded.userId
      };
      
    } catch (jwtError) {
      console.error('JWT verification failed:', jwtError);
      return {
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: '登录状态已过期，请重新登录',
          status: 401
        }
      };
    }
    
  } catch (error) {
    console.error('Authentication error:', error);
    return {
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: '认证过程中发生错误',
        status: 500
      }
    };
  }
}

/**
 * 检查用户是否有cookie token（不验证有效性）
 * @param request NextRequest对象
 * @returns 是否有token
 */
export function hasAuthToken(request: NextRequest): boolean {
  return !!request.cookies.get('token')?.value;
}

/**
 * 创建认证错误响应
 * @param error 错误信息
 * @returns NextResponse
 */
export function createAuthErrorResponse(error: AuthResult['error']) {
  if (!error) {
    return new Response(
      JSON.stringify({ error: { code: 'UNKNOWN_ERROR', message: '未知错误' } }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
  
  return new Response(
    JSON.stringify({ error }),
    { 
      status: error.status, 
      headers: { 'Content-Type': 'application/json' } 
    }
  );
}