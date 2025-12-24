# Google OAuth 生产环境测试指南

## 概述

本文档提供了 Google OAuth 功能在生产环境的完整测试流程，确保所有功能正常工作并满足性能要求。

---

## 测试环境信息

### 生产环境 URL
- **前端**: https://flux-ai-img.com
- **Worker API**: https://flux-ai-worker-prod.liukai19911010.workers.dev
- **数据库**: Cloudflare D1 (flux-ai)

### 测试账号
建议使用真实的 Google 账号进行测试，确保完整的用户体验。

---

## 测试清单

### 1. 部署验证 ✅

#### 1.1 前端部署检查
- [ ] 访问 https://flux-ai-img.com
- [ ] 页面正常加载，无 404 错误
- [ ] 静态资源（CSS、JS、图片）正常加载
- [ ] 控制台无错误信息

#### 1.2 Worker 部署检查
- [ ] Worker API 可访问
- [ ] 健康检查端点返回正常
- [ ] CORS 配置正确

**验证命令**:
```bash
# 测试 Worker 健康检查
curl https://flux-ai-worker-prod.liukai19911010.workers.dev/

# 预期输出：
# {
#   "status": "ok",
#   "message": "Flux AI Worker is running",
#   "timestamp": "2024-12-23T..."
# }
```

#### 1.3 环境变量检查
- [ ] `NEXT_PUBLIC_GOOGLE_CLIENT_ID` 已配置（前端）
- [ ] `GOOGLE_CLIENT_SECRET` 已配置（Worker）
- [ ] `JWT_SECRET` 已配置（Worker）

**验证命令**:
```bash
# 检查 Worker secrets
cd worker
wrangler secret list --env production

# 预期输出应包含：
# - GOOGLE_CLIENT_SECRET
# - JWT_SECRET
```

---

### 2. Google OAuth 登录流程测试 ✅

#### 2.1 新用户注册流程

**测试步骤**:
1. 访问 https://flux-ai-img.com
2. 点击"登录"或"注册"按钮
3. 点击"使用 Google 登录"按钮
4. 跳转到 Google 授权页面
5. 选择 Google 账号并授权
6. 返回应用并自动登录
7. 跳转到 `/create` 页面

**验证点**:
- [ ] Google 登录按钮显示正常（带 Google 图标）
- [ ] 点击后在 3 秒内跳转到 Google 授权页面
- [ ] Google 授权页面显示正确的应用名称和权限
- [ ] 授权后在 3 秒内返回并完成登录
- [ ] 用户信息正确显示（姓名、邮箱）
- [ ] 新用户获得 3 积分
- [ ] 跳转到 `/create` 页面

**性能要求**:
- ⏱️ 整个登录流程 < 3 秒（需求 6.2）
- ⏱️ Google 授权页面打开 < 500ms（需求 6.1）

#### 2.2 老用户登录流程

**测试步骤**:
1. 使用已注册的 Google 账号登录
2. 验证用户信息和积分余额

**验证点**:
- [ ] 老用户可以正常登录
- [ ] 积分余额保持不变（不会重复赠送）
- [ ] 用户信息正确显示
- [ ] 登录历史记录正确

#### 2.3 登出流程

**测试步骤**:
1. 登录后点击"登出"按钮
2. 验证登出成功

**验证点**:
- [ ] 登出后跳转到首页或登录页
- [ ] 用户信息清除
- [ ] 无法访问需要登录的页面
- [ ] 再次登录可以正常工作

---

### 3. 多语言支持测试 ✅

测试所有 20 种语言的 Google OAuth 相关文案。

