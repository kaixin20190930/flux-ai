# Agent Hooks 说明文档

## 概述

本项目配置了多个 Agent Hooks 来确保代码质量和功能完整性。这些 hooks 会在特定事件触发时自动运行检查和测试，防止新功能破坏已有功能。

## 已配置的 Hooks

### 1. 🧪 保存前运行测试 (`pre-commit-tests.json`)
**触发条件**: 保存关键文件时（lib, utils, hooks, components, app/api）

**作用**: 自动运行与修改文件相关的测试

**适用场景**: 修改任何业务逻辑代码时

---

### 2. 🔌 API 路由修改验证 (`api-route-validation.json`)
**触发条件**: 保存 `app/api/**/*.ts` 文件时

**检查项**:
- TypeScript 类型定义
- zod 输入验证
- 用户认证检查
- 日志记录
- 错误处理
- dynamic 配置
- 环境变量配置

**适用场景**: 新增或修改 API 路由时

---

### 3. 🔐 认证系统修改保护 (`auth-changes-guard.json`)
**触发条件**: 修改认证相关文件时
- `lib/auth.ts`
- `lib/auth-utils.ts`
- `app/api/auth/**/*.ts`
- `middleware.ts`

**作用**: 运行完整的认证测试套件

**关键检查**:
- Database sessions（不是 JWT）
- NextAuth v5 配置
- Google OAuth 和邮箱密码登录
- 积分系统集成

**适用场景**: 修改登录、注册、会话管理逻辑时

---

### 4. 💰 积分系统修改保护 (`points-system-guard.json`)
**触发条件**: 修改积分相关文件时
- `lib/points.ts`
- `utils/pointsSystem.ts`
- `utils/securePointsService.ts`
- `hooks/usePoints.ts`
- `app/api/points/**/*.ts`

**关键检查**:
- Prisma 事务使用
- 负数积分防护
- 并发扣除处理
- 积分变动日志
- 免费/付费用户逻辑

**适用场景**: 修改积分扣除、增加、查询逻辑时

---

### 5. 🌍 i18n 多语言验证 (`i18n-validation.json`)
**触发条件**: 修改 UI 组件或翻译文件时
- `components/**/*.tsx`
- `app/[locale]/**/*.tsx`
- `app/i18n/locales/*.json`

**检查项**:
- 是否有硬编码文案
- 20 种语言的翻译完整性
- JSON 格式正确性
- dictionary props 传递

**适用场景**: 修改 UI 组件或添加新文案时

---

### 6. 🗄️ 数据库 Schema 修改保护 (`database-schema-guard.json`)
**触发条件**: 修改 `prisma/schema.prisma` 时

**自动执行**:
- 重新生成 Prisma Client

**提醒步骤**:
1. 运行 `npm run prisma:generate`
2. 运行 `npm run prisma:migrate:dev` 创建迁移
3. 检查迁移文件
4. 更新 TypeScript 类型
5. 测试数据库操作

**适用场景**: 修改数据库表结构时

---

### 7. ⚙️ 环境变量配置验证 (`env-config-validation.json`)
**触发条件**: 修改环境变量相关文件时
- `.env.example`
- `.env.local`
- `lib/env-validator.ts`

**检查项**:
- .env.example 更新
- env-validator.ts 验证逻辑
- 文档说明
- .gitignore 配置

**适用场景**: 添加新的环境变量时

---

### 8. 🚀 部署前完整检查 (`pre-deployment-check.json`)
**触发方式**: 手动触发

**执行内容**:
1. TypeScript 类型检查
2. ESLint 代码检查
3. 完整测试套件
4. 环境变量验证
5. 构建测试

**适用场景**: 部署到生产环境前

**使用方法**: 在命令面板中搜索 "🚀 部署前检查"

---

### 9. 🎨 图片生成 API 保护 (`image-generation-api-guard.json`)
**触发条件**: 修改图片生成核心 API 时
- `app/api/generate/**/*.ts`
- `app/api/fluxToolsGenerate/**/*.ts`
- `utils/usageTrackingService.ts`

