# 数据库架构设置指南

## 概述

本文档描述了 Flux AI 应用的扩展数据库架构，包括新增的表结构、数据访问层和迁移系统。

## 新增表结构

### 1. generation_history
存储用户的图像生成历史记录
- `id`: 主键 (UUID)
- `user_id`: 用户ID
- `prompt`: 生成提示词
- `model`: 使用的模型
- `parameters`: 生成参数 (JSON)
- `image_url`: 图像URL
- `thumbnail_url`: 缩略图URL
- `created_at`: 创建时间
- `updated_at`: 更新时间
- `tags`: 标签 (JSON数组)
- `is_public`: 是否公开
- `download_count`: 下载次数

### 2. batch_jobs
存储批量生成任务
- `id`: 主键 (UUID)
- `user_id`: 用户ID
- `name`: 任务名称
- `prompts`: 提示词列表 (JSON)
- `status`: 任务状态
- `progress`: 进度百分比
- `created_at`: 创建时间
- `completed_at`: 完成时间
- `results`: 生成结果 (JSON)

### 3. edit_history
存储图像编辑历史
- `id`: 主键 (UUID)
- `generation_id`: 关联的生成记录ID
- `operations`: 编辑操作 (JSON)
- `result_url`: 编辑结果URL
- `created_at`: 创建时间

### 4. share_records
存储分享记录
- `id`: 主键 (UUID)
- `generation_id`: 关联的生成记录ID
- `platform`: 分享平台
- `shared_at`: 分享时间
- `user_id`: 用户ID

### 5. system_metrics
存储系统指标
- `id`: 主键 (UUID)
- `metric_name`: 指标名称
- `metric_value`: 指标值
- `recorded_at`: 记录时间

### 6. image_search_history
存储图片搜索历史
- `id`: 主键 (UUID)
- `user_id`: 用户ID
- `query`: 搜索关键词
- `provider`: 搜索提供商
- `results_count`: 结果数量
- `created_at`: 创建时间
- `filters`: 搜索过滤条件 (JSON)

### 7. image_search_results
存储图片搜索结果
- `id`: 主键 (UUID)
- `search_id`: 关联的搜索历史ID
- `image_url`: 图像URL
- `thumbnail_url`: 缩略图URL
- `source_url`: 来源URL
- `title`: 标题
- `description`: 描述
- `created_at`: 创建时间
- `saved`: 是否已保存

## 数据访问层 (DAO)

### GenerationHistoryDAO
- `create()`: 创建生成历史记录
- `findById()`: 根据ID查找记录
- `findByUserId()`: 查找用户的历史记录（支持搜索和分页）
- `updateDownloadCount()`: 更新下载次数
- `delete()`: 删除记录

### BatchJobDAO
- `create()`: 创建批量任务
- `findById()`: 根据ID查找任务
- `findByUserId()`: 查找用户的批量任务
- `updateStatus()`: 更新任务状态
- `updateResults()`: 更新任务结果

### EditHistoryDAO
- `create()`: 创建编辑历史
- `findByGenerationId()`: 查找生成记录的编辑历史

### ShareRecordDAO
- `create()`: 创建分享记录
- `getShareStats()`: 获取分享统计

### SystemMetricsDAO
- `record()`: 记录系统指标
- `getLatestMetrics()`: 获取最新指标
- `getMetricHistory()`: 获取指标历史

### ImageSearchDAO
- `createSearchHistory()`: 创建搜索历史
- `saveSearchResults()`: 保存搜索结果
- `getSearchHistory()`: 获取用户的搜索历史
- `getSearchResults()`: 获取搜索结果
- `toggleSavedStatus()`: 切换图片保存状态
- `getSavedImages()`: 获取用户保存的图片

## 使用方法

### 1. 运行数据库迁移

首次部署或更新时，需要运行数据库迁移：

```bash
# 通过 API 端点运行迁移
curl -X POST https://your-worker-domain.com/init-db
```

