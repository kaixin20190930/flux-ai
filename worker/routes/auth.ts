/**
 * 认证路由
 * Authentication Routes
 */

import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { Env } from '../types';
import { SignJWT, jwtVerify } from 'jose';
import {
  verifyGoogleToken,
  findUserByEmail,
  findUserByOAuthProvider,
  createGoogleUser,
  ensureOAuthBinding,
} from '../utils/google-oauth';

const auth = new Hono<{ Bindings: Env }>();

// 注册 Schema
const registerSchema = z.object({
  name: z.string().min(1, '姓名不能为空'),
  email: z.string().email('邮箱格式不正确'),
  password: z.string().min(6, '密码至少6位').optional(),
  googleToken: z.string().optional(),
}).refine(data => data.password || data.googleToken, {
  message: '密码或Google令牌必须提供其中之一',
});

// 登录 Schema
const loginSchema = z.object({
  email: z.string().email('邮箱格式不正确'),
  password: z.string().optional(),
  googleToken: z.string().optional(),
}).refine(data => data.password || data.googleToken, {
  message: '密码或Google令牌必须提供其中之一',
});

// 令牌验证 Schema
const verifyTokenSchema = z.object({
  token: z.string().min(1, '令牌不能为空'),
});

// Google 登录 Schema
const googleLoginSchema = z.object({
  googleToken: z.string().min(1, 'Google token 不能为空'),
  email: z.string().email('邮箱格式不正确'),
  name: z.string().min(1, '姓名不能为空'),
});

// 辅助函数：哈希密码
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// 辅助函数：验证密码
async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const passwordHash = await hashPassword(password);
  return passwordHash === hash;
}

// 辅助函数：创建 JWT
async function createJWT(payload: any, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const secretKey = encoder.encode(secret);
  
  const jwt = await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(secretKey);
  
  return jwt;
}

// 辅助函数：验证 JWT
async function verifyJWT(token: string, secret: string): Promise<any> {
  const encoder = new TextEncoder();
  const secretKey = encoder.encode(secret);
  
  const { payload } = await jwtVerify(token, secretKey);
  return payload;
}

/**
 * POST /auth/register - 用户注册
 */
auth.post('/register', zValidator('json', registerSchema), async (c) => {
  try {
    const { name, email, password, googleToken } = c.req.valid('json');
    const db = c.env.DB;
    
    // 检查邮箱是否已存在
    const existingUser = await db.prepare('SELECT email FROM users WHERE email = ?')
      .bind(email)
      .first();
    
    if (existingUser) {
      return c.json({
        success: false,
        error: {
          code: 'EMAIL_EXISTS',
          message: '该邮箱已被注册',
        },
      }, 409);
    }
    
    // Google 注册验证
    if (googleToken) {
      try {
        const googleUserResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
          headers: { Authorization: `Bearer ${googleToken}` },
        });
        
        if (!googleUserResponse.ok) {
          return c.json({
            success: false,
            error: {
              code: 'INVALID_GOOGLE_TOKEN',
              message: 'Google 令牌无效',
            },
          }, 401);
        }
        
        const googleUser = await googleUserResponse.json() as any;
        
        if (googleUser.email !== email) {
          return c.json({
            success: false,
            error: {
              code: 'EMAIL_MISMATCH',
              message: '邮箱不匹配',
            },
          }, 401);
        }
      } catch (error) {
        console.error('Google token verification error:', error);
        return c.json({
          success: false,
          error: {
            code: 'GOOGLE_AUTH_FAILED',
            message: 'Google 认证失败',
          },
        }, 401);
      }
    }
    
    // 处理密码
    let hashedPassword: string;
    if (googleToken && !password) {
      const randomPassword = crypto.randomUUID();
      hashedPassword = await hashPassword(randomPassword);
    } else if (password) {
      hashedPassword = await hashPassword(password);
    } else {
      return c.json({
        success: false,
        error: {
          code: 'PASSWORD_REQUIRED',
          message: '密码不能为空',
        },
      }, 400);
    }
    
    // 生成用户 ID
    const userId = crypto.randomUUID();
    
    // 插入用户数据（新用户默认 3 积分）
    await db.prepare(
      'INSERT INTO users (id, name, email, password_hash, email_verified, points) VALUES (?, ?, ?, ?, ?, ?)'
    )
      .bind(userId, name, email, hashedPassword, 0, 3)
      .run();
    
    // 如果是 Google 注册，创建 OAuth 账号绑定
    if (googleToken) {
      await db.prepare(
        'INSERT INTO oauth_accounts (id, user_id, provider, provider_user_id, provider_email) VALUES (?, ?, ?, ?, ?)'
      )
        .bind(crypto.randomUUID(), userId, 'google', email, email)
        .run();
    }
    
    // 记录注册赠送积分的交易
    await db.prepare(
      'INSERT INTO transactions (id, user_id, type, amount, balance_before, balance_after, reason) VALUES (?, ?, ?, ?, ?, ?, ?)'
    )
      .bind(crypto.randomUUID(), userId, 'register_bonus', 3, 0, 3, 'Registration bonus')
      .run();
    
    // 创建 JWT token
    const token = await createJWT(
      { userId, username: name, email },
      c.env.JWT_SECRET
    );
    
    return c.json({
      success: true,
      token,
      user: {
        id: userId,
        name,
        email,
        points: 3, // 注册赠送 3 积分
        isGoogleUser: !!googleToken,
      },
    }, 201);
  } catch (error) {
    console.error('Register error:', error);
    return c.json({
      success: false,
      error: {
        code: 'REGISTER_ERROR',
        message: '注册失败，请稍后重试',
      },
    }, 500);
  }
});

