# 积分系统重构实施计划

## 🎯 目标

将混乱的积分系统重构为清晰、可维护的 Cloudflare Worker 优先架构。

---

## 📋 实施方案选择

### 推荐：方案 B - 登录用户直接使用积分

**规则**：
- 未登录用户：使用免费额度（3次/天，仅 flux-schnell）
- 已登录用户：直接使用用户积分，不使用免费额度

**优点**：
- ✅ 逻辑最清晰
- ✅ 实现最简单
- ✅ 积分消耗明确
- ✅ 易于理解和维护

**缺点**：
- ⚠️ 登录用户无法享受免费额度

**决策**：采用方案 B

---

## 🔧 实施步骤

### 阶段 1：准备工作（5分钟）

#### 1.1 备份当前代码
```bash
# 创建备份分支
git checkout -b backup-old-points-system
git add .
git commit -m "Backup: Old points system before redesign"
git checkout main
```

#### 1.2 创建新分支
```bash
git checkout -b feature/points-system-redesign
```

---

### 阶段 2：Worker 端实现（30分钟）

#### 2.1 创建 D1 数据库表

**文件**：`migrations/d1-points-system.sql`

```sql
-- daily_usage 表：每日免费额度追踪
CREATE TABLE IF NOT EXISTS daily_usage (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL,
  ip_hash TEXT NOT NULL,
  fingerprint_hash TEXT,
  user_id INTEGER,
  generation_count INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(date, ip_hash, fingerprint_hash)
);

CREATE INDEX IF NOT EXISTS idx_daily_usage_date ON daily_usage(date);
CREATE INDEX IF NOT EXISTS idx_daily_usage_ip ON daily_usage(ip_hash);

-- generation_history 表：生成历史
CREATE TABLE IF NOT EXISTS generation_history (
  id TEXT PRIMARY KEY,
  user_id INTEGER,
  model TEXT NOT NULL,
  prompt TEXT NOT NULL,
  image_url TEXT,
  points_used INTEGER NOT NULL,
  used_free_tier BOOLEAN DEFAULT FALSE,
  ip_address TEXT,
  fingerprint_hash TEXT,
  status TEXT DEFAULT 'pending',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  completed_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_generation_user ON generation_history(user_id);
CREATE INDEX IF NOT EXISTS idx_generation_date ON generation_history(created_at);

-- transactions 表：积分交易记录
CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL,
  type TEXT NOT NULL,
  amount INTEGER NOT NULL,
  balance_before INTEGER NOT NULL,
  balance_after INTEGER NOT NULL,
  reason TEXT,
  generation_id TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_transactions_user ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(created_at);
```

**执行迁移**：
```bash
cd worker
npx wrangler d1 execute flux-ai --file=../migrations/d1-points-system.sql --local
npx wrangler d1 execute flux-ai --file=../migrations/d1-points-system.sql --remote
```

#### 2.2 创建 Worker Handlers

**文件 1**：`worker/handlers/getUserStatus.ts`

```typescript
import { Env } from '../types';
import { verifyJWT } from '../utils/auth';

export async function handleGetUserStatus(request: Request, env: Env): Promise<Response> {
  const db = env.DB || env['DB-DEV'];
  if (!db) {
    return Response.json({ error: 'Database not available' }, { status: 500 });
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
        userId = null;
      }
    }

    // 获取免费额度剩余次数
    const today = new Date().toISOString().split('T')[0];
    const ipAddress = request.headers.get('cf-connecting-ip') || 'unknown';
    const fingerprintHash = request.headers.get('x-fingerprint-hash');
    
    // 计算 IP hash
    const ipHash = await hashString(ipAddress + env.IP_SALT);

    // 查询今日使用次数
    const usage = await db.prepare(`
      SELECT generation_count FROM daily_usage
      WHERE date = ? AND ip_hash = ? AND fingerprint_hash = ?
    `).bind(today, ipHash, fingerprintHash).first<{ generation_count: number }>();

    const usedCount = usage?.generation_count || 0;
    const freeGenerationsRemaining = Math.max(0, 3 - usedCount);

    return Response.json({
      success: true,
      data: {
        isLoggedIn: !!userId,
        userId,
        userPoints,
        freeGenerationsRemaining,
        dailyLimit: 3
      }
    });

  } catch (error) {
    console.error('Error getting user status:', error);
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
```

