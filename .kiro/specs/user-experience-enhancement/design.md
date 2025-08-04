# 设计文档

## 概述

本设计文档基于用户体验增强需求，为现有的 Flux AI 图像生成应用提供详细的技术设计方案。该应用目前基于 Next.js 14 构建，使用 TypeScript、Tailwind CSS，并集成了 Stripe 支付、多语言支持等功能。数据存储使用 Cloudflare D1 数据库，部署在 Cloudflare Workers 环境中。

设计目标是在现有架构基础上，增强用户体验功能，包括历史管理、批量操作、图像编辑、移动端优化、社交分享、管理仪表板和图片网络搜索功能。

## 架构

### 整体架构
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   前端 (Next.js) │    │   API Routes    │    │  Cloudflare     │
│   - React 18    │◄──►│   - RESTful     │◄──►│  Worker         │
│   - TypeScript  │    │   - 认证/授权    │    │  - D1 数据库    │
│   - Tailwind    │    │   - 业务逻辑     │    │  - 图像处理     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### 新增组件架构
```
components/
├── dashboard/
│   ├── HistoryGrid.tsx
│   ├── HistoryFilter.tsx
│   ├── HistoryDetail.tsx
│   └── BatchOperationsModal.tsx
├── editor/
│   ├── ImageEditor.tsx
│   ├── EditingTools.tsx
│   └── EditingHistory.tsx
├── mobile/
│   ├── TouchImageViewer.tsx
│   ├── TouchGestureHandler.tsx
│   ├── ProgressiveImage.tsx
│   └── NetworkStatusIndicator.tsx
├── social/
│   ├── ShareModal.tsx
│   ├── SocialPlatformButton.tsx
│   └── BatchShareModal.tsx
├── image-search/
│   ├── ImageSearch.tsx
│   ├── SearchFilters.tsx
│   ├── SavedImages.tsx
│   └── SearchHistory.tsx
└── admin/
    ├── AdminSidebar.tsx
    ├── PerformanceDashboard.tsx
    ├── SystemMetrics.tsx
    └── UserAnalytics.tsx
```

## 组件和接口

### 1. 历史管理系统

#### 数据模型
```typescript
interface GenerationHistory {
  id: string
  userId: string
  prompt: string
  model: string
  parameters: GenerationParameters
  imageUrl: string
  thumbnailUrl?: string
  createdAt: Date
  updatedAt: Date
  tags: string[]
  isPublic: boolean
  downloadCount: number
}

interface GenerationParameters {
  width: number
  height: number
  aspectRatio: string
  outputFormat: string
  seed?: number
  style?: string
}
```

#### API 接口
```typescript
// GET /api/history
interface HistoryListResponse {
  items: GenerationHistory[]
  total: number
  page: number
  limit: number
}

// GET /api/history/[id]
interface HistoryDetailResponse {
  item: GenerationHistory
  relatedItems: GenerationHistory[]
}

// POST /api/history/search
interface HistorySearchRequest {
  query?: string
  dateRange?: [Date, Date]
  model?: string
  tags?: string[]
  page?: number
  limit?: number
}
```

### 2. 批量生成系统

#### 数据模型
```typescript
interface BatchJob {
  id: string
  userId: string
  name: string
  prompts: BatchPrompt[]
  status: 'pending' | 'processing' | 'completed' | 'failed'
  progress: number
  createdAt: Date
  completedAt?: Date
  results: GenerationResult[]
}

interface BatchPrompt {
  prompt: string
  parameters: GenerationParameters
  variations: number
}

interface GenerationResult {
  promptIndex: number
  variationIndex: number
  imageUrl?: string
  error?: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
}
```

#### 队列管理
```typescript
class BatchQueue {
  private queue: BatchJob[] = []
  private processing: Map<string, BatchJob> = new Map()
  
  async addJob(job: BatchJob): Promise<void>
  async processNext(): Promise<void>
  async getStatus(jobId: string): Promise<BatchJob>
  async cancelJob(jobId: string): Promise<void>
}
```

### 3. 图像编辑系统

