# Google Cloud Console 配置指南

## 快速配置步骤

### 1. 创建项目
1. 访问 https://console.cloud.google.com
2. 点击顶部项目选择器 > "新建项目"
3. 项目名称：Flux AI
4. 点击"创建"

### 2. 启用 Google+ API
1. 左侧菜单 > APIs & Services > Library
2. 搜索 "Google+ API"
3. 点击 "启用"

### 3. 配置 OAuth 同意屏幕
1. APIs & Services > OAuth consent screen
2. 选择 "External" > 创建
3. 填写信息：
   - 应用名称：Flux AI Image Generator
   - 用户支持电子邮件：你的邮箱
   - 开发者联系信息：你的邮箱
4. 点击"保存并继续"

### 4. 配置 Scopes
1. 点击 "添加或移除范围"
2. 选择：
   - userinfo.email
   - userinfo.profile  
   - openid
3. 点击"更新" > "保存并继续"

### 5. 添加测试用户（开发阶段）
1. 点击 "添加用户"
2. 输入测试用户邮箱
3. 点击"保存并继续"

### 6. 创建 OAuth 客户端 ID
1. APIs & Services > Credentials
2. 点击 "+ 创建凭据" > "OAuth 客户端 ID"
3. 应用类型：Web 应用
4. 名称：Flux AI Web Client

### 7. 配置授权重定向 URI

**开发环境**：
- `http://localhost:3000/api/auth/callback/google`

**生产环境**（替换为你的域名）：
- `https://flux-ai-img.com/api/auth/callback/google`

**重要**：URI 必须完全匹配，包括协议、域名和路径

### 8. 保存凭据
1. 点击"创建"
2. 复制并保存：
   - Client ID → 用于 `NEXT_PUBLIC_GOOGLE_CLIENT_ID`
   - Client Secret → 用于 `GOOGLE_CLIENT_SECRET`

### 9. 发布应用（生产环境）
1. 返回 OAuth consent screen
2. 点击 "发布应用"
3. 确认发布

## 验证配置

### 检查清单
- [ ] 项目已创建
- [ ] Google+ API 已启用
- [ ] OAuth 同意屏幕已配置
- [ ] Scopes 已添加（email, profile, openid）
- [ ] OAuth 客户端 ID 已创建
- [ ] 重定向 URI 已正确配置（开发和生产）
- [ ] Client ID 和 Client Secret 已保存
- [ ] 应用已发布（生产环境）

## 常见问题

### redirect_uri_mismatch
**原因**：重定向 URI 不匹配
**解决**：确保 Google Cloud Console 中的 URI 与实际请求完全一致

### Access blocked
**原因**：应用未发布或配置不完整
**解决**：检查 OAuth 同意屏幕配置，确保应用已发布

### Invalid client
**原因**：Client ID 或 Secret 错误
**解决**：重新检查并复制正确的凭据

## 安全建议

1. **定期轮换** Client Secret（建议每 90 天）
2. **限制重定向 URI** 只添加实际使用的 URI
3. **使用 HTTPS** 生产环境必须使用 HTTPS
4. **监控使用量** 定期检查 API 使用情况

## 参考资源

- [Google OAuth 2.0 文档](https://developers.google.com/identity/protocols/oauth2)
- [OAuth 同意屏幕配置](https://support.google.com/cloud/answer/10311615)
- [项目生产环境配置指南](./production-env-setup.md)