/**
 * POST /auth/login - 用户登录
 */
auth.post('/login', zValidator('json', loginSchema), async (c) => {
  try {
    const { email, password, googleToken } = c.req.valid('json');
    const db = c.env.DB;
    
    // 查找用户
    const user = await db.prepare('SELECT * FROM users WHERE email = ?')
      .bind(email)
      .first() as any;
    
    if (!user) {
      return c.json({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: '邮箱或密码错误',
        },
      }, 401);
    }
    
    // Google 登录验证
    if (googleToken) {
      try {
        const googleUserResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
          headers: { Authorization: `Bearer ${googleToken}` },
        });
        
        if (!googleUserResponse.ok) {
          return c.json({
            success: false,
            error: {
              code: 'INVALID_GOOGLE_TOKEN',
              message: 'Google 令牌无效',
            },
          }, 401);
        }
        
        const googleUser = await googleUserResponse.json() as any;
        
        if (googleUser.email !== email) {
          return c.json({
            success: false,
            error: {
              code: 'EMAIL_MISMATCH',
              message: '邮箱不匹配',
            },
          }, 401);
        }
      } catch (error) {
        console.error('Google token verification error:', error);
        return c.json({
          success: false,
          error: {
            code: 'GOOGLE_AUTH_FAILED',
            message: 'Google 认证失败',
          },
        }, 401);
      }
    } else {
      // 密码验证
      if (!password || !await verifyPassword(password, user.password_hash)) {
        return c.json({
          success: false,
          error: {
            code: 'INVALID_CREDENTIALS',
            message: '邮箱或密码错误',
          },
        }, 401);
      }
    }
    
    // 创建 JWT token
    const token = await createJWT(
      { userId: user.id, username: user.name, email: user.email },
      c.env.JWT_SECRET
    );
    
    // 设置 HttpOnly Cookie
    c.header('Set-Cookie', `token=${token}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=2592000`);
    
    return c.json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        points: user.points || 3, // 默认 3 积分
      },
    }, 200);
  } catch (error) {
    console.error('Login error:', error);
    return c.json({
      success: false,
      error: {
        code: 'LOGIN_ERROR',
        message: '登录失败，请稍后重试',
      },
    }, 500);
  }
});

/**
 * POST /auth/verify-token - 验证令牌
 */
