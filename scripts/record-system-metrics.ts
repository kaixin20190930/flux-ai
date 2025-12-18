import { SystemMetricsDAO, UserAnalyticsDAO } from '@/utils/dao';
import { Env } from '@/worker/types';
import os from 'os';

/**
 * 记录系统指标的脚本
 * 
 * 此脚本用于定期收集系统指标并存储到数据库中
 * 可以通过 cron 作业或类似机制定期运行
 */
async function recordSystemMetrics() {
  try {
    console.log('开始记录系统指标...');
    
    // 初始化 DAO
    const metricsDAO = new SystemMetricsDAO(process.env as unknown as Env);
    const userAnalyticsDAO = new UserAnalyticsDAO(process.env as unknown as Env);
    
    // 收集 CPU 使用率
    const cpuUsage = await getCpuUsage();
    await metricsDAO.record('cpu_usage', cpuUsage);
    console.log(`记录 CPU 使用率: ${cpuUsage.toFixed(2)}%`);
    
    // 收集内存使用率
    const memoryUsage = getMemoryUsage();
    await metricsDAO.record('memory_usage', memoryUsage);
    console.log(`记录内存使用率: ${memoryUsage.toFixed(2)}%`);
    
    // 记录总内存
    const totalMemory = os.totalmem();
    await metricsDAO.record('total_memory', totalMemory);
    console.log(`记录总内存: ${formatBytes(totalMemory)}`);
    
    // 收集存储使用率 (模拟数据)
    const storageUsage = Math.random() * 20 + 50; // 50-70%
    await metricsDAO.record('storage_usage', storageUsage);
    console.log(`记录存储使用率: ${storageUsage.toFixed(2)}%`);
    
    // 收集网络使用率 (模拟数据)
    const networkUsage = Math.random() * 30 + 40; // 40-70%
    await metricsDAO.record('network_usage', networkUsage);
    console.log(`记录网络使用率: ${networkUsage.toFixed(2)}%`);
    
    // 收集数据库使用率 (模拟数据)
    const databaseUsage = Math.random() * 25 + 45; // 45-70%
    await metricsDAO.record('database_usage', databaseUsage);
    console.log(`记录数据库使用率: ${databaseUsage.toFixed(2)}%`);
    
    // 收集响应时间 (模拟数据)
    const responseTime = Math.random() * 200 + 100; // 100-300ms
    await metricsDAO.record('response_time', responseTime);
    console.log(`记录响应时间: ${responseTime.toFixed(2)}ms`);
    
    // 收集活跃用户数 (模拟数据)
    const activeUsers = Math.floor(Math.random() * 100 + 50); // 50-150 users
    await metricsDAO.record('active_users', activeUsers);
    console.log(`记录活跃用户数: ${activeUsers}`);
    
    // 收集队列长度 (模拟数据)
    const queueLength = Math.floor(Math.random() * 10); // 0-10 jobs
    await metricsDAO.record('queue_length', queueLength);
    console.log(`记录队列长度: ${queueLength}`);
    
    // 收集错误率 (模拟数据)
    const errorRate = Math.random() * 2; // 0-2%
    await metricsDAO.record('error_rate', errorRate);
    console.log(`记录错误率: ${errorRate.toFixed(2)}%`);
    
    // 记录用户分析数据
    console.log('开始记录用户分析数据...');
    await recordUserAnalytics(userAnalyticsDAO);
    
    console.log('系统指标和用户分析数据记录完成');
  } catch (error) {
    console.error('记录系统指标失败:', error);
  }
}

/**
 * 记录用户分析数据
 */