#### 3.1 测试语言列表
- [ ] 英语 (en) - https://flux-ai-img.com/en
- [ ] 简体中文 (zh) - https://flux-ai-img.com/zh
- [ ] 繁体中文 (zh-TW) - https://flux-ai-img.com/zh-TW
- [ ] 日语 (ja) - https://flux-ai-img.com/ja
- [ ] 韩语 (ko) - https://flux-ai-img.com/ko
- [ ] 西班牙语 (es) - https://flux-ai-img.com/es
- [ ] 葡萄牙语 (pt) - https://flux-ai-img.com/pt
- [ ] 德语 (de) - https://flux-ai-img.com/de
- [ ] 法语 (fr) - https://flux-ai-img.com/fr
- [ ] 意大利语 (it) - https://flux-ai-img.com/it
- [ ] 俄语 (ru) - https://flux-ai-img.com/ru
- [ ] 阿拉伯语 (ar) - https://flux-ai-img.com/ar
- [ ] 印地语 (hi) - https://flux-ai-img.com/hi
- [ ] 印尼语 (id) - https://flux-ai-img.com/id
- [ ] 土耳其语 (tr) - https://flux-ai-img.com/tr
- [ ] 荷兰语 (nl) - https://flux-ai-img.com/nl
- [ ] 波兰语 (pl) - https://flux-ai-img.com/pl
- [ ] 越南语 (vi) - https://flux-ai-img.com/vi
- [ ] 泰语 (th) - https://flux-ai-img.com/th
- [ ] 马来语 (ms) - https://flux-ai-img.com/ms

#### 3.2 验证内容
对于每种语言，验证以下内容：
- [ ] Google 登录按钮文案正确
- [ ] 登录成功提示正确
- [ ] 错误提示正确
- [ ] 用户界面文案正确

**快速测试方法**:
```bash
# 使用浏览器开发者工具
# 1. 打开浏览器
# 2. 访问不同语言的 URL
# 3. 检查页面文案
# 4. 测试 Google 登录流程
```

---

### 4. 错误处理测试 ✅

#### 4.1 授权被拒绝

**测试步骤**:
1. 点击 Google 登录
2. 在 Google 授权页面点击"取消"或"拒绝"

**验证点**:
- [ ] 显示友好的错误提示："授权被取消"
- [ ] 不会显示技术错误信息
- [ ] 可以重新尝试登录

#### 4.2 网络错误

**测试步骤**:
1. 使用浏览器开发者工具模拟网络错误
2. 尝试 Google 登录

**验证点**:
- [ ] 显示网络错误提示
- [ ] 提示用户检查网络连接
- [ ] 提供重试选项

#### 4.3 Token 验证失败

**测试步骤**:
1. 使用无效的 Google token 调用 API

**验证点**:
- [ ] Worker 正确拒绝无效 token
- [ ] 返回明确的错误信息
- [ ] 不会泄露敏感信息

#### 4.4 邮箱冲突

**测试步骤**:
1. 使用邮箱密码注册一个账号
2. 使用相同邮箱的 Google 账号登录

**验证点**:
- [ ] 系统正确处理邮箱冲突
- [ ] 显示清晰的错误提示
- [ ] 建议用户使用密码登录或绑定账号

---

### 5. 性能测试 ✅

#### 5.1 登录流程性能

**测试方法**:
使用浏览器开发者工具的 Performance 面板测量。

**性能指标**:
- [ ] Google 授权页面打开 < 500ms（需求 6.1）
- [ ] 授权完成到登录成功 < 2 秒（需求 6.2）
- [ ] 整个登录流程 < 3 秒（需求 6.2）

**测试步骤**:
1. 打开浏览器开发者工具
2. 切换到 Network 标签
3. 点击 Google 登录按钮
4. 记录各个阶段的时间

**时间分解**:
- 点击按钮 → Google 授权页面: < 500ms
- Google 授权 → 回调处理: < 1s
- 回调处理 → 登录完成: < 1s
- 总计: < 3s

#### 5.2 API 响应时间

**测试命令**:
```bash
# 测试 Google 登录 API
time curl -X POST https://flux-ai-worker-prod.liukai19911010.workers.dev/auth/google-login \
  -H "Content-Type: application/json" \
  -H "Origin: https://flux-ai-img.com" \
  -d '{
    "googleToken": "test_token",
    "email": "test@example.com",
    "name": "Test User"
  }'

# 预期响应时间 < 1s
```