**关键检查**:
- 用户认证
- 积分扣除
- 免费用户限额
- 使用量追踪
- Replicate API 调用
- 错误处理
- 性能监控
- 日志记录

**建议测试场景**:
- 未登录用户生成
- 已登录用户生成
- 积分不足
- 达到限额
- 不同模型

**适用场景**: 修改核心业务逻辑时

---

### 10. 💳 支付系统修改保护 (`payment-system-guard.json`)
**触发条件**: 修改 Stripe 支付相关代码时
- `app/api/createCheckoutSession/**/*.ts`
- `app/api/webhook/**/*.ts`
- `utils/stripe.ts`

**安全检查项**:
- API Key 服务端使用
- Webhook 签名验证
- 积分发放防重复
- 金额计算精度
- 完整支付日志
- 错误处理
- 测试场景覆盖

**强烈建议**:
- 在 Stripe 测试模式下验证
- 使用测试卡号
- 检查 webhook 日志
- 验证数据库事务

**适用场景**: 修改支付流程时（极其敏感）

---

### 11. 👋 新会话开发提醒 (`session-start-reminder.json`)
**触发条件**: 每次开始新的开发会话时

**作用**: 提醒项目关键约定和开发流程

**适用场景**: 每次开始工作时

---

## 使用指南

### 自动触发的 Hooks
大部分 hooks 会在你保存文件时自动触发，无需手动操作。你会在编辑器中看到通知和执行结果。

### 手动触发的 Hooks
1. 打开命令面板（Cmd/Ctrl + Shift + P）
2. 搜索 hook 名称（如 "部署前检查"）
3. 点击执行

### 禁用 Hook
如果某个 hook 影响了你的工作流程，可以：
1. 打开对应的 `.json` 文件
2. 将 `"enabled": true` 改为 `"enabled": false`
3. 保存文件

### 查看 Hook 执行结果
- 成功：会显示绿色的成功消息
- 失败：会显示红色的错误消息和详细信息
- 可以在终端中查看完整的命令输出

## 最佳实践

### 1. 修改核心功能前
- 先运行相关测试确保当前状态正常
- 小步提交，每次修改后验证
- 关注 hook 的警告和提示

### 2. 添加新功能时
- 确保添加了相应的测试
- 更新 i18n 翻译文件
- 添加必要的环境变量验证

### 3. 部署前
- 必须运行 "🚀 部署前检查"
- 确保所有测试通过
- 检查环境变量配置

### 4. 修改敏感功能时
- 认证系统：运行完整的认证测试
- 积分系统：验证事务和并发场景
- 支付系统：在测试模式下完整验证

## 故障排除

### Hook 没有触发
1. 检查 `"enabled": true` 是否设置
2. 确认文件路径匹配 `filePattern`
3. 重启编辑器

### 测试失败
1. 查看错误信息
2. 运行 `npm test` 查看详细输出
3. 检查是否有未提交的依赖变更

### 命令执行失败
1. 确保已安装所有依赖 (`npm install`)
2. 检查环境变量配置
3. 查看终端完整输出

## 维护和更新

### 添加新的 Hook
1. 在 `.kiro/hooks/` 目录创建新的 `.json` 文件
2. 参考现有 hook 的格式
3. 测试 hook 是否正常工作
4. 更新本 README

### 修改现有 Hook
1. 编辑对应的 `.json` 文件
2. 测试修改后的行为
3. 更新文档说明

## 相关文档

- [Steering Rules](.kiro/steering/) - 项目开发规范
- [Testing Guide](../docs/) - 测试指南
- [Deployment Guide](../scripts/README_DEPLOYMENT.md) - 部署指南

## 反馈和建议

如果你发现：
- Hook 过于频繁或干扰工作
- 需要新的检查项
- 有更好的验证方式

请在团队中讨论并更新配置。
