# 🚀 Git 推送指南

## ✅ 已完成

1. ✅ 删除所有包含密钥的文件
2. ✅ 创建干净的 Git 历史（orphan 分支）
3. ✅ 所有代码已提交到新的 main 分支

## 📋 下一步：强制推送

由于我们创建了新的历史，需要使用 `--force` 推送：

```bash
git push origin main --force
```

## ⚠️ 重要说明

- 这会**完全替换**远程仓库的历史
- 所有旧的 commits（包含密钥的）将被删除
- 这是**安全的**，因为我们已经移除了所有敏感信息

## 🎯 推送后

1. **Cloudflare Pages 自动部署**
   - GitHub 推送后，Cloudflare Pages 会自动检测并部署
   - 构建命令：`npx @cloudflare/next-on-pages@1`
   - 输出目录：`.vercel/output/static`

2. **配置环境变量**（如果是首次部署）
   - 登录 Cloudflare Dashboard
   - 进入 Pages 项目设置
   - 添加环境变量（参考 `.env.example`）

3. **验证部署**
   ```bash
   # 测试 Worker API
   curl https://api.flux-ai-img.com/
   
   # 访问主站
   open https://flux-ai-img.com
   ```

## 📊 当前架构

```
✅ Cloudflare Workers (API) - 已部署
✅ Cloudflare D1 (数据库) - 已迁移
⏳ Cloudflare Pages (前端) - 等待推送后自动部署
```

## 🔧 如果推送失败

如果仍然遇到密钥检测错误，说明还有文件包含密钥。运行：

```bash
# 查看当前分支的文件
git ls-files

# 搜索可能包含密钥的文件
git grep -i "sk_test_" || echo "未找到 Stripe 测试密钥"
git grep -i "sk_live_" || echo "未找到 Stripe 生产密钥"
git grep -i "r8_" || echo "未找到 Replicate 密钥"
```

---

**准备好了！执行推送命令：**

```bash
git push origin main --force
```