#### 编辑工具接口
```typescript
interface EditingTool {
  name: string
  icon: string
  component: React.ComponentType<EditingToolProps>
  apply: (canvas: HTMLCanvasElement, params: any) => Promise<void>
}

interface EditingToolProps {
  canvas: HTMLCanvasElement
  onApply: (params: any) => void
  onCancel: () => void
}

// 支持的编辑操作
type EditOperation = 
  | { type: 'crop', params: CropParams }
  | { type: 'rotate', params: RotateParams }
  | { type: 'brightness', params: BrightnessParams }
  | { type: 'contrast', params: ContrastParams }
```

#### Canvas 编辑器
```typescript
class ImageEditor {
  private canvas: HTMLCanvasElement
  private context: CanvasRenderingContext2D
  private history: EditOperation[] = []
  private historyIndex: number = -1
  
  loadImage(url: string): Promise<void>
  applyOperation(operation: EditOperation): void
  undo(): void
  redo(): void
  export(format: 'png' | 'jpg', quality?: number): Blob
  reset(): void
}
```

### 4. 移动端优化

#### 响应式设计
```typescript
// 断点配置
const breakpoints = {
  mobile: '(max-width: 768px)',
  tablet: '(min-width: 769px) and (max-width: 1024px)',
  desktop: '(min-width: 1025px)'
}

// 移动端优化组件
interface MobileOptimizedProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}
```

#### 触摸手势
```typescript
interface TouchGestureProps {
  onPinch?: (scale: number) => void
  onPan?: (deltaX: number, deltaY: number) => void
  onTap?: () => void
  onDoubleTap?: () => void
}

class TouchGestureHandler {
  private element: HTMLElement
  private startTouches: Touch[] = []
  private lastScale: number = 1
  
  enable(): void
  disable(): void
  private handleTouchStart(event: TouchEvent): void
  private handleTouchMove(event: TouchEvent): void
  private handleTouchEnd(event: TouchEvent): void
}
```

### 5. 社交分享系统

#### 平台配置
```typescript
interface SocialPlatform {
  name: string
  icon: string
  shareUrl: string
  imageRequirements: {
    maxWidth: number
    maxHeight: number
    aspectRatio?: number
    format: 'jpg' | 'png'
  }
}

const socialPlatforms: SocialPlatform[] = [
  {
    name: 'Twitter',
    icon: 'twitter',
    shareUrl: 'https://twitter.com/intent/tweet',
    imageRequirements: {
      maxWidth: 1200,
      maxHeight: 675,
      aspectRatio: 16/9,
      format: 'jpg'
    }
  },
  {
    name: 'Facebook',
    icon: 'facebook',
    shareUrl: 'https://www.facebook.com/sharer/sharer.php',
    imageRequirements: {
      maxWidth: 1200,
      maxHeight: 630,
      aspectRatio: 1.91/1,
      format: 'jpg'
    }
  },
  {
    name: 'Instagram',
    icon: 'instagram',
    shareUrl: '',
    imageRequirements: {
      maxWidth: 1080,
      maxHeight: 1080,
      aspectRatio: 1/1,
      format: 'jpg'
    }
  }
]
```

#### 分享处理
```typescript
class SocialShareHandler {
  async prepareImage(imageUrl: string, platform: SocialPlatform): Promise<Blob>
  async shareToPlat form(platform: string, imageBlob: Blob, caption: string): Promise<void>
  generateShareUrl(platform: string, params: ShareParams): string
}
```

### 6. 管理仪表板

#### 系统监控
```typescript
interface SystemMetrics {
  cpu: number
  memory: number
  storage: number
  activeUsers: number
  queueLength: number
  errorRate: number
  responseTime: number
  timestamp: Date
}

interface UserAnalytics {
  totalUsers: number
  activeUsers: {
    daily: number
    weekly: number
    monthly: number
  }
  newUsers: {
    daily: number
    weekly: number
    monthly: number
  }
  userGrowth: Array<{
    date: string
    count: number
  }>
  conversionRate: number
  averageSessionDuration: number
}
```

### 7. 图片网络搜索系统

#### 数据模型
```typescript
interface ImageSearchHistory {
  id: string
  userId: string
  query: string
  searchType: 'text' | 'image'
  imageUrl?: string // 如果是图片搜索，存储上传的图片URL
  provider: string
  resultsCount: number
  createdAt: Date
  filters: ImageSearchFilters
}

interface ImageSearchFilters {
  size?: string
  color?: string
  type?: string
  license?: string
  safeSearch?: boolean
  [key: string]: any
}

interface ImageSearchResult {
  id: string
  searchId: string
  imageUrl: string
  thumbnailUrl?: string
  sourceUrl?: string
  title?: string
  description?: string
  createdAt: Date
  saved: boolean
}
```

