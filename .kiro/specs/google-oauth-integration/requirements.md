# Google OAuth 登录集成 - 需求文档

## 简介

恢复并完善 Google OAuth 登录功能，使用户可以通过 Google 账号快速注册和登录。

## 术语表

- **OAuth 2.0**: 开放授权标准，允许第三方应用访问用户资源
- **Google OAuth**: Google 提供的 OAuth 2.0 实现
- **Access Token**: Google 返回的访问令牌，用于获取用户信息
- **JWT**: JSON Web Token，用于维护用户会话
- **Worker**: Cloudflare Worker，处理所有 API 请求

## 需求

### 需求 1: Google OAuth 前端流程

**用户故事**: 作为用户，我想通过 Google 账号登录，这样我可以快速访问系统而无需记住密码。

#### 验收标准

1. WHEN 用户点击 Google 登录按钮 THEN 系统 SHALL 打开 Google OAuth 授权页面
2. WHEN 用户在 Google 页面授权后 THEN 系统 SHALL 接收授权码并获取 access token
3. WHEN 系统获取到 Google access token THEN 系统 SHALL 调用 Google API 获取用户信息
4. WHEN 系统获取到用户信息 THEN 系统 SHALL 调用 Worker API 进行注册或登录
5. WHEN Worker 返回 JWT token THEN 系统 SHALL 存储 token 并跳转到创建页面

### 需求 2: Google OAuth 后端验证

**用户故事**: 作为系统，我需要验证 Google token 的有效性，确保用户身份真实可信。

#### 验收标准

1. WHEN 收到 Google token THEN 系统 SHALL 调用 Google API 验证 token 有效性
2. WHEN token 有效 THEN 系统 SHALL 提取用户邮箱和姓名
3. WHEN 用户邮箱已存在 THEN 系统 SHALL 执行登录流程
4. WHEN 用户邮箱不存在 THEN 系统 SHALL 执行注册流程并赠送 3 积分
5. WHEN 验证失败 THEN 系统 SHALL 返回明确的错误信息

### 需求 3: OAuth 账号绑定

**用户故事**: 作为系统，我需要记录用户的 OAuth 绑定关系，支持多种登录方式。

#### 验收标准

1. WHEN 用户通过 Google 注册 THEN 系统 SHALL 在 oauth_accounts 表中创建绑定记录
2. WHEN 用户通过 Google 登录 THEN 系统 SHALL 检查 oauth_accounts 表确认绑定关系
3. THE 系统 SHALL 存储 provider='google' 和 provider_user_id
4. THE 系统 SHALL 支持同一邮箱绑定多个 OAuth 提供商

### 需求 4: 错误处理

**用户故事**: 作为用户，当 Google 登录失败时，我想看到清晰的错误提示，这样我知道如何解决问题。

#### 验收标准

1. WHEN Google 授权被拒绝 THEN 系统 SHALL 显示 "授权被取消" 提示
2. WHEN Google token 无效 THEN 系统 SHALL 显示 "Google 认证失败" 提示
3. WHEN 网络错误 THEN 系统 SHALL 显示 "网络连接失败，请重试" 提示
4. WHEN 邮箱已被其他方式注册 THEN 系统 SHALL 显示 "该邮箱已注册，请使用密码登录" 提示
5. WHEN 发生未知错误 THEN 系统 SHALL 记录错误日志并显示通用错误提示

### 需求 5: 安全性

**用户故事**: 作为系统管理员，我需要确保 Google OAuth 流程安全可靠，防止恶意攻击。

#### 验收标准

1. THE 系统 SHALL 使用 HTTPS 进行所有 OAuth 通信
2. THE 系统 SHALL 验证 Google token 的签名和有效期
3. THE 系统 SHALL 在服务端验证 token，不信任客户端传递的用户信息
4. THE 系统 SHALL 使用 state 参数防止 CSRF 攻击
5. THE 系统 SHALL 限制 OAuth 回调 URL 只能是预配置的域名

### 需求 6: 用户体验

**用户故事**: 作为用户，我希望 Google 登录流程流畅快速，无需等待过长时间。

#### 验收标准

1. WHEN 用户点击 Google 登录按钮 THEN 系统 SHALL 在 500ms 内打开 Google 授权页面
2. WHEN Google 授权完成 THEN 系统 SHALL 在 2 秒内完成登录并跳转
3. WHEN 登录过程中 THEN 系统 SHALL 显示加载动画
4. WHEN 登录成功 THEN 系统 SHALL 显示欢迎提示
5. THE Google 登录按钮 SHALL 显示 Google 图标和清晰的文字说明

## 技术约束

1. 使用 Google OAuth 2.0 协议
2. 前端使用 `@react-oauth/google` 库（推荐）或原生实现
3. 后端使用 Google API 验证 token
4. 所有 API 调用通过 Cloudflare Worker
5. 使用 JWT 维护用户会话
6. 支持多语言（20+ 语言）

## 非功能需求

1. **性能**: Google 登录流程总耗时 < 3 秒
2. **可用性**: 99.9% 的 Google 登录请求成功
3. **安全性**: 所有敏感操作在服务端完成
4. **兼容性**: 支持所有现代浏览器（Chrome, Firefox, Safari, Edge）
5. **可维护性**: 代码清晰，易于调试和扩展
