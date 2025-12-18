---
priority: high
---

# AI 开发规范

## 1. 总体原则

### 语言要求
- **所有回答必须优先使用中文**，必要时补充英文术语
- 代码注释使用中文
- 文档和说明使用中文

### 云服务选择
- ❌ **不使用 AWS 服务**
- ✅ **优先使用市面常见云服务**：
  - Cloudflare (Workers, Pages, R2, D1)
  - Vercel (Edge Functions, KV, Postgres)
  - Neon (PostgreSQL - 本项目使用)
  - Supabase (Database, Auth, Storage, Edge Functions)
  - PlanetScale (MySQL)
  - MongoDB Atlas
  - Fly.io
  - Railway
  - Render

### 混合部署架构（本项目标准）
本项目采用 **Vercel + Cloudflare 混合部署架构**，充分利用两个平台的优势：

#### Vercel 负责（主要应用）
- ✅ **前端应用** - Next.js SSR/SSG 页面
- ✅ **UI 组件** - React 组件渲染
- ✅ **多语言路由** - i18n 路由处理
- ✅ **API 路由** - 需要数据库连接的 API（使用 Node.js runtime）
- ✅ **认证系统** - NextAuth database sessions
- ✅ **数据库操作** - Prisma + PostgreSQL

**关键规则**：
- 需要 Prisma/数据库连接的 API **必须部署在 Vercel**
- **不能使用 Edge Runtime**（因为 Prisma 不支持）
- 使用 Node.js runtime 以支持完整的数据库功能

#### Cloudflare 负责（边缘加速）
- ✅ **静态资源** - 图片、CSS、JS 文件
- ✅ **CDN 加速** - 全球边缘节点分发
- ✅ **边缘缓存** - 静态内容缓存
- ✅ **边缘 API** - 不需要数据库的轻量级 API
- ✅ **边缘逻辑** - 简单的计算和转换

**关键规则**：
- 只部署**不需要数据库连接**的内容
- 使用 Cloudflare R2 存储大文件
- 使用 Cloudflare Workers 处理边缘逻辑

#### 架构决策规则

**何时使用 Vercel**：
```typescript
// ✅ 需要数据库 → Vercel
export async function POST(req: NextRequest) {
  const session = await auth(); // NextAuth
  const user = await prisma.user.findUnique(...); // Prisma
  // 不使用 edge runtime
}
```

**何时使用 Cloudflare**：
```typescript
// ✅ 不需要数据库 → Cloudflare
export const runtime = 'edge'; // 可以使用 edge
export async function GET(req: NextRequest) {
  // 只做简单计算、缓存、转换
  return Response.json({ status: 'ok' });
}
```

**混合部署检查清单**：
- [ ] API 是否需要 Prisma/数据库？→ Vercel（移除 edge runtime）
- [ ] API 是否需要 NextAuth 认证？→ Vercel（移除 edge runtime）
- [ ] 是否只是静态资源或简单逻辑？→ Cloudflare（可用 edge runtime）
- [ ] 是否需要全球 CDN 加速？→ Cloudflare
- [ ] 是否需要文件存储？→ Cloudflare R2

### 回答质量要求
- 必须**结构化、可落地、可直接执行**
- 避免理论堆砌
- 提供完整的代码示例
- 包含部署和测试步骤

## 2. 前端开发规则

### TypeScript 强制要求
- 所有前端代码必须使用 **TypeScript**
- 定义清晰的 Interface 和 Type
- 避免使用 `any`，优先使用 `unknown` 或具体类型

### i18n 多语言强制要求
- **所有组件中的文案必须通过 i18n 输出**
- 禁止硬编码字符串
- 本项目使用**自定义 i18n 实现**（不是 next-intl）
- 翻译文件位于 `app/i18n/locales/*.json`
- 支持 20 种语言：en, zh, zh-TW, ja, ko, es, pt, de, fr, it, ru, ar, hi, id, tr, nl, pl, vi, th, ms

