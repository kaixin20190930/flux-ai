# 积分系统最终规则

## 📋 核心规则

### 1. 未登录用户
- **每日免费额度**：1 次/天
- **可用模型**：仅 flux-schnell（1 积分）
- **追踪方式**：IP + 指纹（防止删除 token 滥用）
- **限制**：用完后必须登录

### 2. 注册登录用户
- **注册赠送**：3 积分
- **积分消耗**：根据模型不同消耗不同积分
- **无免费额度**：登录用户直接使用积分，不使用免费额度

### 3. 模型积分消耗

| 模型 | 积分消耗 |
|------|---------|
| flux-schnell | 1 |
| flux-dev | 3 |
| flux-1.1-pro-ultra | 3 |
| flux-1.1-pro | 5 |
| flux-pro | 6 |

### 4. 防滥用机制

**追踪维度**：
- IP 地址（哈希存储）
- 浏览器指纹（哈希存储）
- 用户 ID（登录用户）

**规则**：
- 未登录用户：基于 IP + 指纹，每天 1 次
- 删除 localStorage token 不会重置免费额度
- 必须等到第二天才能重新获得免费额度

---

## 🔧 实施方案

### 阶段 1：注释旧代码
- `app/api/generate/route.ts` - 注释复杂的积分逻辑
- `app/api/getRemainingGenerations/route.ts` - 注释整个文件
- `utils/usageTrackingService.ts` - 保留但不使用

### 阶段 2：Worker 实现
- 创建 D1 表：`daily_usage`, `generation_history`, `transactions`
- 实现端点：`/generation/status`, `/generation/create`
- 修改注册逻辑：赠送 3 积分（不是 50）

### 阶段 3：Next.js 简化
- 重写 `/api/generate` - 调用 Worker
- 删除旧的免费额度检查逻辑

### 阶段 4：前端更新
- 更新 `useImageGeneration` hook
- 显示正确的积分和免费额度

---

## ✅ 测试场景

### 场景 1：未登录用户
1. 访问网站
2. 生成 1 次图片（flux-schnell）✅
3. 尝试生成第 2 次 → 提示"每日免费额度已用完，请登录"❌
4. 删除 localStorage token
5. 刷新页面
6. 尝试生成 → 仍然提示"每日免费额度已用完"❌（防滥用）

### 场景 2：注册新用户
1. 注册账号
2. 自动获得 3 积分 ✅
3. 生成 1 次图片（flux-schnell，1 积分）
4. 积分：3 → 2 ✅

### 场景 3：登录用户
1. 登录（积分 2）
2. 生成 1 次图片（flux-schnell，1 积分）
3. 积分：2 → 1 ✅
4. 生成 1 次图片（flux-dev，3 积分）
5. 提示"积分不足"❌

---

**创建时间**: 2024-12-15  
**状态**: ✅ 最终确认  
**下一步**: 开始实施