**文件 2**：`worker/handlers/checkGeneration.ts`

```typescript
import { Env } from '../types';
import { verifyJWT } from '../utils/auth';

const MODEL_POINTS: Record<string, number> = {
  'flux-schnell': 1,
  'flux-dev': 3,
  'flux-1.1-pro-ultra': 3,
  'flux-1.1-pro': 5,
  'flux-pro': 6
};

export async function handleCheckGeneration(request: Request, env: Env): Promise<Response> {
  const db = env.DB || env['DB-DEV'];
  if (!db) {
    return Response.json({ error: 'Database not available' }, { status: 500 });
  }

  try {
    const { model, userId } = await request.json() as { model: string; userId?: number };
    const pointsRequired = MODEL_POINTS[model] || 1;

    // 方案 B：登录用户直接使用积分
    if (userId) {
      // 已登录：检查用户积分
      const user = await db.prepare('SELECT points FROM users WHERE id = ?')
        .bind(userId)
        .first<{ points: number }>();

      const userPoints = user?.points || 0;
      const canGenerate = userPoints >= pointsRequired;

      return Response.json({
        success: true,
        data: {
          canGenerate,
          useFreeTier: false,
          pointsRequired,
          userPoints,
          freeGenerationsRemaining: 0,
          reason: canGenerate ? null : 'Insufficient points'
        }
      });

    } else {
      // 未登录：检查免费额度
      if (model !== 'flux-schnell') {
        return Response.json({
          success: true,
          data: {
            canGenerate: false,
            useFreeTier: false,
            pointsRequired,
            userPoints: 0,
            freeGenerationsRemaining: 0,
            reason: 'Premium model requires login'
          }
        });
      }

      // 检查免费额度
      const today = new Date().toISOString().split('T')[0];
      const ipAddress = request.headers.get('cf-connecting-ip') || 'unknown';
      const fingerprintHash = request.headers.get('x-fingerprint-hash');
      const ipHash = await hashString(ipAddress + env.IP_SALT);

      const usage = await db.prepare(`
        SELECT generation_count FROM daily_usage
        WHERE date = ? AND ip_hash = ? AND fingerprint_hash = ?
      `).bind(today, ipHash, fingerprintHash).first<{ generation_count: number }>();

      const usedCount = usage?.generation_count || 0;
      const remaining = Math.max(0, 3 - usedCount);
      const canGenerate = remaining > 0;

      return Response.json({
        success: true,
        data: {
          canGenerate,
          useFreeTier: true,
          pointsRequired: 0,
          userPoints: 0,
          freeGenerationsRemaining: remaining,
          reason: canGenerate ? null : 'Daily free limit reached'
        }
      });
    }

  } catch (error) {
    console.error('Error checking generation:', error);
    return Response.json({
      success: false,
      error: 'Failed to check generation'
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
```

**文件 3**：`worker/handlers/createGeneration.ts`

