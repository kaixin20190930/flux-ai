# Cloudflare-First 架构规范

## 🎯 核心原则

**本项目采用 100% Cloudflare 原生部署架构**，充分利用 Cloudflare 的全球边缘网络和服务生态。

---

## 📋 架构决策

### 完全 Cloudflare 部署

```
用户请求
    ↓
Cloudflare CDN（全球边缘节点）
    ↓
┌─────────────────────────────────────┐
│     Cloudflare Pages（前端）         │
│  - Next.js 静态页面                  │
│  - SSR with Pages Functions         │
│  - 多语言路由                        │
└─────────────────────────────────────┘
    ↓
┌─────────────────────────────────────┐
│   Cloudflare Workers（API 层）       │
│  - Hono 框架                        │
│  - 所有 API 接口                     │
│  - 认证和授权                        │
│  - 业务逻辑                          │
└─────────────────────────────────────┘
    ↓
┌──────────────┬──────────────┬──────────────┐
│ Cloudflare D1│ Cloudflare R2│ Cloudflare KV│
│  (数据库)     │  (对象存储)   │  (缓存/会话)  │
│  - SQLite    │  - 图片存储   │  - Session   │
│  - Drizzle   │  - 文件存储   │  - Cache     │
└──────────────┴──────────────┴──────────────┘
```

---

## 🏗️ 技术栈

### 前端
- **Cloudflare Pages** - 静态网站托管 + SSR
- **Next.js 14** - React 框架（适配 Pages）
- **TypeScript** - 类型安全
- **Tailwind CSS** - 样式
- **自定义 i18n** - 多语言支持

### 后端
- **Cloudflare Workers** - 边缘计算
- **Hono** - 轻量级 Web 框架
- **Drizzle ORM** - TypeScript ORM（支持 D1）
- **jose** - JWT 处理
- **bcryptjs** - 密码哈希

### 数据层
- **Cloudflare D1** - SQLite 数据库
- **Cloudflare R2** - 对象存储（S3 兼容）
- **Cloudflare KV** - 键值存储
- **Cloudflare Durable Objects** - 有状态服务（可选）

### 工具
- **Wrangler** - Cloudflare CLI
- **Miniflare** - 本地开发环境
- **Vitest** - 测试框架

---

## 📁 项目结构

```
flux-ai/
├── app/                    # Next.js 应用（Pages）
│   ├── [locale]/          # 多语言路由
│   └── api/               # API 路由（迁移到 Workers）
├── worker/                # Cloudflare Workers
│   ├── index.ts          # Worker 入口
│   ├── routes/           # API 路由
│   ├── middleware/       # 中间件
│   ├── services/         # 业务逻辑
│   └── db/               # 数据库操作
├── db/                    # 数据库相关
│   ├── schema.ts         # Drizzle Schema
│   ├── migrations/       # D1 迁移文件
│   └── seed.ts           # 种子数据
├── components/            # React 组件
├── lib/                   # 共享库
├── public/                # 静态资源
├── wrangler.toml         # Cloudflare 配置
└── package.json
```

---

## 🔧 开发规范

### 1. 数据库操作

**使用 Drizzle ORM**：

```typescript
// db/schema.ts
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name'),
  points: integer('points').default(50),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

// worker/services/userService.ts
import { drizzle } from 'drizzle-orm/d1';
import { users } from '@/db/schema';

export async function getUser(env: Env, userId: string) {
  const db = drizzle(env.DB);
  return await db.select().from(users).where(eq(users.id, userId)).get();
}
```

**❌ 不要使用 Prisma**：
```typescript
// ❌ 错误 - Prisma 不支持 D1
import { prisma } from '@/lib/prisma';
const user = await prisma.user.findUnique({ where: { id: userId } });
```

### 2. API 路由

**使用 Hono 框架**：

```typescript
// worker/routes/auth.ts
import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';

const auth = new Hono<{ Bindings: Env }>();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

auth.post('/login', zValidator('json', loginSchema), async (c) => {
  const { email, password } = c.req.valid('json');
  
  // 验证用户
  const user = await getUserByEmail(c.env, email);
  if (!user || !await verifyPassword(password, user.password)) {
    return c.json({ error: 'Invalid credentials' }, 401);
  }
  
  // 生成 JWT
  const token = await generateJWT(user);
  
  // 存储会话到 KV
  await c.env.KV.put(`session:${user.id}`, token, { expirationTtl: 86400 });
  
  return c.json({ token, user });
});

export default auth;
```

