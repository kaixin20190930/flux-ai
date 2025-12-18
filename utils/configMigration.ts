/**
 * 配置迁移工具
 * Configuration Migration Utility
 * 
 * 帮助用户从旧的配置模式迁移到新的统一配置系统
 * Helps users migrate from old configuration patterns to the new unified system
 */

import * as fs from 'fs';
import * as path from 'path';
import { configHelper } from './configHelper';

export interface MigrationResult {
  success: boolean;
  changes: ConfigChange[];
  warnings: string[];
  errors: string[];
}

export interface ConfigChange {
  type: 'add' | 'update' | 'remove' | 'rename';
  key: string;
  oldValue?: string;
  newValue?: string;
  reason: string;
}

export class ConfigMigration {
  private projectRoot: string;
  
  constructor(projectRoot: string = process.cwd()) {
    this.projectRoot = projectRoot;
  }
  
  /**
   * 执行配置迁移
   */
  public async migrate(): Promise<MigrationResult> {
    const result: MigrationResult = {
      success: true,
      changes: [],
      warnings: [],
      errors: []
    };
    
    try {
      // 1. 检查并迁移环境文件
      await this.migrateEnvFiles(result);
      
      // 2. 更新代码中的配置使用
      await this.migrateCodeUsage(result);
      
      // 3. 验证迁移结果
      await this.validateMigration(result);
      
    } catch (error) {
      result.success = false;
      result.errors.push(`Migration failed: ${error}`);
    }
    
    return result;
  }
  
  /**
   * 迁移环境文件
   */
  private async migrateEnvFiles(result: MigrationResult): Promise<void> {
    const envFiles = ['.env.local', '.env.development', '.env.production'];
    
    for (const envFile of envFiles) {
      const filePath = path.join(this.projectRoot, envFile);
      
      if (fs.existsSync(filePath)) {
        await this.migrateEnvFile(filePath, result);
      }
    }
    
    // 确保 .env.example 是最新的
    await this.updateEnvExample(result);
  }
  
  /**
   * 迁移单个环境文件
   */
  private async migrateEnvFile(filePath: string, result: MigrationResult): Promise<void> {
    try {
      const content = await fs.promises.readFile(filePath, 'utf8');
      const lines = content.split('\n');
      const updatedLines: string[] = [];
      let hasChanges = false;
      
      for (const line of lines) {
        const trimmedLine = line.trim();
        
        // 跳过注释和空行
        if (!trimmedLine || trimmedLine.startsWith('#')) {
          updatedLines.push(line);
          continue;
        }
        
        // 解析键值对
        const [key, ...valueParts] = trimmedLine.split('=');
        const value = valueParts.join('=');
        
        if (key && value !== undefined) {
          const migrated = this.migrateConfigKey(key.trim(), value.trim());
          
          if (migrated.key !== key.trim() || migrated.value !== value.trim()) {
            hasChanges = true;
            
            result.changes.push({
              type: migrated.key !== key.trim() ? 'rename' : 'update',
              key: key.trim(),
              oldValue: value.trim(),
              newValue: migrated.value,
              reason: migrated.reason
            });
            
            if (migrated.key !== key.trim()) {
              updatedLines.push(`${migrated.key}=${migrated.value}`);
            } else {
              updatedLines.push(`${migrated.key}=${migrated.value}`);
            }
          } else {
            updatedLines.push(line);
          }
        } else {
          updatedLines.push(line);
        }
      }
      
      // 添加缺失的配置项
      const missingConfigs = this.getMissingConfigs(content);
      if (missingConfigs.length > 0) {
        hasChanges = true;
        updatedLines.push('');
        updatedLines.push('# 新增的配置项 (Added configurations)');
        
        for (const config of missingConfigs) {
          updatedLines.push(`${config.key}=${config.value}`);
          result.changes.push({
            type: 'add',
            key: config.key,
            newValue: config.value,
            reason: config.reason
          });
        }
      }
      
      // 保存更新后的文件
      if (hasChanges) {
        const backupPath = `${filePath}.backup.${Date.now()}`;
        await fs.promises.copyFile(filePath, backupPath);
        await fs.promises.writeFile(filePath, updatedLines.join('\n'), 'utf8');
        
        result.warnings.push(`Backed up original ${path.basename(filePath)} to ${path.basename(backupPath)}`);
      }
      
    } catch (error) {
      result.errors.push(`Failed to migrate ${filePath}: ${error}`);
    }
  }
  