#### API 集成
```typescript
// 外部 API 集成
interface ExternalImageAPI {
  name: string
  searchText(query: string, filters: ImageSearchFilters): Promise<ImageSearchResult[]>
  searchImage?(imageUrl: string, filters: ImageSearchFilters): Promise<ImageSearchResult[]>
}

class PromptHeroAPI implements ExternalImageAPI {
  name = 'PromptHero'
  
  async searchText(query: string, filters: ImageSearchFilters): Promise<ImageSearchResult[]> {
    // 实现 PromptHero API 调用
  }
}

class GoogleVisionAPI implements ExternalImageAPI {
  name = 'Google Vision'
  
  async searchImage(imageUrl: string, filters: ImageSearchFilters): Promise<ImageSearchResult[]> {
    // 实现 Google Vision API 调用
  }
}
```

## 数据模型

### 数据库扩展
基于现有的 Cloudflare D1 数据库，需要添加以下表：

```sql
-- 生成历史表
CREATE TABLE generation_history (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  prompt TEXT NOT NULL,
  model TEXT NOT NULL,
  parameters TEXT NOT NULL, -- JSON
  image_url TEXT NOT NULL,
  thumbnail_url TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  tags TEXT, -- JSON array
  is_public BOOLEAN DEFAULT FALSE,
  download_count INTEGER DEFAULT 0
);

-- 批量任务表
CREATE TABLE batch_jobs (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  prompts TEXT NOT NULL, -- JSON
  status TEXT NOT NULL,
  progress INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  completed_at DATETIME,
  results TEXT -- JSON
);

-- 编辑历史表
CREATE TABLE edit_history (
  id TEXT PRIMARY KEY,
  generation_id TEXT NOT NULL,
  operations TEXT NOT NULL, -- JSON
  result_url TEXT NOT NULL,
  original_url TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  user_id TEXT NOT NULL
);

-- 分享记录表
CREATE TABLE share_records (
  id TEXT PRIMARY KEY,
  generation_id TEXT NOT NULL,
  platform TEXT NOT NULL,
  shared_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  user_id TEXT NOT NULL
);

-- 系统指标表
CREATE TABLE system_metrics (
  id TEXT PRIMARY KEY,
  metric_name TEXT NOT NULL,
  metric_value REAL NOT NULL,
  recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 用户分析表
CREATE TABLE user_analytics (
  id TEXT PRIMARY KEY,
  metric_name TEXT NOT NULL,
  metric_value REAL NOT NULL,
  metric_date TEXT NOT NULL,
  recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 用户会话表
CREATE TABLE user_sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  session_id TEXT NOT NULL,
  platform TEXT NOT NULL,
  duration_seconds INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  ended_at DATETIME
);

-- 图片搜索历史表
CREATE TABLE image_search_history (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  query TEXT NOT NULL,
  search_type TEXT NOT NULL, -- 'text' or 'image'
  image_url TEXT, -- 如果是图片搜索，存储上传的图片URL
  provider TEXT NOT NULL,
  results_count INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  filters TEXT DEFAULT '{}'
);

-- 图片搜索结果表
CREATE TABLE image_search_results (
  id TEXT PRIMARY KEY,
  search_id TEXT NOT NULL,
  image_url TEXT NOT NULL,
  thumbnail_url TEXT,
  source_url TEXT,
  title TEXT,
  description TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  saved BOOLEAN DEFAULT FALSE,
  FOREIGN KEY (search_id) REFERENCES image_search_history(id)
);

-- 创建索引以提高查询性能
CREATE INDEX idx_generation_history_user_id ON generation_history(user_id);
CREATE INDEX idx_generation_history_created_at ON generation_history(created_at);
CREATE INDEX idx_batch_jobs_user_id ON batch_jobs(user_id);
CREATE INDEX idx_batch_jobs_status ON batch_jobs(status);
CREATE INDEX idx_edit_history_generation_id ON edit_history(generation_id);
CREATE INDEX idx_share_records_generation_id ON share_records(generation_id);
CREATE INDEX idx_system_metrics_metric_name ON system_metrics(metric_name);
CREATE INDEX idx_user_analytics_metric_name ON user_analytics(metric_name);
CREATE INDEX idx_image_search_history_user_id ON image_search_history(user_id);
CREATE INDEX idx_image_search_results_search_id ON image_search_results(search_id);
```

