'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { UserAnalyticsResponse } from '@/types/database';
import { 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  Cell, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { Users, UserPlus, UserCheck, Clock, TrendingUp, Percent, Globe, Laptop, Smartphone, Tablet } from 'lucide-react';

interface UserAnalyticsData {
  totalUsers: number;
  activeUsers: {
    daily: number;
    weekly: number;
    monthly: number;
  };
  newUsers: {
    daily: number;
    weekly: number;
    monthly: number;
  };
  userGrowth: Array<{
    date: string;
    count: number;
  }>;
  userRetention: {
    day1: number;
    day7: number;
    day30: number;
  };
  conversionRate: number;
  averageSessionDuration: number;
  usersByPlatform: Array<{
    platform: string;
    percentage: number;
  }>;
  usersByCountry: Array<{
    country: string;
    count: number;
  }>;
}

export default function UserAnalytics() {
  const [analytics, setAnalytics] = useState<UserAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState('month');

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        
        // 获取用户分析数据
        const response = await fetch(`/api/admin/user-analytics?range=${timeRange}`);
        if (!response.ok) {
          throw new Error('Failed to fetch user analytics');
        }
        const data = await response.json() as { analytics: UserAnalyticsResponse };
        setAnalytics(data.analytics);
        
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
        console.error('Error fetching user analytics:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
    
    // 设置定时刷新
    const intervalId = setInterval(fetchAnalytics, 300000); // 每5分钟刷新一次
    
    return () => clearInterval(intervalId);
  }, [timeRange]);

  if (loading && !analytics) {
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

  if (!analytics) {
    return null;
  }

  // 为饼图准备颜色
  const PLATFORM_COLORS = ['#0088FE', '#00C49F', '#FFBB28'];
  const COUNTRY_COLORS = ['#8884d8', '#83a6ed', '#8dd1e1', '#82ca9d', '#a4de6c', '#d0ed57'];

  // 格式化百分比
  const formatPercent = (value: number) => `${value}%`;

  return (
    <div className="space-y-6">
      {/* 时间范围选择器 */}
      <div className="flex justify-end mb-4">
        <div className="inline-flex rounded-md shadow-sm">
          <button
            onClick={() => setTimeRange('week')}
            className={`px-4 py-2 text-sm font-medium rounded-l-lg ${
              timeRange === 'week' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            本周
          </button>
          <button
            onClick={() => setTimeRange('month')}
            className={`px-4 py-2 text-sm font-medium ${
              timeRange === 'month' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            本月
          </button>
          <button
            onClick={() => setTimeRange('year')}
            className={`px-4 py-2 text-sm font-medium rounded-r-lg ${
              timeRange === 'year' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            全年
          </button>
        </div>
      </div>

      {/* 关键指标卡片 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总用户数</CardTitle>
            <Users className="text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalUsers.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              平台注册用户总数
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">日活跃用户</CardTitle>
            <UserCheck className="text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.activeUsers.daily.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              活跃率: {((analytics.activeUsers.daily / analytics.totalUsers) * 100).toFixed(1)}%
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">新增用户</CardTitle>
            <UserPlus className="text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.newUsers.daily.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              今日新注册用户
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">转化率</CardTitle>
            <Percent className="text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.conversionRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              免费用户转为付费用户的比例
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 用户增长图表 */}
      <Card>
        <CardHeader>
          <CardTitle>用户增长趋势</CardTitle>
          <CardDescription>平台用户数量增长情况</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analytics.userGrowth}>
                <defs>
                  <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip formatter={(value) => [value.toLocaleString(), '用户数']} />
                <Area type="monotone" dataKey="count" stroke="#8884d8" fillOpacity={1} fill="url(#colorUsers)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* 用户留存和会话时长 */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>用户留存率</CardTitle>
            <CardDescription>不同时间段的用户留存情况</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={[
                    { name: '1天后', value: analytics.userRetention.day1 },
                    { name: '7天后', value: analytics.userRetention.day7 },
                    { name: '30天后', value: analytics.userRetention.day30 }
                  ]}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip formatter={(value) => [`${value}%`, '留存率']} />
                  <Bar dataKey="value" fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>平均会话时长</CardTitle>
            <CardDescription>用户平均使用时长: {analytics.averageSessionDuration} 分钟</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-center">
            <div className="relative h-[200px] w-[200px]">
              <div className="absolute inset-0 flex items-center justify-center">
                <Clock className="h-16 w-16 text-blue-500" />
              </div>
              <div className="absolute inset-0 flex items-center justify-center mt-24">
                <div className="text-center">
                  <div className="text-3xl font-bold">{analytics.averageSessionDuration}</div>
                  <div className="text-sm text-gray-500">分钟/会话</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 用户平台分布 */}
      <Card>
        <CardHeader>
          <CardTitle>用户平台分布</CardTitle>
          <CardDescription>用户使用的设备平台分布</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="h-[300px] flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={analytics.usersByPlatform}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="percentage"
                    nameKey="platform"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {analytics.usersByPlatform.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PLATFORM_COLORS[index % PLATFORM_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value}%`, '占比']} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-col justify-center space-y-4">
              <div className="flex items-center">
                <Laptop className="h-5 w-5 text-blue-500 mr-2" />
                <div>
                  <div className="text-sm font-medium">桌面端</div>
                  <div className="text-xs text-gray-500">Chrome, Firefox, Safari 等</div>
                </div>
                <div className="ml-auto font-medium">{analytics.usersByPlatform[0].percentage}%</div>
              </div>
              <div className="flex items-center">
                <Smartphone className="h-5 w-5 text-green-500 mr-2" />
                <div>
                  <div className="text-sm font-medium">移动端</div>
                  <div className="text-xs text-gray-500">iOS, Android</div>
                </div>
                <div className="ml-auto font-medium">{analytics.usersByPlatform[1].percentage}%</div>
              </div>
              <div className="flex items-center">
                <Tablet className="h-5 w-5 text-yellow-500 mr-2" />
                <div>
                  <div className="text-sm font-medium">平板</div>
                  <div className="text-xs text-gray-500">iPad, Android 平板</div>
                </div>
                <div className="ml-auto font-medium">{analytics.usersByPlatform[2].percentage}%</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 用户地理分布 */}
      <Card>
        <CardHeader>
          <CardTitle>用户地理分布</CardTitle>
          <CardDescription>用户所在国家/地区分布</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={analytics.usersByCountry}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="country" type="category" width={80} />
                <Tooltip formatter={(value) => [value.toLocaleString(), '用户数']} />
                <Bar dataKey="count" fill="#8884d8">
                  {analytics.usersByCountry.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COUNTRY_COLORS[index % COUNTRY_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* 活跃用户和新用户对比 */}
      <Card>
        <CardHeader>
          <CardTitle>活跃用户与新用户对比</CardTitle>
          <CardDescription>不同时间段的活跃用户和新增用户数据</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={[
                  { name: '日', active: analytics.activeUsers.daily, new: analytics.newUsers.daily },
                  { name: '周', active: analytics.activeUsers.weekly, new: analytics.newUsers.weekly },
                  { name: '月', active: analytics.activeUsers.monthly, new: analytics.newUsers.monthly }
                ]}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="active" name="活跃用户" fill="#8884d8" />
                <Bar dataKey="new" name="新增用户" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* 导出报告按钮 */}
      <div className="flex justify-end">
        <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
          导出用户分析报告
        </button>
      </div>
    </div>
  );
}