# Kiro 项目配置完成

## 📋 已完成的配置

### 1. Steering Rules（开发规范）

已创建 4 个 steering 文档，用于指导 AI 助手的工作：

#### 📄 `product.md` - 产品概述
- Flux AI 的核心功能和特性
- 多模型支持、认证系统、积分体系
- 免费层和付费商业模式

#### 🛠️ `tech.md` - 技术栈
- 完整的技术栈列表
- 所有常用命令（开发、构建、测试、数据库、部署）
- 关键依赖说明

#### 📁 `structure.md` - 项目结构
- 详细的文件夹组织
- App Router 路由模式（含 i18n）
- 组件、工具、hooks 的组织方式

#### ⭐ `ai-development-rules.md` - AI 开发规范（高优先级）
- 语言要求：所有回答优先使用中文
- 云服务选择：不使用 AWS，优先 Cloudflare/Vercel/Neon
- 前端规则：TypeScript 强制、i18n 多语言强制（20 种语言）
- 后端规则：API 规范、输入校验、日志要求
- AI 相关：模型选择优先级、Prompt 设计、流式输出
- 安全规范：限流、输入清洗、NSFW 检测
- 项目特定约定

---

### 2. Agent Hooks（自动化检查）

已创建 11 个 agent hooks，确保新功能不会破坏已有功能：

#### 🧪 自动触发的 Hooks

1. **保存前运行测试** - 修改关键文件时自动运行相关测试
2. **API 路由修改验证** - 检查类型安全、环境变量、认证逻辑
3. **认证系统修改保护** - 运行完整的认证测试套件
4. **积分系统修改保护** - 验证积分业务逻辑
5. **i18n 多语言验证** - 检查文案和翻译完整性
6. **数据库 Schema 修改保护** - 提醒创建迁移并验证
7. **环境变量配置验证** - 验证配置完整性
8. **图片生成 API 保护** - 确保核心业务逻辑不被破坏
9. **支付系统修改保护** - 支付相关的安全检查
10. **新会话开发提醒** - 每次开始工作时的提醒

#### 🚀 手动触发的 Hooks

11. **部署前完整检查** - 运行所有测试和验证

---

## 🎯 这些配置的作用

### Steering Rules 的作用
- AI 助手会自动遵循项目的技术栈和约定
- 所有回答都会使用中文
- 代码建议会符合项目的架构模式
- 自动考虑 i18n、安全、性能等方面

### Agent Hooks 的作用
- 修改关键文件时自动运行测试
- 防止破坏已有功能
- 提醒重要的检查项
- 确保代码质量

---

## 📚 使用指南

### 日常开发流程

1. **开始工作**
   - 打开项目时会看到新会话提醒
   - 了解项目关键约定

2. **编写代码**
   - 保存文件时会自动触发相关检查
   - 关注 hook 的提示和警告
   - 修复测试失败的问题

3. **部署前**
   - 运行 "🚀 部署前检查" hook
   - 确保所有测试通过
   - 检查环境变量配置

### 与 AI 助手协作

现在当你向 AI 助手提问时，它会自动：

✅ 用中文回答（除非特殊情况）
✅ 遵循项目的 i18n 模式（自定义实现，20 种语言）
✅ 使用 Prisma + PostgreSQL 进行数据库操作
✅ 使用 NextAuth v5 的 database sessions（不是 JWT）
✅ 提供结构化、可执行的代码示例
✅ 考虑性能、安全、全球化等方面
✅ 避免使用 AWS 服务

### 修改核心功能时

#### 认证系统
- 会自动运行认证测试套件
- 确保 database sessions 正常工作
- 验证 Google OAuth 和邮箱密码登录

#### 积分系统
- 会自动运行积分测试
- 检查 Prisma 事务使用
- 验证并发场景

#### 图片生成 API
- 提醒关键检查项
- 建议手动测试场景
- 运行类型检查

#### 支付系统
- 显示安全警告
- 提醒在测试模式下验证
- 检查 webhook 签名

---

## 🔧 配置文件位置

