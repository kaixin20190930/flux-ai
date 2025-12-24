# Google OAuth 登录集成 - 设计文档

## 概述

本设计实现完整的 Google OAuth 2.0 登录流程，包括前端授权、后端验证、用户注册/登录和会话管理。采用 100% Cloudflare 架构，所有 API 请求通过 Worker 处理。

## 架构

```
用户点击 Google 登录
    ↓
前端: 使用 Google OAuth 库
    ↓
Google 授权页面
    ↓
用户授权
    ↓
Google 返回 authorization code
    ↓
前端: 用 code 换取 access_token
    ↓
前端: 调用 Worker API (/auth/google-login)
    ├─ 传递: { googleToken, email, name }
    ↓
Worker: 验证 Google token
    ├─ 调用 Google API
    ├─ 验证 token 有效性
    ├─ 提取用户信息
    ↓
Worker: 检查用户是否存在
    ├─ 存在 → 登录流程
    └─ 不存在 → 注册流程（赠送 3 积分）
    ↓
Worker: 生成 JWT token
    ↓
Worker: 返回 { token, user }
    ↓
前端: 存储 token 到 localStorage
    ↓
前端: 跳转到 /create 页面
```

## 组件和接口

### 1. 前端组件

#### 1.1 Google OAuth 按钮组件

```typescript
// components/GoogleOAuthButton.tsx
interface GoogleOAuthButtonProps {
  onSuccess: (token: string, userInfo: any) => void;
  onError: (error: string) => void;
  dictionary: any;
}
```

**职责**:
- 渲染 Google 登录按钮
- 处理 Google OAuth 流程
- 获取 access token
- 调用成功/失败回调

#### 1.2 AuthForm 组件更新

```typescript
// components/AuthForm.tsx
const handleGoogleSignIn = async (googleToken: string, userInfo: any) => {
  try {
    // 调用 Worker API
    const response = await apiClient.googleLogin({
      googleToken,
      email: userInfo.email,
      name: userInfo.name,
    });
    
    // 登录成功，跳转
    router.push(`/${currentLocale}/create`);
  } catch (error) {
    setFormErrors({ general: error.message });
  }
};
```

### 2. API 客户端

#### 2.1 新增 Google 登录方法

```typescript
// lib/api-client.ts
async googleLogin(data: {
  googleToken: string;
  email: string;
  name: string;
}) {
  const response = await this.request('/auth/google-login', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  
  if (response.token) {
    this.setToken(response.token);
  }
  
  return response;
}
```

### 3. Worker API 路由

#### 3.1 新增 Google 登录端点

```typescript
// worker/routes/auth.ts
/**
 * POST /auth/google-login - Google OAuth 登录
 */
auth.post('/google-login', zValidator('json', googleLoginSchema), async (c) => {
  const { googleToken, email, name } = c.req.valid('json');
  
  // 1. 验证 Google token
  const googleUser = await verifyGoogleToken(googleToken);
  
  // 2. 检查邮箱匹配
  if (googleUser.email !== email) {
    return c.json({ error: 'Email mismatch' }, 401);
  }
  
  // 3. 查找或创建用户
  let user = await findUserByEmail(c.env.DB, email);
  
  if (!user) {
    // 注册新用户
    user = await createGoogleUser(c.env.DB, { email, name });
  }
  
  // 4. 生成 JWT
  const token = await createJWT({ userId: user.id }, c.env.JWT_SECRET);
  
  // 5. 返回结果
  return c.json({
    success: true,
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      points: user.points,
    },
  });
});
```

### 4. 辅助函数

#### 4.1 验证 Google Token

```typescript
// worker/utils/google-oauth.ts
async function verifyGoogleToken(token: string): Promise<GoogleUser> {
  const response = await fetch(
    'https://www.googleapis.com/oauth2/v2/userinfo',
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  
  if (!response.ok) {
    throw new Error('Invalid Google token');
  }
  
  return await response.json();
}
```

#### 4.2 创建 Google 用户

```typescript
async function createGoogleUser(
  db: D1Database,
  data: { email: string; name: string }
): Promise<User> {
  const userId = crypto.randomUUID();
  
  // 创建用户（赠送 3 积分）
  await db.prepare(`
    INSERT INTO users (id, name, email, password_hash, points)
    VALUES (?, ?, ?, ?, 3)
  `).bind(userId, data.name, data.email, '').run();
  
  // 创建 OAuth 绑定
  await db.prepare(`
    INSERT INTO oauth_accounts (id, user_id, provider, provider_user_id, provider_email)
    VALUES (?, ?, 'google', ?, ?)
  `).bind(crypto.randomUUID(), userId, data.email, data.email).run();
  
  // 记录注册赠送积分
  await db.prepare(`
    INSERT INTO transactions (id, user_id, type, amount, balance_before, balance_after, reason)
    VALUES (?, ?, 'register_bonus', 3, 0, 3, 'Google registration bonus')
  `).bind(crypto.randomUUID(), userId).run();
  
  return {
    id: userId,
    name: data.name,
    email: data.email,
    points: 3,
  };
}
```

