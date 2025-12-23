# 部署和测试指南

**更新时间**: 2024-12-23

## ✅ 已完成的工作

1. ✅ 在 Worker 中实现了完整的图片生成 API
2. ✅ 修复了 `createGenerationV2.ts` 中的表名（`points_transactions` → `transactions`）
3. ✅ 集成了 Replicate API 调用
4. ✅ 实现了轮询等待图片生成完成
5. ✅ 实现了数据库记录更新

## 🚀 部署步骤

### 1. 配置 Replicate API Token

首先需要配置 Replicate API Token：

```bash
cd worker

# 配置生产环境
wrangler secret put REPLICATE_API_TOKEN --env production
# 输入你的 Replicate API Token

# 配置开发环境
wrangler secret put REPLICATE_API_TOKEN
# 输入你的 Replicate API Token
```

### 2. 部署到开发环境

```bash
cd worker
wrangler deploy
```

预期输出：
```
✅ Deployed flux-ai-worker-dev
https://flux-ai-worker-dev.liukai19911010.workers.dev/
```

### 3. 部署到生产环境

```bash
cd worker
wrangler deploy --env production
```

预期输出：
```
✅ Deployed flux-ai-worker-prod
https://flux-ai-worker-prod.liukai19911010.workers.dev/
```

## 🧪 测试步骤

### 测试 1: 健康检查

```bash
# 开发环境
curl https://flux-ai-worker-dev.liukai19911010.workers.dev/

# 生产环境
curl https://flux-ai-worker-prod.liukai19911010.workers.dev/
```

预期响应：
```json
{
  "message": "Flux AI Cloudflare Worker - Hono Edition",
  "version": "2.0.0",
  "environment": "production",
  "timestamp": "2024-12-23T...",
  "status": "healthy"
}
```

### 测试 2: 注册用户

```bash
# 生产环境
curl -X POST https://flux-ai-worker-prod.liukai19911010.workers.dev/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "test123456"
  }'
```

预期响应：
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid-here",
    "name": "Test User",
    "email": "test@example.com",
    "points": 3,
    "isGoogleUser": false
  }
}
```

保存返回的 `token`，后续测试需要使用。

### 测试 3: 生成图片（未登录用户）

```bash
# 生产环境 - 未登录用户使用免费额度
curl -X POST https://flux-ai-worker-prod.liukai19911010.workers.dev/generation/generate \
  -H "Content-Type: application/json" \
  -H "x-fingerprint-hash: test-fingerprint-123" \
  -d '{
    "prompt": "A beautiful sunset over the ocean",
    "model": "flux-schnell",
    "aspectRatio": "1:1",
    "format": "jpg"
  }'
```

预期响应（需要等待 10-60 秒）：
```json
{
  "image": "https://replicate.delivery/pbxt/...",
  "userPoints": null,
  "freeGenerationsRemaining": 0,
  "pointsConsumed": 0,
  "usedFreeTier": true,
  "generationId": "uuid-here"
}
```

### 测试 4: 生成图片（登录用户）

```bash
# 使用测试 2 中获取的 token
TOKEN="your-token-here"

curl -X POST https://flux-ai-worker-prod.liukai19911010.workers.dev/generation/generate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -H "x-fingerprint-hash: test-fingerprint-123" \
  -d '{
    "prompt": "A futuristic city with flying cars",
    "model": "flux-schnell",
    "aspectRatio": "16:9",
    "format": "jpg"
  }'
```

预期响应（需要等待 10-60 秒）：
```json
{
  "image": "https://replicate.delivery/pbxt/...",
  "userPoints": 2,
  "freeGenerationsRemaining": 0,
  "pointsConsumed": 1,
  "usedFreeTier": false,
  "generationId": "uuid-here"
}
```

### 测试 5: 检查用户状态

```bash
curl https://flux-ai-worker-prod.liukai19911010.workers.dev/generation/status \
  -H "Authorization: Bearer $TOKEN" \
  -H "x-fingerprint-hash: test-fingerprint-123"
