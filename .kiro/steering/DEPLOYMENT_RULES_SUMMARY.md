# 部署规则总结 - 100% Cloudflare

## 📋 快速决策

### 我的代码应该部署到哪里？

```
所有功能 → Cloudflare ✅

前端页面？ → Cloudflare Pages ✅
API 接口？ → Cloudflare Workers ✅
数据库？ → Cloudflare D1 ✅
文件存储？ → Cloudflare R2 ✅
缓存/会话？ → Cloudflare KV ✅
```

## 🎯 核心原则

### 100% Cloudflare 原生架构

```typescript
// ✅ Cloudflare Workers (API)
import { Hono } from 'hono';
import { drizzle } from 'drizzle-orm/d1';

const app = new Hono<{ Bindings: Env }>();

app.post('/api/generate', async (c) => {
  const db = drizzle(c.env.DB);
  const user = await db.select().from(users).where(...);
  // 使用 D1 数据库
  // 使用 JWT 认证
  // 使用 KV 存储会话
});
```

```typescript
// ✅ Cloudflare Pages (前端)
// Next.js 应用，使用 @cloudflare/next-on-pages 构建
export default function Page() {
  return <div>Hello Cloudflare!</div>;
}
```

## ⚠️ 已移除的旧技术

### 不再使用
- ❌ Vercel (已移除)
- ❌ Neon PostgreSQL (已移除)
- ❌ Prisma ORM (已移除)
- ❌ NextAuth (已移除)

### 现在使用
- ✅ Cloudflare Pages (前端)
- ✅ Cloudflare Workers (API)
- ✅ Cloudflare D1 (数据库)
- ✅ Drizzle ORM (D1 ORM)
- ✅ JWT + KV (认证)

## 📁 项目架构

```
flux-ai/
├── app/                    # Next.js 应用 (Cloudflare Pages)
├── worker/                 # Cloudflare Workers
│   ├── index-hono.ts      # Hono 应用入口
│   ├── handlers/          # API 处理器
│   └── routes/            # API 路由
├── migrations/            # D1 数据库迁移
└── wrangler.toml         # Cloudflare 配置
```

## 🚀 部署流程

### 1. 部署 Worker (API)
```bash
cd worker
wrangler deploy --env production
```

### 2. 部署 Pages (前端)
```bash
# 推送到 GitHub，Cloudflare Pages 自动部署
git push origin main
```

### 3. 数据库迁移
```bash
cd worker
wrangler d1 migrations apply flux-ai --remote
```

## 📊 架构对比

| 功能 | 旧架构 (Vercel) | 新架构 (Cloudflare) |
|------|----------------|-------------------|
| 前端 | Vercel | Cloudflare Pages ✅ |
| API | Vercel | Cloudflare Workers ✅ |
| 数据库 | Neon PostgreSQL | Cloudflare D1 ✅ |
| ORM | Prisma | Drizzle ✅ |
| 认证 | NextAuth | JWT + KV ✅ |
| 存储 | 外部 S3 | Cloudflare R2 ✅ |
| 缓存 | Redis | Cloudflare KV ✅ |
| 成本 | 中等 | 极低 ✅ |
| 响应时间 | 100-300ms | < 50ms ✅ |

## ✅ 检查清单

### 开发时
- [ ] 所有 API 在 `worker/` 目录
- [ ] 使用 Drizzle ORM 操作 D1
- [ ] 使用 JWT 进行认证
- [ ] 使用 KV 存储会话

### 部署前
- [ ] 运行 `npm run build`
- [ ] 测试 Worker: `cd worker && wrangler dev`
- [ ] 检查环境变量配置
- [ ] 确认 D1 迁移已完成

### 部署后
- [ ] 测试 Worker API
- [ ] 测试前端页面
- [ ] 测试认证流程
- [ ] 验证数据库操作

## 🆘 常见问题

### Q: 如何操作数据库？
A: 使用 Drizzle ORM + D1
```typescript
import { drizzle } from 'drizzle-orm/d1';
import { users } from './schema';

const db = drizzle(env.DB);
const user = await db.select().from(users).where(...);
```

### Q: 如何进行认证？
A: 使用 JWT + KV
```typescript
import { jwtVerify } from 'jose';

const secret = new TextEncoder().encode(env.JWT_SECRET);
const { payload } = await jwtVerify(token, secret);

// 检查会话
const session = await env.KV.get(`session:${payload.sub}`);
```

### Q: 如何存储文件？
A: 使用 Cloudflare R2
```typescript
await env.R2.put(filename, fileBuffer, {
  httpMetadata: { contentType: 'image/png' }
});
```

## 📞 获取帮助

### 查看文档
```bash
# 部署架构
cat .kiro/steering/deployment-architecture.md

# 开发规范
cat .kiro/steering/ai-development-rules.md

# Cloudflare 架构
cat CLOUDFLARE_ARCHITECTURE.md
```

### 运行诊断
```bash
# 构建测试
npm run build

# Worker 测试
cd worker
wrangler dev

# D1 数据库测试
wrangler d1 execute flux-ai --remote --command "SELECT 1;"
```

---

**最后更新**: 2024-12-16  
**版本**: 2.0  
**状态**: ✅ 100% Cloudflare 架构
