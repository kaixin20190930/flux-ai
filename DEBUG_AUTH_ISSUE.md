# 认证问题调试报告

## 发现的问题

### 1. JWT Token过期时间不一致 ✅ 已修复
**问题**: 在 `utils/auth.ts` 的 `createJWT` 函数中，JWT token的过期时间设置为1小时，但cookie的过期时间设置为7天。

```typescript
// 修复前
const expirationTime = Math.floor(Date.now() / 1000) + (60 * 60); // 1 hour

// 修复后  
const expirationTime = Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60); // 7 days
```

**影响**: 用户登录1小时后，JWT token过期但cookie仍然存在，导致认证状态混乱。

### 2. 可能的其他问题

#### A. JWT验证逻辑
- `verifyJWT` 函数可能存在问题
- 需要检查JWT secret的一致性
- 需要验证token解码逻辑

#### B. 认证状态同步
- `useUnifiedAuth` hook可能存在状态更新延迟
- 组件间的认证状态传递可能有问题

## 调试步骤

### 1. 验证JWT Token ✅
修复了JWT token过期时间不一致的问题。

### 2. 检查认证流程
需要验证以下流程：
1. 用户登录 → JWT token生成 → Cookie设置
2. 页面加载 → Cookie读取 → JWT验证 → 认证状态更新
3. 组件渲染 → 认证状态显示

### 3. 添加调试日志
在关键位置添加了调试日志：
- `useUnifiedAuth` hook
- `ImageSearch` 组件
- `SavedImages` 组件  
- `SearchHistory` 组件

## 预期修复效果

修复JWT token过期时间后，用户应该能够：
1. 登录后保持7天的认证状态
2. 在所有页面看到正确的登录状态
3. 正常使用需要认证的功能

## 测试建议

### 1. 清理测试环境
```javascript
// 在浏览器控制台执行
localStorage.clear();
document.cookie.split(";").forEach(function(c) { 
    document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
});
location.reload();
```

### 2. 测试登录流程
1. 访问创建页面
2. 点击登录链接
3. 完成登录
4. 验证是否返回创建页面
5. 检查页面是否显示正确的认证状态

### 3. 测试认证持久性
1. 登录后关闭浏览器
2. 重新打开浏览器访问网站
3. 验证是否仍然保持登录状态

### 4. 测试搜索功能
1. 登录后访问搜索页面
2. 切换到"保存"和"历史"标签
3. 验证是否显示正确内容而不是登录提示

## 如果问题仍然存在

如果修复JWT过期时间后问题仍然存在，可能的原因：

### 1. JWT Secret不一致
检查环境变量 `JWT_SECRET` 是否在所有地方都一致。

### 2. 数据库连接问题
检查 `getUserPoints` 函数是否能正确获取用户数据。

### 3. Cookie域名问题
检查cookie是否在正确的域名下设置。

### 4. 浏览器缓存问题
清理浏览器缓存和localStorage。

## 下一步行动

1. 部署JWT过期时间修复
2. 清理测试环境
3. 进行完整的认证流程测试
4. 如果问题仍然存在，进行更深入的调试