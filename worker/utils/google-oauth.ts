/**
 * Google OAuth 工具函数
 * Google OAuth Utility Functions
 */

import { Env } from '../types';
import { logWithTimestamp } from './logUtils';

/**
 * Google 用户信息接口
 */
export interface GoogleUser {
  id: string;
  email: string;
  verified_email: boolean;
  name: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
  locale?: string;
}

/**
 * 用户数据库记录接口
 */
export interface User {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  email_verified: number;
  points: number;
  created_at?: string;
  updated_at?: string;
}

/**
 * 验证 Google Token
 * 调用 Google API 验证 token 有效性并获取用户信息
 * 
 * @param token - Google access token
 * @returns Google 用户信息
 * @throws 如果 token 无效或验证失败
 */
export async function verifyGoogleToken(token: string): Promise<GoogleUser> {
  try {
    logWithTimestamp('[Google OAuth] 开始验证 Google token');
    
    // 调用 Google API 验证 token 并获取用户信息
    const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      logWithTimestamp('[Google OAuth] Token 验证失败:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText,
      });
      throw new Error(`Invalid Google token: ${response.status} ${response.statusText}`);
    }
    
    const googleUser = await response.json() as GoogleUser;
    
    // 验证必要字段
    if (!googleUser.email || !googleUser.id) {
      logWithTimestamp('[Google OAuth] Google 用户信息不完整:', googleUser);
      throw new Error('Incomplete Google user information');
    }
    
    logWithTimestamp('[Google OAuth] Token 验证成功:', {
      email: googleUser.email,
      name: googleUser.name,
      verified: googleUser.verified_email,
    });
    
    return googleUser;
  } catch (error) {
    logWithTimestamp('[Google OAuth] Token 验证异常:', error);
    throw error;
  }
}

/**
 * 根据邮箱查找用户
 * 
 * @param db - D1 数据库实例
 * @param email - 用户邮箱
 * @returns 用户信息，如果不存在则返回 null
 */
export async function findUserByEmail(db: D1Database, email: string): Promise<User | null> {
  try {
    logWithTimestamp('[Google OAuth] 查找用户:', { email });
    
    const user = await db.prepare('SELECT * FROM users WHERE email = ?')
      .bind(email)
      .first() as User | null;
    
    if (user) {
      logWithTimestamp('[Google OAuth] 找到现有用户:', {
        id: user.id,
        email: user.email,
        points: user.points,
      });
    } else {
      logWithTimestamp('[Google OAuth] 用户不存在:', { email });
    }
    
    return user;
  } catch (error) {
    logWithTimestamp('[Google OAuth] 查找用户失败:', error);
    throw error;
  }
}

/**
 * 根据 OAuth 提供商和提供商用户 ID 查找用户
 * 
 * @param db - D1 数据库实例
 * @param provider - OAuth 提供商 (例如: 'google')
 * @param providerUserId - 提供商的用户 ID
 * @returns 用户信息，如果不存在则返回 null
 */
export async function findUserByOAuthProvider(
  db: D1Database,
  provider: string,
  providerUserId: string
): Promise<User | null> {
  try {
    logWithTimestamp('[Google OAuth] 通过 OAuth 提供商查找用户:', { provider, providerUserId });
    
    const result = await db.prepare(`
      SELECT u.* FROM users u
      INNER JOIN oauth_accounts oa ON u.id = oa.user_id
      WHERE oa.provider = ? AND oa.provider_user_id = ?
    `)
      .bind(provider, providerUserId)
      .first() as User | null;
    
    if (result) {
      logWithTimestamp('[Google OAuth] 通过 OAuth 找到用户:', {
        id: result.id,
        email: result.email,
        provider,
      });
    } else {
      logWithTimestamp('[Google OAuth] 未找到 OAuth 绑定的用户:', { provider, providerUserId });
    }
    
    return result;
  } catch (error) {
    logWithTimestamp('[Google OAuth] 通过 OAuth 查找用户失败:', error);
    throw error;
  }
}

/**
 * 创建 Google 用户
 * 注册新用户并创建 OAuth 绑定，赠送 3 积分
 * 
 * @param db - D1 数据库实例
 * @param googleUser - Google 用户信息
 * @returns 创建的用户信息
 */