  /**
   * 迁移配置键值对
   */
  private migrateConfigKey(key: string, value: string): { key: string; value: string; reason: string } {
    // 配置键重命名映射
    const keyMappings: Record<string, string> = {
      'NEXTAUTH_URL': 'NEXT_PUBLIC_APP_URL',
      'NEXTAUTH_SECRET': 'JWT_SECRET',
      'DATABASE_URL_LOCAL': 'DATABASE_URL',
      'API_BASE_URL': 'NEXT_PUBLIC_API_URL'
    };
    
    // 检查是否需要重命名
    if (keyMappings[key]) {
      return {
        key: keyMappings[key],
        value: value,
        reason: `Renamed ${key} to ${keyMappings[key]} for consistency`
      };
    }
    
    // 值格式迁移
    switch (key) {
      case 'JWT_SECRET':
        if (value.length < 32) {
          return {
            key: key,
            value: this.generateSecureSecret(),
            reason: 'Generated new secure JWT secret (old one was too short)'
          };
        }
        break;
        
      case 'NEXT_PUBLIC_APP_URL':
      case 'NEXT_PUBLIC_BASE_URL':
      case 'NEXT_PUBLIC_API_URL':
        if (value && !value.startsWith('http')) {
          return {
            key: key,
            value: `https://${value}`,
            reason: 'Added https:// protocol to URL'
          };
        }
        break;
        
      case 'ADMIN_USER_IDS':
        // 确保管理员ID格式正确
        const cleanIds = value.split(',').map(id => id.trim()).filter(id => id.length > 0);
        if (cleanIds.join(',') !== value) {
          return {
            key: key,
            value: cleanIds.join(','),
            reason: 'Cleaned up admin user IDs format'
          };
        }
        break;
    }
    
    return { key, value, reason: '' };
  }
  
  /**
   * 获取缺失的配置项
   */
  private getMissingConfigs(content: string): Array<{ key: string; value: string; reason: string }> {
    const missing: Array<{ key: string; value: string; reason: string }> = [];
    
    // 检查必需的配置项
    const requiredConfigs = [
      {
        key: 'NEXT_TELEMETRY_DISABLED',
        value: '1',
        reason: 'Disable Next.js telemetry for privacy'
      }
    ];
    
    for (const config of requiredConfigs) {
      if (!content.includes(`${config.key}=`)) {
        missing.push(config);
      }
    }
    
    return missing;
  }
  
  /**
   * 更新 .env.example 文件
   */
  private async updateEnvExample(result: MigrationResult): Promise<void> {
    const examplePath = path.join(this.projectRoot, '.env.example');
    
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

# Cloudflare 特定配置 (仅生产环境)
# CF_PAGES=1
# EDGE_RUNTIME=1
`;
    
    try {
      await fs.promises.writeFile(examplePath, template, 'utf8');
      result.changes.push({
        type: 'update',
        key: '.env.example',
        reason: 'Updated .env.example with latest configuration template'
      });
    } catch (error) {
      result.errors.push(`Failed to update .env.example: ${error}`);
    }
  }
  
  /**
   * 迁移代码中的配置使用
   */
  private async migrateCodeUsage(result: MigrationResult): Promise<void> {
    // 这里可以添加代码迁移逻辑，比如：
    // 1. 扫描代码中直接使用 process.env 的地方
    // 2. 建议使用 configHelper 替代
    // 3. 更新导入语句等
    
    result.warnings.push('Code migration is not implemented yet. Please manually update code to use configHelper.');
  }
  
  /**
   * 验证迁移结果
   */
  private async validateMigration(result: MigrationResult): Promise<void> {
    try {
      // 重新加载配置
      configHelper.refresh();
      
      // 验证配置
      const isValid = configHelper.validate();
      
      if (!isValid) {
        const report = configHelper.getValidationReport();
        result.warnings.push('Configuration validation failed after migration:');
        result.warnings.push(report);
      } else {
        result.warnings.push('✅ Configuration validation passed after migration');
      }
      
    } catch (error) {
      result.errors.push(`Failed to validate migration: ${error}`);
    }
  }
  
  /**
   * 生成安全的密钥
   */
  private generateSecureSecret(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
    let result = '';
    
    for (let i = 0; i < 44; i++) { // Base64 编码的 32 字节
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    return result;
  }
  
  /**
   * 生成迁移报告
   */
  public generateMigrationReport(result: MigrationResult): string {
    const lines: string[] = [];
    
    lines.push('=== Configuration Migration Report ===');
    lines.push(`Status: ${result.success ? '✅ SUCCESS' : '❌ FAILED'}`);
    lines.push(`Changes: ${result.changes.length}`);
    lines.push(`Warnings: ${result.warnings.length}`);
    lines.push(`Errors: ${result.errors.length}`);
    lines.push('');
    
    if (result.changes.length > 0) {
      lines.push('📝 CHANGES:');
      result.changes.forEach(change => {
        lines.push(`  ${change.type.toUpperCase()}: ${change.key}`);
        if (change.oldValue && change.newValue) {
          lines.push(`    ${change.oldValue} → ${change.newValue}`);
        } else if (change.newValue) {
          lines.push(`    Added: ${change.newValue}`);
        }
        if (change.reason) {
          lines.push(`    Reason: ${change.reason}`);
        }
      });
      lines.push('');
    }
    
    if (result.warnings.length > 0) {
      lines.push('⚠️  WARNINGS:');
      result.warnings.forEach(warning => {
        lines.push(`  ${warning}`);
      });
      lines.push('');
    }
    
    if (result.errors.length > 0) {
      lines.push('🚨 ERRORS:');
      result.errors.forEach(error => {
        lines.push(`  ${error}`);
      });
      lines.push('');
    }
    
    return lines.join('\n');
  }
}

// 导出便捷函数
export async function migrateConfig(projectRoot?: string): Promise<MigrationResult> {
  const migration = new ConfigMigration(projectRoot);
  return await migration.migrate();
}