**❌ 不要使用 Next.js API Routes**：
```typescript
// ❌ 错误 - Next.js API Routes 不适合 Workers
export async function POST(req: NextRequest) {
  // ...
}
```

### 3. 认证系统

**使用 JWT + KV**：

```typescript
// worker/middleware/auth.ts
import { createMiddleware } from 'hono/factory';
import { jwtVerify } from 'jose';

export const authMiddleware = createMiddleware<{ Bindings: Env }>(async (c, next) => {
  const token = c.req.header('Authorization')?.replace('Bearer ', '');
  
  if (!token) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  
  try {
    // 验证 JWT
    const secret = new TextEncoder().encode(c.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    
    // 检查会话是否存在
    const session = await c.env.KV.get(`session:${payload.sub}`);
    if (!session) {
      return c.json({ error: 'Session expired' }, 401);
    }
    
    // 设置用户信息到上下文
    c.set('userId', payload.sub as string);
    c.set('user', payload);
    
    await next();
  } catch (error) {
    return c.json({ error: 'Invalid token' }, 401);
  }
});
```

**❌ 不要使用 NextAuth**：
```typescript
// ❌ 错误 - NextAuth 需要 Node.js runtime
import { auth } from '@/lib/auth';
const session = await auth();
```

### 4. 图片存储

**使用 Cloudflare R2**：

```typescript
// worker/services/imageService.ts
export async function uploadImage(
  env: Env,
  imageBuffer: ArrayBuffer,
  filename: string
): Promise<string> {
  // 上传到 R2
  await env.R2.put(filename, imageBuffer, {
    httpMetadata: {
      contentType: 'image/png',
    },
  });
  
  // 返回 CDN URL
  return `https://images.yourdomain.com/${filename}`;
}

export async function getImage(env: Env, filename: string): Promise<Response> {
  const object = await env.R2.get(filename);
  
  if (!object) {
    return new Response('Not found', { status: 404 });
  }
  
  return new Response(object.body, {
    headers: {
      'Content-Type': object.httpMetadata?.contentType || 'image/png',
      'Cache-Control': 'public, max-age=31536000',
    },
  });
}
```

### 5. 缓存策略

**使用 Cloudflare KV**：

```typescript
// worker/services/cacheService.ts
export async function getCached<T>(
  env: Env,
  key: string,
  fetcher: () => Promise<T>,
  ttl: number = 3600
): Promise<T> {
  // 尝试从 KV 读取
  const cached = await env.KV.get(key);
  if (cached) {
    return JSON.parse(cached);
  }
  
  // 缓存未命中，执行 fetcher
  const data = await fetcher();
  
  // 存储到 KV
  await env.KV.put(key, JSON.stringify(data), { expirationTtl: ttl });
  
  return data;
}
```

---

## 🚀 部署流程

### 1. 本地开发

```bash
# 安装依赖
npm install

# 启动本地开发服务器
npm run dev

# 启动 Worker 本地开发
npm run dev:worker

# 运行数据库迁移
npm run db:migrate

# 生成 Drizzle 类型
npm run db:generate
```

### 2. 部署到 Cloudflare

```bash
# 部署 Pages（前端）
npm run deploy:pages

# 部署 Workers（API）
npm run deploy:worker

# 运行生产数据库迁移
npm run db:migrate:prod

# 部署所有
npm run deploy
```

### 3. 环境变量配置

```bash
# 设置 Worker secrets
wrangler secret put JWT_SECRET
wrangler secret put REPLICATE_API_TOKEN
wrangler secret put STRIPE_SECRET_KEY
wrangler secret put GOOGLE_CLIENT_SECRET

# 设置 KV namespace
wrangler kv:namespace create "KV"
wrangler kv:namespace create "KV" --preview

# 设置 D1 database
wrangler d1 create flux-ai-db

