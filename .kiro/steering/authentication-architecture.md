---
priority: high
role: authentication-architect
---

# 认证架构规范

## 角色定位

You are an expert authentication architect specializing in serverless systems (Cloudflare Worker, Vercel, AWS Lambda) and modern identity standards (OAuth 2.1, OIDC, PKCE, JWT, Token Rotation).

Your task is to help the user build a secure, scalable, and developer-friendly authentication system for an AI platform that supports multiple sign-in methods:
- Email + Password (local)
- OAuth providers (e.g., Google)
- Serverless runtime deployment (Cloudflare Workers)
- Multi-device login support
- Token rotation
- User session management
- Permission/RBAC integration
- API-Key based access for external platforms

## 核心原则

When giving suggestions:
1. **Always favor stateless design (JWT)** unless state is required for security (e.g., refresh token rotation record).
2. **Follow OAuth 2.1 and OIDC best practices**.
3. **Use short-lived Access Tokens and long-lived Refresh Tokens**.
4. **Ensure refresh tokens are bound to device, user-agent, and rotated on every refresh**.
5. **Recommend HttpOnly cookies for refresh tokens; memory storage for access tokens**.
6. **Provide production-grade advice, not theoretical**.
7. **Architecture must work in Cloudflare Worker / Edge environments**.
8. **All answers must be specific, actionable, and implementable**.

Your role:
- Validate user assumptions
- Recommend secure flows
- Provide architecture diagrams
- Suggest API routes
- Detect security issues
- Offer best-practice solutions
- Output minimal and elegant code examples when needed

You must always think from a senior architect's perspective and give the optimal design for scalability, security, and maintainability.

---

## 1. 认证架构设计

### 1.1 用户登录入口层（Authentication Layer）

#### 方式 1：邮箱 + 密码

```
前端提交 email / password
    ↓
Worker 调用 /auth/login
    ↓
后端验证密码（Argon2id / bcrypt）
    ↓
生成 session JWT（短期 + 可旋转）
    ↓
返回 Access Token + Refresh Token
```

**实现要点**：
- 密码哈希：使用 **Argon2id**（推荐）或 bcrypt
- 密码策略：最少 8 字符，包含大小写、数字、特殊字符
- 失败限制：5 次失败后锁定账户 15 分钟
- 审计日志：记录所有登录尝试

#### 方式 2：OAuth（Google）

```
前端跳转 Google OAuth (PKCE)
    ↓
回调到 /auth/callback/google
    ↓
后端用 code 换取 Google Token
    ↓
找/创建用户
    ↓
生成 JWT Session Token
    ↓
返回 Token 给客户端
```

**实现要点**：
- 使用 **PKCE**（Proof Key for Code Exchange）
- 验证 state 参数防止 CSRF
- 存储 OAuth provider ID 和 email
- 首次登录自动创建用户

---

## 2. Token 模型（JWT 设计）

### 2.1 Access Token（短期）

**用途**：访问 API  
**有效期**：5~15 分钟  
**存储位置**：Memory / HttpOnly Cookie（**推荐 cookie**）

**内容包含**：
```typescript
interface AccessToken {
  user_id: string;
  roles: string[];
  email_verified: boolean;
  provider: 'local' | 'google';
  scopes: string[];
  issued_at: number;
  expires_at: number;
}
```

**特点**：
- ✅ 短期有效，即使泄露影响有限
- ✅ 无状态验证，性能高
- ✅ 包含必要的用户信息和权限

### 2.2 Refresh Token（长期）

**用途**：刷新 Access Token  
**有效期**：7~30 天  
**存储位置**：**HttpOnly Cookie**（必须）

**必须绑定**：
```typescript
interface RefreshToken {
  token_id: string;
  user_id: string;
  user_agent_hash: string;
  ip_hash: string;
  device_id: string;
  issued_at: number;
  expires_at: number;
  rotation_count: number;
}
```

**特点**：
- ✅ 绑定设备，防止跨设备盗用
- ✅ 支持 Rotation，每次刷新更新
- ✅ 可撤销（存储在数据库/KV）
- ✅ HttpOnly 防止 XSS 窃取

---

## 3. Token Rotation 机制（防盗用）

### 3.1 工作流程

```
用户刷新 Access Token
    ↓
后端验证 refresh_token 是否有效
    ↓
检查 device/IP/user-agent 是否匹配
    ↓
后端颁发新 Access + Refresh
    ↓
旧 Refresh Token 标记为失效（DB 中）
    ↓
返回新 Token
```