#### 5.3 并发测试

**测试方法**:
使用 Apache Bench 或类似工具测试并发登录。

```bash
# 安装 Apache Bench (如果未安装)
# macOS: brew install httpd
# Linux: apt-get install apache2-utils

# 测试 100 个并发请求
ab -n 100 -c 10 -H "Content-Type: application/json" \
  -p google-login-payload.json \
  https://flux-ai-worker-prod.liukai19911010.workers.dev/auth/google-login

# 验证：
# - 所有请求成功
# - 平均响应时间 < 1s
# - 无错误
```

---

### 6. 安全测试 ✅

#### 6.1 HTTPS 验证

**验证点**:
- [ ] 所有页面使用 HTTPS
- [ ] SSL 证书有效
- [ ] 无混合内容警告

**测试命令**:
```bash
# 检查 SSL 证书
openssl s_client -connect flux-ai-img.com:443 -servername flux-ai-img.com

# 验证：
# - 证书有效
# - 证书未过期
# - 证书链完整
```

#### 6.2 CORS 配置

**验证点**:
- [ ] Worker API 正确配置 CORS
- [ ] 只允许授权的域名
- [ ] 拒绝未授权的请求

**测试命令**:
```bash
# 测试授权域名
curl -H "Origin: https://flux-ai-img.com" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type" \
  -X OPTIONS \
  https://flux-ai-worker-prod.liukai19911010.workers.dev/auth/google-login

# 验证：
# - 返回 Access-Control-Allow-Origin: https://flux-ai-img.com
# - 返回 Access-Control-Allow-Methods: POST, OPTIONS
```

#### 6.3 Token 安全

**验证点**:
- [ ] JWT token 使用 HTTPS 传输
- [ ] Token 存储在 HttpOnly cookie（如果使用 cookie）
- [ ] Token 有合理的过期时间
- [ ] 无法使用过期 token

#### 6.4 SQL 注入防护

**测试步骤**:
尝试使用恶意输入测试 API。

```bash
# 测试 SQL 注入
curl -X POST https://flux-ai-worker-prod.liukai19911010.workers.dev/auth/google-login \
  -H "Content-Type: application/json" \
  -d '{
    "googleToken": "test",
    "email": "test@example.com OR 1=1--",
    "name": "Test"
  }'

# 验证：
# - 请求被正确拒绝
# - 返回验证错误
# - 不会执行恶意 SQL
```

---

### 7. 数据库验证 ✅

#### 7.1 用户创建验证

**测试步骤**:
1. 使用新 Google 账号登录
2. 检查数据库中的用户记录

**验证命令**:
```bash
cd worker
wrangler d1 execute flux-ai --remote \
  --command "SELECT * FROM users WHERE email = 'test@example.com';"

# 验证：
# - 用户记录存在
# - email 正确
# - name 正确
# - points = 3 (新用户)
# - provider = 'google'
```

#### 7.2 OAuth 绑定验证

**验证命令**:
```bash
wrangler d1 execute flux-ai --remote \
  --command "SELECT * FROM oauth_accounts WHERE provider = 'google' AND provider_email = 'test@example.com';"

# 验证：
# - OAuth 绑定记录存在
# - provider = 'google'
# - provider_email 正确
# - user_id 与 users 表匹配
```

#### 7.3 积分赠送验证

**验证命令**:
```bash
wrangler d1 execute flux-ai --remote \
  --command "SELECT * FROM transactions WHERE user_id = (SELECT id FROM users WHERE email = 'test@example.com') AND type = 'register_bonus';"

# 验证：
# - 交易记录存在
# - type = 'register_bonus'
# - amount = 3
# - reason = 'Google registration bonus'
```

---

### 8. 用户体验测试 ✅

#### 8.1 加载状态

**验证点**:
- [ ] 点击 Google 登录后显示加载动画
- [ ] 按钮禁用，防止重复点击
- [ ] 加载动画流畅，无卡顿

#### 8.2 成功提示

