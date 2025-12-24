# 部署和测试命令清单

## 🚀 快速部署

### 1. 运行前端测试
```bash
./scripts/test-frontend-google-oauth.sh
```

预期结果：所有 9 个测试通过 ✅

### 2. 推送代码
```bash
git add .
git commit -m "feat: 完成 Google OAuth 集成"
git push origin main
```

### 3. 等待部署
- Cloudflare Pages 自动部署（2-5 分钟）
- 访问 [Cloudflare Dashboard](https://dash.cloudflare.com) 查看状态

---

## ✅ 生产环境快速测试

### 基本功能测试（5 分钟）

1. **访问网站**
   ```
   https://flux-ai-img.com
   ```

2. **测试 Google 登录**
   - 点击"登录"按钮
   - 点击"使用 Google 登录"
   - 完成授权
   - 验证：跳转到 `/create` 页面
   - 验证：显示用户信息
   - 验证：新用户有 3 积分

3. **测试多语言**
   ```
   https://flux-ai-img.com/zh  (中文)
   https://flux-ai-img.com/en  (英文)
   https://flux-ai-img.com/ja  (日文)
   ```
   验证：Google 登录按钮文案正确

4. **测试性能**
   - 打开浏览器开发者工具 (F12)
   - Network 标签
   - 点击 Google 登录
   - 验证：整个流程 < 3 秒

---

## 🐛 故障排查

### 问题 1: redirect_uri_mismatch
```bash
# 解决方案：在 Google Cloud Console 添加重定向 URI
# https://flux-ai-img.com/api/auth/callback/google
```

### 问题 2: Invalid Google token
```bash
# 解决方案：重新配置 Worker Secret
cd worker
wrangler secret put GOOGLE_CLIENT_SECRET --env production
wrangler deploy --env production
```

### 问题 3: 环境变量未加载
```bash
# 解决方案：在 Cloudflare Dashboard 配置环境变量
# Workers & Pages > 项目 > Settings > Environment variables
# 添加: NEXT_PUBLIC_GOOGLE_CLIENT_ID
# 然后重新部署
```

---

## 📊 测试报告

### 测试结果
- [ ] ✅ 所有功能正常
- [ ] ⚠️ 有小问题
- [ ] ❌ 有严重问题

### 性能数据
- 登录流程总时间: ___ ms
- 是否满足 < 3s: ☐ 是 ☐ 否

---

## 📚 详细文档

- [完整测试指南](./production-testing-guide.md)
- [手动测试清单](./manual-testing-checklist.md)
- [快速测试指南](./PRODUCTION_TEST_QUICK_GUIDE.md)
- [最终总结](./FINAL_SUMMARY.md)

---

**测试日期**: ___________  
**测试人员**: ___________
