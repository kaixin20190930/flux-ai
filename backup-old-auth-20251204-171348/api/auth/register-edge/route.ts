/**
 * Edge Runtime 兼容的注册 API
 * 替代原有的 app/api/auth/register/route.ts
 */

import { NextRequest } from 'next/server';
import { EdgeAuth, EdgeDB, EdgeUtils, createErrorResponse, createSuccessResponse } from '@/utils/edgeUtils';

// 配置为 Edge Runtime
export const runtime = 'edge';
export const dynamic = 'force-dynamic';

interface RegisterRequest {
  email: string;
  password: string;
  name?: string;
}

interface RegisterResponse {
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
    const body: RegisterRequest = await request.json();
    const { email, password, name } = body;

    // 验证输入
    if (!email || !password) {
      return createErrorResponse('邮箱和密码不能为空', 400);
    }

    // 验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return createErrorResponse('邮箱格式不正确', 400);
    }

    // 验证密码强度
    if (password.length < 6) {
      return createErrorResponse('密码长度至少6位', 400);
    }

    // 获取环境变量
    const env = (request as any).env || process.env;
    const jwtSecret = env.JWT_SECRET || 'fallback-secret';

    // 检查用户是否已存在
    const existingUser = await EdgeDB.queryFirst(
      env,
      'SELECT id FROM users WHERE email = ?',
      [email.toLowerCase()]
    );

    if (existingUser) {
      return createErrorResponse('该邮箱已被注册', 409);
    }

    // 哈希密码
    const passwordHash = await EdgeAuth.hashPassword(password);

    // 生成用户ID
    const userId = `user-${Date.now()}-${EdgeUtils.generateRandomString(8)}`;

    // 创建用户
    await EdgeDB.query(
      env,
      `INSERT INTO users (
        id, email, password_hash, name, created_at, updated_at,
        is_admin, subscription_type, remaining_generations
      ) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, ?, ?, ?)`,
      [
        userId,
        email.toLowerCase(),
        passwordHash,
        name || '',
        false,
        'free',
        10 // 新用户免费10次生成
      ]
    );

    // 创建 JWT Token
    const tokenPayload = {
      userId,
      email: email.toLowerCase(),
      isAdmin: false
    };

    const token = await EdgeAuth.createJWT(tokenPayload, jwtSecret, 24 * 60 * 60); // 24小时

    // 记录注册事件
    await EdgeDB.query(
      env,
      `INSERT INTO user_analytics (id, user_id, event_type, event_data, timestamp) 
       VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      [
        `analytics-${Date.now()}-${EdgeUtils.generateRandomString(8)}`,
        userId,
        'register',
        JSON.stringify({
          ip: EdgeUtils.getClientIP(request),
          userAgent: EdgeUtils.getUserAgent(request),
          registrationMethod: 'email'
        })
      ]
    );

    // 返回成功响应
    const response: RegisterResponse = {
      success: true,
      token,
      user: {
        id: userId,
        email: email.toLowerCase(),
        name: name || '',
        isAdmin: false
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
    console.error('Register error:', error);
    return createErrorResponse('注册失败，请稍后重试', 500);
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