**验证点**:
- [ ] 登录成功后显示欢迎消息
- [ ] 提示包含用户姓名
- [ ] 提示自动消失（3-5 秒）

#### 8.3 错误提示

**验证点**:
- [ ] 错误提示清晰明确
- [ ] 提示包含解决建议
- [ ] 提示样式友好（不是红色警告框）

#### 8.4 响应式设计

**测试设备**:
- [ ] 桌面浏览器（Chrome, Firefox, Safari, Edge）
- [ ] 平板设备（iPad）
- [ ] 移动设备（iPhone, Android）

**验证点**:
- [ ] Google 登录按钮在所有设备上正常显示
- [ ] 登录流程在移动设备上流畅
- [ ] 无布局错乱

---

### 9. 监控和日志 ✅

#### 9.1 Worker 日志

**查看日志**:
```bash
cd worker
wrangler tail --env production

# 实时查看 Worker 日志
# 测试 Google 登录时观察日志输出
```

**验证点**:
- [ ] 登录尝试被记录
- [ ] 成功登录被记录
- [ ] 失败登录被记录（包含原因）
- [ ] 无敏感信息泄露（密码、token）

#### 9.2 错误监控

**验证点**:
- [ ] 所有错误被正确捕获
- [ ] 错误日志包含足够的调试信息
- [ ] 错误不会导致应用崩溃

---

### 10. 回归测试 ✅

确保 Google OAuth 不影响现有功能。

#### 10.1 邮箱密码登录

**验证点**:
- [ ] 邮箱密码注册仍然正常
- [ ] 邮箱密码登录仍然正常
- [ ] 两种登录方式可以共存

#### 10.2 图片生成功能

**验证点**:
- [ ] 登录后可以正常生成图片
- [ ] 积分正确扣除
- [ ] 生成历史正确记录

#### 10.3 积分系统

**验证点**:
- [ ] 积分余额正确显示
- [ ] 积分购买功能正常
- [ ] 积分交易记录正确

---

## 测试报告模板

### 测试执行记录

**测试日期**: 2024-12-23  
**测试人员**: [姓名]  
**测试环境**: 生产环境  

### 测试结果汇总

| 测试项 | 状态 | 备注 |
|--------|------|------|
| 部署验证 | ✅ / ❌ | |
| 新用户注册 | ✅ / ❌ | |
| 老用户登录 | ✅ / ❌ | |
| 多语言支持 | ✅ / ❌ | |
| 错误处理 | ✅ / ❌ | |
| 性能测试 | ✅ / ❌ | |
| 安全测试 | ✅ / ❌ | |
| 数据库验证 | ✅ / ❌ | |
| 用户体验 | ✅ / ❌ | |
| 回归测试 | ✅ / ❌ | |

### 性能指标

- Google 授权页面打开时间: ___ ms
- 授权完成到登录成功: ___ ms
- 整个登录流程: ___ ms
- API 平均响应时间: ___ ms

### 发现的问题

1. **问题描述**: 
   - **严重程度**: 高 / 中 / 低
   - **复现步骤**: 
   - **预期结果**: 
   - **实际结果**: 
   - **截图**: 

### 建议和改进

1. 
2. 
3. 

### 测试结论

- [ ] ✅ 所有测试通过，可以发布
- [ ] ⚠️ 部分测试失败，需要修复
- [ ] ❌ 重大问题，不建议发布

---

## 自动化测试脚本

### 完整测试脚本

创建 `scripts/test-google-oauth-production.sh`:

```bash
#!/bin/bash

echo "=========================================="
echo "Google OAuth 生产环境测试"
echo "=========================================="
echo ""

FRONTEND_URL="https://flux-ai-img.com"
WORKER_URL="https://flux-ai-worker-prod.liukai19911010.workers.dev"

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 测试计数
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# 测试函数
test_case() {
  TOTAL_TESTS=$((TOTAL_TESTS + 1))
  echo -n "测试 $TOTAL_TESTS: $1 ... "
}

pass() {
  PASSED_TESTS=$((PASSED_TESTS + 1))
  echo -e "${GREEN}✅ 通过${NC}"
}

fail() {
  FAILED_TESTS=$((FAILED_TESTS + 1))
  echo -e "${RED}❌ 失败${NC}"
  if [ ! -z "$1" ]; then
    echo "   原因: $1"
  fi
}

# 1. Worker 健康检查
test_case "Worker 健康检查"
HEALTH_RESPONSE=$(curl -s "$WORKER_URL/")
if echo "$HEALTH_RESPONSE" | grep -q "ok"; then
  pass
else
  fail "Worker 未响应"
fi
echo ""

# 2. CORS 配置检查
test_case "CORS 配置"
CORS_RESPONSE=$(curl -s -I -H "Origin: $FRONTEND_URL" "$WORKER_URL/auth/google-login")
if echo "$CORS_RESPONSE" | grep -q "Access-Control-Allow-Origin"; then
  pass
else
  fail "CORS 未正确配置"
fi
echo ""

# 3. 前端可访问性
test_case "前端可访问性"
FRONTEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$FRONTEND_URL")
if [ "$FRONTEND_STATUS" = "200" ]; then
  pass
else
  fail "前端返回状态码: $FRONTEND_STATUS"
fi
echo ""

# 4. Google Client ID 配置检查
test_case "Google Client ID 配置"
FRONTEND_HTML=$(curl -s "$FRONTEND_URL")
if echo "$FRONTEND_HTML" | grep -q "NEXT_PUBLIC_GOOGLE_CLIENT_ID"; then
  pass
else
  fail "Google Client ID 未配置"
fi
echo ""

# 5. SSL 证书检查
test_case "SSL 证书"
SSL_CHECK=$(echo | openssl s_client -connect flux-ai-img.com:443 -servername flux-ai-img.com 2>/dev/null | grep "Verify return code")
if echo "$SSL_CHECK" | grep -q "0 (ok)"; then
  pass
else
  fail "SSL 证书问题"
fi
echo ""

# 测试总结
echo ""
echo "=========================================="
echo "测试总结"
echo "=========================================="
echo "总测试数: $TOTAL_TESTS"
echo -e "通过: ${GREEN}$PASSED_TESTS${NC}"
echo -e "失败: ${RED}$FAILED_TESTS${NC}"
echo ""

if [ $FAILED_TESTS -eq 0 ]; then
  echo -e "${GREEN}✅ 所有测试通过！${NC}"
  exit 0
else
  echo -e "${RED}❌ 有 $FAILED_TESTS 个测试失败${NC}"
  exit 1
fi
```

### 运行测试

```bash
# 添加执行权限
chmod +x scripts/test-google-oauth-production.sh

# 运行测试
./scripts/test-google-oauth-production.sh
```

---

## 常见问题排查

### 问题 1: 登录后立即登出

**可能原因**:
- JWT token 配置错误
- Cookie 设置问题
- 会话存储失败

**排查步骤**:
1. 检查浏览器开发者工具的 Application > Cookies
2. 查看 Worker 日志
3. 验证 JWT_SECRET 配置

### 问题 2: 多语言文案未显示

**可能原因**:
- 翻译文件未更新
- i18n 配置错误
- 构建缓存问题

**排查步骤**:
1. 检查 `app/i18n/locales/*.json` 文件
2. 清除构建缓存并重新部署
3. 验证语言路由配置

### 问题 3: 性能不达标

**可能原因**:
- 网络延迟
- Worker 冷启动
- 数据库查询慢

**排查步骤**:
1. 使用浏览器开发者工具分析性能
2. 检查 Worker 日志中的执行时间
3. 优化数据库查询

---

## 参考文档

- [需求文档](./requirements.md) - 需求 6.1, 6.2
- [设计文档](./design.md)
- [配置检查清单](./CONFIGURATION_CHECKLIST.md)
- [生产环境配置](./production-env-setup.md)

---

**最后更新**: 2024-12-23  
**版本**: 1.0  
**状态**: ✅ 生产环境测试指南
