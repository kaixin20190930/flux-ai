# Google OAuth 登录集成 - 实现任务

## 概述

按照设计文档实现完整的 Google OAuth 登录功能，包括前端组件、API 客户端、Worker 路由和数据库操作。

## 任务列表

- [x] 1. 安装和配置 Google OAuth 库
  - 安装 `@react-oauth/google` 包
  - 配置 Google OAuth Provider
  - _需求: 1.1, 1.2_

- [x] 2. 创建 Google OAuth 按钮组件
  - [x] 2.1 创建 `components/GoogleOAuthButton.tsx`
    - 实现 Google 登录按钮 UI
    - 集成 `@react-oauth/google` 的 `GoogleLogin` 组件
    - 处理成功和失败回调
    - 支持多语言文案
    - _需求: 1.1, 1.5, 6.5_
  
  - [x] 2.2 更新 `components/AuthForm.tsx`
    - 替换现有的 Google 登录按钮
    - 实现 `handleGoogleSignIn` 函数
    - 调用 API 客户端的 `googleLogin` 方法
    - 处理错误并显示提示
    - 成功后跳转到 `/create` 页面
    - _需求: 1.1, 1.4, 1.5, 4.1-4.5, 6.2, 6.4_

- [x] 3. 更新 API 客户端
  - [x] 3.1 在 `lib/api-client.ts` 中添加 `googleLogin` 方法
    - 接收 `googleToken`, `email`, `name` 参数
    - 调用 Worker 的 `/auth/google-login` 端点
    - 存储返回的 JWT token
    - 返回用户信息
    - _需求: 1.4, 2.3, 2.4_
  
  - [x] 3.2 更新 `lib/api-config.ts`
    - 添加 `auth.googleLogin` 端点配置
    - _需求: 1.4_

- [x] 4. 实现 Worker Google OAuth 路由
  - [x] 4.1 创建 `worker/utils/google-oauth.ts`
    - 实现 `verifyGoogleToken` 函数
    - 实现 `createGoogleUser` 函数
    - 实现 `findUserByEmail` 函数
    - 添加错误处理和日志
    - _需求: 2.1, 2.2, 2.3, 5.3_
  
  - [x] 4.2 更新 `worker/routes/auth.ts`
    - 添加 `/auth/google-login` 路由
    - 定义 `googleLoginSchema` 验证规则
    - 调用 Google token 验证函数
    - 检查用户是否存在
    - 创建新用户或登录现有用户
    - 生成 JWT token
    - 返回用户信息和 token
    - _需求: 1.4, 1.5, 2.1-2.5, 3.1-3.4, 5.1-5.5_

- [x] 5. 数据库操作
  - [x] 5.1 验证 `oauth_accounts` 表结构
    - 确认表已存在且结构正确
    - 检查索引是否完整
    - _需求: 3.1-3.4_
  
  - [x] 5.2 实现 OAuth 绑定逻辑
    - 在用户注册时创建 OAuth 绑定记录
    - 在用户登录时检查 OAuth 绑定
    - 支持同一邮箱多个 OAuth 提供商
    - _需求: 3.1-3.4_

- [x] 6. 错误处理和用户体验
  - [x] 6.1 实现错误处理逻辑
    - 定义错误类型和错误码
    - 实现错误消息映射（多语言）
    - 在前端显示友好的错误提示
    - _需求: 4.1-4.5_
  
  - [x] 6.2 添加加载状态
    - 在 Google 登录过程中显示加载动画
    - 禁用按钮防止重复点击
    - _需求: 6.3_
  
  - [x] 6.3 添加成功提示
    - 登录成功后显示欢迎消息
    - 使用 toast 或 notification 组件
    - _需求: 6.4_

- [x] 7. 多语言支持
  - [x] 7.1 更新翻译文件
    - 在所有语言的 JSON 文件中添加 Google OAuth 相关文案
    - 包括按钮文字、错误提示、成功消息
    - _需求: 6.5_

- [x] 8. 环境变量配置
  - [x] 8.1 配置开发环境
    - 在 `.env.local` 中添加 `NEXT_PUBLIC_GOOGLE_CLIENT_ID`
    - 在 Worker 的 `.dev.vars` 中添加 `GOOGLE_CLIENT_SECRET`
    - _需求: 5.1_
  
  - [x] 8.2 配置生产环境
    - 在 Cloudflare Pages 中配置 `NEXT_PUBLIC_GOOGLE_CLIENT_ID`
    - 在 Cloudflare Worker 中配置 `GOOGLE_CLIENT_SECRET`
    - _需求: 5.1_
  
  - [x] 8.3 配置 Google Cloud Console
    - 添加授权重定向 URI（开发和生产）
    - 配置 OAuth 同意屏幕
    - 验证域名所有权
    - _需求: 5.5_

- [ ] 9. 测试
  - [ ] 9.1 本地测试
    - 测试 Google 登录按钮点击
    - 测试 Google 授权流程
    - 测试新用户注册（验证 3 积分赠送）
    - 测试老用户登录
    - 测试错误场景（token 无效、邮箱不匹配等）
    - _需求: 1.1-1.5, 2.1-2.5, 4.1-4.5_
  
  - [x] 9.2 生产环境测试
    - 部署到生产环境
    - 测试完整登录流程
    - 验证多语言支持
    - 验证错误处理
    - 验证性能（< 3 秒）
    - _需求: 6.1, 6.2_

- [x] 10. 文档和清理
  - [x] 10.1 更新 README
    - 添加 Google OAuth 配置说明
    - 添加故障排查指南
  
  - [x] 10.2 添加代码注释
    - 为关键函数添加注释
    - 解释 OAuth 流程
  
  - [x] 10.3 清理旧代码
    - 移除不再使用的 Google OAuth 相关代码
    - 确保没有遗留的调试代码

## 注意事项

1. **安全性**: 所有 Google token 验证必须在服务端完成
2. **错误处理**: 提供清晰的错误提示，帮助用户解决问题
3. **性能**: 确保登录流程在 3 秒内完成
4. **多语言**: 所有用户可见的文案都要支持多语言
5. **测试**: 每个功能都要经过充分测试
6. **日志**: 记录关键操作，便于调试和监控

## 完成标准

- ✅ 用户可以点击 Google 登录按钮
- ✅ Google 授权页面正常显示
- ✅ 授权后正确返回并完成登录
- ✅ 新用户注册成功并赠送 3 积分
- ✅ 老用户登录成功
- ✅ 登录后跳转到 /create 页面
- ✅ 错误提示清晰明确
- ✅ 支持所有 20+ 语言
- ✅ 登录流程 < 3 秒
- ✅ 所有测试通过