```
.kiro/
├── steering/                    # 开发规范
│   ├── product.md              # 产品概述
│   ├── tech.md                 # 技术栈
│   ├── structure.md            # 项目结构
│   └── ai-development-rules.md # AI 开发规范（高优先级）
│
├── hooks/                       # Agent Hooks
│   ├── README.md               # Hooks 使用文档
│   ├── pre-commit-tests.json
│   ├── api-route-validation.json
│   ├── auth-changes-guard.json
│   ├── points-system-guard.json
│   ├── i18n-validation.json
│   ├── database-schema-guard.json
│   ├── env-config-validation.json
│   ├── pre-deployment-check.json
│   ├── image-generation-api-guard.json
│   ├── payment-system-guard.json
│   └── session-start-reminder.json
│
└── SETUP_COMPLETE.md           # 本文档
```

---

## 🎓 学习资源

### 查看 Steering Rules
```bash
# 查看所有开发规范
ls -la .kiro/steering/

# 阅读 AI 开发规范
cat .kiro/steering/ai-development-rules.md
```

### 查看 Agent Hooks
```bash
# 查看所有 hooks
ls -la .kiro/hooks/

# 阅读 hooks 文档
cat .kiro/hooks/README.md
```

### 测试 Hooks
1. 修改一个测试文件并保存
2. 观察是否触发相关 hook
3. 查看执行结果

---

## 🔄 维护和更新

### 更新 Steering Rules
当项目技术栈或约定发生变化时：
1. 编辑 `.kiro/steering/` 中的相应文件
2. 保存后会自动生效
3. AI 助手会遵循新的规范

### 更新 Agent Hooks
当需要调整检查逻辑时：
1. 编辑 `.kiro/hooks/` 中的相应 `.json` 文件
2. 修改 `filePattern`、`actions` 等配置
3. 保存后会自动生效

### 禁用某个 Hook
如果某个 hook 影响工作流程：
1. 打开对应的 `.json` 文件
2. 将 `"enabled": true` 改为 `"enabled": false`
3. 保存文件

---

## ✅ 验证配置

### 验证 Steering Rules
向 AI 助手提问：
- "帮我创建一个新的 API 路由"
- "如何添加一个新的 UI 组件"

观察回答是否：
- 使用中文
- 包含 i18n 集成
- 使用项目的技术栈
- 提供完整的代码示例

### 验证 Agent Hooks
1. 修改 `lib/auth.ts` 并保存
   - 应该触发认证系统保护 hook
   - 运行认证测试套件

2. 修改 `app/api/generate/route.ts` 并保存
   - 应该触发图片生成 API 保护 hook
   - 显示关键检查项

3. 运行手动 hook
   - 打开命令面板
   - 搜索 "部署前检查"
   - 执行并查看结果

---

## 🚨 故障排除

### Hook 没有触发
1. 检查 `"enabled": true` 是否设置
2. 确认文件路径匹配 `filePattern`
3. 重启编辑器

### 测试失败
1. 查看错误信息
2. 运行 `npm test` 查看详细输出
3. 检查是否有未提交的依赖变更

### AI 助手没有遵循规范
1. 确认 steering 文件存在
2. 检查文件格式是否正确
3. 尝试重新加载项目

---

## 📞 获取帮助

### 查看文档
- [Steering Rules](.kiro/steering/)
- [Agent Hooks README](.kiro/hooks/README.md)
- [项目 README](../README.md)

### 常见问题
1. **如何添加新的 hook？**
   - 在 `.kiro/hooks/` 创建新的 `.json` 文件
   - 参考现有 hook 的格式

2. **如何修改 AI 助手的行为？**
   - 编辑 `.kiro/steering/ai-development-rules.md`
   - 添加或修改规则

3. **如何临时禁用所有 hooks？**
   - 将所有 hook 的 `enabled` 设为 `false`
   - 或者重命名 `.kiro/hooks` 目录

---

## 🎉 配置完成！

你的项目现在已经配置了完整的 AI 辅助开发环境：

✅ AI 助手会遵循项目规范
✅ 自动化检查确保代码质量
✅ 防止破坏已有功能
✅ 提供结构化的开发指导

开始享受高效的 AI 辅助开发吧！🚀