export async function createGoogleUser(
  db: D1Database,
  googleUser: GoogleUser
): Promise<User> {
  try {
    logWithTimestamp('[Google OAuth] 开始创建 Google 用户:', {
      email: googleUser.email,
      name: googleUser.name,
    });
    
    // 生成用户 ID
    const userId = crypto.randomUUID();
    
    // 生成随机密码（Google 用户不使用密码登录）
    const randomPassword = crypto.randomUUID();
    const encoder = new TextEncoder();
    const data = encoder.encode(randomPassword);
    const hash = await crypto.subtle.digest('SHA-256', data);
    const passwordHash = Array.from(new Uint8Array(hash))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    
    // 插入用户数据（赠送 3 积分）
    await db.prepare(`
      INSERT INTO users (id, name, email, password_hash, email_verified, points)
      VALUES (?, ?, ?, ?, ?, ?)
    `)
      .bind(
        userId,
        googleUser.name || googleUser.email.split('@')[0],
        googleUser.email,
        passwordHash,
        googleUser.verified_email ? 1 : 0,
        3
      )
      .run();
    
    logWithTimestamp('[Google OAuth] 用户创建成功:', { userId, email: googleUser.email });
    
    // 创建 OAuth 绑定
    const oauthId = crypto.randomUUID();
    await db.prepare(`
      INSERT INTO oauth_accounts (id, user_id, provider, provider_user_id, provider_email)
      VALUES (?, ?, ?, ?, ?)
    `)
      .bind(oauthId, userId, 'google', googleUser.id, googleUser.email)
      .run();
    
    logWithTimestamp('[Google OAuth] OAuth 绑定创建成功:', { oauthId, userId });
    
    // 记录注册赠送积分的交易
    const transactionId = crypto.randomUUID();
    await db.prepare(`
      INSERT INTO transactions (id, user_id, type, amount, balance_before, balance_after, reason)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `)
      .bind(
        transactionId,
        userId,
        'register_bonus',
        3,
        0,
        3,
        'Google registration bonus'
      )
      .run();
    
    logWithTimestamp('[Google OAuth] 注册积分记录成功:', { transactionId, userId });
    
    // 返回用户信息
    const newUser: User = {
      id: userId,
      name: googleUser.name || googleUser.email.split('@')[0],
      email: googleUser.email,
      password_hash: passwordHash,
      email_verified: googleUser.verified_email ? 1 : 0,
      points: 3,
    };
    
    logWithTimestamp('[Google OAuth] Google 用户创建完成:', {
      userId: newUser.id,
      email: newUser.email,
      points: newUser.points,
    });
    
    return newUser;
  } catch (error) {
    logWithTimestamp('[Google OAuth] 创建用户失败:', error);
    throw error;
  }
}

/**
 * 检查并创建 OAuth 绑定
 * 如果用户已存在但没有 Google OAuth 绑定，则创建绑定
 * 
 * @param db - D1 数据库实例
 * @param userId - 用户 ID
 * @param googleUser - Google 用户信息
 */
export async function ensureOAuthBinding(
  db: D1Database,
  userId: string,
  googleUser: GoogleUser
): Promise<void> {
  try {
    // 检查是否已有 OAuth 绑定
    const existingBinding = await db.prepare(`
      SELECT id FROM oauth_accounts
      WHERE user_id = ? AND provider = 'google'
    `)
      .bind(userId)
      .first();
    
    if (existingBinding) {
      logWithTimestamp('[Google OAuth] OAuth 绑定已存在:', { userId });
      return;
    }
    
    // 创建 OAuth 绑定
    const oauthId = crypto.randomUUID();
    await db.prepare(`
      INSERT INTO oauth_accounts (id, user_id, provider, provider_user_id, provider_email)
      VALUES (?, ?, ?, ?, ?)
    `)
      .bind(oauthId, userId, 'google', googleUser.id, googleUser.email)
      .run();
    
    logWithTimestamp('[Google OAuth] OAuth 绑定创建成功:', { oauthId, userId });
  } catch (error) {
    logWithTimestamp('[Google OAuth] 创建 OAuth 绑定失败:', error);
    throw error;
  }
}

/**
 * OAuth 账号信息接口
 */
export interface OAuthAccount {
  id: string;
  user_id: string;
  provider: string;
  provider_user_id: string;
  provider_email: string | null;
  created_at: string;
}

/**
 * 获取用户的所有 OAuth 绑定
 * 
 * @param db - D1 数据库实例
 * @param userId - 用户 ID
 * @returns OAuth 账号列表
 */
export async function getUserOAuthAccounts(
  db: D1Database,
  userId: string
): Promise<OAuthAccount[]> {
  try {
    logWithTimestamp('[Google OAuth] 获取用户的 OAuth 绑定:', { userId });
    
    const result = await db.prepare(`
      SELECT id, user_id, provider, provider_user_id, provider_email, created_at
      FROM oauth_accounts
      WHERE user_id = ?
      ORDER BY created_at DESC
    `)
      .bind(userId)
      .all();
    
    const accounts = (result.results || []) as unknown as OAuthAccount[];
    
    logWithTimestamp('[Google OAuth] 找到 OAuth 绑定:', {
      userId,
      count: accounts.length,
      providers: accounts.map(a => a.provider),
    });
    
    return accounts;
  } catch (error) {
    logWithTimestamp('[Google OAuth] 获取 OAuth 绑定失败:', error);
    throw error;
  }
}

/**
 * 检查用户是否已绑定特定 OAuth 提供商
 * 
 * @param db - D1 数据库实例
 * @param userId - 用户 ID
 * @param provider - OAuth 提供商
 * @returns 是否已绑定
 */
export async function hasOAuthProvider(
  db: D1Database,
  userId: string,
  provider: string
): Promise<boolean> {
  try {
    const result = await db.prepare(`
      SELECT id FROM oauth_accounts
      WHERE user_id = ? AND provider = ?
    `)
      .bind(userId, provider)
      .first();
    
    return result !== null;
  } catch (error) {
    logWithTimestamp('[Google OAuth] 检查 OAuth 绑定失败:', error);
    throw error;
  }
}
