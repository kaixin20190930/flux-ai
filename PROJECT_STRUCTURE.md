# 项目文件结构说明

**更新时间**: 2024-12-23

## 📁 核心目录结构

```
flux-ai/
├── worker/                          # Cloudflare Worker 后端
│   ├── handlers/                    # API 处理器
│   │   ├── createGenerationV2.ts   # ✅ 创建生成任务（扣除积分）
│   │   ├── getUserStatusV2.ts      # ✅ 获取用户状态
│   │   ├── generateImageReplicate.ts # ⚠️ 空文件，需要实现
│   │   └── ...                     # 其他处理器
│   ├── routes/                      # API 路由
│   │   ├── auth.ts                 # ✅ 认证路由
│   │   ├── generation.ts           # ✅ 图片生成路由
│   │   └── points.ts               # ✅ 积分路由
│   ├── utils/                       # 工具函数
│   ├── index-hono.ts               # Worker 入口
│   ├── wrangler.toml               # Cloudflare 配置
│   └── package.json
│
├── app/                             # Next.js 前端应用
│   ├── [locale]/                   # 多语言路由
│   ├── api/                        # Next.js API 路由（最小化）
│   └── i18n/                       # 国际化配置
│
├── hooks/                           # React Hooks
│   └── useImageGeneration.tsx      # ✅ 图片生成 Hook
│
├── components/                      # React 组件
│
├── migrations/                      # 数据库迁移
│   └── d1-auth-clean-simple.sql   # ✅ 当前使用的数据库架构
│
├── scripts/                         # 部署和测试脚本
│   ├── deploy-production.sh       # ✅ 生产部署
│   ├── test-production.sh         # ✅ 生产测试
│   └── fix-and-test-dev-worker.sh # ✅ 开发环境测试
│
├── test-auth.html                  # ✅ 浏览器测试页面
├── CURRENT_STATUS.md               # ✅ 当前状态总结
├── PROJECT_STRUCTURE.md            # ✅ 本文件
├── PRODUCTION_DEPLOYMENT_GUIDE.md  # ✅ 生产部署指南
└── README.md                       # 项目说明
```

## 📄 重要文件说明

### Worker 核心文件

#### `worker/handlers/createGenerationV2.ts` ✅
**功能**: 创建图片生成任务
- 验证用户积分
- 扣除积分
- 记录交易
- 创建 generation_history 记录（status: 'pending'）
- 返回 generationId

**状态**: 已完成

#### `worker/handlers/generateImageReplicate.ts` ⚠️
**功能**: 调用 Replicate API 生成图片
- 调用 Replicate API
- 获取图片 URL
- 更新 generation_history 记录（status: 'completed', image_url）

**状态**: 文件存在但为空，需要实现

#### `worker/routes/generation.ts` ✅
**功能**: 图片生成相关路由
- `POST /generation/create` - 创建生成任务（已完成）
- `GET /generation/status` - 获取用户状态（已完成）
- `POST /generation/generate` - 完整生成流程（需要补充）

**状态**: 部分完成，需要在 `/generate` 端点中集成 Replicate 调用

#### `worker/routes/auth.ts` ✅
**功能**: 认证相关路由
- `POST /auth/register` - 用户注册
- `POST /auth/login` - 用户登录
- `POST /auth/verify-token` - 验证 Token
- `POST /auth/logout` - 用户登出

**状态**: 已完成并测试通过

### 前端核心文件

#### `hooks/useImageGeneration.tsx` ✅
**功能**: 图片生成 React Hook
- 管理生成状态
- 调用 Worker API
- 处理积分和免费额度

**状态**: 已完成，配置正确

### 数据库文件

#### `migrations/d1-auth-clean-simple.sql` ✅
**功能**: 当前使用的数据库架构
- 使用 TEXT UUID 作为主键
- 支持邮箱密码和 OAuth 登录
- 包含积分系统和生成历史表

**状态**: 已在开发和生产环境部署

### 测试和部署脚本

#### `scripts/deploy-production.sh` ✅
**功能**: 部署到生产环境
```bash
cd worker && wrangler deploy --env production
```

#### `scripts/test-production.sh` ✅
**功能**: 测试生产环境
- 测试健康检查
- 测试注册
- 测试登录

#### `scripts/fix-and-test-dev-worker.sh` ✅
**功能**: 部署并测试开发环境
- 部署开发 Worker
- 测试所有功能

#### `test-auth.html` ✅
**功能**: 浏览器测试页面
- 可视化测试注册和登录
- 方便调试

## 🗑️ 已删除的文件

以下文件已被删除（过时或重复）：

### 文档
- `AUTH_FIX_GUIDE.md`
- `AUTH_FIX_GUIDE_V2.md`
- `AUTH_FIX_SUMMARY.md`
- `AUTH_TESTING_GUIDE.md`
- `DEPLOYMENT_STATUS.md`
- `FINAL_FIX_SUMMARY.md`
- `PRODUCTION_DEPLOY_NOW.md`
- `WORKER_STATUS_SUMMARY.md`
- `REMOTE_TESTING_GUIDE.md`
- `POINTS_SYSTEM_V2_SUMMARY.md`
- `PRODUCTION_DEPLOYMENT_CHECKLIST.md`

### 脚本
- `scripts/quick-fix-auth.sh`
- `scripts/test-auth-simple.sh`
- `scripts/check-dev-database.sh`
- `scripts/rebuild-production-database.sh`
- `scripts/init-local-db.sh`
- `scripts/test-worker-dev.sh`
- `scripts/check-dev-db.sh`

### 迁移文件
- `migrations/d1-auth-system-clean.sql`
- `migrations/d1-fix-user-id-types.sql`

## 📋 保留的核心文档

1. **CURRENT_STATUS.md** - 当前项目状态总结
2. **PROJECT_STRUCTURE.md** - 本文件，项目结构说明
3. **PRODUCTION_DEPLOYMENT_GUIDE.md** - 生产部署指南
4. **CLOUDFLARE_ARCHITECTURE.md** - Cloudflare 架构说明
5. **README.md** - 项目说明

## 🎯 下一步工作

1. **实现 Replicate API 调用**
   - 编写 `worker/handlers/generateImageReplicate.ts`
   - 集成到 `/generation/generate` 端点

2. **测试完整流程**
   - 测试从前端到后端的完整图片生成流程
   - 验证积分扣除和图片返回

3. **部署到生产环境**
   - 部署更新后的 Worker
   - 测试生产环境

## 📞 快速命令

```bash
# 开发环境测试
./scripts/fix-and-test-dev-worker.sh

# 生产环境部署
cd worker && wrangler deploy --env production

# 生产环境测试
./scripts/test-production.sh

# 查看 Worker 日志
cd worker && wrangler tail --env production
```

---

**总结**: 项目已清理完毕，保留了核心功能文件和必要的文档。下一步需要实现 Replicate API 调用以完成图片生成功能。
