import { D1Database } from '@cloudflare/workers-types';
import { nanoid } from 'nanoid';

interface UserAnalyticsRecord {
  id: string;
  metricName: string;
  metricValue: number;
  metricDate: string;
  recordedAt: string;
}

/**
 * 记录用户分析数据
 * 此脚本用于收集和记录用户活动和转化率数据
 */
export async function recordUserAnalytics(db: D1Database) {
  const timestamp = new Date().toISOString();
  const dateOnly = timestamp.split('T')[0];
  
  try {
    // 记录总用户数
    await recordMetric(db, 'total_users', await getTotalUsers(db), dateOnly, timestamp);
    
    // 记录活跃用户数
    await recordMetric(db, 'daily_active_users', await getActiveUsers(db, '1d'), dateOnly, timestamp);
    await recordMetric(db, 'weekly_active_users', await getActiveUsers(db, '7d'), dateOnly, timestamp);
    await recordMetric(db, 'monthly_active_users', await getActiveUsers(db, '30d'), dateOnly, timestamp);
    
    // 记录新用户数
    await recordMetric(db, 'daily_new_users', await getNewUsers(db, '1d'), dateOnly, timestamp);
    await recordMetric(db, 'weekly_new_users', await getNewUsers(db, '7d'), dateOnly, timestamp);
    await recordMetric(db, 'monthly_new_users', await getNewUsers(db, '30d'), dateOnly, timestamp);
    
    // 记录转化率
    await recordMetric(db, 'conversion_rate', await getConversionRate(db), dateOnly, timestamp);
    
    // 记录平均会话时长
    await recordMetric(db, 'avg_session_duration', await getAvgSessionDuration(db), dateOnly, timestamp);
    
    // 记录用户留存率
    await recordMetric(db, 'retention_day1', await getRetentionRate(db, 1), dateOnly, timestamp);
    await recordMetric(db, 'retention_day7', await getRetentionRate(db, 7), dateOnly, timestamp);
    await recordMetric(db, 'retention_day30', await getRetentionRate(db, 30), dateOnly, timestamp);
    
    // 记录平台分布
    const platformDistribution = await getPlatformDistribution(db);
    await recordMetric(db, 'desktop_percentage', platformDistribution.desktop, dateOnly, timestamp);
    await recordMetric(db, 'mobile_percentage', platformDistribution.mobile, dateOnly, timestamp);
    await recordMetric(db, 'tablet_percentage', platformDistribution.tablet, dateOnly, timestamp);
    
    console.log('User analytics recorded successfully');
    return { success: true };
  } catch (error) {
    console.error('Error recording user analytics:', error);
    return { success: false, error };
  }
}

/**
 * 记录单个指标
 */
async function recordMetric(
  db: D1Database, 
  metricName: string, 
  metricValue: number, 
  metricDate: string, 
  timestamp: string
) {
  const id = nanoid();
  
  await db.prepare(`
    INSERT INTO user_analytics (id, metric_name, metric_value, metric_date, recorded_at)
    VALUES (?, ?, ?, ?, ?)
  `).bind(id, metricName, metricValue, metricDate, timestamp).run();
}

/**
 * 获取总用户数
 */
async function getTotalUsers(db: D1Database): Promise<number> {
  const result = await db.prepare('SELECT COUNT(*) as count FROM users').first();
  return result ? (result.count as number) : 0;
}

/**
 * 获取活跃用户数
 * @param timeframe 时间范围，如 '1d', '7d', '30d'
 */
async function getActiveUsers(db: D1Database, timeframe: string): Promise<number> {
  let days: number;
  
  switch (timeframe) {
    case '1d':
      days = 1;
      break;
    case '7d':
      days = 7;
      break;
    case '30d':
      days = 30;
      break;
    default:
      days = 1;
  }
  
  const result = await db.prepare(`
    SELECT COUNT(DISTINCT user_id) as count 
    FROM user_sessions 
    WHERE created_at >= datetime('now', '-${days} days')
  `).first();
  
  return result ? (result.count as number) : 0;
}

/**
 * 获取新用户数
 * @param timeframe 时间范围，如 '1d', '7d', '30d'
 */