```typescript
// ❌ 错误示例
<button>Submit</button>

// ✅ 正确示例 - 本项目方式
import { getany } from '@/app/i18n/utils';

// 在服务端组件中
const dictionary = await getany(locale);
<button>{dictionary.common.submit}</button>

// 在客户端组件中 - 通过 props 传递
interface Props {
  dictionary: Dictionary;
}

export default function Component({ dictionary }: Props) {
  return <button>{dictionary.common.submit}</button>;
}
```

### 代码组织要求
- 代码简洁、模块化、易维护
- 避免复杂逻辑塞在一个文件里
- 单一职责原则
- 组件拆分合理

### 回答必须包含的结构
1. **组件结构** - 文件组织和依赖关系
2. **i18n 文案结构** - 翻译 key 的组织（JSON 格式）
3. **API 接口定义** - TypeScript Interface
4. **全局状态** - 如使用 React Context 或自定义 hooks

## 3. 后端开发规则

### 技术栈
- 默认使用 **TypeScript**
- 运行时：Node.js / Cloudflare Workers
- 框架：Next.js 14 App Router API Routes

### API 规范

#### 统一返回格式
```typescript
interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}
```

#### 输入参数校验
- 必须使用 **zod** 校验（本项目已有 zod 依赖）
- 所有用户输入必须验证

```typescript
import { z } from 'zod';

const createToolSchema = z.object({
  name: z.string().min(1).max(100),
  url: z.string().url(),
  category: z.string(),
});

export async function POST(req: Request) {
  const body = await req.json();
  const validated = createToolSchema.parse(body); // 自动抛出错误
  // ...
}
```

#### 日志要求
- 使用项目的 `logUtils.ts` 工具
- 日志可读性强
- 包含关键信息：用户 ID、请求 ID、时间戳
- 错误日志包含堆栈信息

```typescript
import { logWithTimestamp } from '@/utils/logUtils';

logWithTimestamp('操作成功', { userId, action: 'generate' });
```

### AI 网站后端核心流程

所有 AI 相关后端必须自动涵盖：

1. **用户配额管理**
```typescript
// 本项目使用 Prisma + PostgreSQL
const user = await prisma.user.findUnique({
  where: { id: userId },
  select: { points: true }
});
```

2. **使用量追踪**
```typescript
// 本项目使用 usageTrackingService
import { usageTrackingService } from '@/utils/usageTrackingService';

const usageCheck = await usageTrackingService.checkUsageLimit(
  fingerprintHash,
  ipAddress,
  userId || null
);

if (!usageCheck.allowed) {
  return Response.json({ error: usageCheck.reason }, { status: 403 });
}
```

3. **限流策略**
```typescript
// 使用 Upstash Redis 或类似服务
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '1 m'), // 每分钟 10 次
});

const { success } = await ratelimit.limit(identifier);
if (!success) {
  return new Response('Too many requests', { status: 429 });
}
```

4. **缓存策略**
- 相同 prompt 缓存结果
- 使用 Redis / Upstash / Vercel KV

5. **Fallback 模型机制**
```typescript
const MODEL_FALLBACK_CHAIN = [
  'deepseek-chat',
  'qwen-turbo',
  'gpt-3.5-turbo',
];

async function callAIWithFallback(prompt: string) {
  for (const model of MODEL_FALLBACK_CHAIN) {
    try {
      return await callModel(model, prompt);
    } catch (error) {
      logWithTimestamp(`模型 ${model} 调用失败，尝试下一个`);
      continue;
    }
  }
  throw new Error('所有模型调用失败');
}
```

## 4. AI 相关规则

### 模型选择优先级
1. **DeepSeek** (deepseek-chat, deepseek-coder) - 性价比最高
2. **Qwen** (qwen-turbo, qwen-plus) - 中文优秀
3. **Groq** (llama3-70b) - 速度快
4. **Together AI** - 开源模型
5. **OpenRouter** - 聚合多个模型
6. OpenAI (gpt-3.5-turbo, gpt-4) - 最后选择

