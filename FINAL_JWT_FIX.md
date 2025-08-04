# JWT Token过期时间修复

## 问题根源 🎯

经过深入分析，发现了认证问题的根本原因：

**JWT Token过期时间不一致**
- JWT Token过期时间：1小时 ❌
- Cookie过期时间：7天 ✅
- 结果：用户登录1小时后JWT过期，但cookie仍存在，导致认证状态混乱

## 修复措施 ✅

### 1. 修复JWT Token过期时间
**文件**: `utils/auth.ts`
```typescript
// 修复前
const expirationTime = Math.floor(Date.now() / 1000) + (60 * 60); // 1 hour

// 修复后
const expirationTime = Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60); // 7 days
```

### 2. 添加认证调试工具
**文件**: `utils/authDebug.ts`
- 提供详细的认证状态调试信息
- 可以检查token有效性和过期时间
- 提供清理认证数据的工具

### 3. 集成调试工具
**文件**: `hooks/useUnifiedAuth.ts`
- 在开发环境下自动显示认证调试信息
- 便于排查认证问题

## 测试步骤 📋

### 1. 清理测试环境
在浏览器控制台执行：
```javascript
// 方法1：使用调试工具
window.authDebug.clear()

// 方法2：手动清理
localStorage.clear();
document.cookie.split(";").forEach(function(c) { 
    document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
});
location.reload();
```

### 2. 测试登录流程
1. 访问创建页面 `/[locale]/create`
2. 点击登录链接
3. 完成登录
4. 验证是否返回创建页面
5. 检查页面显示用户点数而不是登录链接

### 3. 测试搜索功能
1. 访问搜索页面 `/[locale]/image-search`
2. 切换到"保存"和"历史"标签
3. 验证显示功能界面而不是登录按钮

### 4. 测试认证持久性
1. 登录后关闭浏览器
2. 重新打开浏览器访问网站
3. 验证仍然保持登录状态（7天内）

## 调试工具使用 🔧

在开发环境下，浏览器控制台提供以下调试命令：

```javascript
// 查看详细认证信息
window.authDebug.log()

// 获取认证信息对象
const info = await window.authDebug.getInfo()

// 清理所有认证数据
window.authDebug.clear()
```

## 预期效果 🎉

修复后用户应该能够：
1. ✅ 登录后保持7天的认证状态
2. ✅ 在创建页面看到用户点数而不是登录链接
3. ✅ 在搜索页面正常使用保存和历史功能
4. ✅ 登录后保留在当前页面或跳转到合适页面
5. ✅ 享受一致和流畅的用户体验

## 如果问题仍然存在 🔍

如果修复后问题仍然存在，请：

1. **检查调试信息**：
   ```javascript
   window.authDebug.log()
   ```

2. **清理环境重新测试**：
   ```javascript
   window.authDebug.clear()
   ```

3. **检查可能的其他问题**：
   - JWT_SECRET环境变量是否正确配置
   - 数据库连接是否正常
   - 网络请求是否成功

## 部署清单 📝

部署前确认：
- [ ] JWT token过期时间已修复为7天
- [ ] 调试工具已集成
- [ ] 测试环境已清理
- [ ] 所有认证相关功能已测试

部署后验证：
- [ ] 用户可以正常登录
- [ ] 登录状态在所有页面正确显示
- [ ] 认证状态可以持续7天
- [ ] 所有需要认证的功能正常工作

---

**这个修复应该解决了认证问题的根本原因。JWT token和cookie现在有一致的7天过期时间，用户登录后应该能够正常使用所有功能。**