# 设置 R2 bucket
wrangler r2 bucket create flux-ai-images
```

---

## 📊 性能优化

### 1. 边缘缓存

```typescript
// 使用 Cloudflare Cache API
export async function handleRequest(request: Request): Promise<Response> {
  const cache = caches.default;
  const cacheKey = new Request(request.url, request);
  
  // 检查缓存
  let response = await cache.match(cacheKey);
  
  if (!response) {
    // 缓存未命中，处理请求
    response = await processRequest(request);
    
    // 缓存响应
    const headers = new Headers(response.headers);
    headers.set('Cache-Control', 'public, max-age=3600');
    
    response = new Response(response.body, {
      status: response.status,
      headers,
    });
    
    await cache.put(cacheKey, response.clone());
  }
  
  return response;
}
```

### 2. 数据库查询优化

```typescript
// 使用索引
export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
}, (table) => ({
  emailIdx: index('email_idx').on(table.email),
  createdAtIdx: index('created_at_idx').on(table.createdAt),
}));

// 批量查询
const users = await db.select()
  .from(usersTable)
  .where(inArray(usersTable.id, userIds))
  .all();
```

### 3. 并发请求

```typescript
// 使用 Promise.all 并发执行
const [user, stats, history] = await Promise.all([
  getUser(env, userId),
  getUserStats(env, userId),
  getUserHistory(env, userId),
]);
```

---

## 🔒 安全最佳实践

### 1. 环境变量

```typescript
// ✅ 正确 - 使用 Worker secrets
const apiKey = env.REPLICATE_API_TOKEN;

// ❌ 错误 - 硬编码
const apiKey = 'sk-xxx';
```

### 2. SQL 注入防护

```typescript
// ✅ 正确 - 使用参数化查询
const user = await db.select()
  .from(users)
  .where(eq(users.email, email))
  .get();

// ❌ 错误 - 字符串拼接
const user = await db.run(`SELECT * FROM users WHERE email = '${email}'`);
```

### 3. XSS 防护

```typescript
// ✅ 正确 - 设置安全头
return new Response(html, {
  headers: {
    'Content-Type': 'text/html',
    'Content-Security-Policy': "default-src 'self'",
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
  },
});
```

---

## 📝 迁移检查清单

### 数据库
- [ ] 将 Prisma schema 转换为 Drizzle schema
- [ ] 创建 D1 数据库
- [ ] 运行迁移脚本
- [ ] 迁移现有数据
- [ ] 验证数据完整性

### 认证
- [ ] 实现 JWT 认证
- [ ] 使用 KV 存储会话
- [ ] 实现 OAuth 流程
- [ ] 实现密码重置
- [ ] 测试认证流程

### API
- [ ] 将所有 API 路由迁移到 Workers
- [ ] 使用 Hono 框架
- [ ] 实现中间件
- [ ] 添加错误处理
- [ ] 测试所有 API

### 存储
- [ ] 创建 R2 bucket
- [ ] 实现图片上传
- [ ] 实现图片访问
- [ ] 配置 CDN
- [ ] 测试图片功能

### 前端
- [ ] 适配 Cloudflare Pages
- [ ] 配置 SSR
- [ ] 更新 API 调用
- [ ] 测试所有页面
- [ ] 优化性能

### 部署
- [ ] 配置 wrangler.toml
- [ ] 设置环境变量
- [ ] 配置 CI/CD
- [ ] 部署到预览环境
- [ ] 部署到生产环境

---

## 🎯 成功标准

1. ✅ 100% 部署在 Cloudflare
2. ✅ 全球平均响应时间 < 200ms
3. ✅ 数据库查询 < 50ms
4. ✅ 所有功能正常
5. ✅ 通过所有测试
6. ✅ 成本降低 50%+

---

## 📚 参考资源

### 官方文档
- [Cloudflare Pages](https://developers.cloudflare.com/pages/)
- [Cloudflare Workers](https://developers.cloudflare.com/workers/)
- [Cloudflare D1](https://developers.cloudflare.com/d1/)
- [Cloudflare R2](https://developers.cloudflare.com/r2/)
- [Cloudflare KV](https://developers.cloudflare.com/kv/)
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/)

### 框架和工具
- [Hono](https://hono.dev/)
- [Drizzle ORM](https://orm.drizzle.team/)
- [jose (JWT)](https://github.com/panva/jose)

---

**最后更新**: 2024-12-12  
**版本**: 1.0  
**状态**: ✅ Cloudflare-First 架构规范