async function getNewUsers(db: D1Database, timeframe: string): Promise<number> {
  let days: number;
  
  switch (timeframe) {
    case '1d':
      days = 1;
      break;
    case '7d':
      days = 7;
      break;
    case '30d':
      days = 30;
      break;
    default:
      days = 1;
  }
  
  const result = await db.prepare(`
    SELECT COUNT(*) as count 
    FROM users 
    WHERE created_at >= datetime('now', '-${days} days')
  `).first();
  
  return result ? (result.count as number) : 0;
}

/**
 * 获取转化率（免费用户转为付费用户的比例）
 */
async function getConversionRate(db: D1Database): Promise<number> {
  const totalUsers = await getTotalUsers(db);
  if (totalUsers === 0) return 0;
  
  const result = await db.prepare(`
    SELECT COUNT(*) as count 
    FROM users 
    WHERE subscription_status = 'active'
  `).first();
  
  const paidUsers = result ? (result.count as number) : 0;
  return (paidUsers / totalUsers) * 100;
}

/**
 * 获取平均会话时长（分钟）
 */
async function getAvgSessionDuration(db: D1Database): Promise<number> {
  const result = await db.prepare(`
    SELECT AVG(duration_seconds) / 60 as avg_duration 
    FROM user_sessions 
    WHERE created_at >= datetime('now', '-7 days')
  `).first();
  
  return result && result.avg_duration ? parseFloat(result.avg_duration as string) : 0;
}

/**
 * 获取用户留存率
 * @param days 天数，如 1, 7, 30
 */
async function getRetentionRate(db: D1Database, days: number): Promise<number> {
  // 获取 N 天前的新用户
  const newUsersResult = await db.prepare(`
    SELECT COUNT(*) as count 
    FROM users 
    WHERE created_at BETWEEN datetime('now', '-${days+1} days') AND datetime('now', '-${days} days')
  `).first();
  
  const newUsers = newUsersResult ? (newUsersResult.count as number) : 0;
  if (newUsers === 0) return 0;
  
  // 获取这些用户中今天仍然活跃的用户
  const retainedUsersResult = await db.prepare(`
    SELECT COUNT(DISTINCT u.id) as count 
    FROM users u
    JOIN user_sessions s ON u.id = s.user_id
    WHERE u.created_at BETWEEN datetime('now', '-${days+1} days') AND datetime('now', '-${days} days')
    AND s.created_at >= datetime('now', '-1 days')
  `).first();
  
  const retainedUsers = retainedUsersResult ? (retainedUsersResult.count as number) : 0;
  return (retainedUsers / newUsers) * 100;
}

/**
 * 获取平台分布
 */
async function getPlatformDistribution(db: D1Database): Promise<{desktop: number, mobile: number, tablet: number}> {
  // 获取总会话数
  const totalResult = await db.prepare(`
    SELECT COUNT(*) as count 
    FROM user_sessions 
    WHERE created_at >= datetime('now', '-30 days')
  `).first();
  
  const total = totalResult ? (totalResult.count as number) : 0;
  if (total === 0) return { desktop: 0, mobile: 0, tablet: 0 };
  
  // 获取桌面端会话数
  const desktopResult = await db.prepare(`
    SELECT COUNT(*) as count 
    FROM user_sessions 
    WHERE platform = 'desktop' AND created_at >= datetime('now', '-30 days')
  `).first();
  
  // 获取移动端会话数
  const mobileResult = await db.prepare(`
    SELECT COUNT(*) as count 
    FROM user_sessions 
    WHERE platform = 'mobile' AND created_at >= datetime('now', '-30 days')
  `).first();
  
  // 获取平板会话数
  const tabletResult = await db.prepare(`
    SELECT COUNT(*) as count 
    FROM user_sessions 
    WHERE platform = 'tablet' AND created_at >= datetime('now', '-30 days')
  `).first();
  
  const desktop = desktopResult ? (desktopResult.count as number) : 0;
  const mobile = mobileResult ? (mobileResult.count as number) : 0;
  const tablet = tabletResult ? (tabletResult.count as number) : 0;
  
  return {
    desktop: (desktop / total) * 100,
    mobile: (mobile / total) * 100,
    tablet: (tablet / total) * 100
  };
}