### Prompt 设计要求

回答必须包含：
1. **适合的模型推荐**
2. **Prompt 结构模板**
3. **调用示例（TypeScript）**
4. **流式输出（SSE）示例**

#### Prompt 模板示例
```typescript
interface PromptTemplate {
  system: string;
  user: string;
  variables: Record<string, string>;
}

const translatePrompt: PromptTemplate = {
  system: '你是一个专业的翻译助手，擅长将内容翻译成自然流畅的{targetLang}。',
  user: '请将以下内容翻译成{targetLang}：\n\n{content}',
  variables: {
    targetLang: '目标语言',
    content: '待翻译内容',
  },
};
```

#### 流式输出示例
```typescript
export async function POST(req: Request) {
  const { prompt } = await req.json();
  
  const stream = new ReadableStream({
    async start(controller) {
      const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [{ role: 'user', content: prompt }],
          stream: true,
        }),
      });
      
      const reader = response.body?.getReader();
      if (!reader) return;
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        controller.enqueue(value);
      }
      
      controller.close();
    },
  });
  
  return new Response(stream, {
    headers: { 'Content-Type': 'text/event-stream' },
  });
}
```

### API Key 安全管理
- ❌ **禁止在前端暴露 API Key**
- ✅ **统一后端代理**
- 使用环境变量存储
- 定期轮换 Key

```typescript
// ✅ 正确：后端代理
// app/api/ai/chat/route.ts
export async function POST(req: Request) {
  const apiKey = process.env.DEEPSEEK_API_KEY; // 服务端读取
  // ...
}

// ❌ 错误：前端直接调用
// const apiKey = 'sk-xxx'; // 永远不要这样做
```

### 成本优化提示
- 当模型调用成本可能过高时，**必须主动提示**
- 提供更低成本的替代方案
- 建议使用缓存减少调用次数

## 5. 全球化支持规则

任何涉及国际化功能，必须自动考虑：

### 文案多语言
- 使用本项目的 i18n 系统
- 支持 20 种语言
- 翻译文件位于 `app/i18n/locales/*.json`

### 货币显示
```typescript
// 使用 Intl API
const formatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD', // 根据用户地区动态切换
});

const price = formatter.format(99.99);
```

### 日期格式
```typescript
// 使用 date-fns（本项目已安装）
import { format } from 'date-fns';
import { zhCN, enUS } from 'date-fns/locale';

const formattedDate = format(new Date(), 'PPP', {
  locale: locale === 'zh' ? zhCN : enUS
});
```

### 时区处理
```typescript
// 使用 Intl API
const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
```

### SEO 多语言 URL
```
/en/create
/zh/create
/ja/create
```

### RTL 布局支持
```css
/* 支持阿拉伯语等 RTL 语言 */
[dir="rtl"] .container {
  direction: rtl;
}
```

### 支付逻辑
- 主要：**Stripe**（本项目已集成）
- 中国用户：**Ping++** / **Stripe China** / 支付宝 / 微信支付

## 6. 数据隐私与合规规则

### 默认考虑合规要求
- **GDPR** (欧盟)
- **CCPA** (加州)
- **中国数据跨境合规**

### 禁止行为
- ❌ 不得输出用户敏感信息
- ❌ 不得存储未加密的密码
- ❌ 不得记录完整的信用卡号

### 合规替代方案
```typescript
// ❌ 错误：直接存储敏感数据
await db.insert({ email, password, creditCard });

// ✅ 正确：加密或使用第三方
import * as bcrypt from 'bcryptjs';

await prisma.user.create({
  data: {
    email,
    password: await bcrypt.hash(password, 10),
    // 不存储卡号，使用 Stripe Customer ID
  }
});
```

### Cookie 同意
- 必须实现 Cookie 同意横幅
- 区分必要 Cookie 和分析 Cookie

