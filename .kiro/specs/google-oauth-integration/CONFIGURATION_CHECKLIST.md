# Google OAuth 配置检查清单

## 📋 配置前准备

- [ ] 已有 Google 账号
- [ ] 已安装 Wrangler CLI (`npm install -g wrangler`)
- [ ] 已登录 Cloudflare (`wrangler login`)
- [ ] 已有生产域名（如果配置生产环境）

---

## 🔧 开发环境配置

### 前端 (.env.local)
- [x] `NEXT_PUBLIC_GOOGLE_CLIENT_ID` 已配置
- [x] `GOOGLE_CLIENT_SECRET` 已配置

### Worker (worker/.dev.vars)
- [x] `GOOGLE_CLIENT_SECRET` 已配置

### 测试
- [ ] 本地启动前端：`npm run dev`
- [ ] 本地启动 Worker：`cd worker && wrangler dev`
- [ ] 访问 http://localhost:3000
- [ ] 点击 Google 登录按钮
- [ ] 成功跳转到 Google 授权页面
- [ ] 授权后成功登录

---

## 🚀 生产环境配置

### Cloudflare Pages
- [ ] 访问 Cloudflare Dashboard
- [ ] Workers & Pages > 选择项目
- [ ] Settings > Environment variables
- [ ] 添加 `NEXT_PUBLIC_GOOGLE_CLIENT_ID`
- [ ] 应用到 Production 环境
- [ ] 重新部署应用

### Cloudflare Workers
- [ ] 运行：`cd worker`
- [ ] 配置 Secret：`wrangler secret put GOOGLE_CLIENT_SECRET --env production`
- [ ] 验证：`wrangler secret list --env production`
- [ ] 部署：`wrangler deploy --env production`

### 测试
- [ ] 访问生产域名
- [ ] 点击 Google 登录按钮
- [ ] 成功授权并登录
- [ ] 检查用户信息显示
- [ ] 检查积分余额（新用户 3 积分）

---

## ☁️ Google Cloud Console 配置

### 项目设置
- [ ] 创建或选择项目
- [ ] 启用 Google+ API

### OAuth 同意屏幕
- [ ] 选择 External 用户类型
- [ ] 填写应用信息
- [ ] 配置 Scopes (email, profile, openid)
- [ ] 添加测试用户（开发阶段）
- [ ] 发布应用（生产环境）

### OAuth 客户端 ID
- [ ] 创建 Web 应用类型客户端
- [ ] 配置授权 JavaScript 来源
- [ ] 配置授权重定向 URI（开发和生产）
- [ ] 保存 Client ID 和 Client Secret

### 重定向 URI 配置
开发环境：
- [ ] `http://localhost:3000/api/auth/callback/google`

生产环境：
- [ ] `https://[你的域名]/api/auth/callback/google`

---

## ✅ 最终验证

### 开发环境
- [ ] Google 登录按钮显示正常
- [ ] 点击后跳转到 Google 授权页面
- [ ] 授权后成功返回并登录
- [ ] 用户信息正确显示
- [ ] 新用户获得 3 积分
- [ ] 老用户正常登录

### 生产环境
- [ ] 所有开发环境测试项在生产环境通过
- [ ] HTTPS 连接正常
- [ ] 多语言支持正常
- [ ] 错误提示清晰
- [ ] 登录流程 < 3 秒

---

## 📚 参考文档

- [生产环境配置指南](./production-env-setup.md)
- [Google Cloud Console 配置](./google-cloud-console-setup.md)
- [设计文档](./design.md)
- [需求文档](./requirements.md)

---

## 🆘 遇到问题？

查看故障排查指南：
- [production-env-setup.md](./production-env-setup.md) - 第 5.3 节
- [google-cloud-console-setup.md](./google-cloud-console-setup.md) - 常见问题部分

或运行诊断脚本：
```bash
./scripts/setup-google-oauth-production.sh
```

---

**最后更新**: 2024-12-23  
**状态**: ✅ 配置检查清单
