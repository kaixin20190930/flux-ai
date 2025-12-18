// React Hook for tools configuration
import { useState, useEffect, useMemo } from 'react';
import ToolsConfigManager, { ToolConfig, ToolCategory } from '@/config/tools';
import ToolUsageManager, { UserToolUsage } from '@/utils/toolUsage';
import { getToolPoints, isToolFree, validateToolAccess } from '@/utils/pointsSystem';

export interface UseToolsOptions {
  category?: ToolCategory;
  enabledOnly?: boolean;
  freeOnly?: boolean;
  searchQuery?: string;
}

export interface ToolWithUsage extends ToolConfig {
  userUsage?: UserToolUsage;
  canUse: boolean;
  usageReason?: string;
}

/**
 * Hook for managing tools configuration and usage
 */
export function useTools(options: UseToolsOptions = {}) {
  const [tools, setTools] = useState<ToolConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [userUsage, setUserUsage] = useState<UserToolUsage[]>([]);

  // Get filtered tools based on options
  const filteredTools = useMemo(() => {
    let result = ToolsConfigManager.getAllTools();

    if (options.category) {
      result = result.filter(tool => tool.category === options.category);
    }

    if (options.enabledOnly) {
      result = result.filter(tool => tool.isEnabled);
    }

    if (options.freeOnly) {
      result = result.filter(tool => tool.isFree);
    }

    if (options.searchQuery) {
      const query = options.searchQuery.toLowerCase();
      result = result.filter(tool => 
        tool.name.toLowerCase().includes(query) ||
        tool.description.toLowerCase().includes(query) ||
        tool.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    return result;
  }, [options]);

  // Load user usage data
  useEffect(() => {
    const loadUserUsage = async () => {
      try {
        // This would typically get userId from auth context
        const userId = 'current-user-id'; // Replace with actual user ID
        const usage = await ToolUsageManager.getUserToolUsage(userId);
        setUserUsage(usage);
      } catch (error) {
        console.error('Failed to load user usage:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUserUsage();
  }, []);

  // Combine tools with usage data
  const toolsWithUsage: ToolWithUsage[] = useMemo(() => {
    return filteredTools.map(tool => {
      const usage = userUsage.find(u => u.toolId === tool.id);
      const accessCheck = validateToolAccess(tool.id, true); // Assume authenticated for now
      
      return {
        ...tool,
        userUsage: usage,
        canUse: accessCheck.canUse,
        usageReason: accessCheck.reason
      };
    });
  }, [filteredTools, userUsage]);

  return {
    tools: toolsWithUsage,
    loading,
    refresh: () => {
      setLoading(true);
      // Reload data
    }
  };
}

/**
 * Hook for a specific tool
 */
export function useTool(toolId: string) {
  const [tool, setTool] = useState<ToolConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [userUsage, setUserUsage] = useState<UserToolUsage | null>(null);
  const [dailyUsage, setDailyUsage] = useState({ current: 0, limit: -1 });

  useEffect(() => {
    const loadTool = async () => {
      try {
        const toolConfig = ToolsConfigManager.getToolConfig(toolId);
        setTool(toolConfig);

        if (toolConfig) {
          // Load user usage for this tool
          const userId = 'current-user-id'; // Replace with actual user ID
          const usage = await ToolUsageManager.getUserToolUsage(userId, toolId);
          setUserUsage(usage[0] || null);

          // Check daily usage limit
          const dailyCheck = await ToolUsageManager.checkDailyLimit(userId, toolId);
          setDailyUsage({
            current: dailyCheck.currentUsage,
            limit: dailyCheck.limit
          });
        }
      } catch (error) {
        console.error('Failed to load tool:', error);
      } finally {
        setLoading(false);
      }
    };

    loadTool();
  }, [toolId]);

  const canUse = useMemo(() => {
    if (!tool) return false;
    
    const accessCheck = validateToolAccess(toolId, true);
    if (!accessCheck.canUse) return false;

    // Check daily limit
    if (dailyUsage.limit > 0 && dailyUsage.current >= dailyUsage.limit) {
      return false;
    }

    return true;
  }, [tool, toolId, dailyUsage]);

  const getUsageTips = () => {
    return ToolUsageManager.getUsageTips(toolId);
  };

  const validateFile = (fileName: string, fileSizeInBytes: number) => {
    return ToolUsageManager.validateFile(toolId, fileName, fileSizeInBytes);
  };

  const getEstimatedTime = (inputSize?: number) => {
    return ToolUsageManager.getEstimatedProcessingTime(toolId, inputSize);
  };

  return {
    tool,
    loading,
    userUsage,
    dailyUsage,
    canUse,
    pointsCost: tool ? getToolPoints(toolId) : 0,
    isFree: tool ? isToolFree(toolId) : false,
    getUsageTips,
    validateFile,
    getEstimatedTime
  };
}

/**
 * Hook for tools by category
 */
export function useToolsByCategory(category: ToolCategory) {
  return useTools({ category, enabledOnly: true });
}

/**
 * Hook for free tools
 */
export function useFreeTools() {
  return useTools({ freeOnly: true, enabledOnly: true });
}

/**
 * Hook for tool search
 */
export function useToolSearch(query: string) {
  return useTools({ searchQuery: query, enabledOnly: true });
}

/**
 * Hook for popular tools
 */
export function usePopularTools(limit: number = 10) {
  const [popularTools, setPopularTools] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPopularTools = async () => {
      try {
        const tools = await ToolUsageManager.getPopularTools(limit);
        setPopularTools(tools);
      } catch (error) {
        console.error('Failed to load popular tools:', error);
      } finally {
        setLoading(false);
      }
    };

    loadPopularTools();
  }, [limit]);

  return { popularTools, loading };
}

/**
 * Hook for tool recommendations
 */
export function useToolRecommendations() {
  const [recommendations, setRecommendations] = useState<{
    recommendedTools: ToolConfig[];
    reasons: string[];
  }>({ recommendedTools: [], reasons: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadRecommendations = async () => {
      try {
        const userId = 'current-user-id'; // Replace with actual user ID
        const recs = await ToolUsageManager.getUsageRecommendations(userId);
        setRecommendations(recs);
      } catch (error) {
        console.error('Failed to load recommendations:', error);
      } finally {
        setLoading(false);
      }
    };

    loadRecommendations();
  }, []);

  return { ...recommendations, loading };
}