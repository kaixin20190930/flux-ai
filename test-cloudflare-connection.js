#!/usr/bin/env node

/**
 * 测试 Cloudflare 连接和基本设置
 */

const { execSync } = require('child_process');
const fs = require('fs');

console.log('🔍 测试 Cloudflare 连接...\n');

async function testConnection() {
  const tests = [
    {
      name: '检查网络连接',
      test: () => {
        try {
          execSync('ping -c 1 cloudflare.com', { stdio: 'pipe' });
          return { success: true, message: 'Cloudflare 网络连接正常' };
        } catch (error) {
          return { success: false, message: '无法连接到 Cloudflare，请检查网络' };
        }
      }
    },
    {
      name: '检查 Wrangler 版本',
      test: () => {
        try {
          const version = execSync('npx wrangler --version', { encoding: 'utf8' }).trim();
          const versionNumber = version.match(/(\d+\.\d+\.\d+)/)?.[1];
          if (versionNumber) {
            const [major, minor] = versionNumber.split('.').map(Number);
            if (major >= 4 || (major === 3 && minor >= 70)) {
              return { success: true, message: `Wrangler 版本: ${version}` };
            } else {
              return { success: false, message: `Wrangler 版本过旧: ${version}，建议升级到 4.x` };
            }
          }
          return { success: false, message: '无法获取 Wrangler 版本' };
        } catch (error) {
          return { success: false, message: 'Wrangler 未安装或不可用' };
        }
      }
    },
    {
      name: '检查登录状态',
      test: () => {
        try {
          const result = execSync('npx wrangler whoami', { encoding: 'utf8' });
          if (result.includes('@')) {
            return { success: true, message: '已登录 Cloudflare' };
          } else {
            return { success: false, message: '未登录 Cloudflare，请运行: npx wrangler login' };
          }
        } catch (error) {
          return { success: false, message: '未登录 Cloudflare，请运行: npx wrangler login' };
        }
      }
    },
    {
      name: '检查项目文件',
      test: () => {
        const requiredFiles = [
          'utils/edgeUtils.ts',
          'wrangler.toml',
          'app/api/auth/login-edge/route.ts',
          'app/api/auth/register-edge/route.ts'
        ];
        
        const missing = requiredFiles.filter(file => !fs.existsSync(file));
        
        if (missing.length === 0) {
          return { success: true, message: '所有必要文件都存在' };
        } else {
          return { success: false, message: `缺少文件: ${missing.join(', ')}` };
        }
      }
    }
  ];

  console.log('📋 运行连接测试...\n');

  let allPassed = true;
  for (const test of tests) {
    console.log(`🔄 ${test.name}...`);
    const result = test.test();
    
    if (result.success) {
      console.log(`✅ ${result.message}`);
    } else {
      console.log(`❌ ${result.message}`);
      allPassed = false;
    }
    console.log('');
  }

  if (allPassed) {
    console.log('🎉 所有测试通过！可以继续进行 Cloudflare 设置。');
    showNextSteps();
  } else {
    console.log('⚠️  存在问题需要解决。请按照上述提示修复后重新运行。');
    showTroubleshooting();
  }
}

function showNextSteps() {
  console.log(`
📋 下一步操作：

1. 🔧 手动创建 Cloudflare 资源：
   npx wrangler d1 create flux-ai-db
   npx wrangler r2 bucket create flux-ai-storage
   npx wrangler kv:namespace create "CACHE"

2. 📝 更新 wrangler.toml 配置：
   - 将创建的资源 ID 填入配置文件

3. 🗄️ 初始化数据库：
   npx wrangler d1 execute flux-ai-db --file=migrations/d1-schema.sql

4. 🧪 测试 Edge Runtime API：
   npm run dev
   # 访问 /api/auth/login-edge 和 /api/auth/register-edge

5. 🚀 部署到 Cloudflare Pages：
   git push origin main
   # 然后在 Cloudflare Dashboard 中配置 Pages

详细步骤请参考: CLOUDFLARE_MANUAL_SETUP.md
`);
}

function showTroubleshooting() {
  console.log(`
🛠️  故障排除：

1. 网络连接问题：
   - 检查防火墙设置
   - 尝试使用代理：export HTTP_PROXY=http://proxy:port
   - 或使用手机热点测试

2. Wrangler 版本问题：
   npm install -g wrangler@latest
   # 或
   npm install --save-dev wrangler@latest

3. 登录问题：
   npx wrangler logout
   npx wrangler login
   # 如果浏览器无法打开，使用 API Token：
   npx wrangler auth

4. 文件缺失问题：
   - 确保运行了之前的脚本创建了必要文件
   - 或手动创建缺失的文件

5. 权限问题：
   - 确保 Cloudflare 账户有足够权限
   - 检查 API Token 权限设置

重新运行测试: node test-cloudflare-connection.js
`);
}

testConnection().catch(console.error);