## 7. 性能与架构规则

### 服务部署优先推荐
1. **Vercel** - Next.js 最佳部署平台（本项目使用）
2. **Cloudflare Workers** - 全球边缘计算
3. **Cloudflare Pages** - 静态站点

### 必须自动考虑

#### 缓存策略
```typescript
// Next.js 缓存示例
export const revalidate = 3600; // 1 小时

// Cloudflare Workers 缓存
const cache = caches.default;
const cachedResponse = await cache.match(request);
if (cachedResponse) return cachedResponse;
```

#### 数据库连接池
```typescript
// Prisma 连接池（本项目使用）
// lib/prisma.ts 已配置单例模式
import { prisma } from '@/lib/prisma';
```

#### 冷启动优化
- 减少依赖包大小
- 使用 Edge Runtime
- 延迟加载非关键模块

#### 流式输出优化
- AI 响应使用 SSE (Server-Sent Events)
- 图片使用渐进式加载
- 大文件分块传输

## 8. 安全与滥用防护规则

### 所有回答默认考虑

#### Rate Limit (限速)
```typescript
// 本项目已实现 usageTrackingService
import { usageTrackingService } from '@/utils/usageTrackingService';

const usageCheck = await usageTrackingService.checkUsageLimit(
  fingerprintHash,
  ipAddress,
  userId || null
);
```

#### API Key 泄漏检测
```typescript
// 检测代码中是否包含 API Key
const API_KEY_PATTERN = /sk-[a-zA-Z0-9]{32,}/g;
if (API_KEY_PATTERN.test(userInput)) {
  throw new Error('检测到 API Key，已拒绝');
}
```

#### 文本输入清洗
```typescript
import DOMPurify from 'isomorphic-dompurify';

// XSS 防护
const cleanInput = DOMPurify.sanitize(userInput);

// SQL 注入防护 - 使用 Prisma 参数化查询
const user = await prisma.user.findUnique({
  where: { email: userInput } // 自动转义
});
```

#### NSFW 内容检测
```typescript
// 使用 Cloudflare AI 或 OpenAI Moderation API
const response = await fetch('https://api.openai.com/v1/moderations', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ input: userContent }),
});

const { results } = await response.json();
if (results[0].flagged) {
  throw new Error('内容违规');
}
```

#### robots.txt 与反爬虫
```
# public/robots.txt
User-agent: *
Allow: /
Disallow: /api/
Disallow: /admin/

# 限制爬虫频率
Crawl-delay: 10
```

## 9. 回答格式要求

每次回答必须按以下结构输出（如适用）：

### 1. 摘要
- 简要说明解决方案
- 关键技术点

### 2. 解决方案结构
- 文件组织
- 模块划分
- 数据流向

### 3. 前端代码（TS + i18n）
```typescript
// 完整的 TypeScript 代码
// 包含 i18n 集成
```

### 4. 后端代码（TS）
```typescript
// API 路由
// 数据验证
// 错误处理
```

### 5. 数据库设计
```sql
-- 表结构
-- 索引
-- 关系
```

### 6. AI 模型调用示例
```typescript
// 模型选择
// Prompt 设计
// 流式输出
```

### 7. 全球化注意点
- i18n 配置
- 货币/日期处理
- SEO 多语言

### 8. 性能与成本建议
- 缓存策略
- 成本估算
- 优化建议

## 10. 项目特定规则

### 本项目技术栈
- Next.js 14.2.5 App Router
- TypeScript 5.5.4 (strict mode)
- 自定义 i18n 实现（20 种语言）
- Prisma ORM + PostgreSQL (Neon)
- NextAuth v5 (database sessions)
- Tailwind CSS
- npm (包管理器)

### 本项目约定
- Server Components 优先
- 所有文案通过 `app/i18n/locales/*.json` 管理
- API 返回格式遵循统一标准
- 使用 `@/` 路径别名
- 认证使用 NextAuth 的 `auth()` 函数
- 数据库操作使用 Prisma
- 日志使用 `logUtils.ts`
- 性能监控使用 `performanceMonitor.ts`