async function recordUserAnalytics(userAnalyticsDAO: UserAnalyticsDAO) {
  const dateOnly = new Date().toISOString().split('T')[0];
  
  try {
    // 记录总用户数 (模拟数据)
    const totalUsers = 1250;
    await userAnalyticsDAO.record('total_users', totalUsers, dateOnly);
    console.log(`记录总用户数: ${totalUsers}`);
    
    // 记录活跃用户数 (模拟数据)
    const dailyActiveUsers = 320;
    const weeklyActiveUsers = 780;
    const monthlyActiveUsers = 950;
    await userAnalyticsDAO.record('daily_active_users', dailyActiveUsers, dateOnly);
    await userAnalyticsDAO.record('weekly_active_users', weeklyActiveUsers, dateOnly);
    await userAnalyticsDAO.record('monthly_active_users', monthlyActiveUsers, dateOnly);
    console.log(`记录活跃用户数: 日 ${dailyActiveUsers}, 周 ${weeklyActiveUsers}, 月 ${monthlyActiveUsers}`);
    
    // 记录新用户数 (模拟数据)
    const dailyNewUsers = 45;
    const weeklyNewUsers = 210;
    const monthlyNewUsers = 450;
    await userAnalyticsDAO.record('daily_new_users', dailyNewUsers, dateOnly);
    await userAnalyticsDAO.record('weekly_new_users', weeklyNewUsers, dateOnly);
    await userAnalyticsDAO.record('monthly_new_users', monthlyNewUsers, dateOnly);
    console.log(`记录新用户数: 日 ${dailyNewUsers}, 周 ${weeklyNewUsers}, 月 ${monthlyNewUsers}`);
    
    // 记录转化率 (模拟数据)
    const conversionRate = 12.5;
    await userAnalyticsDAO.record('conversion_rate', conversionRate, dateOnly);
    console.log(`记录转化率: ${conversionRate.toFixed(1)}%`);
    
    // 记录平均会话时长 (模拟数据)
    const avgSessionDuration = 8.2;
    await userAnalyticsDAO.record('avg_session_duration', avgSessionDuration, dateOnly);
    console.log(`记录平均会话时长: ${avgSessionDuration.toFixed(1)}分钟`);
    
    // 记录用户留存率 (模拟数据)
    const retentionDay1 = 85;
    const retentionDay7 = 65;
    const retentionDay30 = 45;
    await userAnalyticsDAO.record('retention_day1', retentionDay1, dateOnly);
    await userAnalyticsDAO.record('retention_day7', retentionDay7, dateOnly);
    await userAnalyticsDAO.record('retention_day30', retentionDay30, dateOnly);
    console.log(`记录用户留存率: 1天 ${retentionDay1}%, 7天 ${retentionDay7}%, 30天 ${retentionDay30}%`);
    
    // 记录平台分布 (模拟数据)
    const desktopPercentage = 65;
    const mobilePercentage = 30;
    const tabletPercentage = 5;
    await userAnalyticsDAO.record('desktop_percentage', desktopPercentage, dateOnly);
    await userAnalyticsDAO.record('mobile_percentage', mobilePercentage, dateOnly);
    await userAnalyticsDAO.record('tablet_percentage', tabletPercentage, dateOnly);
    console.log(`记录平台分布: 桌面端 ${desktopPercentage}%, 移动端 ${mobilePercentage}%, 平板 ${tabletPercentage}%`);
  } catch (error) {
    console.error('记录用户分析数据失败:', error);
  }
}

/**
 * 获取 CPU 使用率
 * 注意：这是一个简化的实现，实际应用中可能需要更复杂的逻辑
 */
async function getCpuUsage(): Promise<number> {
  return new Promise((resolve) => {
    const startMeasure = cpuAverage();
    
    // 设置延迟以获取有意义的 CPU 使用率样本
    setTimeout(() => {
      const endMeasure = cpuAverage();
      
      // 计算差异
      const idleDifference = endMeasure.idle - startMeasure.idle;
      const totalDifference = endMeasure.total - startMeasure.total;
      
      // 计算 CPU 使用率百分比
      const percentageCpu = 100 - (100 * idleDifference / totalDifference);
      resolve(percentageCpu);
    }, 100);
  });
}

/**
 * 获取平均 CPU 使用情况
 */
function cpuAverage() {
  const cpus = os.cpus();
  let idleMs = 0;
  let totalMs = 0;

  // 循环 CPU 内核
  for (const cpu of cpus) {
    // 累加所有时间
    for (const type in cpu.times) {
      totalMs += cpu.times[type as keyof typeof cpu.times];
    }
    // 累加空闲时间
    idleMs += cpu.times.idle;
  }

  // 返回平均空闲时间和总时间
  return {
    idle: idleMs / cpus.length,
    total: totalMs / cpus.length
  };
}

/**
 * 获取内存使用率
 */
function getMemoryUsage(): number {
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const usedMem = totalMem - freeMem;
  
  return (usedMem / totalMem) * 100;
}

/**
 * 格式化字节数为人类可读格式
 */
function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

// 执行脚本
recordSystemMetrics().catch(console.error);

// 导出函数以便可以从其他地方调用
export { recordSystemMetrics };