import { Database } from './db';
import { Env } from '@/worker/types';
import { 
  GenerationHistory, 
  BatchJob, 
  EditHistory, 
  ShareRecord, 
  SystemMetrics,
  HistorySearchRequest,
  AppErrorClass,
  ErrorCode,
  ImageSearchHistory,
  ImageSearchFilters,
  ImageSearchResult
} from '@/types/database';

export class GenerationHistoryDAO {
  private db: Database;

  constructor(env: Env) {
    this.db = new Database(env);
  }

  async create(history: Omit<GenerationHistory, 'createdAt' | 'updatedAt'>): Promise<string> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    
    await this.db.run(`
      INSERT INTO generation_history (
        id, user_id, prompt, model, parameters, image_url, thumbnail_url,
        created_at, updated_at, tags, is_public, download_count
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      id,
      history.userId,
      history.prompt,
      history.model,
      JSON.stringify(history.parameters),
      history.imageUrl,
      history.thumbnailUrl || null,
      now,
      now,
      JSON.stringify(history.tags),
      history.isPublic ? 1 : 0,
      history.downloadCount
    ]);

    return id;
  }
  
  async getHistoryInRange(startDate: Date, endDate: Date): Promise<any[]> {
    const results = await this.db.all<any>(`
      SELECT id, user_id, prompt, model, parameters, image_url, thumbnail_url,
             created_at, updated_at, tags, is_public, download_count
      FROM generation_history 
      WHERE created_at BETWEEN ? AND ?
      ORDER BY created_at DESC
    `, [startDate.toISOString(), endDate.toISOString()]);

    // 将结果转换为适合导出的格式
    return results.map(row => ({
      id: row.id,
      userId: row.user_id,
      prompt: row.prompt,
      model: row.model,
      parameters: JSON.parse(row.parameters),
      imageUrl: row.image_url,
      thumbnailUrl: row.thumbnail_url,
      createdAt: new Date(row.created_at).toISOString(),
      updatedAt: new Date(row.updated_at).toISOString(),
      tags: JSON.parse(row.tags || '[]'),
      isPublic: Boolean(row.is_public),
      downloadCount: row.download_count
    }));
  }

  async findById(id: string): Promise<GenerationHistory | null> {
    const result = await this.db.get<any>(
      'SELECT * FROM generation_history WHERE id = ?',
      [id]
    );

    if (!result) return null;

    return this.mapToGenerationHistory(result);
  }

  async findByUserId(
    userId: string, 
    search?: HistorySearchRequest
  ): Promise<{ items: GenerationHistory[], total: number, page: number, limit: number }> {
    let sql = 'SELECT * FROM generation_history WHERE user_id = ?';
    const params: any[] = [userId];

    // 添加搜索条件
    if (search?.query) {
      sql += ' AND prompt LIKE ?';
      params.push(`%${search.query}%`);
    }

    if (search?.model) {
      sql += ' AND model = ?';
      params.push(search.model);
    }

    if (search?.dateRange) {
      sql += ' AND created_at BETWEEN ? AND ?';
      params.push(search.dateRange[0].toISOString(), search.dateRange[1].toISOString());
    }

    if (search?.tags && search.tags.length > 0) {
      // 简单的标签搜索，实际项目中可能需要更复杂的逻辑
      const tagConditions = search.tags.map(() => 'tags LIKE ?').join(' OR ');
      sql += ` AND (${tagConditions})`;
      search.tags.forEach(tag => params.push(`%"${tag}"%`));
    }

    sql += ' ORDER BY created_at DESC';

    const result = await this.db.paginate<any>(
      sql,
      params,
      search?.page || 1,
      search?.limit || 20
    );

    return {
      ...result,
      items: result.items.map(item => this.mapToGenerationHistory(item))
    };
  }

  async update(id: string, updates: Partial<GenerationHistory>): Promise<void> {
    const now = new Date().toISOString();
    const updateFields: string[] = [];
    const params: any[] = [];

    // 构建更新字段
    if (updates.tags !== undefined) {
      updateFields.push('tags = ?');
      params.push(JSON.stringify(updates.tags));
    }

    if (updates.isPublic !== undefined) {
      updateFields.push('is_public = ?');
      params.push(updates.isPublic ? 1 : 0);
    }

    if (updates.thumbnailUrl !== undefined) {
      updateFields.push('thumbnail_url = ?');
      params.push(updates.thumbnailUrl);
    }

    // 总是更新 updated_at 字段
    updateFields.push('updated_at = ?');
    params.push(now);

    // 添加 ID 作为 WHERE 条件
    params.push(id);

    // 如果没有要更新的字段，则直接返回
    if (updateFields.length <= 1) {
      return;
    }

    const sql = `UPDATE generation_history SET ${updateFields.join(', ')} WHERE id = ?`;
    const result = await this.db.run(sql, params);

    if (result.changes === 0) {
      throw new AppErrorClass({
        code: ErrorCode.HISTORY_NOT_FOUND,
        message: 'Generation history not found',
        timestamp: new Date()
      });
    }
  }

  async updateDownloadCount(id: string): Promise<void> {
    await this.db.run(
      'UPDATE generation_history SET download_count = download_count + 1, updated_at = ? WHERE id = ?',
      [new Date().toISOString(), id]
    );
  }

  async delete(id: string, userId: string): Promise<void> {
    const result = await this.db.run(
      'DELETE FROM generation_history WHERE id = ? AND user_id = ?',
      [id, userId]
    );

    if (result.changes === 0) {
      throw new AppErrorClass({
        code: ErrorCode.HISTORY_NOT_FOUND,
        message: 'Generation history not found or access denied',
        timestamp: new Date()
      });
    }
  }

  private mapToGenerationHistory(row: any): GenerationHistory {
    return {
      id: row.id,
      userId: row.user_id,
      prompt: row.prompt,
      model: row.model,
      parameters: JSON.parse(row.parameters),
      imageUrl: row.image_url,
      thumbnailUrl: row.thumbnail_url,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      tags: JSON.parse(row.tags || '[]'),
      isPublic: Boolean(row.is_public),
      downloadCount: row.download_count
    };
  }
}

export class BatchJobDAO {
  private db: Database;

  constructor(env: Env) {
    this.db = new Database(env);
  }

  async create(job: Omit<BatchJob, 'id' | 'createdAt'>): Promise<string> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    await this.db.run(`
      INSERT INTO batch_jobs (
        id, user_id, name, prompts, status, progress, created_at, results
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      id,
      job.userId,
      job.name,
      JSON.stringify(job.prompts),
      job.status,
      job.progress,
      now,
      JSON.stringify(job.results)
    ]);

