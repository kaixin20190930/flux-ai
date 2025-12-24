# 生产环境测试快速指南

## 🚀 部署步骤

### 1. 推送代码
```bash
git add .
git commit -m "feat: 完成 Google OAuth 集成"
git push origin main
```

### 2. 等待自动部署
- Cloudflare Pages 会自动部署
- 访问 Cloudflare Dashboard 查看部署状态
- 等待部署完成（通常 2-5 分钟）

---

## ✅ 快速测试清单

### 基本功能（5 分钟）

1. **访问生产环境**
   - [ ] 打开 https://flux-ai-img.com
   - [ ] 页面正常加载

2. **新用户注册**
   - [ ] 点击"登录"按钮
   - [ ] 点击"使用 Google 登录"
   - [ ] 完成 Google 授权
   - [ ] 自动登录并跳转到 `/create`
   - [ ] 检查积分余额 = 3

3. **老用户登录**
   - [ ] 登出
   - [ ] 再次使用 Google 登录
   - [ ] 积分余额保持不变

4. **多语言测试**（抽样）
   - [ ] 中文: https://flux-ai-img.com/zh
   - [ ] 英文: https://flux-ai-img.com/en
   - [ ] 日文: https://flux-ai-img.com/ja
   - 验证：Google 登录按钮文案正确

5. **性能测试**
   - [ ] 打开浏览器开发者工具 (F12)
   - [ ] Network 标签
   - [ ] 点击 Google 登录
   - [ ] 验证：整个流程 < 3 秒

---

## ⚡ 性能要求

使用浏览器开发者工具测量：

| 指标 | 要求 | 实际 |
|------|------|------|
| Google 授权页面打开 | < 500ms | ___ ms |
| 授权完成到登录成功 | < 2s | ___ ms |
| 整个登录流程 | < 3s | ___ ms |

---

## 🐛 常见问题

### 问题 1: redirect_uri_mismatch
**解决**: 
1. 访问 [Google Cloud Console](https://console.cloud.google.com)
2. 添加重定向 URI: `https://flux-ai-img.com/api/auth/callback/google`

### 问题 2: Invalid Google token
**解决**:
```bash
cd worker
wrangler secret put GOOGLE_CLIENT_SECRET --env production
# 输入正确的 Client Secret
wrangler deploy --env production
```

### 问题 3: 环境变量未加载
**解决**:
1. 访问 Cloudflare Dashboard
2. Workers & Pages > 选择项目 > Settings > Environment variables
3. 确认 `NEXT_PUBLIC_GOOGLE_CLIENT_ID` 已配置
4. 重新部署

---

## 📝 测试报告

### 测试结果
- [ ] ✅ 所有功能正常
- [ ] ⚠️ 有小问题，但不影响使用
- [ ] ❌ 有严重问题，需要修复

### 发现的问题
1. 
2. 
3. 

### 性能数据
- 登录流程总时间: ___ ms
- 是否满足 < 3s 要求: ☐ 是 ☐ 否

---

## 📚 详细文档

如需更详细的测试，参考：
- [完整测试指南](./production-testing-guide.md)
- [手动测试清单](./manual-testing-checklist.md)
- [配置检查清单](./CONFIGURATION_CHECKLIST.md)

---

**测试日期**: ___________  
**测试人员**: ___________  
**结论**: ___________