```

预期响应：
```json
{
  "success": true,
  "data": {
    "isLoggedIn": true,
    "userId": "uuid-here",
    "userPoints": 2,
    "freeGenerationsRemaining": 0
  }
}
```

## 🌐 前端测试

### 使用浏览器测试页面

1. 打开 `test-auth.html` 文件
2. 修改 Worker URL（如果需要）
3. 在浏览器中打开
4. 测试注册、登录、生成图片

### 使用实际前端应用

1. 确保 `.env.local` 中配置了正确的 Worker URL：
```env
NEXT_PUBLIC_WORKER_URL=https://flux-ai-worker-prod.liukai19911010.workers.dev
```

2. 启动前端应用：
```bash
npm run dev
```

3. 访问 `http://localhost:3000/en/create`

4. 测试完整流程：
   - 注册/登录
   - 输入 prompt
   - 选择模型
   - 点击生成
   - 等待图片生成（10-60 秒）
   - 查看生成的图片

## 🐛 故障排除

### 问题 1: Replicate API Token 未配置

**错误信息**:
```json
{
  "error": "Image generation service not configured"
}
```

**解决方案**:
```bash
cd worker
wrangler secret put REPLICATE_API_TOKEN --env production
```

### 问题 2: 图片生成超时

**错误信息**:
```json
{
  "error": "Failed to generate image"
}
```

**可能原因**:
- Replicate API 响应慢
- 网络问题
- Replicate 服务故障

**解决方案**:
- 检查 Worker 日志：`cd worker && wrangler tail --env production`
- 重试请求
- 检查 Replicate 服务状态

### 问题 3: 积分不足

**错误信息**:
```json
{
  "error": "Insufficient points. You need 1 points but only have 0."
}
```

**解决方案**:
- 检查用户积分余额
- 购买更多积分（如果已实现支付功能）
- 或者使用免费额度（未登录用户）

### 问题 4: 免费额度用完

**错误信息**:
```json
{
  "error": "Daily free limit reached. Please sign in to continue generating images."
}
```

**解决方案**:
- 注册/登录账号
- 使用积分生成图片

## 📊 监控和日志

### 查看 Worker 日志

```bash
cd worker

# 实时查看生产环境日志
wrangler tail --env production

# 实时查看开发环境日志
wrangler tail
```

### 查看数据库记录

```bash
cd worker

# 查看最近的生成记录
wrangler d1 execute flux-ai --remote --command \
  "SELECT id, user_id, model, status, image_url, created_at 
   FROM generation_history 
   ORDER BY created_at DESC 
   LIMIT 10;"

# 查看用户积分
wrangler d1 execute flux-ai --remote --command \
  "SELECT id, name, email, points 
   FROM users 
   ORDER BY created_at DESC 
   LIMIT 10;"

# 查看积分交易记录
wrangler d1 execute flux-ai --remote --command \
  "SELECT id, user_id, type, amount, reason, created_at 
   FROM transactions 
   ORDER BY created_at DESC 
   LIMIT 10;"
```

## ✅ 验收标准

完整的图片生成功能应该满足以下标准：

1. ✅ 未登录用户可以使用免费额度生成图片（每天 1 次）
2. ✅ 登录用户可以使用积分生成图片
3. ✅ 积分正确扣除
4. ✅ 生成记录正确保存到数据库
5. ✅ 图片 URL 正确返回给前端
6. ✅ 前端可以显示生成的图片
7. ✅ 用户积分余额正确更新
8. ✅ 免费额度正确追踪

## 📞 快速命令参考

```bash
# 部署开发环境
cd worker && wrangler deploy

# 部署生产环境
cd worker && wrangler deploy --env production

# 查看生产日志
cd worker && wrangler tail --env production

# 测试生产环境
./scripts/test-production.sh

# 查看数据库
cd worker && wrangler d1 execute flux-ai --remote --command "SELECT * FROM generation_history ORDER BY created_at DESC LIMIT 5;"
```

---

**下一步**: 配置 REPLICATE_API_TOKEN 并部署测试！