### 2. 使用 DAO 类

```typescript
import { GenerationHistoryDAO } from '@/utils/dao';
import { Env } from '@/worker/types';

// 在 Worker 处理函数中
export async function handleCreateHistory(request: Request, env: Env) {
  const dao = new GenerationHistoryDAO(env);
  
  const historyData = await request.json();
  const historyId = await dao.create(historyData);
  
  return new Response(JSON.stringify({ id: historyId }), {
    headers: { 'Content-Type': 'application/json' }
  });
}
```

### 3. 错误处理

```typescript
import { ErrorHandler } from '@/utils/errorHandler';

try {
  const result = await dao.findById(id);
  // 处理结果
} catch (error) {
  const appError = ErrorHandler.handle(error);
  ErrorHandler.logError(appError);
  return ErrorHandler.createResponse(appError);
}
```

## 索引优化

系统会自动创建以下索引以优化查询性能：

- `idx_generation_history_user_id`: 用户ID索引
- `idx_generation_history_created_at`: 创建时间索引
- `idx_generation_history_model`: 模型索引
- `idx_batch_jobs_user_id`: 批量任务用户ID索引
- `idx_batch_jobs_status`: 批量任务状态索引
- `idx_edit_history_generation_id`: 编辑历史生成ID索引
- `idx_share_records_generation_id`: 分享记录生成ID索引
- `idx_share_records_user_id`: 分享记录用户ID索引
- `idx_system_metrics_name_time`: 系统指标名称和时间索引
- `idx_image_search_history_user_id`: 图片搜索历史用户ID索引
- `idx_image_search_history_created_at`: 图片搜索历史创建时间索引
- `idx_image_search_results_search_id`: 图片搜索结果搜索ID索引

## 图片网络搜索功能

### 功能概述

图片网络搜索功能允许用户搜索网络上的图片，并保存感兴趣的图片。该功能包括：

1. 搜索界面：用户可以输入关键词和过滤条件
2. 结果展示：以网格形式展示搜索结果
3. 保存功能：用户可以保存喜欢的图片
4. 历史记录：用户可以查看过去的搜索历史

### 数据流程

1. 用户输入搜索关键词和过滤条件
2. 系统调用外部图片搜索API（如Unsplash、Pexels等）
3. 搜索结果保存到数据库
4. 用户可以浏览、保存和下载图片

### 使用示例

```typescript
import { ImageSearchDAO } from '@/utils/dao';

// 创建搜索历史
const searchDao = new ImageSearchDAO(env);
const searchId = await searchDao.createSearchHistory(
  userId,
  query,
  'unsplash',
  results.length,
  { size: 'large', color: 'red' }
);

// 保存搜索结果
await searchDao.saveSearchResults(
  results.map(result => ({
    id: crypto.randomUUID(),
    searchId,
    imageUrl: result.urls.regular,
    thumbnailUrl: result.urls.thumb,
    sourceUrl: result.links.html,
    title: result.description || result.alt_description,
    description: `Photo by ${result.user.name}`,
    saved: false
  }))
);

// 获取用户保存的图片
const savedImages = await searchDao.getSavedImages(userId);
```

## 注意事项

1. **UUID 使用**: 所有新表都使用 UUID 作为主键，确保分布式环境下的唯一性
2. **JSON 字段**: 复杂数据结构存储为 JSON 字符串，查询时需要解析
3. **时间戳**: 统一使用 ISO 8601 格式的时间戳
4. **错误处理**: 所有数据库操作都包含适当的错误处理和日志记录
5. **分页支持**: 列表查询都支持分页，避免大量数据的性能问题

## 测试

运行测试脚本验证数据库设置：

```bash
npm run test:db-setup
```

## 迁移管理

迁移系统会自动跟踪已执行的迁移，避免重复执行。新的迁移应该添加到 `utils/migrations.ts` 文件中。