```typescript
import { Env } from '../types';
import { verifyJWT } from '../utils/auth';

const MODEL_POINTS: Record<string, number> = {
  'flux-schnell': 1,
  'flux-dev': 3,
  'flux-1.1-pro-ultra': 3,
  'flux-1.1-pro': 5,
  'flux-pro': 6
};

export async function handleCreateGeneration(request: Request, env: Env): Promise<Response> {
  const db = env.DB || env['DB-DEV'];
  if (!db) {
    return Response.json({ error: 'Database not available' }, { status: 500 });
  }

  try {
    const body = await request.json() as {
      model: string;
      prompt: string;
      userId?: number;
      ipAddress: string;
      fingerprintHash?: string;
    };

    const { model, prompt, userId, ipAddress, fingerprintHash } = body;
    const pointsRequired = MODEL_POINTS[model] || 1;
    const generationId = crypto.randomUUID();
    const today = new Date().toISOString().split('T')[0];
    const ipHash = await hashString(ipAddress + env.IP_SALT);

    let pointsDeducted = 0;
    let usedFreeTier = false;
    let newBalance = 0;
    let freeGenerationsRemaining = 0;

    // 方案 B：登录用户直接使用积分
    if (userId) {
      // 已登录：扣除用户积分
      const user = await db.prepare('SELECT points FROM users WHERE id = ?')
        .bind(userId)
        .first<{ points: number }>();

      const currentPoints = user?.points || 0;

      if (currentPoints < pointsRequired) {
        return Response.json({
          success: false,
          error: 'Insufficient points'
        }, { status: 403 });
      }

      // 扣除积分
      newBalance = currentPoints - pointsRequired;
      await db.prepare('UPDATE users SET points = ? WHERE id = ?')
        .bind(newBalance, userId)
        .run();

      // 记录交易
      await db.prepare(`
        INSERT INTO transactions (id, user_id, type, amount, balance_before, balance_after, reason, generation_id)
        VALUES (?, ?, 'deduct', ?, ?, ?, 'Image generation', ?)
      `).bind(crypto.randomUUID(), userId, pointsRequired, currentPoints, newBalance, generationId).run();

      pointsDeducted = pointsRequired;
      usedFreeTier = false;

    } else {
      // 未登录：使用免费额度
      if (model !== 'flux-schnell') {
        return Response.json({
          success: false,
          error: 'Premium model requires login'
        }, { status: 403 });
      }

      // 检查并更新免费额度
      const usage = await db.prepare(`
        SELECT id, generation_count FROM daily_usage
        WHERE date = ? AND ip_hash = ? AND fingerprint_hash = ?
      `).bind(today, ipHash, fingerprintHash).first<{ id: string; generation_count: number }>();

      const usedCount = usage?.generation_count || 0;

      if (usedCount >= 3) {
        return Response.json({
          success: false,
          error: 'Daily free limit reached'
        }, { status: 403 });
      }

      // 更新使用次数
      if (usage) {
        await db.prepare(`
          UPDATE daily_usage SET generation_count = generation_count + 1, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).bind(usage.id).run();
      } else {
        await db.prepare(`
          INSERT INTO daily_usage (id, date, ip_hash, fingerprint_hash, generation_count)
          VALUES (?, ?, ?, ?, 1)
        `).bind(crypto.randomUUID(), today, ipHash, fingerprintHash).run();
      }

      freeGenerationsRemaining = Math.max(0, 2 - usedCount);
      usedFreeTier = true;
    }

    // 创建生成记录
    await db.prepare(`
      INSERT INTO generation_history (id, user_id, model, prompt, points_used, used_free_tier, ip_address, fingerprint_hash, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')
    `).bind(generationId, userId || null, model, prompt, pointsDeducted, usedFreeTier, ipAddress, fingerprintHash).run();

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
    console.error('Error creating generation:', error);
    return Response.json({
      success: false,
      error: 'Failed to create generation'
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
```

#### 2.3 更新 Worker 路由

**修改**：`worker/routes/generation.ts`

```typescript
import { Hono } from 'hono';
import { Env } from '../types';
import { handleGetUserStatus } from '../handlers/getUserStatus';
import { handleCheckGeneration } from '../handlers/checkGeneration';
import { handleCreateGeneration } from '../handlers/createGeneration';

const generation = new Hono<{ Bindings: Env }>();

// GET /generation/status - 获取用户状态
generation.get('/status', async (c) => {
  const request = new Request(c.req.url, {
    method: 'GET',
    headers: c.req.raw.headers,
  });
  return await handleGetUserStatus(request, c.env);
});

// POST /generation/check - 检查是否可以生成
generation.post('/check', async (c) => {
  const request = new Request(c.req.url, {
    method: 'POST',
    headers: c.req.raw.headers,
    body: JSON.stringify(await c.req.json()),
  });
  return await handleCheckGeneration(request, c.env);
});

// POST /generation/create - 创建生成任务
generation.post('/create', async (c) => {
  const request = new Request(c.req.url, {
    method: 'POST',
    headers: c.req.raw.headers,
    body: JSON.stringify(await c.req.json()),
  });
  return await handleCreateGeneration(request, c.env);
});

export default generation;
```

---

### 阶段 3：Next.js API 简化（15分钟）

#### 3.1 重写 `/api/generate`

**文件**：`app/api/generate/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import Replicate from "replicate";
import { logWithTimestamp } from '@/utils/logUtils';

const replicate = new Replicate({
    auth: process.env.REPLICATE_API_TOKEN,
});

export const dynamic = 'force-dynamic';

const WORKER_URL = process.env.NODE_ENV === 'production'
    ? 'https://flux-ai-worker.liukai19911010.workers.dev'
    : 'http://localhost:8787';

export async function POST(req: NextRequest) {
    try {
        // 1. 获取请求参数
        const { prompt, model, aspectRatio, format } = await req.json();
        const token = req.headers.get('authorization')?.replace('Bearer ', '') || null;
        const ipAddress = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
        const fingerprintHash = req.headers.get('x-fingerprint-hash') || null;

        // 2. 调用 Worker 创建生成任务
        const generationResponse = await fetch(`${WORKER_URL}/generation/create`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': token ? `Bearer ${token}` : '',
                'x-fingerprint-hash': fingerprintHash || '',
            },
            body: JSON.stringify({
                model,
                prompt,
                ipAddress,
                fingerprintHash,
            }),
        });

        if (!generationResponse.ok) {
            const error = await generationResponse.json();
            return Response.json({ error: error.error || 'Failed to create generation' }, { status: generationResponse.status });
        }

        const generationData = await generationResponse.json();
        const { generationId, pointsDeducted, usedFreeTier, newBalance, freeGenerationsRemaining } = generationData.data;

        logWithTimestamp('Generation created:', { generationId, pointsDeducted, usedFreeTier });

        // 3. 调用 Replicate API
        const identifier = `black-forest-labs/${model}`;
        const output = await replicate.run(identifier as any, {
            input: {
                prompt,
                aspect_ratio: aspectRatio,
                output_format: format,
                num_inference_steps: 4,
            }
        });

        // 4. 获取图片 URL
        let imageUrl = '';
        if (Array.isArray(output) && output.length > 0) {
            imageUrl = output[0];
        } else if (typeof output === 'string') {
            imageUrl = output;
        }

        if (!imageUrl) {
            return Response.json({ error: 'Failed to generate image' }, { status: 500 });
        }

        // 5. 返回结果
        return NextResponse.json({
            image: imageUrl,
            userPoints: usedFreeTier ? null : newBalance,
            freeGenerationsRemaining: usedFreeTier ? freeGenerationsRemaining : 0,
            pointsConsumed: pointsDeducted,
            usedFreeTier,
            generationId
        });

    } catch (error) {
        logWithTimestamp('Error generating image:', error);
        return Response.json({ error: 'Failed to generate image' }, { status: 500 });
    }
}
```

#### 3.2 删除旧文件

```bash
rm app/api/getRemainingGenerations/route.ts
rm utils/usageTrackingService.ts
```

---

### 阶段 4：前端更新（10分钟）

#### 4.1 简化 `useImageGeneration` hook

**文件**：`hooks/useImageGeneration.tsx`

```typescript
import {useState, useEffect, useCallback} from 'react';
import {useRouter} from "next/navigation";

