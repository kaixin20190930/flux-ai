# 认证系统重新设计需求文档

## 简介

本需求文档旨在重新设计和实现一个完整的认证系统，支持多种登录方式（邮箱密码、Google OAuth 等），并确保数据库设计清晰、类型一致。

## 术语表

- **D1**: Cloudflare 的 SQLite 数据库服务
- **JWT**: JSON Web Token，用于用户认证的令牌
- **Worker**: Cloudflare Workers，边缘计算服务
- **Schema**: 数据库表结构定义
- **SQLITE_MISMATCH**: SQLite 数据类型不匹配错误

## 需求

### 需求 1: 修复用户 ID 类型不一致问题

**用户故事**: 作为系统管理员，我希望数据库中的用户 ID 类型在所有表中保持一致，以便系统能够正常运行。

#### 验收标准

1. WHEN 系统创建新用户 THEN 系统应使用 UUID 字符串作为用户 ID
2. WHEN 系统在 transactions 表中插入记录 THEN 系统应使用 TEXT 类型的 user_id
3. WHEN 系统查询用户数据 THEN 系统应正确处理 TEXT 类型的 ID
4. WHEN 系统执行数据库迁移 THEN 系统应确保所有相关表的 user_id 字段类型为 TEXT
5. WHEN 用户注册成功 THEN 系统应正确记录注册奖励交易

### 需求 2: 修复密码字段兼容性问题

**用户故事**: 作为开发者，我希望系统能够兼容不同版本的密码字段命名，以便支持数据库迁移过程。

#### 验收标准

1. WHEN 系统验证用户密码 THEN 系统应同时检查 password_hash 和 password 字段
2. WHEN 系统存储新用户密码 THEN 系统应使用 password_hash 字段
3. WHEN 系统处理 Google 登录用户 THEN 系统应允许 password_hash 为 NULL
4. WHEN 系统查询用户 THEN 系统应正确处理两种密码字段命名

### 需求 3: 修复数据库 Schema 定义

**用户故事**: 作为数据库管理员，我希望数据库 schema 定义清晰且一致，以便避免类型不匹配错误。

#### 验收标准

1. WHEN 系统初始化数据库 THEN users 表的 id 字段应为 TEXT PRIMARY KEY
2. WHEN 系统初始化数据库 THEN transactions 表的 user_id 字段应为 TEXT NOT NULL
3. WHEN 系统初始化数据库 THEN 所有外键关系应正确定义为 TEXT 类型
4. WHEN 系统执行迁移 THEN 系统应验证所有表的类型一致性
5. WHEN 系统创建索引 THEN 系统应为所有关键字段创建适当的索引

### 需求 4: 改进错误处理和日志记录

**用户故事**: 作为运维人员，我希望系统能够提供详细的错误信息和日志，以便快速诊断和解决问题。

#### 验收标准

1. WHEN 系统发生认证错误 THEN 系统应记录详细的错误信息和堆栈跟踪
2. WHEN 系统执行数据库操作 THEN 系统应记录操作的关键参数
3. WHEN 系统返回错误响应 THEN 系统应提供有意义的错误消息
4. WHEN 系统处理异常 THEN 系统应避免泄露敏感信息
5. WHEN 系统记录日志 THEN 系统应包含时间戳和请求上下文

### 需求 5: 确保数据完整性

**用户故事**: 作为用户，我希望我的注册奖励积分能够正确记录，以便我可以使用这些积分。

#### 验收标准

1. WHEN 用户成功注册 THEN 系统应在 users 表中创建用户记录并设置 points 为 3
2. WHEN 用户成功注册 THEN 系统应在 transactions 表中创建注册奖励记录
3. WHEN 系统记录交易 THEN 系统应正确记录 balance_before 和 balance_after
4. WHEN 系统发生错误 THEN 系统应回滚所有相关的数据库操作
5. WHEN 用户查询积分余额 THEN 系统应返回准确的积分数量

### 需求 6: 支持 Google OAuth 认证

**用户故事**: 作为用户，我希望能够使用 Google 账号登录和注册，以便快速访问系统。

#### 验收标准

1. WHEN 用户使用 Google 登录 THEN 系统应验证 Google token 的有效性
2. WHEN 用户使用 Google 注册 THEN 系统应创建用户记录并标记为 Google 用户
3. WHEN Google 用户登录 THEN 系统应跳过密码验证
4. WHEN Google 用户注册 THEN 系统应生成随机密码哈希值
5. WHEN 系统验证 Google token THEN 系统应检查邮箱是否匹配

### 需求 7: 清理和重建数据库

**用户故事**: 作为系统管理员，我希望能够安全地清理测试数据并重建数据库，以便修复现有的数据问题。

#### 验收标准

1. WHEN 管理员执行数据库清理 THEN 系统应删除所有现有表
2. WHEN 管理员重建数据库 THEN 系统应使用正确的 schema 创建所有表
3. WHEN 系统重建数据库 THEN 系统应创建所有必要的索引
4. WHEN 系统重建数据库 THEN 系统应验证表结构的正确性
5. WHEN 数据库重建完成 THEN 系统应能够正常处理注册和登录请求