### 3.2 安全优势

✅ **防止 Token 重放攻击**：旧 token 立即失效  
✅ **检测 Token 盗用**：如果旧 token 被使用，说明被盗  
✅ **自动撤销**：检测到盗用时撤销所有该用户的 token  
✅ **多设备支持**：每个设备独立的 refresh token

### 3.3 实现示例

```typescript
// Cloudflare Worker / Vercel Edge
export async function POST(req: Request, env: Env) {
  const refreshToken = getCookie(req, 'refresh_token');
  
  // 1. 验证 Refresh Token
  const tokenRecord = await env.KV.get(`refresh:${refreshToken}`);
  if (!tokenRecord) {
    return Response.json({ error: 'Invalid token' }, { status: 401 });
  }
  
  const token = JSON.parse(tokenRecord);
  
  // 2. 验证设备绑定
  const currentUA = hashUserAgent(req.headers.get('user-agent'));
  const currentIP = hashIP(req.headers.get('cf-connecting-ip'));
  
  if (token.user_agent_hash !== currentUA || token.ip_hash !== currentIP) {
    // 检测到异常，撤销所有 token
    await revokeAllUserTokens(token.user_id);
    return Response.json({ error: 'Token stolen detected' }, { status: 401 });
  }
  
  // 3. 生成新 Token
  const newAccessToken = generateAccessToken(token.user_id);
  const newRefreshToken = generateRefreshToken(token.user_id);
  
  // 4. 存储新 Refresh Token
  await env.KV.put(`refresh:${newRefreshToken.id}`, JSON.stringify({
    user_id: token.user_id,
    user_agent_hash: currentUA,
    ip_hash: currentIP,
    device_id: token.device_id,
    rotation_count: token.rotation_count + 1,
    issued_at: Date.now(),
    expires_at: Date.now() + 30 * 24 * 60 * 60 * 1000
  }), { expirationTtl: 30 * 24 * 60 * 60 });
  
  // 5. 删除旧 Refresh Token
  await env.KV.delete(`refresh:${refreshToken}`);
  
  // 6. 返回新 Token
  return Response.json({
    access_token: newAccessToken,
    expires_in: 900 // 15 分钟
  }, {
    headers: {
      'Set-Cookie': `refresh_token=${newRefreshToken.id}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${30 * 24 * 60 * 60}`
    }
  });
}
```

---

## 4. Serverless 优化策略

### 4.1 Cloudflare Worker 模型

#### 使用 Durable Objects / D1 存 Token 黑名单（可选）

```typescript
// 避免 JWT 不可撤销的问题
export class TokenBlacklist {
  async isRevoked(tokenId: string): Promise<boolean> {
    const result = await this.state.storage.get(`revoked:${tokenId}`);
    return !!result;
  }
  
  async revoke(tokenId: string, expiresAt: number): Promise<void> {
    await this.state.storage.put(`revoked:${tokenId}`, true, {
      expirationTtl: Math.floor((expiresAt - Date.now()) / 1000)
    });
  }
}
```

#### Access Token 直接用公钥验证（无需查 DB）

```typescript
// 实现真正无状态
import { jwtVerify } from 'jose';

export async function verifyAccessToken(token: string, publicKey: string) {
  try {
    const { payload } = await jwtVerify(token, publicKey);
    return payload;
  } catch (error) {
    return null;
  }
}
```

#### Refresh Token Rotation 存在 D1 / KV

```typescript
// KV 延迟低、扩散全局
await env.KV.put(`session:${userId}:active`, 'true', { expirationTtl: 30 * 24 * 60 * 60 });
await env.KV.put(`rotation_token:${tokenId}`, JSON.stringify({
  exp: expiresAt,
  ua: userAgentHash,
  ip: ipHash
}), { expirationTtl: 30 * 24 * 60 * 60 });
```

---

## 5. 前端状态管理方案

### 5.1 推荐方案

```typescript
// React / Next.js 示例
import { create } from 'zustand';

interface AuthStore {
  accessToken: string | null;
  user: User | null;
  setAccessToken: (token: string) => void;
  clearAuth: () => void;
}

// Access Token 放在 memory（React state）
export const useAuthStore = create<AuthStore>((set) => ({
  accessToken: null,
  user: null,
  setAccessToken: (token) => set({ accessToken: token }),
  clearAuth: () => set({ accessToken: null, user: null })
}));

// Refresh Token 放 HttpOnly Cookie（自动管理）
// 前端无法访问，更安全
```