const WORKER_URL = process.env.NODE_ENV === 'production'
    ? 'https://flux-ai-worker.liukai19911010.workers.dev'
    : 'http://localhost:8787';

export const useImageGeneration = (locale: string) => {
    const router = useRouter();
    const [state, setState] = useState({
        prompt: '',
        generatedImage: null,
        isLoading: false,
        error: null,
        freeGenerationsRemaining: 3,
        isLoggedIn: false,
        userPoints: null,
        userId: null,
        selectedModel: 'flux-schnell',
        aspectRatio: '1:1',
        outputFormat: 'jpg'
    });

    const fetchGenerationData = useCallback(async () => {
        try {
            const token = localStorage.getItem('auth_token');
            const headers: HeadersInit = {};
            
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }
            
            const response = await fetch(`${WORKER_URL}/generation/status`, { headers });
            const data = await response.json();

            setState(prev => ({
                ...prev,
                freeGenerationsRemaining: data.data.freeGenerationsRemaining,
                isLoggedIn: data.data.isLoggedIn,
                userPoints: data.data.userPoints,
                userId: data.data.userId
            }));
        } catch (error) {
            console.error('Error fetching generation data:', error);
        }
    }, []);

    const handleGenerate = useCallback(async () => {
        if (!state.prompt.trim()) {
            setState(prev => ({...prev, error: 'Please enter a prompt'}));
            return;
        }

        setState(prev => ({...prev, isLoading: true, error: null}));

        try {
            const token = localStorage.getItem('auth_token');
            const headers: HeadersInit = {
                'Content-Type': 'application/json',
            };
            
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            const response = await fetch('/api/generate', {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    prompt: state.prompt,
                    model: state.selectedModel,
                    aspectRatio: state.aspectRatio,
                    format: state.outputFormat,
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to generate image');
            }

            setState(prev => ({
                ...prev,
                generatedImage: data.image,
                freeGenerationsRemaining: data.freeGenerationsRemaining || prev.freeGenerationsRemaining,
                userPoints: data.userPoints !== null ? data.userPoints : prev.userPoints,
            }));
        } catch (error) {
            setState(prev => ({
                ...prev,
                error: error instanceof Error ? error.message : 'Failed to generate image'
            }));
        } finally {
            setState(prev => ({...prev, isLoading: false}));
        }
    }, [state.prompt, state.selectedModel, state.aspectRatio, state.outputFormat]);

    useEffect(() => {
        fetchGenerationData();
    }, [fetchGenerationData]);

    return {
        state,
        updateState: (updates: any) => setState(prev => ({...prev, ...updates})),
        handleGenerate,
        fetchGenerationData
    };
};
```

---

### 阶段 5：测试（10分钟）

#### 5.1 重启服务

```bash
# 重启 Worker
cd worker
npx wrangler dev

