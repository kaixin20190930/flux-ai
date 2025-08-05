# Cloudflare Pages 部署指南

## 🚀 部署步骤

### 1. 准备工作
确保所有 API 路由都使用 Edge Runtime：
```bash
node fix-cloudflare-deployment.js
```

### 2. 本地构建测试
```bash
npm run build:cloudflare
```

### 3. 部署到 Cloudflare Pages

#### 方法一：通过 GitHub 自动部署
1. 将代码推送到 GitHub 仓库
2. 登录 Cloudflare Dashboard
3. 进入 Pages 页面，点击 "Create a project"
4. 连接 GitHub 仓库
5. 配置构建设置：
   - **构建命令**: `npx @cloudflare/next-on-pages@1`
   - **输出目录**: `.vercel/output/static`
   - **Node.js 版本**: 18 或更高

#### 方法二：使用 Wrangler CLI
```bash
npm install -g wrangler
wrangler login
npm run build:cloudflare
wrangler pages deploy .vercel/output/static
```

### 4. 环境变量配置
在 Cloudflare Pages 项目设置中添加以下环境变量：

```
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1
DATABASE_URL=your-database-url
JWT_SECRET=your-jwt-secret
NEXT_PUBLIC_API_URL=https://your-domain.pages.dev
ADMIN_USER_IDS=admin1,admin2,admin3
```

## 🔧 技术要求

### Edge Runtime 兼容性
所有 API 路由必须使用 Edge Runtime：
```typescript
export const runtime = 'edge'
export const dynamic = 'force-dynamic'
```

### 限制和注意事项
1. **Node.js APIs**: Edge Runtime 不支持所有 Node.js APIs
2. **文件系统**: 无法访问文件系统
3. **数据库**: 推荐使用 Cloudflare D1 或外部数据库
4. **第三方库**: 确保所有依赖都兼容 Edge Runtime

## 🐛 常见问题

### 1. bcryptjs 兼容性问题
如果遇到 bcryptjs 相关错误，可以替换为 Edge Runtime 兼容的加密库：
```bash
npm install @noble/hashes
```

### 2. 数据库连接问题
推荐使用：
- Cloudflare D1 (SQLite)
- PlanetScale (MySQL)
- Supabase (PostgreSQL)
- 其他支持 Edge Runtime 的数据库

### 3. 环境变量问题
确保在 Cloudflare Pages 项目设置中正确配置所有环境变量。

## 📊 性能优化

1. **静态资源**: 利用 Cloudflare CDN 加速
2. **缓存策略**: 配置适当的缓存头
3. **图片优化**: 使用 Cloudflare Images 或其他优化服务

## 🔍 调试

### 本地预览
```bash
npm run preview:cloudflare
```

### 查看构建日志
在 Cloudflare Pages 项目的 "Functions" 标签页查看详细日志。

### 错误排查
1. 检查 Edge Runtime 兼容性
2. 验证环境变量配置
3. 查看 Cloudflare Pages 构建日志
4. 使用 Wrangler 本地调试

## 📚 相关文档

- [Cloudflare Pages 文档](https://developers.cloudflare.com/pages/)
- [Next.js on Cloudflare Pages](https://developers.cloudflare.com/pages/framework-guides/deploy-a-nextjs-site/)
- [Edge Runtime 文档](https://nextjs.org/docs/app/building-your-application/rendering/edge-and-nodejs-runtimes)
