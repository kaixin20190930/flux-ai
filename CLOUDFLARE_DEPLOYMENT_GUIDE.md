# 🚀 Cloudflare Pages 完整部署指南

## 📋 概述

由于本地 Wrangler 权限问题，我们将采用 **Cloudflare Dashboard + GitHub 集成** 的方式进行部署。这种方式更稳定，也是推荐的生产部署方法。

## 🎯 部署策略

### 方案一：Cloudflare Dashboard 部署（推荐）

1. **推送代码到 GitHub**
2. **在 Cloudflare Dashboard 中创建 Pages 项目**
3. **配置环境变量和绑定**
4. **自动部署**

### 方案二：本地 Wrangler 部署（备选）

如果解决了权限问题，可以使用本地部署。

## 🔧 步骤详解

### 第1步：准备代码

首先确保所有 Edge Runtime 兼容的代码都已推送到 GitHub：

```bash
# 检查当前状态
git status

# 添加所有文件
git add .

# 提交更改
git commit -m "feat: Add Cloudflare Edge Runtime support

- Add Edge Runtime compatible auth APIs
- Add comprehensive edgeUtils with EdgeAuth, EdgeDB, EdgeStorage
- Add D1 database schema and migration scripts
- Add Cloudflare configuration files
- Update API routes for Edge Runtime compatibility"

# 推送到 GitHub
git push origin main
```

### 第2步：在 Cloudflare Dashboard 中创建项目

