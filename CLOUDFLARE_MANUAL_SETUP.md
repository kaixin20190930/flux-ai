# 🛠️ Cloudflare 手动设置指南

由于自动化脚本遇到网络问题，这里提供手动设置步骤。

## 📋 前置条件

1. **Cloudflare 账户**：确保你有 Cloudflare 账户
2. **网络连接**：确保可以访问 Cloudflare API
3. **更新 Wrangler**：使用最新版本

## 🔧 步骤1：更新 Wrangler CLI

```bash
# 更新到最新版本
npm install -g wrangler@latest

# 或者使用项目本地安装
npm install --save-dev wrangler@latest

# 验证版本
npx wrangler --version
```

## 🔑 步骤2：登录 Cloudflare

```bash
# 登录 Cloudflare
npx wrangler login

# 验证登录状态
npx wrangler whoami
```

## 🗄️ 步骤3：创建 D1 数据库

```bash
# 创建 D1 数据库
npx wrangler d1 create flux-ai-db

# 记录输出中的 database_id，类似：
# database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

## 📦 步骤4：创建 R2 存储桶

```bash
# 创建 R2 存储桶
npx wrangler r2 bucket create flux-ai-storage

# 验证创建成功
npx wrangler r2 bucket list
```

## 🔄 步骤5：创建 KV 命名空间

```bash
# 创建 KV 命名空间
npx wrangler kv:namespace create "CACHE"

# 记录输出中的 id，类似：
# id = "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
```

## ⚙️ 步骤6：更新 wrangler.toml

将步骤3和5中获得的ID更新到 \`wrangler.toml\` 文件中：

\`\`\`toml
# D1 数据库绑定
[[d1_databases]]
binding = "DB"
database_name = "flux-ai-db"
database_id = "你的数据库ID"  # 替换为实际ID

# KV 缓存绑定
[[kv_namespaces]]
binding = "KV"
id = "你的KV命名空间ID"  # 替换为实际ID
\`\`\`

## 🏗️ 步骤7：初始化数据库结构

```bash
# 创建数据库表结构
npx wrangler d1 execute flux-ai-db --file=migrations/d1-schema.sql

# 如果 migrations 目录不存在，先创建
mkdir -p migrations
```

创建 \`migrations/d1-schema.sql\` 文件：

\`\`\`sql
-- 用户表
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT,
  avatar_url TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  is_admin BOOLEAN DEFAULT FALSE,
  subscription_type TEXT DEFAULT 'free',
  subscription_expires_at DATETIME,
  total_generations INTEGER DEFAULT 0,
  remaining_generations INTEGER DEFAULT 10
);

-- 生成历史表
CREATE TABLE IF NOT EXISTS generation_history (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  prompt TEXT NOT NULL,
  image_url TEXT,
  model TEXT DEFAULT 'flux-schnell',
  width INTEGER DEFAULT 1024,
  height INTEGER DEFAULT 1024,
  steps INTEGER DEFAULT 4,
  guidance REAL DEFAULT 0.0,
  seed INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  is_public BOOLEAN DEFAULT FALSE,
  tags TEXT,
  FOREIGN KEY (user_id) REFERENCES users (id)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_generation_history_user_id ON generation_history(user_id);
CREATE INDEX IF NOT EXISTS idx_generation_history_created_at ON generation_history(created_at);
\`\`\`

## 🧪 步骤8：测试数据库连接

```bash
# 测试数据库查询
npx wrangler d1 execute flux-ai-db --command="SELECT name FROM sqlite_master WHERE type='table';"

# 插入测试数据
npx wrangler d1 execute flux-ai-db --command="INSERT INTO users (id, email, password_hash, name) VALUES ('test-001', 'test@example.com', 'hashed-password', 'Test User');"