## 数据模型

### OAuth Accounts 表（已存在）

```sql
CREATE TABLE oauth_accounts (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  provider TEXT NOT NULL,              -- 'google'
  provider_user_id TEXT NOT NULL,      -- Google user ID (email)
  provider_email TEXT,                 -- Google email
  access_token TEXT,                   -- 可选：存储 access token
  refresh_token TEXT,                  -- 可选：存储 refresh token
  token_expires_at TEXT,               -- 可选：token 过期时间
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(provider, provider_user_id)
);
```

## 错误处理

### 错误类型

1. **GOOGLE_TOKEN_INVALID**: Google token 无效或过期
2. **EMAIL_MISMATCH**: 邮箱不匹配
3. **NETWORK_ERROR**: 网络连接失败
4. **DATABASE_ERROR**: 数据库操作失败
5. **UNKNOWN_ERROR**: 未知错误

### 错误响应格式

```typescript
{
  success: false,
  error: {
    code: 'GOOGLE_TOKEN_INVALID',
    message: 'Google 认证失败，请重试',
  }
}
```

## 测试策略

### 单元测试

1. **Google Token 验证**
   - 测试有效 token
   - 测试无效 token
   - 测试过期 token
   - 测试网络错误

2. **用户创建**
   - 测试新用户注册
   - 测试重复邮箱
   - 测试积分赠送
   - 测试 OAuth 绑定

3. **JWT 生成**
   - 测试 token 生成
   - 测试 token 验证
   - 测试 token 过期

### 集成测试

1. **完整登录流程**
   - 模拟 Google OAuth 流程
   - 验证用户创建
   - 验证 token 返回
   - 验证前端跳转

2. **错误场景**
   - 测试 token 验证失败
   - 测试邮箱不匹配
   - 测试数据库错误

### 手动测试清单

- [ ] 点击 Google 登录按钮
- [ ] Google 授权页面正常显示
- [ ] 授权后正确返回
- [ ] 新用户注册成功（赠送 3 积分）
- [ ] 老用户登录成功
- [ ] 登录后跳转到 /create 页面
- [ ] 用户信息正确显示
- [ ] 积分余额正确显示
- [ ] 多语言支持正常
- [ ] 错误提示清晰明确

## 安全考虑

1. **Token 验证**: 所有 Google token 必须在服务端验证
2. **HTTPS**: 生产环境强制使用 HTTPS
3. **CORS**: 限制允许的来源域名
4. **Rate Limiting**: 限制 OAuth 请求频率
5. **日志记录**: 记录所有认证尝试（成功和失败）

## 性能优化

1. **缓存**: 缓存 Google API 响应（短时间）
2. **并发**: 并行执行数据库查询
3. **超时**: 设置合理的 API 超时时间
4. **重试**: 网络错误时自动重试

## 部署步骤

1. **环境变量配置**
   ```bash
   # Cloudflare Pages
   NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-client-id
   
   # Cloudflare Worker
   wrangler secret put GOOGLE_CLIENT_SECRET
   ```

2. **代码部署**
   ```bash
   # 部署 Worker
   cd worker
   wrangler deploy --env production
   
   # 部署前端（推送到 GitHub，自动部署）
   git push origin main
   ```

3. **Google Cloud Console 配置**
   - 添加授权重定向 URI
   - 配置 OAuth 同意屏幕
   - 验证域名所有权

4. **测试验证**
   - 测试开发环境
   - 测试生产环境
   - 验证多语言支持
   - 验证错误处理

## 监控和日志

### 关键指标

- Google 登录成功率
- Google 登录失败率
- 平均登录耗时
- Token 验证失败次数

### 日志记录

```typescript
console.log('[Google OAuth] Login attempt:', {
  email: user.email,
  timestamp: new Date().toISOString(),
  success: true,
});
```

## 未来扩展

1. **支持更多 OAuth 提供商**: GitHub, Facebook, Apple
2. **账号绑定**: 允许用户绑定多个 OAuth 账号
3. **自动刷新 Token**: 使用 refresh token 自动刷新
4. **OAuth 权限管理**: 细粒度的权限控制
