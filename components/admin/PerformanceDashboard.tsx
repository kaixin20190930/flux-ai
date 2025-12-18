'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Tabs } from '@/components/ui/tabs';

interface PerformanceMetric {
  name: string;
  value: number;
  unit: 'ms' | 'bytes' | 'count' | 'percentage';
  timestamp: Date;
  context?: Record<string, any>;
}

interface PerformanceStats {
  count: number;
  average: number;
  min: number;
  max: number;
  p95: number;
  p99: number;
}

interface SystemOverview {
  totalMetrics: number;
  recentErrors: number;
  averageResponseTime: number;
  memoryUsage: number;
  topSlowOperations: Array<{ name: string; averageTime: number }>;
  performanceScore: number;
  healthStatus: 'healthy' | 'warning' | 'critical';
  recommendations: string[];
}

interface CacheStats {
  imageProcessing: {
    size: number;
    hitRate: number;
    memoryUsage: number;
  };
}

interface ActiveJob {
  jobId: string;
  progress: number;
  estimatedCompletion: number;
  elapsedTime: number;
}

interface PerformanceData {
  timestamp: string;
  systemOverview: SystemOverview;
  performanceReport: {
    summary: {
      totalRequests: number;
      averageResponseTime: number;
      errorRate: number;
      throughput: number;
    };
    trends: {
      responseTimeTrend: Array<{ time: Date; value: number }>;
      errorRateTrend: Array<{ time: Date; value: number }>;
      throughputTrend: Array<{ time: Date; value: number }>;
    };
    bottlenecks: Array<{
      operation: string;
      averageTime: number;
      count: number;
      impact: 'high' | 'medium' | 'low';
    }>;
    recommendations: string[];
  };
  cacheStats: CacheStats;
  activeJobs: ActiveJob[];
  errorStats: {
    totalErrors: number;
    errorsByCode: Record<string, number>;
    errorRate: number;
    topErrors: Array<{ code: string; count: number }>;
  };
}