### 禁止事项
- ❌ 不使用 AWS 服务
- ❌ 不在前端硬编码文案
- ❌ 不在前端暴露 API Key
- ❌ 不使用 yarn 或 pnpm（必须用 npm）
- ❌ 不使用 JWT 进行会话管理（使用 database sessions）
- ❌ 不在需要数据库的 API 中使用 Edge Runtime

### Edge Runtime 使用规则（重要）
**关键原则**：Edge Runtime 不支持 Prisma，因此有严格的使用限制

#### ✅ 可以使用 Edge Runtime 的场景
```typescript
// 1. 纯静态响应
export const runtime = 'edge';
export async function GET() {
  return Response.json({ status: 'ok' });
}

// 2. 简单计算（无数据库）
export const runtime = 'edge';
export async function POST(req: NextRequest) {
  const { a, b } = await req.json();
  return Response.json({ sum: a + b });
}

// 3. 外部 API 调用（无数据库）
export const runtime = 'edge';
export async function GET(req: NextRequest) {
  const response = await fetch('https://api.example.com/data');
  return Response.json(await response.json());
}
```

#### ❌ 不能使用 Edge Runtime 的场景
```typescript
// 1. 使用 Prisma
// ❌ 错误
export const runtime = 'edge';
export async function GET() {
  const users = await prisma.user.findMany(); // Prisma 不支持 Edge
  return Response.json(users);
}

// ✅ 正确 - 移除 edge runtime
export async function GET() {
  const users = await prisma.user.findMany();
  return Response.json(users);
}

// 2. 使用 NextAuth
// ❌ 错误
export const runtime = 'edge';
export async function POST(req: NextRequest) {
  const session = await auth(); // NextAuth database sessions 需要 Prisma
  // ...
}

// ✅ 正确 - 移除 edge runtime
export async function POST(req: NextRequest) {
  const session = await auth();
  // ...
}

// 3. 任何数据库操作
// ❌ 错误
export const runtime = 'edge';
export async function POST(req: NextRequest) {
  await prisma.user.update(...); // 不支持
}
```

#### 检查工具
```bash
# 自动检测和修复 Edge Runtime 冲突
npx tsx scripts/fix-edge-runtime-auth.ts
```

### 关键文件位置
- 认证配置：`lib/auth.ts`
- 数据库客户端：`lib/prisma.ts`
- 环境变量验证：`lib/env-validator.ts`
- i18n 工具：`app/i18n/utils.ts`
- 使用量追踪：`utils/usageTrackingService.ts`
- 性能监控：`utils/performanceMonitor.ts`
- 日志工具：`utils/logUtils.ts`

### 环境变量要求
所有新功能必须：
1. 在 `.env.example` 中添加示例
2. 在 `lib/env-validator.ts` 中添加验证
3. 在文档中说明用途


## 11. 部署架构规则

### 混合部署策略（Vercel + Cloudflare）

本项目采用混合部署架构，充分利用 Vercel 和 Cloudflare 的各自优势：

#### 架构图
```
用户请求
    ↓
Cloudflare CDN (边缘层)
    ├─→ 静态资源 (图片、CSS、JS) → Cloudflare Pages/R2
    ├─→ 边缘 API (无数据库) → Cloudflare Workers
    └─→ 动态内容 → Vercel
            ├─→ SSR 页面 (Next.js)
            ├─→ API 路由 (Node.js runtime)
            ├─→ 认证系统 (NextAuth)
            └─→ 数据库操作 (Prisma + Neon)
```

### Vercel 部署清单

**部署内容**：
- ✅ Next.js 应用（SSR/SSG）
- ✅ 所有 React 组件和页面
- ✅ 多语言路由 (`/[locale]/...`)
- ✅ 需要数据库的 API 路由
- ✅ NextAuth 认证系统
- ✅ Prisma 数据库操作