    return id;
  }

  async findById(id: string): Promise<BatchJob | null> {
    const result = await this.db.get<any>(
      'SELECT * FROM batch_jobs WHERE id = ?',
      [id]
    );

    if (!result) return null;

    return this.mapToBatchJob(result);
  }

  async findByUserId(userId: string, page: number = 1, limit: number = 20): Promise<{
    items: BatchJob[], total: number, page: number, limit: number
  }> {
    const result = await this.db.paginate<any>(
      'SELECT * FROM batch_jobs WHERE user_id = ? ORDER BY created_at DESC',
      [userId],
      page,
      limit
    );

    return {
      ...result,
      items: result.items.map(item => this.mapToBatchJob(item))
    };
  }

  async updateStatus(id: string, status: BatchJob['status'], progress?: number): Promise<void> {
    let sql = 'UPDATE batch_jobs SET status = ?';
    const params: any[] = [status];

    if (progress !== undefined) {
      sql += ', progress = ?';
      params.push(progress);
    }

    if (status === 'completed' || status === 'failed') {
      sql += ', completed_at = ?';
      params.push(new Date().toISOString());
    }

    sql += ' WHERE id = ?';
    params.push(id);

    await this.db.run(sql, params);
  }

  async updateResults(id: string, results: BatchJob['results']): Promise<void> {
    await this.db.run(
      'UPDATE batch_jobs SET results = ? WHERE id = ?',
      [JSON.stringify(results), id]
    );
  }
  
  async getJobsInRange(startDate: Date, endDate: Date): Promise<any[]> {
    const results = await this.db.all<any>(`
      SELECT id, user_id, name, prompts, status, progress, created_at, completed_at, results
      FROM batch_jobs 
      WHERE created_at BETWEEN ? AND ?
      ORDER BY created_at DESC
    `, [startDate.toISOString(), endDate.toISOString()]);

    // 将结果转换为适合导出的格式
    return results.map(row => ({
      id: row.id,
      userId: row.user_id,
      name: row.name,
      prompts: JSON.parse(row.prompts),
      status: row.status,
      progress: row.progress,
      createdAt: new Date(row.created_at).toISOString(),
      completedAt: row.completed_at ? new Date(row.completed_at).toISOString() : null,
      results: JSON.parse(row.results || '[]')
    }));
  }

  private mapToBatchJob(row: any): BatchJob {
    return {
      id: row.id,
      userId: row.user_id,
      name: row.name,
      prompts: JSON.parse(row.prompts),
      status: row.status,
      progress: row.progress,
      createdAt: new Date(row.created_at),
      completedAt: row.completed_at ? new Date(row.completed_at) : undefined,
      results: JSON.parse(row.results || '[]')
    };
  }
}

