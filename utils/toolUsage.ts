// 工具使用记录和统计系统
import ToolsConfigManager, { type ToolConfig } from '@/config/tools';

export interface ToolUsageRecord {
  id: string;
  userId: string;
  toolId: string;
  pointsConsumed: number;
  timestamp: Date;
  success: boolean;
  errorMessage?: string;
  processingTime?: number; // 处理时间（毫秒）
  inputSize?: number; // 输入文件大小（字节）
  outputSize?: number; // 输出文件大小（字节）
  metadata?: Record<string, any>; // 额外的元数据
}

export interface ToolUsageStats {
  toolId: string;
  totalUsage: number;
  successfulUsage: number;
  failedUsage: number;
  totalPointsConsumed: number;
  averageProcessingTime: number;
  lastUsed: Date;
  dailyUsage: number;
  weeklyUsage: number;
  monthlyUsage: number;
}

export interface UserToolUsage {
  userId: string;
  toolId: string;
  dailyUsage: number;
  weeklyUsage: number;
  monthlyUsage: number;
  totalUsage: number;
  totalPointsSpent: number;
  lastUsed: Date;
  averageProcessingTime: number;
}

/**
 * 工具使用管理类
 */
export class ToolUsageManager {
  /**
   * 记录工具使用
   */
  static async recordUsage(record: Omit<ToolUsageRecord, 'id' | 'timestamp'>): Promise<void> {
    const usageRecord: ToolUsageRecord = {
      ...record,
      id: this.generateId(),
      timestamp: new Date()
    };

    // 这里应该保存到数据库
    // await saveToDatabase('tool_usage', usageRecord);
    console.log('Tool usage recorded:', usageRecord);
  }

  /**
   * 检查用户每日使用限制
   */
  static async checkDailyLimit(userId: string, toolId: string): Promise<{
    canUse: boolean;
    currentUsage: number;
    limit: number;
  }> {
    const tool = ToolsConfigManager.getToolConfig(toolId);
    if (!tool || !tool.maxUsagePerDay) {
      return { canUse: true, currentUsage: 0, limit: -1 };
    }

    // 这里应该从数据库查询今日使用次数
    const currentUsage = await this.getDailyUsage(userId, toolId);
    
    return {
      canUse: currentUsage < tool.maxUsagePerDay,
      currentUsage,
      limit: tool.maxUsagePerDay
    };
  }

  /**
   * 获取用户今日使用次数
   */
  static async getDailyUsage(userId: string, toolId: string): Promise<number> {
    // 这里应该从数据库查询
    // const today = new Date().toISOString().split('T')[0];
    // return await countUsageByDate(userId, toolId, today);
    return 0; // 临时返回
  }

  /**
   * 获取工具统计信息
   */
  static async getToolStats(toolId: string): Promise<ToolUsageStats | null> {
    // 这里应该从数据库查询统计信息
    return null; // 临时返回
  }

  /**
   * 获取用户工具使用统计
   */
  static async getUserToolUsage(userId: string, toolId?: string): Promise<UserToolUsage[]> {
    // 这里应该从数据库查询用户使用统计
    return []; // 临时返回
  }

  /**
   * 获取热门工具排行
   */
  static async getPopularTools(limit: number = 10): Promise<{
    toolId: string;
    toolName: string;
    usageCount: number;
    tool: ToolConfig;
  }[]> {
    // 这里应该从数据库查询热门工具
    const allTools = ToolsConfigManager.getAllTools();
    return allTools.slice(0, limit).map(tool => ({
      toolId: tool.id,
      toolName: tool.name,
      usageCount: 0, // 临时数据
      tool
    }));
  }

  /**
   * 验证文件格式和大小
   */
  static validateFile(toolId: string, fileName: string, fileSizeInBytes: number): {
    valid: boolean;
    error?: string;
  } {
    const tool = ToolsConfigManager.getToolConfig(toolId);
    if (!tool) {
      return { valid: false, error: 'Tool not found' };
    }

    // 检查文件格式
    if (tool.supportedFormats) {
      const fileExtension = fileName.split('.').pop()?.toLowerCase();
      if (!fileExtension || !ToolsConfigManager.isFormatSupported(toolId, fileExtension)) {
        return { 
          valid: false, 
          error: `Unsupported format. Supported formats: ${tool.supportedFormats.join(', ')}` 
        };
      }
    }

    // 检查文件大小
    const fileSizeInMB = fileSizeInBytes / (1024 * 1024);
    if (!ToolsConfigManager.isFileSizeValid(toolId, fileSizeInMB)) {
      return { 
        valid: false, 
        error: `File too large. Maximum size: ${tool.maxFileSize}MB` 
      };
    }

    return { valid: true };
  }

  /**
   * 获取工具使用建议
   */
  static getUsageRecommendations(userId: string): Promise<{
    recommendedTools: ToolConfig[];
    reasons: string[];
  }> {
    // 基于用户使用历史推荐工具
    const freeTools = ToolsConfigManager.getFreeTools();
    const popularTools = ToolsConfigManager.getToolsByCategory(ToolsConfigManager.getAllTools()[0].category);
    
    return Promise.resolve({
      recommendedTools: [...freeTools, ...popularTools].slice(0, 5),
      reasons: ['Free to use', 'Popular among users', 'High success rate']
    });
  }

  /**
   * 生成唯一ID
   */
  private static generateId(): string {
    return `usage_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 计算预估处理时间
   */
  static getEstimatedProcessingTime(toolId: string, inputSize?: number): number {
    const tool = ToolsConfigManager.getToolConfig(toolId);
    if (!tool) return 0;

    let baseTime = tool.estimatedProcessingTime || 5;
    
    // 根据文件大小调整处理时间
    if (inputSize && inputSize > 1024 * 1024) { // 大于1MB
      const sizeFactor = Math.log(inputSize / (1024 * 1024)) + 1;
      baseTime *= sizeFactor;
    }

    return Math.round(baseTime);
  }

  /**
   * 获取工具使用提示
   */
  static getUsageTips(toolId: string): string[] {
    const tool = ToolsConfigManager.getToolConfig(toolId);
    if (!tool) return [];

    const tips: string[] = [];

    if (tool.supportedFormats) {
      tips.push(`Supported formats: ${tool.supportedFormats.join(', ')}`);
    }

    if (tool.maxFileSize) {
      tips.push(`Maximum file size: ${tool.maxFileSize}MB`);
    }

    if (tool.maxUsagePerDay) {
      tips.push(`Daily usage limit: ${tool.maxUsagePerDay} times`);
    }

    if (tool.estimatedProcessingTime) {
      tips.push(`Estimated processing time: ${tool.estimatedProcessingTime} seconds`);
    }

    if (tool.limitations) {
      tips.push(...tool.limitations);
    }

    return tips;
  }
}

export default ToolUsageManager;