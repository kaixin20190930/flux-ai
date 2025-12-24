# Google OAuth 生产环境配置指南

## 概述

本文档提供了在生产环境中配置 Google OAuth 所需的所有步骤，包括 Cloudflare Pages 和 Cloudflare Workers 的环境变量配置。

---

## 1. Cloudflare Pages 环境变量配置

### 访问配置页面

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com)
2. 选择你的账户
3. 进入 **Workers & Pages**
4. 选择你的 Pages 项目（例如：`flux-ai-img`）
5. 点击 **Settings** 标签
6. 选择 **Environment variables** 部分

### 需要配置的环境变量

#### NEXT_PUBLIC_GOOGLE_CLIENT_ID

**描述**: Google OAuth 客户端 ID（公开可见）

**值**: 从 Google Cloud Console 获取（见下文"Google Cloud Console 配置"部分）

**示例**: `your-client-id.apps.googleusercontent.com`

**配置步骤**:
1. 点击 **Add variable**
2. Variable name: `NEXT_PUBLIC_GOOGLE_CLIENT_ID`
3. Value: 粘贴你的 Google Client ID
4. Environment: 选择 **Production** 和 **Preview**（如果需要）
5. 点击 **Save**

#### 验证配置

配置完成后，重新部署你的应用：
1. 进入 **Deployments** 标签
2. 点击最新部署旁边的 **Retry deployment** 或推送新的代码到 GitHub

---

## 2. Cloudflare Workers 环境变量配置

### 使用 Wrangler CLI 配置 Secrets

Cloudflare Workers 的敏感信息（如 API 密钥）应该使用 `wrangler secret` 命令配置，而不是直接写在 `wrangler.toml` 文件中。

### 需要配置的 Secrets

#### GOOGLE_CLIENT_SECRET

**描述**: Google OAuth 客户端密钥（保密）

**值**: 从 Google Cloud Console 获取（见下文"Google Cloud Console 配置"部分）

**配置步骤**:

```bash
# 进入 worker 目录
cd worker

# 为生产环境配置 GOOGLE_CLIENT_SECRET
wrangler secret put GOOGLE_CLIENT_SECRET --env production

# 系统会提示你输入密钥值，粘贴后按 Enter
# Enter a secret value: [粘贴你的 Google Client Secret]
# 🌀 Creating the secret for the Worker "flux-ai-worker-prod"
# ✨ Success! Uploaded secret GOOGLE_CLIENT_SECRET
```

#### JWT_SECRET（如果尚未配置）

如果你的生产环境还没有配置 JWT_SECRET，也需要配置：

```bash
# 生成一个安全的随机密钥
openssl rand -base64 32

# 配置到 Worker
wrangler secret put JWT_SECRET --env production
# 粘贴上面生成的密钥
```

### 验证 Secrets 配置

查看已配置的 secrets（不会显示实际值）：

```bash
wrangler secret list --env production
```

输出示例：
```
[
  {
    "name": "GOOGLE_CLIENT_SECRET",
    "type": "secret_text"
  },
  {
    "name": "JWT_SECRET",
    "type": "secret_text"
  }
]
```

### 重新部署 Worker

配置完 secrets 后，重新部署 Worker：

```bash
wrangler deploy --env production
```

---

## 3. Google Cloud Console 配置

### 3.1 创建 OAuth 2.0 客户端 ID