export class EditHistoryDAO {
  private db: Database;

  constructor(env: Env) {
    this.db = new Database(env);
  }

  async create(edit: Omit<EditHistory, 'id' | 'createdAt'>): Promise<string> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    await this.db.run(`
      INSERT INTO edit_history (id, generation_id, operations, result_url, original_url, created_at, user_id)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      id,
      edit.generationId,
      JSON.stringify(edit.operations),
      edit.resultUrl,
      edit.originalUrl,
      now,
      edit.userId
    ]);

    return id;
  }

  async findByGenerationId(generationId: string, userId: string): Promise<EditHistory[]> {
    const results = await this.db.all<any>(
      'SELECT * FROM edit_history WHERE generation_id = ? AND user_id = ? ORDER BY created_at DESC',
      [generationId, userId]
    );

    return results.map(row => ({
      id: row.id,
      generationId: row.generation_id,
      operations: JSON.parse(row.operations),
      resultUrl: row.result_url,
      originalUrl: row.original_url,
      createdAt: new Date(row.created_at),
      userId: row.user_id
    }));
  }
}

export class ShareRecordDAO {
  private db: Database;

  constructor(env: Env) {
    this.db = new Database(env);
  }

  async create(share: Omit<ShareRecord, 'id' | 'sharedAt'>): Promise<string> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    await this.db.run(`
      INSERT INTO share_records (id, generation_id, platform, shared_at, user_id)
      VALUES (?, ?, ?, ?, ?)
    `, [
      id,
      share.generationId,
      share.platform,
      now,
      share.userId
    ]);

    return id;
  }

  async getShareStats(generationId: string): Promise<{ platform: string, count: number }[]> {
    const results = await this.db.all<{ platform: string, count: number }>(
      'SELECT platform, COUNT(*) as count FROM share_records WHERE generation_id = ? GROUP BY platform',
      [generationId]
    );

    return results;
  }
}

export class SystemMetricsDAO {
  private db: Database;

  constructor(env: Env) {
    this.db = new Database(env);
  }

  async record(metricName: string, metricValue: number): Promise<void> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    await this.db.run(`
      INSERT INTO system_metrics (id, metric_name, metric_value, recorded_at)
      VALUES (?, ?, ?, ?)
    `, [id, metricName, metricValue, now]);
  }

  async getLatestMetrics(metricNames: string[]): Promise<SystemMetrics[]> {
    const placeholders = metricNames.map(() => '?').join(',');
    const results = await this.db.all<any>(`
      SELECT DISTINCT metric_name, metric_value, recorded_at
      FROM system_metrics 
      WHERE metric_name IN (${placeholders})
      AND recorded_at = (
        SELECT MAX(recorded_at) 
        FROM system_metrics s2 
        WHERE s2.metric_name = system_metrics.metric_name
      )
    `, metricNames);

    return results.map(row => ({
      id: row.id || crypto.randomUUID(),
      metricName: row.metric_name,
      metricValue: row.metric_value,
      recordedAt: new Date(row.recorded_at)
    }));
  }

  async getMetricHistory(
    metricName: string, 
    startDate: Date, 
    endDate: Date
  ): Promise<SystemMetrics[]> {
    const results = await this.db.all<any>(`
      SELECT * FROM system_metrics 
      WHERE metric_name = ? AND recorded_at BETWEEN ? AND ?
      ORDER BY recorded_at ASC
    `, [metricName, startDate.toISOString(), endDate.toISOString()]);

    return results.map(row => ({
      id: row.id,
      metricName: row.metric_name,
      metricValue: row.metric_value,
      recordedAt: new Date(row.recorded_at)
    }));
  }
  
  async getMetricsInRange(
    metricNames: string[],
    startDate: Date,
    endDate: Date
  ): Promise<any[]> {
    const placeholders = metricNames.map(() => '?').join(',');
    const params = [...metricNames, startDate.toISOString(), endDate.toISOString()];
    
    const results = await this.db.all<any>(`
      SELECT metric_name, metric_value, recorded_at
      FROM system_metrics 
      WHERE metric_name IN (${placeholders})
      AND recorded_at BETWEEN ? AND ?
      ORDER BY recorded_at ASC
    `, params);

    // 将结果转换为适合导出的格式
    const exportData = results.map(row => ({
      metricName: row.metric_name,
      metricValue: row.metric_value,
      recordedAt: new Date(row.recorded_at).toISOString()
    }));
    
    return exportData;
  }
}

// 用户分析 DAO
export class UserAnalyticsDAO {
  private db: Database;

  constructor(env: Env) {
    this.db = new Database(env);
  }

  async record(metricName: string, metricValue: number, metricDate: string): Promise<void> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    await this.db.run(`
      INSERT INTO user_analytics (id, metric_name, metric_value, metric_date, recorded_at)
      VALUES (?, ?, ?, ?, ?)
    `, [id, metricName, metricValue, metricDate, now]);
  }

  async getUserAnalytics(range: string = 'month'): Promise<Record<string, any>> {
    // 获取当前日期
    const now = new Date();
    let startDate: Date;
    
    // 根据范围确定开始日期
    switch (range) {
      case 'week':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
        break;
      case 'year':
        startDate = new Date(now);
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      case 'month':
      default:
        startDate = new Date(now);
        startDate.setMonth(now.getMonth() - 1);
        break;
    }
    
    const startDateStr = startDate.toISOString().split('T')[0];
    const nowDateStr = now.toISOString().split('T')[0];
    
    // 获取最新的用户统计数据
    const latestMetrics = await this.getLatestMetrics([
      'total_users',
      'daily_active_users',
      'weekly_active_users',
      'monthly_active_users',
      'daily_new_users',
      'weekly_new_users',
      'monthly_new_users',
      'conversion_rate',
      'avg_session_duration',
      'retention_day1',
      'retention_day7',
      'retention_day30',
      'desktop_percentage',
      'mobile_percentage',
      'tablet_percentage'
    ]);
    
    // 获取用户增长历史
    const userGrowth = await this.getMetricHistory('total_users', startDate, now);
    
    // 构建返回对象
    const result: Record<string, any> = {
      totalUsers: this.getMetricValue(latestMetrics, 'total_users'),
      activeUsers: {
        daily: this.getMetricValue(latestMetrics, 'daily_active_users'),
        weekly: this.getMetricValue(latestMetrics, 'weekly_active_users'),
        monthly: this.getMetricValue(latestMetrics, 'monthly_active_users')
      },
      newUsers: {
        daily: this.getMetricValue(latestMetrics, 'daily_new_users'),
        weekly: this.getMetricValue(latestMetrics, 'weekly_new_users'),
        monthly: this.getMetricValue(latestMetrics, 'monthly_new_users')
      },
      userGrowth: userGrowth.map(metric => ({
        date: metric.recordedAt.toISOString().split('T')[0],
        count: metric.metricValue
      })),
      userRetention: {
        day1: this.getMetricValue(latestMetrics, 'retention_day1'),
        day7: this.getMetricValue(latestMetrics, 'retention_day7'),
        day30: this.getMetricValue(latestMetrics, 'retention_day30')
      },
      conversionRate: this.getMetricValue(latestMetrics, 'conversion_rate'),
      averageSessionDuration: this.getMetricValue(latestMetrics, 'avg_session_duration'),
      usersByPlatform: [
        { platform: '桌面端', percentage: this.getMetricValue(latestMetrics, 'desktop_percentage') },
        { platform: '移动端', percentage: this.getMetricValue(latestMetrics, 'mobile_percentage') },
        { platform: '平板', percentage: this.getMetricValue(latestMetrics, 'tablet_percentage') }
      ],
      usersByCountry: [
        { country: '中国', count: 450 },
        { country: '美国', count: 320 },
        { country: '日本', count: 150 },
        { country: '德国', count: 95 },
        { country: '英国', count: 85 },
        { country: '其他', count: 150 }
      ]
    };
    
    return result;
  }

  private async getLatestMetrics(metricNames: string[]): Promise<SystemMetrics[]> {
    const placeholders = metricNames.map(() => '?').join(',');
    const results = await this.db.all<any>(`
      SELECT DISTINCT metric_name, metric_value, recorded_at
      FROM user_analytics 
      WHERE metric_name IN (${placeholders})
      AND recorded_at = (
        SELECT MAX(recorded_at) 
        FROM user_analytics s2 
        WHERE s2.metric_name = user_analytics.metric_name
      )
    `, metricNames);

    return results.map(row => ({
      id: row.id || crypto.randomUUID(),
      metricName: row.metric_name,
      metricValue: row.metric_value,
      recordedAt: new Date(row.recorded_at)
    }));
  }

  private async getMetricHistory(
    metricName: string, 
    startDate: Date, 
    endDate: Date
  ): Promise<SystemMetrics[]> {
    const results = await this.db.all<any>(`
      SELECT DISTINCT metric_date, metric_value, recorded_at
      FROM user_analytics 
      WHERE metric_name = ? AND metric_date BETWEEN ? AND ?
      GROUP BY metric_date
      ORDER BY metric_date ASC
    `, [
      metricName, 
      startDate.toISOString().split('T')[0], 
      endDate.toISOString().split('T')[0]
    ]);

    return results.map(row => ({
      id: crypto.randomUUID(),
      metricName,
      metricValue: row.metric_value,
      recordedAt: new Date(row.metric_date)
    }));
  }

  private getMetricValue(metrics: SystemMetrics[], metricName: string): number {
    const metric = metrics.find(m => m.metricName === metricName);
    return metric ? metric.metricValue : 0;
  }
  
  async getMetricsInRange(
    metricNames: string[],
    startDate: Date,
    endDate: Date
  ): Promise<any[]> {
    const placeholders = metricNames.map(() => '?').join(',');
    const params = [...metricNames, startDate.toISOString().split('T')[0], endDate.toISOString().split('T')[0]];
    
    const results = await this.db.all<any>(`
      SELECT metric_name, metric_value, metric_date, recorded_at
      FROM user_analytics 
      WHERE metric_name IN (${placeholders})
      AND metric_date BETWEEN ? AND ?
      ORDER BY metric_date ASC, metric_name ASC
    `, params);

    // 将结果转换为适合导出的格式
    const exportData = results.map(row => ({
      metricName: row.metric_name,
      metricValue: row.metric_value,
      metricDate: row.metric_date,
      recordedAt: new Date(row.recorded_at).toISOString()
    }));
    
    return exportData;
  }
}

// 新增：图片搜索 DAO
export class ImageSearchDAO {
  private db: Database;

  constructor(env: Env) {
    this.db = new Database(env);
  }

  async createSearchHistory(
    userId: string,
    query: string,
    searchType: 'text' | 'image',
    imageUrl: string | undefined,
    provider: string,
    resultsCount: number,
    filters: ImageSearchFilters
  ): Promise<string> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    await this.db.run(`
      INSERT INTO image_search_history (
        id, user_id, query, search_type, image_url, provider, results_count, created_at, filters
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      id,
      userId,
      query,
      searchType,
      imageUrl || null,
      provider,
      resultsCount,
      now,
      JSON.stringify(filters)
    ]);