# 重启 Next.js
cd ..
npm run dev
```

#### 5.2 测试场景

**场景 1：未登录用户**
1. 清除 localStorage
2. 生成 3 次图片（flux-schnell）
3. 验证免费额度从 3 → 2 → 1 → 0
4. 第 4 次应该提示登录

**场景 2：登录用户**
1. 登录（积分 50）
2. 生成 1 次图片（flux-schnell，1 积分）
3. 验证积分 50 → 49
4. 验证免费额度不变（仍然是 3）

**场景 3：高级模型**
1. 未登录用户选择 flux-pro
2. 应该提示需要登录
3. 登录后可以生成

---

## ✅ 完成标准

- [ ] Worker 端点全部实现并测试通过
- [ ] D1 数据库表创建成功
- [ ] Next.js API 简化完成
- [ ] 前端 hook 更新完成
- [ ] 未登录用户免费额度正常工作
- [ ] 登录用户积分扣除正常工作
- [ ] 所有旧代码已删除
- [ ] 文档已更新

---

## 📝 回滚计划

如果出现问题，可以快速回滚：

```bash
git checkout backup-old-points-system
git checkout -b main-rollback
git push origin main-rollback --force
```

---

**创建时间**: 2024-12-15  
**预计时间**: 70 分钟  
**状态**: 📝 待执行