**配置要求**：
```typescript
// vercel.json (如需自定义)
{
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "nextjs",
  "regions": ["iad1"], // 选择靠近数据库的区域
  "env": {
    "DATABASE_URL": "@database_url",
    "NEXTAUTH_URL": "@nextauth_url",
    "NEXTAUTH_SECRET": "@nextauth_secret"
  }
}
```

**环境变量**（必须在 Vercel 配置）：
- `DATABASE_URL` - Neon PostgreSQL 连接字符串
- `NEXTAUTH_URL` - 应用 URL
- `NEXTAUTH_SECRET` - NextAuth 密钥
- `NEXT_PUBLIC_GOOGLE_CLIENT_ID` - Google OAuth
- `GOOGLE_CLIENT_SECRET` - Google OAuth 密钥
- `REPLICATE_API_TOKEN` - AI 模型 API
- `STRIPE_SECRET_KEY` - Stripe 支付

**部署命令**：
```bash
# 部署到 Vercel
npm run deploy:vercel

# 或使用 Vercel CLI
vercel --prod
```

### Cloudflare 部署清单

**部署内容**：
- ✅ 静态资源（图片、字体、图标）
- ✅ 生成的图片文件
- ✅ AI 模型输出缓存
- ✅ 边缘 API（不需要数据库的轻量级 API）
- ✅ CDN 缓存配置

**使用场景**：

1. **静态资源托管（Cloudflare R2）**
```typescript
// 上传生成的图片到 R2
const uploadToR2 = async (imageBuffer: Buffer, filename: string) => {
  const formData = new FormData();
  formData.append('file', new Blob([imageBuffer]));
  
  await fetch(`https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/r2/buckets/${BUCKET_NAME}/objects/${filename}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${R2_API_TOKEN}`,
    },
    body: imageBuffer,
  });
  
  return `https://cdn.yourdomain.com/${filename}`;
};
```

2. **边缘缓存 API（Cloudflare Workers）**
```typescript
// worker/edge-cache.ts
export const runtime = 'edge'; // ✅ 可以使用，因为不需要数据库