    return id;
  }

  async saveSearchResults(results: Omit<ImageSearchResult, 'createdAt'>[]): Promise<void> {
    const now = new Date().toISOString();
    
    const records = results.map(result => ({
      id: result.id || crypto.randomUUID(),
      search_id: result.searchId,
      image_url: result.imageUrl,
      thumbnail_url: result.thumbnailUrl || null,
      source_url: result.sourceUrl || null,
      title: result.title || null,
      description: result.description || null,
      created_at: now,
      saved: result.saved ? 1 : 0
    }));

    await this.db.batchInsert('image_search_results', records);
  }

  async getSearchHistory(
    userId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<{ items: ImageSearchHistory[], total: number, page: number, limit: number }> {
    const result = await this.db.paginate<any>(
      'SELECT * FROM image_search_history WHERE user_id = ? ORDER BY created_at DESC',
      [userId],
      page,
      limit
    );

    return {
      ...result,
      items: result.items.map(item => ({
        id: item.id,
        userId: item.user_id,
        query: item.query,
        searchType: item.search_type || 'text',
        imageUrl: item.image_url,
        provider: item.provider,
        resultsCount: item.results_count,
        createdAt: new Date(item.created_at),
        filters: JSON.parse(item.filters || '{}')
      }))
    };
  }

  async getSearchResults(
    searchId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<{ items: ImageSearchResult[], total: number, page: number, limit: number }> {
    const result = await this.db.paginate<any>(
      'SELECT * FROM image_search_results WHERE search_id = ? ORDER BY created_at DESC',
      [searchId],
      page,
      limit
    );

    return {
      ...result,
      items: result.items.map(item => ({
        id: item.id,
        searchId: item.search_id,
        imageUrl: item.image_url,
        thumbnailUrl: item.thumbnail_url,
        sourceUrl: item.source_url,
        title: item.title,
        description: item.description,
        createdAt: new Date(item.created_at),
        saved: Boolean(item.saved)
      }))
    };
  }

  async toggleSavedStatus(resultId: string, saved: boolean): Promise<void> {
    await this.db.run(
      'UPDATE image_search_results SET saved = ? WHERE id = ?',
      [saved ? 1 : 0, resultId]
    );
  }

  async getSavedImages(
    userId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<{ items: ImageSearchResult[], total: number, page: number, limit: number }> {
    const result = await this.db.paginate<any>(
      `SELECT r.* 
       FROM image_search_results r
       JOIN image_search_history h ON r.search_id = h.id
       WHERE h.user_id = ? AND r.saved = 1
       ORDER BY r.created_at DESC`,
      [userId],
      page,
      limit
    );

    return {
      ...result,
      items: result.items.map(item => ({
        id: item.id,
        searchId: item.search_id,
        imageUrl: item.image_url,
        thumbnailUrl: item.thumbnail_url,
        sourceUrl: item.source_url,
        title: item.title,
        description: item.description,
        createdAt: new Date(item.created_at),
        saved: Boolean(item.saved)
      }))
    };
  }

  async deleteSearchHistory(historyId: string, userId: string): Promise<void> {
    // 首先删除相关的搜索结果
    await this.db.run(
      'DELETE FROM image_search_results WHERE search_id = ?',
      [historyId]
    );
    
    // 然后删除搜索历史记录（确保只能删除自己的记录）
    await this.db.run(
      'DELETE FROM image_search_history WHERE id = ? AND user_id = ?',
      [historyId, userId]
    );
  }

  async toggleSavedStatusByUserId(imageUrl: string, userId: string, saved: boolean): Promise<void> {
    // 通过图片URL和用户ID来更新保存状态
    await this.db.run(
      `UPDATE image_search_results 
       SET saved = ? 
       WHERE image_url = ? AND search_id IN (
         SELECT id FROM image_search_history WHERE user_id = ?
       )`,
      [saved ? 1 : 0, imageUrl, userId]
    );
  }
}
// 编辑历史相关函数

export async function saveEditHistory(editHistory: Omit<EditHistory, 'id' | 'createdAt'>): Promise<string> {
  const env = { DB: null, 'DB-DEV': null, JWT_SECRET: '', ENVIRONMENT: 'development' } as unknown as Env;
  const db = new Database(env);
  
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  
  await db.run(`
    INSERT INTO edit_history (
      id, generation_id, user_id, operation_type, parameters, 
      before_image_url, after_image_url, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    id,
    editHistory.generationId,
    editHistory.userId,
    editHistory.operations,
    JSON.stringify(editHistory.operations),
    editHistory.originalUrl,
    editHistory.resultUrl,
    now
  ]);

  return id;
}

export async function getEditHistoryByGenerationId(generationId: string): Promise<EditHistory[]> {
  const env = { DB: null, 'DB-DEV': null, JWT_SECRET: '', ENVIRONMENT: 'development' } as unknown as Env;
  const db = new Database(env);
  
  const results = await db.all<any>(
    'SELECT * FROM edit_history WHERE generation_id = ? ORDER BY created_at DESC',
    [generationId]
  );

  return results.map(row => ({
    id: row.id,
    generationId: row.generation_id,
    userId: row.user_id,
    operations: JSON.parse(row.parameters || '[]'),
    originalUrl: row.before_image_url,
    resultUrl: row.after_image_url,
    createdAt: new Date(row.created_at)
  }));
}