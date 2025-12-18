'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { AlertTriangle, CheckCircle, Activity, Server, Cpu, Database, Clock, Users } from 'lucide-react';

interface SystemMetric {
  id: string;
  metricName: string;
  metricValue: number;
  recordedAt: string;
}

interface MetricHistory {
  timestamp: string;
  value: number;
}

interface Alert {
  id: string;
  level: 'info' | 'warning' | 'error';
  message: string;
  timestamp: string;
  resolved: boolean;
}

export default function SystemMetrics() {
  const [metrics, setMetrics] = useState<SystemMetric[]>([]);
  const [cpuHistory, setCpuHistory] = useState<MetricHistory[]>([]);
  const [memoryHistory, setMemoryHistory] = useState<MetricHistory[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState('24h');

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        setLoading(true);
        
        // 获取最新指标
        const metricsResponse = await fetch('/api/admin/metrics/latest', {
          credentials: 'include'
        });
        if (!metricsResponse.ok) {
          throw new Error('Failed to fetch metrics');
        }
        const metricsData = await metricsResponse.json() as { metrics: SystemMetric[] };
        setMetrics(metricsData.metrics);
        
        // 获取CPU历史数据
        const cpuResponse = await fetch(`/api/admin/metrics/history?name=cpu_usage&range=${timeRange}`);
        if (!cpuResponse.ok) {
          throw new Error('Failed to fetch CPU history');
        }
        const cpuData = await cpuResponse.json() as { history: SystemMetric[] };
        setCpuHistory(cpuData.history.map((item: SystemMetric) => ({
          timestamp: new Date(item.recordedAt).toLocaleTimeString(),
          value: item.metricValue
        })));
        
        // 获取内存历史数据
        const memoryResponse = await fetch(`/api/admin/metrics/history?name=memory_usage&range=${timeRange}`);
        if (!memoryResponse.ok) {
          throw new Error('Failed to fetch memory history');
        }
        const memoryData = await memoryResponse.json() as { history: SystemMetric[] };
        setMemoryHistory(memoryData.history.map((item: SystemMetric) => ({
          timestamp: new Date(item.recordedAt).toLocaleTimeString(),
          value: item.metricValue
        })));
        
        // 获取告警数据
        const alertsResponse = await fetch('/api/admin/alerts', {
          credentials: 'include'
        });
        if (!alertsResponse.ok) {
          throw new Error('Failed to fetch alerts');
        }
        const alertsData = await alertsResponse.json() as { alerts: any[] };
        setAlerts(alertsData.alerts);
        
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
        console.error('Error fetching metrics:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
    
    // 设置定时刷新
    const intervalId = setInterval(fetchMetrics, 60000); // 每分钟刷新一次
    
    return () => clearInterval(intervalId);
  }, [timeRange]);

  const getMetricValue = (name: string): number => {
    const metric = metrics.find(m => m.metricName === name);
    return metric ? metric.metricValue : 0;
  };

  const getStatusColor = (value: number, thresholds: [number, number]): string => {
    const [warning, critical] = thresholds;
    if (value >= critical) return 'text-red-500';
    if (value >= warning) return 'text-yellow-500';
    return 'text-green-500';
  };

  const formatPercentage = (value: number): string => {
    return `${value.toFixed(1)}%`;
  };

  const formatBytes = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  };

  const formatMs = (ms: number): string => {
    if (ms < 1000) return `${ms.toFixed(0)} ms`;
    return `${(ms / 1000).toFixed(2)} s`;
  };

  if (loading && metrics.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
        <strong className="font-bold">Error: </strong>
        <span className="block sm:inline">{error}</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 时间范围选择器 */}
      <div className="flex justify-end mb-4">
        <div className="inline-flex rounded-md shadow-sm">
          <button
            onClick={() => setTimeRange('1h')}
            className={`px-4 py-2 text-sm font-medium rounded-l-lg ${
              timeRange === '1h' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            1小时
          </button>
          <button
            onClick={() => setTimeRange('24h')}
            className={`px-4 py-2 text-sm font-medium ${
              timeRange === '24h' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            24小时
          </button>
          <button
            onClick={() => setTimeRange('7d')}
            className={`px-4 py-2 text-sm font-medium rounded-r-lg ${
              timeRange === '7d' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            7天
          </button>
        </div>
      </div>

      {/* 关键指标卡片 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">CPU 使用率</CardTitle>
            <Cpu className={getStatusColor(getMetricValue('cpu_usage'), [70, 90])} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPercentage(getMetricValue('cpu_usage'))}</div>
            <p className="text-xs text-muted-foreground">
              {getMetricValue('cpu_usage') > 80 ? '负载较高' : '正常范围内'}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">内存使用率</CardTitle>
            <Server className={getStatusColor(getMetricValue('memory_usage'), [80, 95])} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPercentage(getMetricValue('memory_usage'))}</div>
            <p className="text-xs text-muted-foreground">
              总内存: {formatBytes(getMetricValue('total_memory'))}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">响应时间</CardTitle>
            <Clock className={getStatusColor(getMetricValue('response_time'), [500, 1000])} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatMs(getMetricValue('response_time'))}</div>
            <p className="text-xs text-muted-foreground">
              {getMetricValue('response_time') < 300 ? '响应迅速' : '需要优化'}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">活跃用户</CardTitle>
            <Users className="text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getMetricValue('active_users')}</div>
            <p className="text-xs text-muted-foreground">
              当前在线用户数
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 图表区域 */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>CPU 使用率历史</CardTitle>
            <CardDescription>过去{timeRange === '1h' ? '1小时' : timeRange === '24h' ? '24小时' : '7天'}的CPU使用情况</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={cpuHistory}>
                  <defs>
                    <linearGradient id="colorCpu" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="timestamp" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Area type="monotone" dataKey="value" stroke="#8884d8" fillOpacity={1} fill="url(#colorCpu)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>内存使用率历史</CardTitle>
            <CardDescription>过去{timeRange === '1h' ? '1小时' : timeRange === '24h' ? '24小时' : '7天'}的内存使用情况</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={memoryHistory}>
                  <defs>
                    <linearGradient id="colorMemory" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#82ca9d" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="timestamp" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Area type="monotone" dataKey="value" stroke="#82ca9d" fillOpacity={1} fill="url(#colorMemory)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 系统资源使用情况 */}
      <Card>
        <CardHeader>
          <CardTitle>系统资源使用情况</CardTitle>
          <CardDescription>各项系统资源的当前使用状态</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={[
                  { name: 'CPU', value: getMetricValue('cpu_usage') },
                  { name: '内存', value: getMetricValue('memory_usage') },
                  { name: '存储', value: getMetricValue('storage_usage') },
                  { name: '网络', value: getMetricValue('network_usage') },
                  { name: '数据库', value: getMetricValue('database_usage') },
                ]}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis domain={[0, 100]} />
                <Tooltip formatter={(value) => [`${value}%`, '使用率']} />
                <Bar dataKey="value" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* 告警和通知 */}
      <Card>
        <CardHeader>
          <CardTitle>系统告警</CardTitle>
          <CardDescription>最近的系统告警和通知</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {alerts.length === 0 ? (
              <div className="flex items-center justify-center p-6 text-center">
                <div>
                  <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
                  <h3 className="mt-2 text-lg font-medium">系统运行正常</h3>
                  <p className="mt-1 text-sm text-gray-500">目前没有任何告警</p>
                </div>
              </div>
            ) : (
              alerts.map((alert) => (
                <div 
                  key={alert.id} 
                  className={`flex items-start p-4 rounded-lg ${
                    alert.level === 'error' 
                      ? 'bg-red-50 border-l-4 border-red-500' 
                      : alert.level === 'warning'
                        ? 'bg-yellow-50 border-l-4 border-yellow-500'
                        : 'bg-blue-50 border-l-4 border-blue-500'
                  }`}
                >
                  <div className="flex-shrink-0">
                    {alert.level === 'error' ? (
                      <AlertTriangle className="h-5 w-5 text-red-500" />
                    ) : alert.level === 'warning' ? (
                      <AlertTriangle className="h-5 w-5 text-yellow-500" />
                    ) : (
                      <Activity className="h-5 w-5 text-blue-500" />
                    )}
                  </div>
                  <div className="ml-3 flex-1">
                    <div className="flex items-center justify-between">
                      <p className={`text-sm font-medium ${
                        alert.level === 'error' 
                          ? 'text-red-800' 
                          : alert.level === 'warning'
                            ? 'text-yellow-800'
                            : 'text-blue-800'
                      }`}>
                        {alert.level === 'error' 
                          ? '错误' 
                          : alert.level === 'warning'
                            ? '警告'
                            : '信息'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(alert.timestamp).toLocaleString()}
                      </p>
                    </div>
                    <p className="text-sm mt-1">{alert.message}</p>
                    {alert.resolved && (
                      <p className="text-xs text-green-600 mt-1 flex items-center">
                        <CheckCircle className="h-3 w-3 mr-1" /> 已解决
                      </p>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}