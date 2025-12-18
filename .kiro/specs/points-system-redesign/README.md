# 积分系统重新设计规范

## 📋 当前问题分析

### 问题 1：免费额度显示不更新
- **现象**：前端一直显示 `remainingFreeGenerations: 2`
- **原因**：`usageTrackingService` 使用内存存储，但每次请求都重新计算，没有正确累加

### 问题 2：积分扣除接口未被调用
- **现象**：`/points/deduct` 接口没有被调用
- **原因**：`pointsToDeductFromUser = 0`（因为还有免费额度）

### 问题 3：系统混乱
- **免费额度系统**：基于 IP/指纹的每日限制（`usageTrackingService`）
- **用户积分系统**：基于用户账户的付费积分（Worker D1 数据库）
- **两个系统交织**：优先级不清晰，逻辑复杂

---

## 🎯 新系统设计原则

### 核心原则
1. **简单明确**：免费额度和用户积分完全分离
2. **Worker 优先**：所有积分逻辑在 Cloudflare Worker 中处理
3. **单一数据源**：使用 D1 数据库作为唯一真实来源
4. **清晰优先级**：明确的积分使用顺序

---

## 📊 新积分系统架构

### 架构图

```
用户请求生成图片
    ↓
Next.js API (/api/generate)
    ↓
验证 JWT Token
    ↓
调用 Worker API (/generation/create)
    ├─→ 检查用户状态（登录/未登录）
    ├─→ 检查免费额度（D1: daily_usage 表）
    ├─→ 检查用户积分（D1: users 表）
    ├─→ 计算积分扣除策略
    ├─→ 扣除积分（事务）
    ├─→ 调用 Replicate API
    └─→ 返回结果 + 更新后的积分
```

### 数据存储

**全部使用 Cloudflare D1 数据库**：

1. **users 表**：用户积分
2. **daily_usage 表**：每日免费额度使用记录
3. **generation_history 表**：生成历史记录
4. **transactions 表**：积分交易记录

---

## 💰 积分规则

### 模型积分消耗

| 模型 | 积分消耗 | 说明 |
|------|---------|------|
| flux-schnell | 1 | 快速生成 |
| flux-dev | 3 | 高质量 |
| flux-1.1-pro-ultra | 3 | 超高分辨率 |
| flux-1.1-pro | 5 | 专业级 |
| flux-pro | 6 | 顶级质量 |

### 免费额度规则

**每日免费额度**：3 次/天（基于 IP + 指纹）

**限制**：
- 只能使用 `flux-schnell` 模型（1 积分）
- 未登录用户：只能使用免费额度
- 已登录用户：可以使用免费额度 + 用户积分

### 积分使用优先级

#### 方案 A：登录用户优先使用免费额度（当前设计）

```
1. 检查免费额度
   ├─ 有免费额度 → 使用免费额度
   └─ 无免费额度 → 使用用户积分

优点：对用户友好，鼓励注册
缺点：可能让用户困惑
```

#### 方案 B：登录用户直接使用积分（推荐）

```
1. 检查用户状态
   ├─ 未登录 → 使用免费额度
   └─ 已登录 → 使用用户积分

优点：逻辑清晰，积分消耗明确
缺点：登录用户无法享受免费额度
```

#### 方案 C：用户可选择（最灵活）

```
1. 前端提供选项
   ├─ 使用免费额度（如果有）
   └─ 使用用户积分

优点：最灵活，用户自主选择
缺点：增加 UI 复杂度
```

**推荐使用方案 B**：逻辑最清晰，实现最简单。

---

## 🔧 实现方案

### 阶段 1：清理旧代码

**删除**：
- `utils/usageTrackingService.ts` - 旧的免费额度追踪
- `app/api/getRemainingGenerations/route.ts` - 旧的积分查询 API
- `app/api/generate/route.ts` 中的复杂积分逻辑

**保留**：
- Worker 的积分管理接口
- D1 数据库表结构

### 阶段 2：Worker 实现新逻辑

**新建 Worker 端点**：

#### 1. `POST /generation/check` - 检查是否可以生成

**请求**：
```json
{
  "model": "flux-schnell",
  "userId": 3  // 可选，未登录为 null
}
```

**响应**：
```json
{
  "success": true,
  "data": {
    "canGenerate": true,
    "useFreeTier": false,
    "pointsRequired": 1,
    "userPoints": 50,
    "freeGenerationsRemaining": 0,
    "reason": null
  }
}
```

#### 2. `POST /generation/create` - 创建生成任务

**请求**：
```json
{
  "model": "flux-schnell",
  "prompt": "...",
  "aspectRatio": "1:1",
  "format": "jpg",
  "userId": 3,
  "ipAddress": "1.2.3.4",
  "fingerprintHash": "abc123"
}
```

**响应**：
```json
{
  "success": true,
  "data": {
    "generationId": "uuid",
    "pointsDeducted": 1,
    "usedFreeTier": false,
    "newBalance": 49,
    "freeGenerationsRemaining": 0
  }
}
```

#### 3. `GET /user/status` - 获取用户状态