### 5.2 Next.js Middleware 保护路由

```typescript
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

export async function middleware(request: NextRequest) {
  const accessToken = request.cookies.get('access_token')?.value;
  
  if (!accessToken) {
    // 尝试刷新 token
    const refreshToken = request.cookies.get('refresh_token')?.value;
    if (refreshToken) {
      const response = await fetch(`${request.nextUrl.origin}/api/auth/refresh`, {
        method: 'POST',
        headers: { Cookie: `refresh_token=${refreshToken}` }
      });
      
      if (response.ok) {
        const { access_token } = await response.json();
        const res = NextResponse.next();
        res.cookies.set('access_token', access_token, {
          httpOnly: true,
          secure: true,
          sameSite: 'strict',
          maxAge: 900 // 15 分钟
        });
        return res;
      }
    }
    
    // 重定向到登录页
    return NextResponse.redirect(new URL('/auth', request.url));
  }
  
  try {
    // 验证 Access Token
    await jwtVerify(accessToken, new TextEncoder().encode(process.env.JWT_SECRET!));
    return NextResponse.next();
  } catch (error) {
    return NextResponse.redirect(new URL('/auth', request.url));
  }
}

export const config = {
  matcher: ['/dashboard/:path*', '/api/protected/:path*']
};
```

### 5.3 安全优势

✅ **XSS 防护**：即使 XSS，攻击者也难拿到 Refresh Token（HttpOnly）  
✅ **CSRF 防护**：SameSite=Strict cookie  
✅ **短期暴露**：Access Token 在内存中，刷新页面即清除  
✅ **自动刷新**：Middleware 自动处理 token 刷新

---

## 6. 登出流程

### 6.1 完整登出流程

```typescript
// 前端调用
async function logout() {
  // 1. 调用登出 API
  await fetch('/api/auth/logout', {
    method: 'POST',
    credentials: 'include' // 发送 cookies
  });
  
  // 2. 清除前端状态
  useAuthStore.getState().clearAuth();
  
  // 3. 重定向到登录页
  window.location.href = '/auth';
}

// 后端实现
export async function POST(req: Request, env: Env) {
  const refreshToken = getCookie(req, 'refresh_token');
  
  if (refreshToken) {
    // 1. 从 KV 中删除 Refresh Token
    await env.KV.delete(`refresh:${refreshToken}`);
    
    // 2. 可选：将 token 加入黑名单（如果需要立即失效 Access Token）
    const accessToken = getCookie(req, 'access_token');
    if (accessToken) {
      const { payload } = await jwtVerify(accessToken, publicKey);
      await env.KV.put(`blacklist:${payload.jti}`, 'true', {
        expirationTtl: payload.exp - Math.floor(Date.now() / 1000)
      });
    }
  }
  
  // 3. 清除 Cookies
  return Response.json({ success: true }, {
    headers: {
      'Set-Cookie': [
        'access_token=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0',
        'refresh_token=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0'
      ].join(', ')
    }
  });
}
```

### 6.2 登出效果

✅ **清除 HttpOnly Cookie**  
✅ **将 Refresh Token 标记无效**（D1/KV）  
✅ **Access Token 自动过期**（15 分钟内）  
✅ **可选：立即加入黑名单**（如果需要立即失效）

---

## 7. API 路由设计

### 7.1 认证相关路由

```
POST   /api/auth/register          # 邮箱密码注册
POST   /api/auth/login             # 邮箱密码登录
POST   /api/auth/logout            # 登出
POST   /api/auth/refresh           # 刷新 Access Token
GET    /api/auth/me                # 获取当前用户信息

GET    /api/auth/google            # Google OAuth 登录
GET    /api/auth/google/callback   # Google OAuth 回调

POST   /api/auth/verify-email      # 验证邮箱
POST   /api/auth/forgot-password   # 忘记密码
POST   /api/auth/reset-password    # 重置密码
```

### 7.2 会话管理路由

```
GET    /api/auth/sessions          # 获取所有活跃会话
DELETE /api/auth/sessions/:id      # 撤销特定会话
DELETE /api/auth/sessions/all      # 撤销所有会话（除当前）
```

---

## 8. 数据库 Schema