## 错误处理

### 错误类型定义
```typescript
enum ErrorCode {
  HISTORY_NOT_FOUND = 'HISTORY_NOT_FOUND',
  BATCH_LIMIT_EXCEEDED = 'BATCH_LIMIT_EXCEEDED',
  EDIT_OPERATION_FAILED = 'EDIT_OPERATION_FAILED',
  SHARE_PLATFORM_ERROR = 'SHARE_PLATFORM_ERROR',
  MOBILE_OPTIMIZATION_ERROR = 'MOBILE_OPTIMIZATION_ERROR',
  ADMIN_ACCESS_DENIED = 'ADMIN_ACCESS_DENIED',
  IMAGE_SEARCH_API_ERROR = 'IMAGE_SEARCH_API_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR'
}

interface AppError {
  code: ErrorCode
  message: string
  details?: any
  timestamp: Date
}
```

### 错误处理策略
```typescript
class ErrorHandler {
  static handle(error: AppError): void {
    // 记录错误
    console.error(`[${error.code}] ${error.message}`, error.details)
    
    // 发送到监控系统
    this.sendToMonitoring(error)
    
    // 用户友好的错误提示
    this.showUserError(error)
  }
  
  private static sendToMonitoring(error: AppError): void {
    // 发送到性能监控系统
    fetch('/api/performance/metrics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'error.count',
        value: 1,
        unit: 'count',
        context: {
          code: error.code,
          message: error.message,
          timestamp: error.timestamp
        }
      })
    }).catch(() => {})
  }
  
  private static showUserError(error: AppError): void {
    // 显示用户友好的错误消息
    const userMessage = this.getUserFriendlyMessage(error.code)
    // 通过 toast 或其他方式显示给用户
  }
  
  private static getUserFriendlyMessage(code: ErrorCode): string {
    const messages = {
      [ErrorCode.HISTORY_NOT_FOUND]: '未找到历史记录',
      [ErrorCode.BATCH_LIMIT_EXCEEDED]: '批量生成数量超出限制',
      [ErrorCode.EDIT_OPERATION_FAILED]: '图像编辑操作失败',
      [ErrorCode.SHARE_PLATFORM_ERROR]: '分享到社交平台失败',
      [ErrorCode.MOBILE_OPTIMIZATION_ERROR]: '移动端优化错误',
      [ErrorCode.ADMIN_ACCESS_DENIED]: '管理员权限不足',
      [ErrorCode.IMAGE_SEARCH_API_ERROR]: '图片搜索服务暂时不可用',
      [ErrorCode.NETWORK_ERROR]: '网络连接错误'
    }
    return messages[code] || '发生未知错误'
  }
}
```

## 测试策略

### 单元测试
- 使用 Jest 和 React Testing Library
- 覆盖所有核心业务逻辑
- 模拟外部依赖（API 调用、文件操作等）

### 集成测试
- 测试 API 路由的完整流程
- 测试数据库操作
- 测试第三方服务集成

### 端到端测试
- 使用 Playwright 进行 E2E 测试
- 测试关键用户流程
- 测试移动端响应式设计

### 性能测试
- 图像处理性能测试
- 批量操作性能测试
- 移动端性能优化验证

## 安全考虑

### 数据安全
- 用户生成的图像存储加密
- 敏感数据传输使用 HTTPS
- 实施适当的访问控制

### API 安全
- 实施速率限制
- 输入验证和清理
- JWT 令牌验证

### 隐私保护
- 遵循 GDPR 和其他隐私法规
- 用户数据匿名化选项
- 清晰的隐私政策和用户同意

## 性能优化

### 前端优化
- 图像懒加载和渐进式加载
- 组件代码分割
- 缓存策略优化

### 后端优化
- 数据库查询优化
- 图像处理异步化
- CDN 集成优化

### 移动端优化
- 图像压缩和格式优化
- 触摸响应优化
- 网络状况适配

## 部署和监控

### 部署策略
- 基于现有的 Cloudflare Workers 部署
- 数据库迁移脚本
- 环境配置管理

### 监控和日志
- 集成现有的性能监控系统
- 错误追踪和报告
- 用户行为分析