auth.post('/verify-token', async (c) => {
  try {
    // 从 Authorization header 获取 token
    const authHeader = c.req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({
        success: false,
        valid: false,
        error: {
          code: 'NO_TOKEN',
          message: '未提供令牌',
        },
      }, 401);
    }
    
    const token = authHeader.substring(7); // 移除 "Bearer " 前缀
    
    // 验证 JWT
    let payload;
    try {
      payload = await verifyJWT(token, c.env.JWT_SECRET);
    } catch (jwtError) {
      return c.json({
        success: false,
        valid: false,
        error: {
          code: 'INVALID_TOKEN',
          message: 'JWT 验证失败',
        },
      }, 401);
    }
    
    // 从数据库获取最新的用户信息（包括积分）
    const db = c.env.DB;
    const user = await db.prepare('SELECT id, name, email, points FROM users WHERE id = ?')
      .bind(payload.userId)
      .first() as any;
    
    if (!user) {
      return c.json({
        success: false,
        valid: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: '用户不存在',
        },
      }, 401);
    }
    
    return c.json({
      success: true,
      valid: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        points: user.points || 3, // 默认 3 积分
      },
    }, 200);
  } catch (error) {
    console.error('Token verification error:', error);
    return c.json({
      success: false,
      valid: false,
      error: {
        code: 'INVALID_TOKEN',
        message: '令牌验证失败',
      },
    }, 401);
  }
});

/**
 * POST /auth/google-login - Google OAuth 登录
 */
auth.post('/google-login', zValidator('json', googleLoginSchema), async (c) => {
  try {
    const { googleToken, email, name } = c.req.valid('json');
    const db = c.env.DB;
    
    // 1. 验证 Google token
    let googleUser;
    try {
      googleUser = await verifyGoogleToken(googleToken);
    } catch (error) {
      console.error('[Google OAuth] Token 验证失败:', error);
      return c.json({
        success: false,
        error: {
          code: 'INVALID_GOOGLE_TOKEN',
          message: 'Google 认证失败，请重试',
        },
      }, 401);
    }
    
    // 2. 检查邮箱匹配
    if (googleUser.email !== email) {
      console.error('[Google OAuth] 邮箱不匹配:', {
        provided: email,
        google: googleUser.email,
      });
      return c.json({
        success: false,
        error: {
          code: 'EMAIL_MISMATCH',
          message: '邮箱不匹配',
        },
      }, 401);
    }
    
    // 3. 查找或创建用户
    // 首先尝试通过 OAuth provider ID 查找（更准确）
    let user = await findUserByOAuthProvider(db, 'google', googleUser.id);
    
    if (!user) {
      // 如果没有找到，尝试通过邮箱查找
      user = await findUserByEmail(db, email);
      
      if (user) {
        // 用户存在但没有 Google OAuth 绑定，创建绑定
        console.log('[Google OAuth] 用户已存在，创建 OAuth 绑定:', { userId: user.id });
        await ensureOAuthBinding(db, user.id, googleUser);
      } else {
        // 用户不存在，注册新用户
        console.log('[Google OAuth] 创建新用户:', { email, name });
        user = await createGoogleUser(db, googleUser);
      }
    } else {
      // 通过 OAuth 找到用户，直接登录
      console.log('[Google OAuth] 通过 OAuth 找到用户:', { userId: user.id });
    }
    
    // 4. 生成 JWT token
    const token = await createJWT(
      {
        userId: user.id,
        username: user.name,
        email: user.email,
      },
      c.env.JWT_SECRET
    );
    
    // 5. 设置 HttpOnly Cookie
    c.header('Set-Cookie', `token=${token}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=2592000`);
    
    // 6. 返回结果
    console.log('[Google OAuth] 登录成功:', {
      userId: user.id,
      email: user.email,
      points: user.points,
    });
    
    return c.json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        points: user.points,
      },
    }, 200);
  } catch (error) {
    console.error('[Google OAuth] 登录失败:', error);
    return c.json({
      success: false,
      error: {
        code: 'GOOGLE_LOGIN_ERROR',
        message: '登录失败，请稍后重试',
      },
    }, 500);
  }
});

/**
 * POST /auth/logout - 用户登出
 */
auth.post('/logout', async (c) => {
  try {
    // 清除 Cookie
    c.header('Set-Cookie', 'token=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0');
    
    return c.json({
      success: true,
      message: '登出成功',
    });
  } catch (error) {
    console.error('Logout error:', error);
    return c.json({
      success: false,
      error: {
        code: 'LOGOUT_ERROR',
        message: '登出失败',
      },
    }, 500);
  }
});

export default auth;
