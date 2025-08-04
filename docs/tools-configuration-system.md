# 工具配置系统文档

## 概述

这个工具配置系统提供了一个统一的方式来管理所有AI工具的配置信息，包括点数消耗、是否收费、使用限制等。通过集中化的配置管理，可以轻松地添加新工具、修改现有工具的设置，而无需修改多个文件。

## 核心文件结构

```
config/
├── tools.ts                    # 工具配置文件（核心）
utils/
├── pointsSystem.ts             # 点数系统（已更新）
├── toolUsage.ts               # 工具使用记录和统计
hooks/
├── useTools.ts                # React Hooks for tools
components/
├── tools/
│   ├── ToolCard.tsx           # 工具卡片组件
│   ├── ToolsList.tsx          # 工具列表组件
├── admin/
│   ├── ToolsManagement.tsx    # 管理员工具管理界面
app/
├── tools/
│   ├── page.tsx               # 工具展示页面
├── api/
│   ├── image-search/
│   │   ├── route.ts           # API路由（已更新示例）
```

## 主要功能

### 1. 统一工具配置 (`config/tools.ts`)

所有工具的配置信息都集中在这个文件中：

```typescript
export interface ToolConfig {
  id: string;                    // 工具唯一标识
  name: string;                  // 工具名称
  nameKey: string;               // 国际化key
  description: string;           // 工具描述
  descriptionKey: string;        // 国际化key
  category: ToolCategory;        // 工具分类
  pointsCost: number;            // 点数消耗
  isFree: boolean;               // 是否免费
  isEnabled: boolean;            // 是否启用
  icon: string;                  // 图标
  route: string;                 // 前端路由
  apiEndpoint: string;           // API端点
  maxUsagePerDay?: number;       // 每日使用限制
  requiresAuth: boolean;         // 是否需要认证
  supportedFormats?: string[];   // 支持的文件格式
  maxFileSize?: number;          // 最大文件大小(MB)
  estimatedProcessingTime?: number; // 预估处理时间(秒)
  features: string[];            // 功能特性
  limitations?: string[];        // 使用限制
  tags: string[];               // 标签
}
```

### 2. 工具分类

```typescript
export enum ToolCategory {
  TEXT_TO_IMAGE = 'text-to-image',
  IMAGE_SEARCH = 'image-search',
  IMAGE_ANALYSIS = 'image-analysis',
  IMAGE_EDITING = 'image-editing',
  IMAGE_TO_VIDEO = 'image-to-video',
  VIDEO_PROCESSING = 'video-processing',
  BATCH_OPERATIONS = 'batch-operations',
  SOCIAL_SHARING = 'social-sharing'
}
```

### 3. 工具配置管理器

`ToolsConfigManager` 类提供了各种方法来访问和操作工具配置：

```typescript
// 获取工具配置
ToolsConfigManager.getToolConfig(toolId)

// 获取所有工具
ToolsConfigManager.getAllTools()

// 按分类获取工具
ToolsConfigManager.getToolsByCategory(category)

// 获取免费工具
ToolsConfigManager.getFreeTools()

// 搜索工具
ToolsConfigManager.searchToolsByName(name)
ToolsConfigManager.searchToolsByTag(tag)

// 验证文件
ToolsConfigManager.isFormatSupported(toolId, format)
ToolsConfigManager.isFileSizeValid(toolId, sizeInMB)
```

## 使用方法

### 1. 添加新工具

在 `config/tools.ts` 的 `TOOLS_CONFIG` 对象中添加新的工具配置：

```typescript
'new-tool-id': {
  id: 'new-tool-id',
  name: 'New AI Tool',
  nameKey: 'tools.new_tool.name',
  description: 'Description of the new tool',
  descriptionKey: 'tools.new_tool.description',
  category: ToolCategory.IMAGE_EDITING,
  pointsCost: 5,
  isFree: false,
  isEnabled: true,
  icon: '🆕',
  route: '/new-tool',
  apiEndpoint: '/api/new-tool',
  maxUsagePerDay: 20,
  requiresAuth: true,
  supportedFormats: ['jpg', 'png'],
  maxFileSize: 10,
  estimatedProcessingTime: 15,
  features: ['Feature 1', 'Feature 2'],
  tags: ['new', 'ai', 'editing']
}
```

### 2. 在API路由中使用