export default function PerformanceDashboard() {
  const [performanceData, setPerformanceData] = useState<PerformanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMetric, setSelectedMetric] = useState<string>('');
  const [autoRefresh, setAutoRefresh] = useState(true);

  // 获取性能数据
  const fetchPerformanceData = async () => {
    try {
      const params = new URLSearchParams();
      params.append('recommendations', 'true');
      if (selectedMetric) {
        params.append('metric', selectedMetric);
      }

      const response = await fetch(`/api/performance/analytics?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch performance data');
      }

      const data = await response.json() as PerformanceData;
      setPerformanceData(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  // 手动触发优化
  const triggerOptimization = async () => {
    try {
      const response = await fetch('/api/performance/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cleanup' })
      });
      
      if (response.ok) {
        await fetchPerformanceData(); // 刷新数据
      }
    } catch (err) {
      console.error('Failed to trigger optimization:', err);
    }
  };

  // 自动刷新
  useEffect(() => {
    fetchPerformanceData();

    if (autoRefresh) {
      const interval = setInterval(fetchPerformanceData, 30000); // 30秒刷新
      return () => clearInterval(interval);
    }
  }, [selectedMetric, autoRefresh]);

  // 格式化时间
  const formatDuration = (ms: number): string => {
    if (ms < 1000) return `${ms.toFixed(0)}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  // 格式化字节
  const formatBytes = (bytes: number): string => {
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  };

  // 获取性能状态颜色
  const getPerformanceColor = (value: number, thresholds: { warning: number; critical: number }): string => {
    if (value >= thresholds.critical) return 'text-red-600';
    if (value >= thresholds.warning) return 'text-yellow-600';
    return 'text-green-600';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <h3 className="text-red-800 font-medium">Error Loading Performance Data</h3>
        <p className="text-red-600 mt-1">{error}</p>
        <button
          onClick={fetchPerformanceData}
          className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!performanceData) {
    return <div>No performance data available</div>;
  }

  const { systemOverview, performanceReport, cacheStats, activeJobs, errorStats } = performanceData;

  return (
    <div className="space-y-6">
      {/* 控制面板 */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Performance Dashboard</h2>
          <div className="flex items-center mt-2">
            <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              systemOverview.healthStatus === 'healthy' ? 'bg-green-100 text-green-800' :
              systemOverview.healthStatus === 'warning' ? 'bg-yellow-100 text-yellow-800' :
              'bg-red-100 text-red-800'
            }`}>
              {systemOverview.healthStatus === 'healthy' ? '🟢' : 
               systemOverview.healthStatus === 'warning' ? '🟡' : '🔴'}
              {systemOverview.healthStatus.toUpperCase()}
            </div>
            <span className="ml-2 text-sm text-gray-600">
              Performance Score: {systemOverview.performanceScore}/100
            </span>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="mr-2"
            />
            Auto Refresh
          </label>
          <button
            onClick={triggerOptimization}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Optimize
          </button>
          <button
            onClick={fetchPerformanceData}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* 系统概览 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="p-4">
          <h3 className="text-sm font-medium text-gray-500">Total Requests</h3>
          <p className="text-2xl font-bold text-gray-900">{performanceReport.summary.totalRequests.toLocaleString()}</p>
          <p className="text-xs text-gray-500 mt-1">
            {performanceReport.summary.throughput.toFixed(1)} req/min
          </p>
        </Card>

        <Card className="p-4">
          <h3 className="text-sm font-medium text-gray-500">Error Rate</h3>
          <p className={`text-2xl font-bold ${performanceReport.summary.errorRate > 5 ? 'text-red-600' : 'text-green-600'}`}>
            {performanceReport.summary.errorRate.toFixed(1)}%
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {errorStats.totalErrors} total errors
          </p>
        </Card>

        <Card className="p-4">
          <h3 className="text-sm font-medium text-gray-500">Avg Response Time</h3>
          <p className={`text-2xl font-bold ${getPerformanceColor(performanceReport.summary.averageResponseTime, { warning: 1000, critical: 3000 })}`}>
            {formatDuration(performanceReport.summary.averageResponseTime)}
          </p>
        </Card>

        <Card className="p-4">
          <h3 className="text-sm font-medium text-gray-500">Memory Usage</h3>
          <p className="text-2xl font-bold text-gray-900">
            {formatBytes(systemOverview.memoryUsage)}
          </p>
        </Card>

        <Card className="p-4">
          <h3 className="text-sm font-medium text-gray-500">Cache Hit Rate</h3>
          <p className={`text-2xl font-bold ${cacheStats.imageProcessing.hitRate < 0.7 ? 'text-yellow-600' : 'text-green-600'}`}>
            {(cacheStats.imageProcessing.hitRate * 100).toFixed(1)}%
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {cacheStats.imageProcessing.size} items
          </p>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button className="border-b-2 border-blue-500 py-2 px-1 text-sm font-medium text-blue-600">
              Overview
            </button>
            <button className="border-b-2 border-transparent py-2 px-1 text-sm font-medium text-gray-500 hover:text-gray-700">
              Cache Stats
            </button>
            <button className="border-b-2 border-transparent py-2 px-1 text-sm font-medium text-gray-500 hover:text-gray-700">
              Active Jobs
            </button>
            <button className="border-b-2 border-transparent py-2 px-1 text-sm font-medium text-gray-500 hover:text-gray-700">
              Recent Metrics
            </button>
          </nav>
        </div>

        <div className="mt-6">
          {/* 概览标签页 */}
          <div className="space-y-6">
            {/* 性能建议 */}
            {systemOverview.recommendations && systemOverview.recommendations.length > 0 && (
              <Card className="p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Performance Recommendations</h3>
                <div className="space-y-2">
                  {systemOverview.recommendations.map((recommendation, index) => (
                    <div key={index} className="flex items-start">
                      <div className="flex-shrink-0">
                        <div className="w-2 h-2 bg-blue-400 rounded-full mt-2"></div>
                      </div>
                      <p className="ml-3 text-sm text-gray-700">{recommendation}</p>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* 性能瓶颈 */}
            <Card className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Performance Bottlenecks</h3>
              <div className="space-y-3">
                {performanceReport.bottlenecks.slice(0, 5).map((bottleneck, index) => (
                  <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <div>
                      <span className="text-sm font-medium text-gray-900">{bottleneck.operation}</span>
                      <div className="flex items-center mt-1">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          bottleneck.impact === 'high' ? 'bg-red-100 text-red-800' :
                          bottleneck.impact === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {bottleneck.impact.toUpperCase()}
                        </span>
                        <span className="ml-2 text-xs text-gray-500">{bottleneck.count} calls</span>
                      </div>
                    </div>
                    <span className={`text-sm font-medium ${getPerformanceColor(bottleneck.averageTime, { warning: 1000, critical: 3000 })}`}>
                      {formatDuration(bottleneck.averageTime)}
                    </span>
                  </div>
                ))}
              </div>
            </Card>

            {/* 缓存统计 */}
            <Card className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Cache Performance</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Image Processing Cache</h4>
                  <div className="mt-2 space-y-1">
                    <p className="text-sm">Size: {cacheStats.imageProcessing.size} items</p>
                    <p className="text-sm">Hit Rate: {(cacheStats.imageProcessing.hitRate * 100).toFixed(1)}%</p>
                    <p className="text-sm">Memory: {formatBytes(cacheStats.imageProcessing.memoryUsage)}</p>
                  </div>
                </div>
              </div>
            </Card>

            {/* 活跃任务 */}
            {activeJobs.length > 0 && (
              <Card className="p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Active Jobs</h3>
                <div className="space-y-3">
                  {activeJobs.map((job) => (
                    <div key={job.jobId} className="border rounded-lg p-3">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium">{job.jobId}</span>
                        <span className="text-sm text-gray-500">
                          {formatDuration(job.elapsedTime)} elapsed
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${job.progress * 100}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>{(job.progress * 100).toFixed(1)}% complete</span>
                        <span>ETA: {formatDuration(job.estimatedCompletion)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* 错误统计 */}
            <Card className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Error Statistics</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Top Error Types</h4>
                  <div className="space-y-2">
                    {errorStats.topErrors.slice(0, 5).map((error, index) => (
                      <div key={index} className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">{error.code}</span>
                        <span className="text-sm font-medium text-red-600">{error.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Error Distribution</h4>
                  <div className="space-y-2">
                    {Object.entries(errorStats.errorsByCode).slice(0, 5).map(([code, count], index) => (
                      <div key={index} className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">{code}</span>
                        <div className="flex items-center">
                          <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                            <div
                              className="bg-red-600 h-2 rounded-full"
                              style={{ width: `${(count / errorStats.totalErrors) * 100}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-medium">{count}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </Tabs>
    </div>
  );
}