1. 访问 [Google Cloud Console](https://console.cloud.google.com)
2. 选择或创建一个项目
3. 在左侧菜单中，选择 **APIs & Services** > **Credentials**
4. 点击 **+ CREATE CREDENTIALS** > **OAuth client ID**
5. 如果是第一次创建，需要先配置 OAuth 同意屏幕（见下文）

### 3.2 配置 OAuth 同意屏幕

1. 在 **APIs & Services** > **OAuth consent screen**
2. 选择 **External**（外部用户）或 **Internal**（仅限组织内部）
3. 填写应用信息：
   - **App name**: Flux AI Image Generator
   - **User support email**: 你的邮箱
   - **Developer contact information**: 你的邮箱
4. 点击 **SAVE AND CONTINUE**

5. **Scopes** 页面：
   - 点击 **ADD OR REMOVE SCOPES**
   - 选择以下 scopes：
     - `userinfo.email`
     - `userinfo.profile`
     - `openid`
   - 点击 **UPDATE** 然后 **SAVE AND CONTINUE**

6. **Test users** 页面（如果选择了 External）：
   - 在开发阶段，添加测试用户邮箱
   - 点击 **SAVE AND CONTINUE**

7. 点击 **BACK TO DASHBOARD**

### 3.3 创建 OAuth 客户端 ID

1. 返回 **Credentials** 页面
2. 点击 **+ CREATE CREDENTIALS** > **OAuth client ID**
3. 选择 **Application type**: **Web application**
4. 填写信息：
   - **Name**: Flux AI Web Client
   
5. **Authorized JavaScript origins**:
   - 开发环境: `http://localhost:3000`
   - 生产环境: `https://flux-ai-img.com`（替换为你的域名）
   
6. **Authorized redirect URIs**:
   - 开发环境: `http://localhost:3000/api/auth/callback/google`
   - 生产环境: `https://flux-ai-img.com/api/auth/callback/google`
   
   **重要**: 确保 URI 完全匹配，包括协议（http/https）、域名和路径

7. 点击 **CREATE**

8. 保存凭据：
   - **Client ID**: 复制并保存（用于 `NEXT_PUBLIC_GOOGLE_CLIENT_ID`）
   - **Client Secret**: 复制并保存（用于 `GOOGLE_CLIENT_SECRET`）

### 3.4 发布应用（生产环境）

如果你选择了 **External** 用户类型，需要发布应用：

1. 进入 **OAuth consent screen**
2. 点击 **PUBLISH APP**
3. 确认发布

**注意**: 
- 未发布的应用只能有最多 100 个测试用户
- 发布后，任何 Google 账号都可以登录你的应用
- 如果应用需要敏感权限，可能需要 Google 审核（我们使用的基本权限不需要）

### 3.5 验证域名所有权（可选但推荐）

1. 在 **OAuth consent screen** 页面
2. 在 **Authorized domains** 部分，添加你的域名
3. 点击 **ADD DOMAIN**
4. 输入域名（例如：`flux-ai-img.com`）
5. 按照提示验证域名所有权（通常通过添加 DNS TXT 记录）

---

## 4. 环境变量配置检查清单

### Cloudflare Pages

- [ ] `NEXT_PUBLIC_GOOGLE_CLIENT_ID` 已配置
- [ ] 环境变量应用到 Production 环境
- [ ] 应用已重新部署

### Cloudflare Workers

- [ ] `GOOGLE_CLIENT_SECRET` 已通过 `wrangler secret put` 配置
- [ ] `JWT_SECRET` 已配置（如果尚未配置）
- [ ] Worker 已重新部署

### Google Cloud Console

- [ ] OAuth 同意屏幕已配置
- [ ] OAuth 客户端 ID 已创建
- [ ] 授权重定向 URI 已正确配置（开发和生产）
- [ ] Client ID 和 Client Secret 已保存
- [ ] 应用已发布（如果是 External 类型）
- [ ] 域名已验证（可选）

---

## 5. 测试配置

### 5.1 测试开发环境

```bash
# 启动本地开发服务器
npm run dev

# 在另一个终端启动 Worker
cd worker
wrangler dev

# 访问 http://localhost:3000
# 点击 Google 登录按钮
# 应该能够成功跳转到 Google 授权页面
```

### 5.2 测试生产环境

1. 访问你的生产域名（例如：`https://flux-ai-img.com`）
2. 点击 Google 登录按钮
3. 应该跳转到 Google 授权页面
4. 授权后应该成功登录并跳转到 `/create` 页面
5. 检查用户信息是否正确显示
6. 检查积分余额（新用户应该有 3 积分）

### 5.3 常见问题排查

#### 问题 1: "redirect_uri_mismatch" 错误

**原因**: Google Cloud Console 中配置的重定向 URI 与实际请求的 URI 不匹配

**解决方案**:
1. 检查错误信息中显示的实际 URI
2. 在 Google Cloud Console 中添加完全匹配的 URI
3. 确保包含协议（http/https）、域名和完整路径

#### 问题 2: "Access blocked: This app's request is invalid"

**原因**: OAuth 同意屏幕配置不完整或应用未发布

**解决方案**:
1. 检查 OAuth 同意屏幕是否完整配置
2. 确保应用已发布（External 类型）
3. 检查 scopes 是否正确配置

#### 问题 3: Worker 返回 "Invalid Google token"

**原因**: `GOOGLE_CLIENT_SECRET` 未正确配置或不匹配

**解决方案**:
1. 确认 Worker 的 secret 已配置：`wrangler secret list --env production`
2. 重新配置 secret：`wrangler secret put GOOGLE_CLIENT_SECRET --env production`
3. 确保使用的是正确的 Client Secret（与 Client ID 匹配）

#### 问题 4: 前端无法获取 Client ID

**原因**: Cloudflare Pages 环境变量未配置或未重新部署

**解决方案**:
1. 检查 Pages 环境变量配置
2. 确保变量名是 `NEXT_PUBLIC_GOOGLE_CLIENT_ID`（必须以 `NEXT_PUBLIC_` 开头）
3. 重新部署应用

---

## 6. 安全最佳实践

### 6.1 保护 Client Secret

- ✅ **永远不要**在前端代码中使用 Client Secret
- ✅ **永远不要**将 Client Secret 提交到 Git
- ✅ **使用** `wrangler secret` 命令配置到 Worker
- ✅ **定期轮换** Client Secret（建议每 90 天）

### 6.2 限制重定向 URI

- ✅ **只添加**你实际使用的重定向 URI
- ✅ **不要使用**通配符（例如：`https://*.example.com/*`）
- ✅ **使用 HTTPS**（生产环境必须）

### 6.3 监控和日志

- ✅ **启用** Google Cloud Console 的审计日志
- ✅ **监控** Worker 日志中的认证失败
- ✅ **设置告警**（如果认证失败率过高）

### 6.4 用户隐私

- ✅ **只请求**必要的 scopes（email, profile, openid）
- ✅ **明确告知**用户你会使用哪些数据
- ✅ **遵守** GDPR 和其他隐私法规

---

## 7. 维护和更新

### 7.1 定期检查

- [ ] 每月检查 Google Cloud Console 的使用量
- [ ] 每季度轮换 Client Secret
- [ ] 每半年审查授权用户列表（如果使用测试模式）

### 7.2 更新流程

如果需要更新 Client Secret：

```bash
# 1. 在 Google Cloud Console 生成新的 Client Secret
# 2. 更新 Worker secret
wrangler secret put GOOGLE_CLIENT_SECRET --env production

# 3. 更新开发环境
# 编辑 worker/.dev.vars 文件

# 4. 重新部署
wrangler deploy --env production
```

### 7.3 备份

保存以下信息到安全的地方（例如：密码管理器）：
- Google Cloud Project ID
- OAuth Client ID
- OAuth Client Secret（加密存储）
- 授权重定向 URI 列表

---

## 8. 参考资源

### 官方文档

- [Google OAuth 2.0 文档](https://developers.google.com/identity/protocols/oauth2)
- [Cloudflare Pages 环境变量](https://developers.cloudflare.com/pages/platform/build-configuration/#environment-variables)
- [Cloudflare Workers Secrets](https://developers.cloudflare.com/workers/configuration/secrets/)
- [Wrangler CLI 文档](https://developers.cloudflare.com/workers/wrangler/)

### 项目文档

- [设计文档](./design.md)
- [需求文档](./requirements.md)
- [任务列表](./tasks.md)

---

## 9. 支持

如果遇到问题：

1. 查看本文档的"常见问题排查"部分
2. 检查 Worker 日志：`wrangler tail --env production`
3. 查看 Google Cloud Console 的错误日志
4. 查看项目的 GitHub Issues

---

**最后更新**: 2024-12-23  
**版本**: 1.0  
**状态**: ✅ 生产环境配置指南