**响应**：
```json
{
  "success": true,
  "data": {
    "isLoggedIn": true,
    "userId": 3,
    "userPoints": 50,
    "freeGenerationsRemaining": 3,
    "dailyLimit": 3
  }
}
```

### 阶段 3：简化 Next.js API

**新的 `/api/generate` 逻辑**：

```typescript
export async function POST(req: NextRequest) {
  // 1. 获取 token 和用户信息
  const token = getToken(req);
  const user = token ? await verifyToken(token) : null;
  
  // 2. 获取请求参数
  const { prompt, model, aspectRatio, format } = await req.json();
  
  // 3. 调用 Worker 创建生成任务
  const generation = await fetch(`${WORKER_URL}/generation/create`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({
      model,
      prompt,
      aspectRatio,
      format,
      userId: user?.id,
      ipAddress: getIP(req),
      fingerprintHash: req.headers.get('x-fingerprint-hash')
    })
  });
  
  if (!generation.ok) {
    return Response.json({ error: 'Insufficient points' }, { status: 403 });
  }
  
  const { generationId } = await generation.json();
  
  // 4. 调用 Replicate API
  const image = await replicate.run(model, { input: { prompt, ... } });
  
  // 5. 更新生成记录
  await fetch(`${WORKER_URL}/generation/complete`, {
    method: 'POST',
    body: JSON.stringify({ generationId, imageUrl: image })
  });
  
  // 6. 返回结果
  return Response.json({
    image,
    userPoints: generation.data.newBalance,
    freeGenerationsRemaining: generation.data.freeGenerationsRemaining
  });
}
```

### 阶段 4：更新前端

**简化 `useImageGeneration` hook**：

```typescript
const fetchGenerationData = async () => {
  const response = await fetch(`${WORKER_URL}/user/status`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const data = await response.json();
  
  setState({
    userPoints: data.userPoints,
    freeGenerationsRemaining: data.freeGenerationsRemaining,
    isLoggedIn: data.isLoggedIn
  });
};
```

---

## 📝 D1 数据库表结构

### daily_usage 表

```sql
CREATE TABLE daily_usage (
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

CREATE INDEX idx_daily_usage_date ON daily_usage(date);
CREATE INDEX idx_daily_usage_ip ON daily_usage(ip_hash);
CREATE INDEX idx_daily_usage_fingerprint ON daily_usage(fingerprint_hash);
```

### generation_history 表

```sql
CREATE TABLE generation_history (
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

CREATE INDEX idx_generation_user ON generation_history(user_id);
CREATE INDEX idx_generation_date ON generation_history(created_at);
```

### transactions 表

```sql
CREATE TABLE transactions (
  id TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL,
  type TEXT NOT NULL,  -- 'deduct', 'purchase', 'refund'
  amount INTEGER NOT NULL,
  balance_before INTEGER NOT NULL,
  balance_after INTEGER NOT NULL,
  reason TEXT,
  generation_id TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX idx_transactions_user ON transactions(user_id);
CREATE INDEX idx_transactions_date ON transactions(created_at);
```

---

## ✅ 实施步骤

### 步骤 1：创建 Worker 新端点（优先）
- [ ] `worker/handlers/checkGeneration.ts`
- [ ] `worker/handlers/createGeneration.ts`
- [ ] `worker/handlers/completeGeneration.ts`
- [ ] `worker/handlers/getUserStatus.ts`
- [ ] `worker/routes/generation.ts` - 添加路由

### 步骤 2：更新 D1 数据库
- [ ] 创建 `daily_usage` 表
- [ ] 创建 `generation_history` 表
- [ ] 创建 `transactions` 表

### 步骤 3：简化 Next.js API
- [ ] 重写 `app/api/generate/route.ts`
- [ ] 删除 `app/api/getRemainingGenerations/route.ts`
- [ ] 删除 `utils/usageTrackingService.ts`

### 步骤 4：更新前端
- [ ] 简化 `hooks/useImageGeneration.tsx`
- [ ] 更新积分显示组件

### 步骤 5：测试
- [ ] 测试未登录用户免费额度
- [ ] 测试登录用户积分扣除
- [ ] 测试免费额度用完后的行为
- [ ] 测试不同模型的积分消耗

---

## 🎯 预期效果

### 未登录用户
```
1. 访问网站
2. 每天可以生成 3 次（flux-schnell）
3. 用完后提示登录
```

### 登录用户（方案 B）
```
1. 登录后直接使用用户积分
2. 不使用免费额度
3. 积分用完后提示购买
```

### 清晰的积分流程
```
生成图片 → Worker 检查 → 扣除积分 → 调用 Replicate → 返回结果
```

---

## 📊 对比：旧系统 vs 新系统

| 特性 | 旧系统 | 新系统 |
|------|--------|--------|
| 免费额度存储 | 内存 + 数据库 | D1 数据库 |
| 用户积分存储 | D1 数据库 | D1 数据库 |
| 积分逻辑位置 | Next.js API | Worker |
| 数据一致性 | 差（内存丢失） | 好（数据库） |
| 代码复杂度 | 高 | 低 |
| 可维护性 | 差 | 好 |

---

**创建时间**: 2024-12-15  
**状态**: 📝 设计阶段  
**下一步**: 实施步骤 1 - 创建 Worker 新端点
