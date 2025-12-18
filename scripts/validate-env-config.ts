#!/usr/bin/env node

/**
 * 环境配置验证 CLI 工具
 * Environment Configuration Validation CLI Tool
 */

// Load environment variables from .env files
import * as fs from 'fs';
import * as path from 'path';

// Load .env files manually since we're not in Next.js context
function loadEnvFiles() {
  const envFiles = ['.env.local', '.env.development', '.env'];
  
  for (const envFile of envFiles) {
    const envPath = path.resolve(envFile);
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8');
      const lines = content.split('\n');
      
      for (const line of lines) {
        const trimmedLine = line.trim();
        if (trimmedLine && !trimmedLine.startsWith('#')) {
          const [key, ...valueParts] = trimmedLine.split('=');
          if (key && valueParts.length > 0) {
            const value = valueParts.join('=').replace(/^["']|["']$/g, '');
            if (!process.env[key.trim()]) {
              process.env[key.trim()] = value;
            }
          }
        }
      }
    }
  }
}

// Load environment variables before importing other modules
loadEnvFiles();

import { EnvConfigValidator } from '../utils/envConfig';

interface CliOptions {
  verbose?: boolean;
  fix?: boolean;
  environment?: 'development' | 'production' | 'test';
  output?: string;
}

class EnvConfigCli {
  private validator: EnvConfigValidator;
  private options: CliOptions;
  
  constructor(options: CliOptions = {}) {
    this.validator = new EnvConfigValidator();
    this.options = options;
  }
  
  /**
   * 运行配置验证
   */
  public async run(): Promise<void> {
    console.log('🔍 Validating environment configuration...\n');
    
    const validation = this.validator.validate();
    const report = this.validator.generateReport();
    
    // 输出报告
    console.log(report);
    
    // 保存报告到文件
    if (this.options.output) {
      await this.saveReport(report, this.options.output);
    }
    
    // 详细模式输出
    if (this.options.verbose) {
      this.printVerboseInfo();
    }
    
    // 自动修复模式
    if (this.options.fix) {
      await this.attemptAutoFix(validation);
    }
    
    // 退出码
    const hasErrors = validation.errors.some(e => e.severity === 'critical' || e.severity === 'error');
    process.exit(hasErrors ? 1 : 0);
  }
  
  /**
   * 打印详细信息
   */
  private printVerboseInfo(): void {
    console.log('\n=== Detailed Configuration ===');
    const config = this.validator.getConfig();
    
    Object.entries(config).forEach(([key, value]) => {
      if (value) {
        // 隐藏敏感信息
        const displayValue = this.maskSensitiveValue(key, value);
        console.log(`${key}: ${displayValue}`);
      } else {
        console.log(`${key}: <not set>`);
      }
    });
    
    console.log(`\nEnvironment: ${this.validator.getEnvironment()}`);
    console.log(`Is Production: ${this.validator.isProduction()}`);
    console.log(`Is Cloudflare: ${this.validator.isCloudflare()}`);
    console.log(`Is Edge Runtime: ${this.validator.isEdgeRuntime()}`);
  }
  
  /**
   * 隐藏敏感配置值
   */
  private maskSensitiveValue(key: string, value: string): string {
    const sensitiveKeys = [
      'JWT_SECRET',
      'GOOGLE_CLIENT_SECRET',
      'STRIPE_SECRET_KEY',
      'STRIPE_WEBHOOK_SECRET',
      'REPLICATE_API_TOKEN',
      'DATABASE_URL'
    ];
    
    if (sensitiveKeys.includes(key)) {
      return value.length > 8 ? 
        `${value.substring(0, 4)}...${value.substring(value.length - 4)}` : 
        '***';
    }
    
    return value;
  }
  
  /**
   * 保存报告到文件
   */
  private async saveReport(report: string, outputPath: string): Promise<void> {
    try {
      const fullPath = path.resolve(outputPath);
      await fs.promises.writeFile(fullPath, report, 'utf8');
      console.log(`📄 Report saved to: ${fullPath}`);
    } catch (error) {
      console.error(`❌ Failed to save report: ${error}`);
    }
  }
  
  /**
   * 尝试自动修复配置问题
   */
  private async attemptAutoFix(validation: any): Promise<void> {
    console.log('\n🔧 Attempting auto-fix...');
    
    const fixes: string[] = [];
    
    // 检查是否缺少 .env.example
    if (!fs.existsSync('.env.example')) {
      await this.createEnvExample();
      fixes.push('Created .env.example template');
    }
    
    // 检查是否缺少 .env.local
    if (!fs.existsSync('.env.local') && this.validator.isDevelopment()) {
      await this.createEnvLocal();
      fixes.push('Created .env.local template');
    }
    
    // 生成 JWT_SECRET
    if (!this.validator.hasConfig('JWT_SECRET')) {
      const jwtSecret = await this.generateJwtSecret();
      fixes.push(`Generated JWT_SECRET: ${jwtSecret.substring(0, 8)}...`);
    }
    
    if (fixes.length > 0) {
      console.log('\n✅ Auto-fixes applied:');
      fixes.forEach(fix => console.log(`  - ${fix}`));
      console.log('\n⚠️  Please review and update the generated files with your actual values.');
    } else {
      console.log('No auto-fixes available. Please review the errors and warnings above.');
    }
  }
  
  /**
   * 创建 .env.example 模板
   */
  private async createEnvExample(): Promise<void> {
    const template = `# 数据库配置
DATABASE_URL="your-database-url"

# JWT 密钥
JWT_SECRET="your-jwt-secret-key"

# API 配置
NEXT_PUBLIC_API_URL="http://localhost:3000"
NEXT_PUBLIC_BASE_URL="http://localhost:3000"
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Google OAuth 配置
NEXT_PUBLIC_GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
GOOGLE_REDIRECT_URI="http://localhost:3000/api/auth/google/callback"

# Stripe 配置
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="your-stripe-publishable-key"
STRIPE_SECRET_KEY="your-stripe-secret-key"
STRIPE_WEBHOOK_SECRET="your-stripe-webhook-secret"
NEXT_PUBLIC_STRIPE_BASIC_PRICE_ID="your-basic-price-id"
NEXT_PUBLIC_STRIPE_PRO_MONTH_PRICE_ID="your-pro-month-price-id"
NEXT_PUBLIC_STRIPE_PRO_YEAR_PRICE_ID="your-pro-year-price-id"

# Replicate API
REPLICATE_API_TOKEN="your-replicate-api-token"

# 管理员配置
ADMIN_USER_IDS="admin1,admin2,admin3"

# 环境配置
NODE_ENV="development"
NEXT_TELEMETRY_DISABLED=1
`;
    
    await fs.promises.writeFile('.env.example', template, 'utf8');
  }
  
  /**
   * 创建 .env.local 模板
   */
  private async createEnvLocal(): Promise<void> {
    const jwtSecret = this.generateRandomString(32);
    
    const template = `# 本地开发环境配置
# Local Development Environment Configuration

# JWT 密钥 (自动生成)
JWT_SECRET="${jwtSecret}"

# API 配置
NEXT_PUBLIC_API_URL="http://localhost:3000"
NEXT_PUBLIC_BASE_URL="http://localhost:3000"
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# 禁用遥测
NEXT_TELEMETRY_DISABLED=1

# 环境标识
NODE_ENV="development"

# 请添加您的实际配置值:
# NEXT_PUBLIC_GOOGLE_CLIENT_ID="your-google-client-id"
# GOOGLE_CLIENT_SECRET="your-google-client-secret"
# GOOGLE_REDIRECT_URI="http://localhost:3000/api/auth/google/callback"
# REPLICATE_API_TOKEN="your-replicate-api-token"
`;
    
    await fs.promises.writeFile('.env.local', template, 'utf8');
  }
  
  /**
   * 生成 JWT 密钥
   */
  private async generateJwtSecret(): Promise<string> {
    const secret = this.generateRandomString(32);
    
    // 尝试添加到 .env.local
    try {
      const envPath = '.env.local';
      let content = '';
      
      if (fs.existsSync(envPath)) {
        content = await fs.promises.readFile(envPath, 'utf8');
      }
      
      if (!content.includes('JWT_SECRET=')) {
        content += `\n# JWT 密钥 (自动生成)\nJWT_SECRET="${secret}"\n`;
        await fs.promises.writeFile(envPath, content, 'utf8');
      }
    } catch (error) {
      console.warn(`Warning: Could not update .env.local: ${error}`);
    }
    
    return secret;
  }
  
  /**
   * 生成随机字符串
   */
  private generateRandomString(length: number): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
    let result = '';
    
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    return result;
  }
  
  /**
   * 打印使用帮助
   */
  public static printHelp(): void {
    console.log(`
Environment Configuration Validator

Usage: npm run validate-env [options]

Options:
  --verbose, -v     Show detailed configuration information
  --fix, -f         Attempt to auto-fix common issues
  --output, -o      Save report to file
  --help, -h        Show this help message

Examples:
  npm run validate-env
  npm run validate-env --verbose
  npm run validate-env --fix
  npm run validate-env --output config-report.txt
`);
  }
}

// CLI 入口点
async function main() {
  const args = process.argv.slice(2);
  const options: CliOptions = {};
  
  // 解析命令行参数
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    switch (arg) {
      case '--verbose':
      case '-v':
        options.verbose = true;
        break;
      case '--fix':
      case '-f':
        options.fix = true;
        break;
      case '--output':
      case '-o':
        options.output = args[++i];
        break;
      case '--help':
      case '-h':
        EnvConfigCli.printHelp();
        process.exit(0);
        break;
      default:
        console.error(`Unknown option: ${arg}`);
        EnvConfigCli.printHelp();
        process.exit(1);
    }
  }
  
  const cli = new EnvConfigCli(options);
  await cli.run();
}

// 运行 CLI
if (require.main === module) {
  main().catch(error => {
    console.error('❌ CLI Error:', error);
    process.exit(1);
  });
}

export { EnvConfigCli };