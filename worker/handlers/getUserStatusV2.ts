/**
 * 获取用户状态 V2
 * Get User Status V2 - 新积分系统
 */

import { Env } from '../types';
import { verifyJWT } from '../utils/auth';
import { logWithTimestamp } from '../utils/logUtils';

/**
 * 标准化 IP 地址
 * 将 IPv6 localhost (::1) 转换为 IPv4 (127.0.0.1)
 */
function normalizeIP(ip: string): string {
  if (ip === '::1' || ip === '::ffff:127.0.0.1') {
    return '127.0.0.1';
  }
  return ip;
}

export async function handleGetUserStatusV2(request: Request, env: Env): Promise<Response> {
  const db = env.DB || env['DB-DEV'];
  if (!db) {
    return Response.json({ 
      success: false,
      error: 'Database not available' 
    }, { status: 500 });
  }

  try {
    // 获取 token（可选）
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    let userId: number | null = null;
    let userPoints = 0;

    // 如果有 token，验证并获取用户信息
    if (token) {
      try {
        const decoded = await verifyJWT(token, env.JWT_SECRET);
        userId = decoded.userId;

        // 获取用户积分
        const user = await db.prepare('SELECT points FROM users WHERE id = ?')
          .bind(userId)
          .first<{ points: number }>();

        userPoints = user?.points || 0;
      } catch (error) {
        // Token 无效，当作未登录处理
        logWithTimestamp('Invalid token in getUserStatus:', error);
        userId = null;
      }
    }

    // 获取免费额度剩余次数（仅未登录用户）
    let freeGenerationsRemaining = 0;
    
    if (!userId) {
      const today = new Date().toISOString().split('T')[0];
      const rawIP = request.headers.get('cf-connecting-ip') || 
                    request.headers.get('x-forwarded-for') || 
                    request.headers.get('x-real-ip') ||
                    '127.0.0.1'; // 本地开发默认值
      
      // 标准化 IP 地址（::1 → 127.0.0.1）
      const ipAddress = normalizeIP(rawIP);
      const fingerprintHash = request.headers.get('x-fingerprint-hash') || '';
      
      logWithTimestamp('getUserStatus - checking free tier:', {
        rawIP: rawIP.substring(0, 15) + '...',
        normalizedIP: ipAddress,
        hasFingerprintHash: !!fingerprintHash,
        fingerprintLength: fingerprintHash.length,
        today
      });
      
      // 计算 IP hash
      const ipHash = await hashString(ipAddress + (env.IP_SALT || 'default_salt'));

      // 查询今日使用次数
      const usage = await db.prepare(`
        SELECT generation_count FROM daily_usage
        WHERE date = ? AND ip_hash = ? AND fingerprint_hash = ?
      `).bind(today, ipHash, fingerprintHash).first<{ generation_count: number }>();

      const usedCount = usage?.generation_count || 0;
      freeGenerationsRemaining = Math.max(0, 1 - usedCount); // 每天 1 次
      
      logWithTimestamp('getUserStatus - query result:', {
        ipHash: ipHash.substring(0, 10) + '...',
        fingerprintHash: fingerprintHash.substring(0, 10) + '...',
        usedCount,
        freeGenerationsRemaining
      });
    }

    return Response.json({
      success: true,
      data: {
        isLoggedIn: !!userId,
        userId,
        userPoints,
        freeGenerationsRemaining,
        dailyLimit: 1 // 每天 1 次免费
      }
    });

  } catch (error) {
    logWithTimestamp('Error getting user status:', error);
    return Response.json({
      success: false,
      error: 'Failed to get user status'
    }, { status: 500 });
  }
}

async function hashString(str: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