```typescript
import ToolsConfigManager from '@/config/tools';
import { getToolPoints, validateToolAccess } from '@/utils/pointsSystem';
import ToolUsageManager from '@/utils/toolUsage';

export async function POST(request: NextRequest) {
  const toolId = 'your-tool-id';
  
  // 获取工具配置
  const toolConfig = ToolsConfigManager.getToolConfig(toolId);
  if (!toolConfig || !toolConfig.isEnabled) {
    return NextResponse.json({ error: 'Tool not available' }, { status: 404 });
  }
  
  // 验证访问权限
  const accessCheck = validateToolAccess(toolId, isAuthenticated);
  if (!accessCheck.canUse) {
    return NextResponse.json({ error: accessCheck.reason }, { status: 403 });
  }
  
  // 检查每日限制
  const dailyCheck = await ToolUsageManager.checkDailyLimit(userId, toolId);
  if (!dailyCheck.canUse) {
    return NextResponse.json({ error: 'Daily limit exceeded' }, { status: 429 });
  }
  
  // 消费点数（如果不是免费工具）
  if (!toolConfig.isFree) {
    const pointsResult = await validateAndConsumePoints(token, getToolPoints(toolId));
    if (!pointsResult.success) {
      return NextResponse.json({ error: pointsResult.error }, { status: 402 });
    }
  }
  
  // 处理业务逻辑...
  
  // 记录使用情况
  await ToolUsageManager.recordUsage({
    userId,
    toolId,
    pointsConsumed: toolConfig.isFree ? 0 : toolConfig.pointsCost,
    success: true,
    processingTime: Date.now() - startTime
  });
}
```

### 3. 在React组件中使用

```typescript
import { useTool, useTools } from '@/hooks/useTools';
import ToolCard from '@/components/tools/ToolCard';

function MyComponent() {
  // 使用单个工具
  const { tool, canUse, pointsCost, validateFile } = useTool('flux-schnell');
  
  // 使用工具列表
  const { tools, loading } = useTools({ 
    category: ToolCategory.TEXT_TO_IMAGE,
    enabledOnly: true 
  });
  
  return (
    <div>
      {tools.map(tool => (
        <ToolCard key={tool.id} tool={tool} />
      ))}
    </div>
  );
}
```

### 4. 文件验证

```typescript
import ToolUsageManager from '@/utils/toolUsage';

const validation = ToolUsageManager.validateFile(
  'image-edit-canny',
  'image.jpg',
  1024 * 1024 * 5 // 5MB
);

if (!validation.valid) {
  console.error(validation.error);
}
```

## 管理界面

管理员可以通过 `ToolsManagement` 组件来管理工具配置：

- 启用/禁用工具
- 修改点数消耗
- 设置每日使用限制
- 更新工具描述
- 设置免费/付费状态

## 国际化支持

工具配置支持国际化，通过 `nameKey` 和 `descriptionKey` 字段：

```json
// app/i18n/locales/en.json
{
  "tools": {
    "flux_schnell": {
      "name": "Flux Schnell",
      "description": "Fast AI image generation"
    }
  }
}
```

## 数据库扩展

如果需要持久化工具使用记录，可以添加以下数据库表：

```sql
-- 工具使用记录表
CREATE TABLE tool_usage_records (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  tool_id TEXT NOT NULL,
  points_consumed INTEGER NOT NULL,
  success BOOLEAN NOT NULL,
  error_message TEXT,
  processing_time INTEGER,
  input_size INTEGER,
  output_size INTEGER,
  metadata TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 用户工具使用统计表
CREATE TABLE user_tool_usage_stats (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  tool_id TEXT NOT NULL,
  daily_usage INTEGER DEFAULT 0,
  weekly_usage INTEGER DEFAULT 0,
  monthly_usage INTEGER DEFAULT 0,
  total_usage INTEGER DEFAULT 0,
  total_points_spent INTEGER DEFAULT 0,
  last_used DATETIME,
  average_processing_time REAL,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, tool_id)
);
```

## 最佳实践

1. **工具ID命名**: 使用kebab-case格式，如 `flux-schnell`, `image-edit-canny`
2. **点数设置**: 根据工具的计算复杂度和资源消耗来设置合理的点数
3. **使用限制**: 为高消耗工具设置每日使用限制
4. **错误处理**: 在API路由中正确处理各种错误情况
5. **使用记录**: 记录工具使用情况以便分析和优化
6. **缓存**: 对工具配置进行适当的缓存以提高性能

## 扩展性

这个系统设计为高度可扩展：

- 可以轻松添加新的工具分类
- 支持添加新的工具属性
- 可以扩展使用统计和分析功能
- 支持A/B测试和动态配置

通过这个统一的工具配置系统，你可以更高效地管理所有AI工具，并为用户提供一致的体验。