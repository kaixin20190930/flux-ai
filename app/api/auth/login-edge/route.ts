/**
 * Edge Runtime 兼容的登录 API
 * 替代原有的 app/api/auth/login/route.ts
 */

import { NextRequest } from 'next/server';
import { EdgeAuth, EdgeDB, createErrorResponse, createSuccessResponse } from '@/utils/edgeUtils';

// 配置为 Edge Runtime
export const runtime = 'edge';
export const dynamic = 'force-dynamic';

interface LoginRequest {
  email: string;
  password: string;
}

interface LoginResponse {
  success: boolean;
  token?: string;
  user?: {
    id: string;
    email: string;
    name: string;
    isAdmin: boolean;
  };
  message?: string;
}

export async function POST(request: NextRequest): Promise<Response> {
  try {
    // 解析请求体
    const body: LoginRequest = await request.json();
    const { email, password } = body;

    // 验证输入
    if (!email || !password) {
      return createErrorResponse('邮箱和密码不能为空', 400);
    }

    // 获取环境变量（在 Edge Runtime 中需要通过 env 对象）
    const env = (request as any).env || process.env;
    const jwtSecret = env.JWT_SECRET || 'fallback-secret';

    // 查询用户
    const user = await EdgeDB.queryFirst(
      env,
      'SELECT id, email, password_hash, name, is_admin FROM users WHERE email = ?',
      [email.toLowerCase()]
    );

    if (!user) {
      return createErrorResponse('用户不存在或密码错误', 401);
    }

    // 验证密码
    const isValidPassword = await EdgeAuth.verifyPassword(password, user.password_hash);
    if (!isValidPassword) {
      return createErrorResponse('用户不存在或密码错误', 401);
    }

    // 创建 JWT Token
    const tokenPayload = {
      userId: user.id,
      email: user.email,
      isAdmin: user.is_admin || false
    };

    const token = await EdgeAuth.createJWT(tokenPayload, jwtSecret, 24 * 60 * 60); // 24小时

    // 更新最后登录时间
    await EdgeDB.query(
      env,
      'UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [user.id]
    );

    // 记录登录事件
    await EdgeDB.query(
      env,
      `INSERT INTO user_analytics (id, user_id, event_type, event_data, timestamp) 
       VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      [
        `analytics-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        user.id,
        'login',
        JSON.stringify({
          ip: request.headers.get('CF-Connecting-IP') || 'unknown',
          userAgent: request.headers.get('User-Agent') || 'unknown'
        })
      ]
    );

    // 返回成功响应
    const response: LoginResponse = {
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name || '',
        isAdmin: user.is_admin || false
      }
    };

    // 创建响应并设置 Cookie
    const res = createSuccessResponse(response);
    
    // 设置 HTTP-only Cookie
    const cookieOptions = [
      `auth-token=${token}`,
      'HttpOnly',
      'Secure',
      'SameSite=Strict',
      'Path=/',
      `Max-Age=${24 * 60 * 60}` // 24小时
    ].join('; ');

    res.headers.set('Set-Cookie', cookieOptions);

    return res;

  } catch (error) {
    console.error('Login error:', error);
    return createErrorResponse('登录失败，请稍后重试', 500);
  }
}

// OPTIONS 方法用于 CORS 预检
export async function OPTIONS(request: NextRequest): Promise<Response> {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
}