1. **登录 Cloudflare Dashboard**
   - 访问 [dash.cloudflare.com](https://dash.cloudflare.com)
   - 登录你的账户

2. **进入 Pages**
   - 在左侧菜单中点击 "Pages"
   - 点击 "Create a project"

3. **连接 GitHub**
   - 选择 "Connect to Git"
   - 授权 Cloudflare 访问你的 GitHub
   - 选择 \`flux-ai\` 仓库

4. **配置构建设置**
   ```
   Project name: flux-ai
   Production branch: main
   Build command: npm run build
   Build output directory: .next
   Root directory: (留空)
   ```

### 第3步：创建 D1 数据库

在 Cloudflare Dashboard 中：

1. **进入 D1**
   - 左侧菜单 → "D1 SQL Database"
   - 点击 "Create database"

2. **创建数据库**
   ```
   Database name: flux-ai-db
   ```
   - 点击 "Create"
   - 记录数据库 ID（类似：xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx）

3. **执行数据库迁移**
   - 在数据库详情页面，点击 "Console"
   - 复制 \`migrations/d1-schema.sql\` 的内容
   - 粘贴到控制台并执行

### 第4步：创建 R2 存储桶

1. **进入 R2**
   - 左侧菜单 → "R2 Object Storage"
   - 点击 "Create bucket"

2. **创建存储桶**
   ```
   Bucket name: flux-ai-storage
   Location: Auto (Cloudflare will choose)
   ```
   - 点击 "Create bucket"

### 第5步：创建 KV 命名空间

1. **进入 KV**
   - 左侧菜单 → "KV"
   - 点击 "Create a namespace"

2. **创建命名空间**
   ```
   Namespace name: flux-ai-cache
   ```
   - 点击 "Add"
   - 记录命名空间 ID

### 第6步：配置 Pages 绑定

回到 Pages 项目：

1. **进入项目设置**
   - 在 Pages 中找到你的 \`flux-ai\` 项目
   - 点击项目名称进入详情
   - 点击 "Settings" 标签

2. **配置 Functions**
   - 点击 "Functions" 标签
   - 在 "Bindings" 部分添加：

   **D1 Database Binding:**
   ```
   Variable name: DB
   D1 database: flux-ai-db
   ```

   **R2 Bucket Binding:**
   ```
   Variable name: STORAGE
   R2 bucket: flux-ai-storage
   ```

   **KV Namespace Binding:**
   ```
   Variable name: KV
   KV namespace: flux-ai-cache
   ```

3. **配置环境变量**
   - 点击 "Environment variables" 标签
   - 添加以下变量：

   ```
   NODE_ENV = production
   JWT_SECRET = your-super-secret-jwt-key-here-make-it-long-and-random
   NEXTAUTH_SECRET = your-nextauth-secret-here
   NEXTAUTH_URL = https://your-domain.pages.dev
   
   # 如果有其他 API 密钥
   OPENAI_API_KEY = your-openai-key
   STRIPE_SECRET_KEY = your-stripe-key
   # ... 其他环境变量
   ```

### 第7步：触发部署

1. **自动部署**
   - 配置完成后，Cloudflare 会自动触发部署
   - 在 "Deployments" 标签中查看部署状态

2. **手动触发**
   - 如果需要手动触发，点击 "Create deployment"
   - 选择分支和提交

### 第8步：验证部署

1. **检查部署日志**
   - 在 "Deployments" 中点击最新的部署
   - 查看构建日志，确认没有错误

2. **测试 API 端点**
   ```bash
   # 获取你的部署 URL（类似 https://flux-ai.pages.dev）
   DEPLOY_URL="https://your-app.pages.dev"
   
   # 测试健康检查
   curl $DEPLOY_URL/api/health
   
   # 测试注册 API
   curl -X POST $DEPLOY_URL/api/auth/register-edge \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"testpass123","name":"Test User"}'
   
   # 测试登录 API
   curl -X POST $DEPLOY_URL/api/auth/login-edge \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"testpass123"}'
   ```

3. **检查数据库**
   - 在 D1 控制台中查询：
   ```sql
   SELECT * FROM users;
   SELECT * FROM user_analytics;
   ```

## 🔧 故障排除

### 常见问题

1. **构建失败**
   ```
   Error: Module not found
   ```
   - 检查 \`package.json\` 中的依赖
   - 确保所有导入路径正确

2. **Edge Runtime 错误**
   ```
   Error: This API is not available in the Edge Runtime
   ```
   - 检查 API 路由是否使用了不兼容的库
   - 确保使用 \`utils/edgeUtils.ts\` 中的兼容函数

3. **数据库连接失败**
   ```
   Error: D1 database binding not found
   ```
   - 检查绑定配置是否正确
   - 确保变量名为 \`DB\`

4. **环境变量问题**
   ```
   Error: JWT_SECRET is not defined
   ```
   - 检查环境变量是否正确设置
   - 确保在生产环境中配置了所有必要变量

### 调试技巧

1. **查看实时日志**
   ```bash
   # 如果本地 Wrangler 可用
   npx wrangler pages deployment tail
   ```

2. **使用 Console API**
   - 在代码中添加 \`console.log\`
   - 在 Cloudflare Dashboard 的 "Real-time Logs" 中查看

3. **测试本地开发**
   ```bash
   # 如果权限问题解决了
   npx wrangler pages dev
   ```

## 🎯 下一步优化

### 1. 域名配置

1. **添加自定义域名**
   - 在 Pages 项目中点击 "Custom domains"
   - 添加你的域名
   - 配置 DNS 记录

2. **SSL 证书**
   - Cloudflare 会自动提供 SSL 证书
   - 确保强制 HTTPS

### 2. 性能优化

1. **缓存策略**
   - 配置静态资源缓存
   - 使用 KV 存储频繁访问的数据

2. **图片优化**
   - 使用 Cloudflare Images
   - 配置自动图片优化

### 3. 监控和分析

1. **设置 Analytics**
   - 启用 Cloudflare Analytics
   - 配置自定义事件追踪

2. **错误监控**
   - 集成 Sentry 或其他错误追踪服务
   - 设置告警通知

## 📊 部署检查清单

- [ ] 代码推送到 GitHub
- [ ] Cloudflare Pages 项目创建
- [ ] D1 数据库创建和初始化
- [ ] R2 存储桶创建
- [ ] KV 命名空间创建
- [ ] 绑定配置完成
- [ ] 环境变量设置
- [ ] 部署成功
- [ ] API 端点测试通过
- [ ] 数据库连接正常
- [ ] 前端功能正常

## 🎉 完成！

如果所有步骤都完成了，你的 Flux AI 应用现在应该在 Cloudflare Pages 上运行，并且使用 Edge Runtime 获得了更好的性能和全球分布能力。

需要帮助？请查看：
- [Cloudflare Pages 文档](https://developers.cloudflare.com/pages/)
- [D1 数据库文档](https://developers.cloudflare.com/d1/)
- [R2 存储文档](https://developers.cloudflare.com/r2/)

## 🔄 持续部署

配置完成后，每次推送到 \`main\` 分支都会自动触发部署：

```bash
# 日常开发流程
git add .
git commit -m "feat: add new feature"
git push origin main
# 自动部署到 Cloudflare Pages
```