# 查询测试数据
npx wrangler d1 execute flux-ai-db --command="SELECT * FROM users WHERE email='test@example.com';"
```

## 🌐 步骤9：配置环境变量

创建 \`.env.cloudflare\` 文件：

\`\`\`env
# 基本配置
NODE_ENV=production
JWT_SECRET=your-super-secret-jwt-key-here
DATABASE_URL=your-d1-database-url

# Cloudflare 特定
CF_ACCOUNT_ID=your-cloudflare-account-id
CF_API_TOKEN=your-cloudflare-api-token

# 应用配置
NEXTAUTH_SECRET=your-nextauth-secret-here
NEXTAUTH_URL=https://your-domain.com
\`\`\`

## 🚀 步骤10：本地测试

```bash
# 本地开发服务器
npx wrangler pages dev

# 或者使用 Next.js 开发服务器
npm run dev
```

## 📤 步骤11：部署到 Cloudflare Pages

### 方法1：通过 GitHub 集成

1. 推送代码到 GitHub：
   ```bash
   git add .
   git commit -m "Add Cloudflare Edge Runtime support"
   git push origin main
   ```

2. 在 Cloudflare Dashboard 中：
   - 进入 Pages
   - 点击 "Create a project"
   - 连接 GitHub 仓库
   - 选择 \`flux-ai\` 仓库
   - 配置构建设置：
     - Build command: \`npm run build\`
     - Build output directory: \`.next\`
   - 添加环境变量（从 .env.cloudflare 复制）
   - 点击 "Save and Deploy"

### 方法2：直接部署

```bash
# 构建项目
npm run build

# 部署到 Cloudflare Pages
npx wrangler pages publish .next
```

## 🔍 步骤12：验证部署

1. **检查部署状态**：
   - 在 Cloudflare Pages Dashboard 查看部署日志
   - 确认没有 Edge Runtime 错误

2. **测试 API 端点**：
   ```bash
   # 测试登录 API
   curl -X POST https://your-app.pages.dev/api/auth/login-edge \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"testpassword"}'
   
   # 测试注册 API
   curl -X POST https://your-app.pages.dev/api/auth/register-edge \
     -H "Content-Type: application/json" \
     -d '{"email":"new@example.com","password":"newpassword","name":"New User"}'
   ```

3. **检查数据库**：
   ```bash
   # 查看用户数据
   npx wrangler d1 execute flux-ai-db --command="SELECT id, email, name FROM users;"
   ```

## ⚠️ 常见问题

### 1. 网络连接问题
```bash
# 如果遇到网络问题，尝试设置代理
export HTTP_PROXY=http://your-proxy:port
export HTTPS_PROXY=http://your-proxy:port
```

### 2. 权限问题
```bash
# 确保有正确的权限
npx wrangler auth list
```

### 3. 数据库连接失败
- 检查 database_id 是否正确
- 确认数据库已创建成功
- 验证绑定配置

### 4. API 路由错误
- 确认 \`export const runtime = 'edge'\` 已添加
- 检查导入的模块是否兼容 Edge Runtime
- 查看 Cloudflare Pages 部署日志

## 📞 获取帮助

如果遇到问题：

1. **查看日志**：
   ```bash
   # Wrangler 日志
   cat ~/.wrangler/logs/wrangler-*.log
   
   # Cloudflare Pages 部署日志
   # 在 Dashboard 中查看
   ```

2. **调试命令**：
   ```bash
   # 检查配置
   npx wrangler d1 list
   npx wrangler r2 bucket list
   npx wrangler kv:namespace list
   
   # 测试连接
   npx wrangler d1 execute flux-ai-db --command="SELECT 1;"
   ```

3. **重置和重试**：
   ```bash
   # 清除缓存
   rm -rf .wrangler
   
   # 重新登录
   npx wrangler logout
   npx wrangler login
   ```

## 🎯 下一步

完成基础设置后，继续进行：

1. **API 路由迁移**：将所有 Node.js API 迁移到 Edge Runtime
2. **前端适配**：更新前端代码以使用新的 API 端点
3. **测试和优化**：全面测试功能并优化性能
4. **监控和维护**：设置监控和错误追踪

参考完整迁移计划：\`CLOUDFLARE_EDGE_MIGRATION_PLAN.md\`