export async function GET(request: Request) {
  const cache = caches.default;
  const cacheKey = new Request(request.url, request);
  
  // 检查缓存
  let response = await cache.match(cacheKey);
  
  if (!response) {
    // 从源获取
    response = await fetch(request);
    
    // 缓存 1 小时
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

3. **边缘图片优化（Cloudflare Images）**
```typescript
// 使用 Cloudflare Images 进行图片优化
const optimizedImageUrl = `https://imagedelivery.net/${ACCOUNT_HASH}/${IMAGE_ID}/public`;
```

**配置文件**：
```toml
# wrangler.toml
name = "flux-ai-edge"
main = "worker/index.ts"
compatibility_date = "2024-01-01"

[env.production]
routes = [
  { pattern = "cdn.yourdomain.com/*", zone_name = "yourdomain.com" }
]

[[r2_buckets]]
binding = "IMAGES"
bucket_name = "flux-ai-images"
preview_bucket_name = "flux-ai-images-preview"

[vars]
ENVIRONMENT = "production"
```

### 部署决策流程图

```
新功能开发
    ↓
需要数据库？
    ├─ 是 → 部署到 Vercel
    │       ├─ 使用 Node.js runtime
    │       ├─ 可以使用 Prisma
    │       └─ 可以使用 NextAuth
    │
    └─ 否 → 可以选择
            ├─ Vercel (如果是 Next.js 页面)
            └─ Cloudflare (如果是静态资源或边缘 API)
                    ├─ 可以使用 Edge Runtime
                    ├─ 使用 Workers/Pages
                    └─ 使用 R2 存储
```

### 性能优化建议

#### Vercel 优化
```typescript
// 1. 使用 ISR (Incremental Static Regeneration)
export const revalidate = 3600; // 1 小时重新验证

// 2. 使用 Streaming SSR
import { Suspense } from 'react';

export default function Page() {
  return (
    <Suspense fallback={<Loading />}>
      <DataComponent />
    </Suspense>
  );
}

// 3. 优化数据库查询
const users = await prisma.user.findMany({
  select: { id: true, name: true }, // 只选择需要的字段
  take: 10, // 限制数量
});
```

#### Cloudflare 优化
```typescript
// 1. 使用 Cache API
const cache = await caches.open('v1');
await cache.put(request, response);

// 2. 使用 KV 存储
await env.KV.put('key', 'value', { expirationTtl: 3600 });

// 3. 使用 Durable Objects（有状态）
export class Counter {
  async fetch(request: Request) {
    // 处理请求
  }
}
```

### 监控和日志

#### Vercel 监控
```typescript
// 使用 Vercel Analytics
import { Analytics } from '@vercel/analytics/react';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
```

#### Cloudflare 监控
```typescript
// Worker 日志
export default {
  async fetch(request: Request, env: Env) {
    console.log('Request:', request.url);
    
    try {
      const response = await handleRequest(request);
      return response;
    } catch (error) {
      console.error('Error:', error);
      return new Response('Internal Error', { status: 500 });
    }
  }
};
```

### 成本优化

#### Vercel 成本控制
- 使用 ISR 减少 SSR 调用
- 优化数据库查询减少执行时间
- 使用 Edge Config 存储配置（免费）
- 监控 Function 执行时间

#### Cloudflare 成本控制
- R2 存储比 S3 便宜 90%
- Workers 前 100,000 请求/天免费
- 使用 Cache API 减少源请求
- 使用 KV 存储小数据（免费额度）

### 部署检查清单

#### 部署前检查
- [ ] 所有环境变量已配置
- [ ] 数据库迁移已完成
- [ ] 所有测试通过 (`npm run verify:all`)
- [ ] 构建成功 (`npm run build`)
- [ ] Edge Runtime 使用正确（运行 `npx tsx scripts/fix-edge-runtime-auth.ts`）

#### Vercel 部署检查
- [ ] 环境变量在 Vercel Dashboard 中配置
- [ ] 数据库 URL 指向生产数据库
- [ ] NextAuth URL 设置为生产域名
- [ ] Stripe webhook 指向生产 URL
- [ ] 域名 DNS 配置正确

#### Cloudflare 部署检查
- [ ] R2 bucket 已创建
- [ ] Workers 路由已配置
- [ ] CDN 缓存规则已设置
- [ ] SSL/TLS 证书已配置
- [ ] 防火墙规则已设置

### 故障排除

#### Vercel 常见问题
```bash
# 1. 构建失败
npm run build # 本地测试构建

# 2. 环境变量未加载
vercel env pull # 拉取环境变量到本地

# 3. 数据库连接失败
# 检查 DATABASE_URL 是否正确
# 确保 IP 白名单包含 Vercel IP
```

#### Cloudflare 常见问题
```bash
# 1. Worker 部署失败
wrangler deploy # 使用 Wrangler CLI 部署

# 2. R2 访问失败
wrangler r2 bucket list # 检查 bucket 列表

# 3. 缓存未生效
# 检查 Cache-Control headers
# 清除 Cloudflare 缓存
```

### 总结

**关键原则**：
1. **数据库操作 → Vercel**（Node.js runtime）
2. **静态资源 → Cloudflare**（CDN + R2）
3. **边缘逻辑 → Cloudflare**（Workers，无数据库）
4. **认证系统 → Vercel**（NextAuth + Prisma）

**记住**：
- ✅ Prisma 需要 Node.js runtime（Vercel）
- ✅ NextAuth database sessions 需要 Prisma（Vercel）
- ✅ Edge Runtime 不支持 Prisma（Cloudflare）
- ✅ 静态资源和边缘缓存用 Cloudflare
- ✅ 混合部署获得最佳性能和成本

