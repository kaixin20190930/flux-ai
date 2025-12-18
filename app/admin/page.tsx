'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import SystemMetrics from '@/components/admin/SystemMetrics';
import UserAnalytics from '@/components/admin/UserAnalytics';
import AdminSidebar from '@/components/admin/AdminSidebar';
import PerformanceDashboard from '@/components/admin/PerformanceDashboard';

export default function AdminDashboardPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState('system');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push('/auth');
      } else {
        // 检查用户是否为管理员
        fetch('/api/admin/check-permission', {
            credentials: 'include'
          })
          .then(res => {
            if (!res.ok) {
              throw new Error('Not authorized');
            }
            return res.json();
          })
          .then(data => {
            // 类型安全的处理
            const response = data as { isAdmin: boolean };
            setIsAdmin(response.isAdmin);
          })
          .catch(() => {
            router.push('/dashboard');
          });
      }
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading || !isAdmin) {
    return <div className="flex items-center justify-center min-h-screen">加载中...</div>;
  }

  return (
    <div className="flex">
      {/* 侧边栏 */}
      <AdminSidebar activeTab={activeTab} onTabChange={setActiveTab} />
      
      {/* 主内容区 */}
      <div className="flex-1 ml-64 p-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">管理员仪表盘</h1>
          <div className="flex items-center space-x-4">
            <div className="relative">
              <button className="p-2 bg-white rounded-full shadow">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                <span className="absolute top-0 right-0 h-2 w-2 bg-red-500 rounded-full"></span>
              </button>
            </div>
            <div className="bg-white p-2 rounded-full shadow">
              <img src="https://via.placeholder.com/40" alt="Admin" className="h-8 w-8 rounded-full" />
            </div>
          </div>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="hidden">
            <TabsTrigger value="system">系统监控</TabsTrigger>
            <TabsTrigger value="performance">性能监控</TabsTrigger>
            <TabsTrigger value="users">用户分析</TabsTrigger>
            <TabsTrigger value="export">数据导出</TabsTrigger>
            <TabsTrigger value="settings">系统设置</TabsTrigger>
            <TabsTrigger value="logs">系统日志</TabsTrigger>
            <TabsTrigger value="alerts">告警设置</TabsTrigger>
            <TabsTrigger value="database">数据库管理</TabsTrigger>
          </TabsList>

        <TabsContent value="system" className="space-y-4">
          <SystemMetrics />
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <PerformanceDashboard />
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <UserAnalytics />
        </TabsContent>

        <TabsContent value="export" className="space-y-4">
          <div className="grid gap-4">
            <div className="p-6 bg-white rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-4">数据导出</h2>
              <p className="mb-4">导出系统数据用于分析和报告。</p>
              
              <div className="space-y-4">
                <div className="flex flex-col space-y-2">
                  <label className="font-medium">选择数据类型</label>
                  <select 
                    id="dataType" 
                    className="border rounded p-2"
                    onChange={(e) => {
                      // 可以根据数据类型调整其他选项
                      const dataType = e.target.value;
                      console.log(`Selected data type: ${dataType}`);
                    }}
                  >
                    <option value="user_stats">用户统计</option>
                    <option value="system_metrics">系统指标</option>
                    <option value="generation_history">生成历史</option>
                    <option value="batch_jobs">批量任务</option>
                  </select>
                </div>
                
                <div className="flex flex-col space-y-2">
                  <label className="font-medium">日期范围</label>
                  <div className="flex flex-wrap space-x-2">
                    <input 
                      type="date" 
                      id="startDate" 
                      className="border rounded p-2"
                      defaultValue={new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                    />
                    <span className="self-center">至</span>
                    <input 
                      type="date" 
                      id="endDate" 
                      className="border rounded p-2"
                      defaultValue={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                </div>
                
                <div className="flex flex-col space-y-2">
                  <label className="font-medium">格式</label>
                  <div className="flex flex-wrap space-x-4">
                    <label className="flex items-center">
                      <input type="radio" name="format" value="csv" className="mr-2" defaultChecked />
                      CSV
                    </label>
                    <label className="flex items-center">
                      <input type="radio" name="format" value="json" className="mr-2" />
                      JSON
                    </label>
                    <label className="flex items-center">
                      <input type="radio" name="format" value="excel" className="mr-2" />
                      Excel
                    </label>
                  </div>
                </div>
                
                <div className="flex flex-col space-y-2">
                  <button 
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 flex items-center justify-center"
                    onClick={async () => {
                      try {
                        // 获取选择的值
                        const dataTypeElement = document.getElementById('dataType') as HTMLSelectElement | null;
                        const dataType = dataTypeElement?.value;
                        const startDate = (document.getElementById('startDate') as HTMLInputElement).value;
                        const endDate = (document.getElementById('endDate') as HTMLInputElement).value;
                        const format = document.querySelector('input[name="format"]:checked') as HTMLInputElement;
                        
                        if (!dataType || !startDate || !endDate || !format) {
                          alert('请填写所有必要字段');
                          return;
                        }
                        
                        // 显示加载状态
                        const exportButton = document.getElementById('exportButton');
                        if (exportButton) {
                          exportButton.innerHTML = '<span class="animate-spin mr-2">⏳</span> 导出中...';
                          exportButton.setAttribute('disabled', 'true');
                        }
                        
                        // 发送导出请求
                        const response = await fetch('/api/admin/export', {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json',
                          },
                          body: JSON.stringify({
                            dataType,
                            dateRange: { start: startDate, end: endDate },
                            format: format.value
                          })
                        });
                        
                        if (!response.ok) {
                          throw new Error(`导出失败: ${response.statusText}`);
                        }
                        
                        // 获取文件名
                        const contentDisposition = response.headers.get('Content-Disposition');
                        let filename = `${dataType}_export.${format.value}`;
                        if (contentDisposition) {
                          const filenameMatch = contentDisposition.match(/filename="(.+)"/);
                          if (filenameMatch && filenameMatch[1]) {
                            filename = filenameMatch[1];
                          }
                        }
                        
                        // 下载文件
                        const blob = await response.blob();
                        const url = window.URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.style.display = 'none';
                        a.href = url;
                        a.download = filename;
                        document.body.appendChild(a);
                        a.click();
                        window.URL.revokeObjectURL(url);
                        
                        // 恢复按钮状态
                        if (exportButton) {
                          exportButton.innerHTML = '导出数据';
                          exportButton.removeAttribute('disabled');
                        }
                        
                      } catch (error) {
                        console.error('导出错误:', error);
                        alert(`导出失败: ${error instanceof Error ? error.message : '未知错误'}`);
                        
                        // 恢复按钮状态
                        const exportButton = document.getElementById('exportButton');
                        if (exportButton) {
                          exportButton.innerHTML = '导出数据';
                          exportButton.removeAttribute('disabled');
                        }
                      }
                    }}
                    id="exportButton"
                  >
                    导出数据
                  </button>
                </div>
                
                <div className="mt-4 text-sm text-gray-500">
                  <p>导出说明:</p>
                  <ul className="list-disc pl-5 space-y-1 mt-2">
                    <li><strong>用户统计</strong>: 包含用户活跃度、增长率、留存率等指标</li>
                    <li><strong>系统指标</strong>: 包含CPU、内存、响应时间等系统性能指标</li>
                    <li><strong>生成历史</strong>: 包含所有图像生成记录及其参数</li>
                    <li><strong>批量任务</strong>: 包含批量生成任务的详细信息和状态</li>
                  </ul>
                </div>
                
                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
                  <h3 className="text-sm font-medium text-blue-800">自动报告生成</h3>
                  <p className="text-xs text-blue-600 mt-1">
                    您可以设置定期自动生成报告并通过邮件接收。
                    <button className="ml-2 text-blue-700 underline">设置自动报告</button>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="settings" className="space-y-4">
          <div className="grid gap-4">
            <div className="p-6 bg-white rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-4">系统设置</h2>
              <p className="mb-4">配置系统参数和全局设置。</p>
              
              <div className="space-y-6">
                <div className="border-b pb-4">
                  <h3 className="text-lg font-medium mb-3">性能设置</h3>
                  <div className="space-y-4">
                    <div className="flex flex-col space-y-2">
                      <label className="font-medium">最大并发请求数</label>
                      <input type="number" className="border rounded p-2" defaultValue="50" />
                      <p className="text-xs text-gray-500">设置系统可以同时处理的最大请求数量</p>
                    </div>
                    
                    <div className="flex flex-col space-y-2">
                      <label className="font-medium">图像处理线程数</label>
                      <input type="number" className="border rounded p-2" defaultValue="4" />
                      <p className="text-xs text-gray-500">设置用于图像处理的线程数量</p>
                    </div>
                    
                    <div className="flex flex-col space-y-2">
                      <label className="font-medium">缓存过期时间（分钟）</label>
                      <input type="number" className="border rounded p-2" defaultValue="60" />
                      <p className="text-xs text-gray-500">设置缓存数据的过期时间</p>
                    </div>
                  </div>
                </div>
                
                <div className="border-b pb-4">
                  <h3 className="text-lg font-medium mb-3">安全设置</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">启用双因素认证</p>
                        <p className="text-xs text-gray-500">为管理员账户启用双因素认证</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" defaultChecked />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">IP访问限制</p>
                        <p className="text-xs text-gray-500">限制只有特定IP地址可以访问管理面板</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                    
                    <div className="flex flex-col space-y-2">
                      <label className="font-medium">会话超时时间（分钟）</label>
                      <input type="number" className="border rounded p-2" defaultValue="30" />
                      <p className="text-xs text-gray-500">设置管理员会话的超时时间</p>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium mb-3">通知设置</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">系统告警邮件通知</p>
                        <p className="text-xs text-gray-500">当系统出现异常时发送邮件通知</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" defaultChecked />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                    
                    <div className="flex flex-col space-y-2">
                      <label className="font-medium">通知邮箱</label>
                      <input type="email" className="border rounded p-2" defaultValue="admin@example.com" />
                      <p className="text-xs text-gray-500">接收系统通知的邮箱地址</p>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-end space-x-3 pt-4">
                  <button className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50">
                    取消
                  </button>
                  <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                    保存设置
                  </button>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="logs" className="space-y-4">
          <div className="grid gap-4">
            <div className="p-6 bg-white rounded-lg shadow">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">系统日志</h2>
                <div className="flex space-x-2">
                  <select className="border rounded p-2 text-sm">
                    <option value="all">所有级别</option>
                    <option value="error">错误</option>
                    <option value="warning">警告</option>
                    <option value="info">信息</option>
                    <option value="debug">调试</option>
                  </select>
                  <button className="px-3 py-2 bg-gray-100 rounded hover:bg-gray-200">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        时间
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        级别
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        模块
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        消息
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        2023-07-23 14:32:45
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                          错误
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        数据库
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        连接池达到最大连接数，无法创建新连接
                      </td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        2023-07-23 14:30:12
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                          警告
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        API
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        API请求速率超过限制，IP: 192.168.1.105
                      </td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        2023-07-23 14:28:56
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                          信息
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        系统
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        系统自动扩容已触发，新增1个实例
                      </td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        2023-07-23 14:25:30
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          调试
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        图像处理
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        批量处理任务完成，处理了128张图像
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-gray-500">
                  显示 1 - 4 条，共 256 条
                </div>
                <div className="flex space-x-2">
                  <button className="px-3 py-1 border rounded text-sm disabled:opacity-50" disabled>
                    上一页
                  </button>
                  <button className="px-3 py-1 border rounded bg-blue-50 text-blue-600 text-sm">
                    1
                  </button>
                  <button className="px-3 py-1 border rounded text-sm">
                    2
                  </button>
                  <button className="px-3 py-1 border rounded text-sm">
                    3
                  </button>
                  <button className="px-3 py-1 border rounded text-sm">
                    下一页
                  </button>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="alerts" className="space-y-4">
          <div className="grid gap-4">
            <div className="p-6 bg-white rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-4">告警设置</h2>
              <p className="mb-4">配置系统告警规则和通知方式。</p>
              
              <div className="space-y-6">
                <div className="border-b pb-4">
                  <h3 className="text-lg font-medium mb-3">性能告警</h3>
                  <div className="space-y-4">
                    <div className="flex flex-col space-y-2">
                      <label className="font-medium">CPU使用率告警阈值 (%)</label>
                      <div className="flex items-center space-x-2">
                        <input type="range" min="50" max="100" defaultValue="80" className="w-full" />
                        <span className="text-sm font-medium">80%</span>
                      </div>
                      <p className="text-xs text-gray-500">当CPU使用率超过此阈值时触发告警</p>
                    </div>
                    
                    <div className="flex flex-col space-y-2">
                      <label className="font-medium">内存使用率告警阈值 (%)</label>
                      <div className="flex items-center space-x-2">
                        <input type="range" min="50" max="100" defaultValue="90" className="w-full" />
                        <span className="text-sm font-medium">90%</span>
                      </div>
                      <p className="text-xs text-gray-500">当内存使用率超过此阈值时触发告警</p>
                    </div>
                    
                    <div className="flex flex-col space-y-2">
                      <label className="font-medium">响应时间告警阈值 (ms)</label>
                      <input type="number" className="border rounded p-2" defaultValue="1000" />
                      <p className="text-xs text-gray-500">当API响应时间超过此阈值时触发告警</p>
                    </div>
                  </div>
                </div>
                
                <div className="border-b pb-4">
                  <h3 className="text-lg font-medium mb-3">业务告警</h3>
                  <div className="space-y-4">
                    <div className="flex flex-col space-y-2">
                      <label className="font-medium">错误率告警阈值 (%)</label>
                      <input type="number" className="border rounded p-2" defaultValue="5" />
                      <p className="text-xs text-gray-500">当API错误率超过此阈值时触发告警</p>
                    </div>
                    
                    <div className="flex flex-col space-y-2">
                      <label className="font-medium">队列积压告警阈值</label>
                      <input type="number" className="border rounded p-2" defaultValue="100" />
                      <p className="text-xs text-gray-500">当队列中待处理任务数超过此阈值时触发告警</p>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium mb-3">通知方式</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">邮件通知</p>
                        <p className="text-xs text-gray-500">通过邮件发送告警通知</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" defaultChecked />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">短信通知</p>
                        <p className="text-xs text-gray-500">通过短信发送告警通知</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Webhook通知</p>
                        <p className="text-xs text-gray-500">通过Webhook发送告警通知</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" defaultChecked />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                    
                    <div className="flex flex-col space-y-2">
                      <label className="font-medium">Webhook URL</label>
                      <input type="text" className="border rounded p-2" defaultValue="https://example.com/webhook/alerts" />
                      <p className="text-xs text-gray-500">接收告警通知的Webhook地址</p>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-end space-x-3 pt-4">
                  <button className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50">
                    重置
                  </button>
                  <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                    保存设置
                  </button>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="database" className="space-y-4">
          <div className="grid gap-4">
            <div className="p-6 bg-white rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-4">数据库管理</h2>
              <p className="mb-4">管理数据库连接、备份和优化。</p>
              
              <div className="space-y-6">
                <div className="border-b pb-4">
                  <h3 className="text-lg font-medium mb-3">数据库状态</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="text-sm text-gray-500">连接数</div>
                      <div className="text-2xl font-bold">24 / 100</div>
                      <div className="mt-2 h-2 bg-gray-200 rounded-full">
                        <div className="h-2 bg-green-500 rounded-full" style={{ width: '24%' }}></div>
                      </div>
                    </div>
                    
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="text-sm text-gray-500">存储使用</div>
                      <div className="text-2xl font-bold">4.2 GB / 10 GB</div>
                      <div className="mt-2 h-2 bg-gray-200 rounded-full">
                        <div className="h-2 bg-blue-500 rounded-full" style={{ width: '42%' }}></div>
                      </div>
                    </div>
                    
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="text-sm text-gray-500">查询性能</div>
                      <div className="text-2xl font-bold">24 ms</div>
                      <div className="text-xs text-green-600 mt-1">良好</div>
                    </div>
                  </div>
                </div>
                
                <div className="border-b pb-4">
                  <h3 className="text-lg font-medium mb-3">数据库备份</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium">自动备份</p>
                        <p className="text-xs text-gray-500">每天自动备份数据库</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" defaultChecked />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                    
                    <div className="flex flex-col space-y-2">
                      <label className="font-medium">备份保留天数</label>
                      <input type="number" className="border rounded p-2" defaultValue="30" />
                      <p className="text-xs text-gray-500">自动备份保留的天数</p>
                    </div>
                    
                    <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                      立即备份
                    </button>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium mb-3">数据库优化</h3>
                  <div className="space-y-4">
                    <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200">
                      优化表结构
                    </button>
                    
                    <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200">
                      清理无用数据
                    </button>
                    
                    <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200">
                      重建索引
                    </button>
                  </div>
                </div>
                
                <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                  <h3 className="text-sm font-medium text-yellow-800">注意事项</h3>
                  <p className="text-xs text-yellow-600 mt-1">
                    数据库优化操作可能会暂时影响系统性能，建议在低峰期进行。
                  </p>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  </div>
  );
}