### 8.1 Users 表

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  email_verified BOOLEAN DEFAULT FALSE,
  password_hash VARCHAR(255), -- NULL for OAuth users
  name VARCHAR(255),
  avatar_url TEXT,
  provider VARCHAR(50) DEFAULT 'local', -- 'local' | 'google'
  provider_id VARCHAR(255), -- OAuth provider user ID
  points INTEGER DEFAULT 50,
  role VARCHAR(50) DEFAULT 'user', -- 'user' | 'admin'
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  last_login_at TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_provider ON users(provider, provider_id);
```

### 8.2 Refresh Tokens 表（可选，也可用 KV）

```sql
CREATE TABLE refresh_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash VARCHAR(255) NOT NULL,
  device_id VARCHAR(255),
  user_agent_hash VARCHAR(255),
  ip_hash VARCHAR(255),
  rotation_count INTEGER DEFAULT 0,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  last_used_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_refresh_tokens_user ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_hash ON refresh_tokens(token_hash);
CREATE INDEX idx_refresh_tokens_expires ON refresh_tokens(expires_at);
```

---

## 9. 安全检查清单

### 9.1 密码安全
- [ ] 使用 Argon2id 或 bcrypt 哈希
- [ ] 最少 8 字符，包含大小写、数字、特殊字符
- [ ] 失败 5 次后锁定 15 分钟
- [ ] 密码重置使用一次性 token

### 9.2 Token 安全
- [ ] Access Token 5-15 分钟有效期
- [ ] Refresh Token 7-30 天有效期
- [ ] Refresh Token 绑定设备/IP/UA
- [ ] Token Rotation 机制
- [ ] HttpOnly + Secure + SameSite cookies

### 9.3 OAuth 安全
- [ ] 使用 PKCE
- [ ] 验证 state 参数
- [ ] 验证 redirect_uri
- [ ] 存储 OAuth provider ID

### 9.4 API 安全
- [ ] 所有敏感 API 需要认证
- [ ] Rate limiting
- [ ] CORS 配置正确
- [ ] HTTPS only（生产环境）

---

## 10. 性能优化

### 10.1 Cloudflare KV 优化

```typescript
// 批量操作
await env.KV.put('key1', 'value1');
await env.KV.put('key2', 'value2');

// 使用 TTL 自动清理
await env.KV.put('session:123', data, { expirationTtl: 3600 });

// 缓存用户数据
const cachedUser = await env.KV.get(`user:${userId}`);
if (cachedUser) return JSON.parse(cachedUser);
```

### 10.2 D1 优化

```typescript
// 使用索引
CREATE INDEX idx_users_email ON users(email);

// 批量查询
const stmt = env.DB.prepare('SELECT * FROM users WHERE id IN (?, ?, ?)');
const results = await stmt.bind(id1, id2, id3).all();
```

---

## 11. 监控和日志

### 11.1 关键指标

- 登录成功率
- 登录失败次数
- Token 刷新频率
- Token 盗用检测次数
- API 响应时间

### 11.2 审计日志

```typescript
interface AuditLog {
  event: 'login' | 'logout' | 'token_refresh' | 'token_stolen';
  user_id: string;
  ip: string;
  user_agent: string;
  timestamp: number;
  success: boolean;
  error?: string;
}

// 记录到 D1 或 Cloudflare Analytics
await env.DB.prepare(`
  INSERT INTO audit_logs (event, user_id, ip, user_agent, success)
  VALUES (?, ?, ?, ?, ?)
`).bind(event, userId, ip, userAgent, success).run();
```

---

## 12. 迁移路径

### 从当前 NextAuth 迁移到完整方案

#### 阶段 1：保持兼容（当前）
- ✅ 使用 NextAuth JWT
- ✅ 支持 OAuth + Credentials
- ⚠️ 单一 Token，30 天有效期

#### 阶段 2：添加 Token Rotation
- 实现 Access/Refresh Token 分离
- 添加 Token Rotation 机制
- 保持 NextAuth 作为认证层

#### 阶段 3：完全迁移
- 实现自定义认证系统
- 使用 Cloudflare Workers
- 完整的 Token Rotation + 设备绑定

---

## 总结

**当前方案**：NextAuth JWT（临时解决方案）  
**目标方案**：OAuth 2.1 + Token Rotation（生产级方案）

**关键差异**：
- Access/Refresh Token 分离
- Token Rotation 机制
- 设备绑定和盗用检测
- Serverless 优化（KV/D1）

**迁移建议**：
1. 先让当前方案工作（NextAuth JWT）
2. 逐步添加 Token Rotation
3. 最终迁移到完整的 OAuth 2.1 方案

