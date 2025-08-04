// 点数系统工具类
import { verifyJWT } from '@/utils/auth';
import { getUserPoints, updateUserPoints } from '@/utils/userUtils';
import ToolsConfigManager from '@/config/tools';

// 保持向后兼容的类型定义
export type ModelType = string;
export type FeatureType = string;

// 点数验证结果接口
export interface PointsValidationResult {
  success: boolean;
  error?: string;
  userPoints?: number;
  requiredPoints?: number;
}

// 点数消费结果接口
export interface PointsConsumptionResult {
  success: boolean;
  error?: string;
  remainingPoints?: number;
  consumedPoints?: number;
}

/**
 * 验证用户登录状态和点数
 */
export async function validateUserAndPoints(
  token: string | undefined,
  requiredPoints: number
): Promise<PointsValidationResult> {
  // 检查是否提供了token
  if (!token) {
    return {
      success: false,
      error: 'LOGIN_REQUIRED',
    };
  }

  try {
    // 验证JWT token
    const decoded = await verifyJWT(token, process.env.JWT_SECRET!);
    const userId = decoded.userId || decoded.id;

    if (!userId) {
      return {
        success: false,
        error: 'INVALID_TOKEN',
      };
    }

    // 获取用户点数
    const userPoints = await getUserPoints(parseInt(userId));
    
    if (userPoints === null) {
      return {
        success: false,
        error: 'FAILED_TO_GET_POINTS',
      };
    }

    // 检查点数是否足够
    if (userPoints < requiredPoints) {
      return {
        success: false,
        error: 'INSUFFICIENT_POINTS',
        userPoints,
        requiredPoints,
      };
    }

    return {
      success: true,
      userPoints,
      requiredPoints,
    };

  } catch (error) {
    console.error('Token validation error:', error);
    return {
      success: false,
      error: 'INVALID_TOKEN',
    };
  }
}

/**
 * 消费用户点数
 */
export async function consumeUserPoints(
  token: string,
  pointsToConsume: number
): Promise<PointsConsumptionResult> {
  try {
    // 验证JWT token
    const decoded = await verifyJWT(token, process.env.JWT_SECRET!);
    const userId = decoded.userId || decoded.id;

    if (!userId) {
      return {
        success: false,
        error: 'INVALID_TOKEN',
      };
    }

    // 获取当前用户点数
    const currentPoints = await getUserPoints(parseInt(userId));
    
    if (currentPoints === null) {
      return {
        success: false,
        error: 'FAILED_TO_GET_POINTS',
      };
    }

    // 检查点数是否足够
    if (currentPoints < pointsToConsume) {
      return {
        success: false,
        error: 'INSUFFICIENT_POINTS',
      };
    }

    // 计算剩余点数
    const remainingPoints = currentPoints - pointsToConsume;

    // 更新用户点数
    const updateSuccess = await updateUserPoints(parseInt(userId), remainingPoints);
    
    if (!updateSuccess) {
      return {
        success: false,
        error: 'FAILED_TO_UPDATE_POINTS',
      };
    }

    return {
      success: true,
      remainingPoints,
      consumedPoints: pointsToConsume,
    };

  } catch (error) {
    console.error('Points consumption error:', error);
    return {
      success: false,
      error: 'CONSUMPTION_FAILED',
    };
  }
}

/**
 * 获取工具所需点数（统一接口）
 */
export function getToolPoints(toolId: string): number {
  return ToolsConfigManager.getToolPoints(toolId);
}

/**
 * 获取模型所需点数（向后兼容）
 */
export function getModelPoints(modelType: string): number {
  return ToolsConfigManager.getToolPoints(modelType);
}

/**
 * 获取功能所需点数（向后兼容）
 */
export function getFeaturePoints(featureType: string): number {
  return ToolsConfigManager.getToolPoints(featureType);
}

/**
 * 检查工具是否免费
 */
export function isToolFree(toolId: string): boolean {
  return ToolsConfigManager.isToolFree(toolId);
}

/**
 * 检查工具是否启用
 */
export function isToolEnabled(toolId: string): boolean {
  return ToolsConfigManager.isToolEnabled(toolId);
}

/**
 * 验证工具使用权限
 */
export function validateToolAccess(toolId: string, isAuthenticated: boolean): {
  canUse: boolean;
  reason?: string;
} {
  const tool = ToolsConfigManager.getToolConfig(toolId);
  
  if (!tool) {
    return { canUse: false, reason: 'TOOL_NOT_FOUND' };
  }
  
  if (!tool.isEnabled) {
    return { canUse: false, reason: 'TOOL_DISABLED' };
  }
  
  if (tool.requiresAuth && !isAuthenticated) {
    return { canUse: false, reason: 'LOGIN_REQUIRED' };
  }
  
  return { canUse: true };
}

/**
 * 验证并消费点数（一步完成）
 */
export async function validateAndConsumePoints(
  token: string | undefined,
  requiredPoints: number
): Promise<PointsConsumptionResult> {
  // 首先验证用户和点数
  const validation = await validateUserAndPoints(token, requiredPoints);
  
  if (!validation.success) {
    return {
      success: false,
      error: validation.error,
    };
  }

  // 如果验证通过，消费点数
  return await consumeUserPoints(token!, requiredPoints);
}

/**
 * 获取错误消息的多语言版本
 */
export function getPointsErrorMessage(error: string, locale: string = 'en'): string {
  const messages: Record<string, Record<string, string>> = {
    en: {
      LOGIN_REQUIRED: 'Please login to use this feature',
      INVALID_TOKEN: 'Invalid authentication token',
      INSUFFICIENT_POINTS: 'Insufficient points. Please purchase more points.',
      FAILED_TO_GET_POINTS: 'Failed to retrieve user points',
      FAILED_TO_UPDATE_POINTS: 'Failed to update user points',
      CONSUMPTION_FAILED: 'Points consumption failed',
    },
    zh: {
      LOGIN_REQUIRED: '请登录后使用此功能',
      INVALID_TOKEN: '无效的认证令牌',
      INSUFFICIENT_POINTS: '点数不足，请购买更多点数',
      FAILED_TO_GET_POINTS: '获取用户点数失败',
      FAILED_TO_UPDATE_POINTS: '更新用户点数失败',
      CONSUMPTION_FAILED: '点数消费失败',
    },
  };

  return messages[locale]?.[error] || messages.en[error] || 'Unknown error';
}

/**
 * 检查用户是否有足够的点数（不消费）
 */
export async function checkUserPoints(
  token: string | undefined,
  requiredPoints: number
): Promise<PointsValidationResult> {
  return await validateUserAndPoints(token, requiredPoints);
}