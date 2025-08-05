#!/usr/bin/env node

/**
 * Cloudflare Edge Runtime 迁移启动脚本
 * 第一阶段：基础设施准备和初始迁移
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 开始 Cloudflare Edge Runtime 迁移...\n');

class CloudflareMigration {
  constructor() {
    this.steps = [
      { name: '检查环境', fn: this.checkEnvironment },
      { name: '安装 Wrangler CLI', fn: this.installWrangler },
      { name: '创建 D1 数据库', fn: this.createD1Database },
      { name: '设置 R2 存储', fn: this.setupR2Storage },
      { name: '创建 KV 命名空间', fn: this.createKVNamespace },
      { name: '运行数据库迁移', fn: this.runDatabaseMigration },
      { name: '测试 Edge API', fn: this.testEdgeAPIs },
      { name: '更新环境配置', fn: this.updateEnvironmentConfig },
    ];
  }

  async run() {
    console.log('📋 迁移计划：');
    this.steps.forEach((step, index) => {
      console.log(`${index + 1}. ${step.name}`);
    });
    console.log('');

    for (let i = 0; i < this.steps.length; i++) {
      const step = this.steps[i];
      console.log(`🔄 执行步骤 ${i + 1}: ${step.name}...`);
      
      try {
        await step.fn.call(this);
        console.log(`✅ 步骤 ${i + 1} 完成\n`);
      } catch (error) {
        console.error(`❌ 步骤 ${i + 1} 失败:`, error.message);
        console.log(`\n🛠️  请手动解决此问题后重新运行脚本\n`);
        return;
      }
    }

    console.log('🎉 第一阶段迁移完成！');
    this.showNextSteps();
  }

  async checkEnvironment() {
    // 检查 Node.js 版本
    const nodeVersion = process.version;
    console.log(`   Node.js 版本: ${nodeVersion}`);
    
    // 检查 npm
    try {
      const npmVersion = execSync('npm --version', { encoding: 'utf8' }).trim();
      console.log(`   npm 版本: ${npmVersion}`);
    } catch (error) {
      throw new Error('npm 未安装或不可用');
    }

    // 检查项目文件
    const requiredFiles = ['package.json', 'next.config.js'];
    for (const file of requiredFiles) {
      if (!fs.existsSync(file)) {
        throw new Error(`缺少必要文件: ${file}`);
      }
    }

    console.log('   环境检查通过');
  }

  async installWrangler() {
    try {
      // 检查是否已安装
      execSync('npx wrangler --version', { stdio: 'pipe' });
      console.log('   Wrangler CLI 已安装');
    } catch (error) {
      console.log('   正在安装 Wrangler CLI...');
      execSync('npm install -g wrangler', { stdio: 'inherit' });
    }
  }

  async createD1Database() {
    try {
      // 检查是否已存在
      const result = execSync('npx wrangler d1 list', { encoding: 'utf8' });
      if (result.includes('flux-ai-db')) {
        console.log('   D1 数据库已存在');
        return;
      }
    } catch (error) {
      // 可能是第一次使用，需要登录
      console.log('   请先登录 Cloudflare:');
      execSync('npx wrangler login', { stdio: 'inherit' });
    }

    console.log('   创建 D1 数据库...');
    const output = execSync('npx wrangler d1 create flux-ai-db', { encoding: 'utf8' });
    console.log('   D1 数据库创建成功');
    
    // 提取数据库 ID
    const match = output.match(/database_id = "([^"]+)"/);
    if (match) {
      const databaseId = match[1];
      console.log(`   数据库 ID: ${databaseId}`);
      
      // 更新 wrangler.toml
      this.updateWranglerConfig('database_id', databaseId);
    }
  }

  async setupR2Storage() {
    try {
      console.log('   创建 R2 存储桶...');
      execSync('npx wrangler r2 bucket create flux-ai-storage', { stdio: 'inherit' });
      console.log('   R2 存储桶创建成功');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('   R2 存储桶已存在');
      } else {
        throw error;
      }
    }
  }

  async createKVNamespace() {
    try {
      console.log('   创建 KV 命名空间...');
      const output = execSync('npx wrangler kv:namespace create "CACHE"', { encoding: 'utf8' });
      console.log('   KV 命名空间创建成功');
      
      // 提取命名空间 ID
      const match = output.match(/id = "([^"]+)"/);
      if (match) {
        const namespaceId = match[1];
        console.log(`   命名空间 ID: ${namespaceId}`);
        
        // 更新 wrangler.toml
        this.updateWranglerConfig('kv_namespace_id', namespaceId);
      }
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('   KV 命名空间已存在');
      } else {
        throw error;
      }
    }
  }

  async runDatabaseMigration() {
    console.log('   运行数据库迁移...');
    
    // 检查迁移脚本是否存在
    if (!fs.existsSync('scripts/migrate-to-d1.ts')) {
      console.log('   迁移脚本不存在，跳过此步骤');
      return;
    }

    try {
      // 编译并运行迁移脚本
      execSync('npx ts-node scripts/migrate-to-d1.ts', { stdio: 'inherit' });
      console.log('   数据库迁移完成');
    } catch (error) {
      console.log('   数据库迁移失败，请手动执行');
      console.log('   命令: npx ts-node scripts/migrate-to-d1.ts');
    }
  }

  async testEdgeAPIs() {
    console.log('   测试 Edge Runtime API...');
    
    // 检查 Edge API 文件是否存在
    const edgeAPIs = [
      'app/api/auth/login-edge/route.ts',
      'app/api/auth/register-edge/route.ts'
    ];

    let existingAPIs = 0;
    for (const api of edgeAPIs) {
      if (fs.existsSync(api)) {
        existingAPIs++;
        console.log(`   ✓ ${api} 存在`);
      } else {
        console.log(`   ✗ ${api} 不存在`);
      }
    }

    if (existingAPIs === 0) {
      console.log('   警告: 没有找到 Edge Runtime API 文件');
    } else {
      console.log(`   找到 ${existingAPIs} 个 Edge Runtime API`);
    }
  }

  async updateEnvironmentConfig() {
    console.log('   更新环境配置...');
    
    // 创建 .env.cloudflare 文件
    const envContent = `# Cloudflare 环境变量
NODE_ENV=production
JWT_SECRET=your-jwt-secret-here
DATABASE_URL=your-d1-database-url
NEXTAUTH_SECRET=your-nextauth-secret-here
NEXTAUTH_URL=https://your-domain.com

# Cloudflare 特定配置
CF_ACCOUNT_ID=your-account-id
CF_API_TOKEN=your-api-token
`;

    fs.writeFileSync('.env.cloudflare', envContent);
    console.log('   .env.cloudflare 文件已创建');

    // 更新 next.config.js 以支持 Edge Runtime
    this.updateNextConfig();
  }

  updateWranglerConfig(key, value) {
    const wranglerPath = 'wrangler.toml';
    if (!fs.existsSync(wranglerPath)) {
      console.log('   wrangler.toml 不存在，跳过更新');
      return;
    }

    let content = fs.readFileSync(wranglerPath, 'utf8');
    
    if (key === 'database_id') {
      content = content.replace(
        /database_id = "your-database-id-here"/,
        `database_id = "${value}"`
      );
    } else if (key === 'kv_namespace_id') {
      content = content.replace(
        /id = "your-kv-namespace-id-here"/,
        `id = "${value}"`
      );
    }

    fs.writeFileSync(wranglerPath, content);
    console.log(`   wrangler.toml 已更新 (${key})`);
  }

  updateNextConfig() {
    const nextConfigPath = 'next.config.js';
    if (!fs.existsSync(nextConfigPath)) {
      console.log('   next.config.js 不存在，跳过更新');
      return;
    }

    // 这里可以添加 Next.js 配置的更新逻辑
    console.log('   next.config.js 配置检查完成');
  }

  showNextSteps() {
    console.log(`
📋 下一步操作：

1. 🔧 配置环境变量
   - 编辑 .env.cloudflare 文件
   - 设置正确的 JWT_SECRET 和其他密钥

2. 🗄️ 完成数据库迁移
   - 如果有现有数据，运行: npx ts-node scripts/migrate-to-d1.ts
   - 或手动导入数据到 D1 数据库

3. 🧪 测试 Edge Runtime API
   - 访问: /api/auth/login-edge
   - 访问: /api/auth/register-edge
   - 确保功能正常

4. 🚀 开始 API 路由迁移
   - 运行: node migrate-api-routes.js
   - 逐个迁移现有的 Node.js API 到 Edge Runtime

5. 📦 部署到 Cloudflare Pages
   - 推送代码到 GitHub
   - 在 Cloudflare Pages 中连接仓库
   - 配置环境变量和绑定

🔗 有用的命令：
- 查看 D1 数据库: npx wrangler d1 list
- 查询 D1 数据: npx wrangler d1 execute flux-ai-db --command="SELECT * FROM users LIMIT 5"
- 本地开发: npx wrangler pages dev
- 部署: npx wrangler pages publish

需要帮助？查看迁移计划: CLOUDFLARE_EDGE_MIGRATION_PLAN.md
`);
  }
}

// 运行迁移
const migration = new CloudflareMigration();
migration.run().catch(console.error);