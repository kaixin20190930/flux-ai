/**
 * 创建生成任务 V2
 * Create Generation V2 - 新积分系统
 */

import { Env } from '../types';
import { verifyJWT } from '../utils/auth';
import { logWithTimestamp } from '../utils/logUtils';

const MODEL_POINTS: Record<string, number> = {
  'flux-schnell': 1,
  'flux-dev': 3,
  'flux-1.1-pro-ultra': 3,
  'flux-1.1-pro': 5,
  'flux-pro': 6
};

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

export async function handleCreateGenerationV2(request: Request, env: Env): Promise<Response> {
  const db = env.DB;
  if (!db) {
    return Response.json({ 
      success: false,
      error: 'Database not available' 
    }, { status: 500 });
  }

  try {
    const body = await request.json() as {
      model: string;
      prompt: string;
      userId?: number;
      ipAddress: string;
      fingerprintHash?: string;
    };

    const { model, prompt, userId, ipAddress: rawIPAddress, fingerprintHash } = body;
    
    // 验证必需参数
    if (!model || !prompt || !rawIPAddress) {
      logWithTimestamp('Missing required parameters:', { model, prompt: !!prompt, ipAddress: !!rawIPAddress });
      return Response.json({
        success: false,
        error: 'Missing required parameters: model, prompt, and ipAddress are required'
      }, { status: 400 });
    }
    
    // 标准化 IP 地址（::1 → 127.0.0.1）
    const ipAddress = normalizeIP(rawIPAddress);
    
    const pointsRequired = MODEL_POINTS[model] || 1;
    const generationId = crypto.randomUUID();
    const today = new Date().toISOString().split('T')[0];
    const ipHash = await hashString(ipAddress + (env.IP_SALT || 'default_salt'));
    
    logWithTimestamp('createGeneration - normalized IP:', {
      rawIP: rawIPAddress,
      normalizedIP: ipAddress,
      ipHashPreview: ipHash.substring(0, 10) + '...',
      fingerprintHash: fingerprintHash?.substring(0, 10) + '...',
      model
    });

    let pointsDeducted = 0;
    let usedFreeTier = false;
    let newBalance = 0;
    let freeGenerationsRemaining = 0;

    // 新规则：登录用户直接使用积分，未登录用户使用免费额度
    if (userId) {
      // 已登录：扣除用户积分
      const user = await db.prepare('SELECT points FROM users WHERE id = ?')
        .bind(userId)
        .first<{ points: number }>();

      const currentPoints = user?.points || 0;

      if (currentPoints < pointsRequired) {
        return Response.json({
          success: false,
          error: `Insufficient points. You need ${pointsRequired} points but only have ${currentPoints}.`
        }, { status: 403 });
      }

      // 扣除积分（使用事务）
      newBalance = currentPoints - pointsRequired;
      const updateResult = await db.prepare('UPDATE users SET points = ? WHERE id = ?')
        .bind(newBalance, userId)
        .run();

      if (!updateResult.success) {
        throw new Error('Failed to deduct points');
      }

      // 记录交易
      await db.prepare(`
        INSERT INTO transactions (id, user_id, type, amount, balance_before, balance_after, reason, related_id)
        VALUES (?, ?, 'deduct', ?, ?, ?, 'Image generation', ?)
      `).bind(
        crypto.randomUUID(), 
        userId, 
        pointsRequired, 
        currentPoints, 
        newBalance, 
        generationId
      ).run();

      pointsDeducted = pointsRequired;
      usedFreeTier = false;

      logWithTimestamp('Points deducted for logged-in user:', {
        userId,
        pointsDeducted,
        newBalance,
        model
      });

    } else {
      // 未登录：使用免费额度
      if (model !== 'flux-schnell') {
        return Response.json({
          success: false,
          error: 'Premium models require login. Please sign in to use this model.'
        }, { status: 403 });
      }

      // 检查并更新免费额度
      const usage = await db.prepare(`
        SELECT id, generation_count FROM daily_usage
        WHERE date = ? AND ip_hash = ? AND fingerprint_hash = ?
      `).bind(today, ipHash, fingerprintHash || '').first<{ id: string; generation_count: number }>();

      const usedCount = usage?.generation_count || 0;

      if (usedCount >= 1) { // 每天只有 1 次
        return Response.json({
          success: false,
          error: 'Daily free limit reached. Please sign in to continue generating images.'
        }, { status: 403 });
      }

      // 更新使用次数
      if (usage) {
        await db.prepare(`
          UPDATE daily_usage 
          SET generation_count = generation_count + 1, 
              updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).bind(usage.id).run();
      } else {
        await db.prepare(`
          INSERT INTO daily_usage (id, date, ip_hash, fingerprint_hash, generation_count)
          VALUES (?, ?, ?, ?, 1)
        `).bind(crypto.randomUUID(), today, ipHash, fingerprintHash || '').run();
      }

      freeGenerationsRemaining = 0; // 用完了
      usedFreeTier = true;

      logWithTimestamp('Free tier used for anonymous user:', {
        ipHash: ipHash.substring(0, 10) + '...',
        model
      });
    }

    // 创建生成记录
    await db.prepare(`
      INSERT INTO generation_history (
        id, user_id, model, prompt, points_used, used_free_tier, 
        ip_address, fingerprint_hash, status
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')
    `).bind(
      generationId, 
      userId || null, 
      model, 
      prompt, 
      pointsDeducted, 
      usedFreeTier, 
      ipAddress, 
      fingerprintHash || null
    ).run();

    return Response.json({
      success: true,
      data: {
        generationId,
        pointsDeducted,
        usedFreeTier,
        newBalance: userId ? newBalance : 0,
        freeGenerationsRemaining
      }
    });

  } catch (error) {
    logWithTimestamp('Error creating generation:', error);
    return Response.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create generation'
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
