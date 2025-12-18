import React from 'react';
import Link from 'next/link';
import { 
  BarChart3, 
  Users, 
  Settings, 
  FileText, 
  Bell, 
  Database, 
  Download,
  Home,
  LogOut,
  Activity
} from 'lucide-react';

interface AdminSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export default function AdminSidebar({ activeTab, onTabChange }: AdminSidebarProps) {
  const menuItems = [
    { id: 'system', label: '系统监控', icon: <BarChart3 className="w-5 h-5" /> },
    { id: 'performance', label: '性能监控', icon: <Activity className="w-5 h-5" /> },
    { id: 'users', label: '用户分析', icon: <Users className="w-5 h-5" /> },
    { id: 'export', label: '数据导出', icon: <Download className="w-5 h-5" /> },
    { id: 'settings', label: '系统设置', icon: <Settings className="w-5 h-5" /> },
    { id: 'logs', label: '系统日志', icon: <FileText className="w-5 h-5" /> },
    { id: 'alerts', label: '告警设置', icon: <Bell className="w-5 h-5" /> },
    { id: 'database', label: '数据库管理', icon: <Database className="w-5 h-5" /> },
  ];

  return (
    <div className="w-64 bg-white shadow-md h-screen fixed left-0 top-0 overflow-y-auto">
      <div className="p-4 border-b">
        <h2 className="text-xl font-bold text-gray-800">管理员控制台</h2>
      </div>
      
      <nav className="mt-4">
        <ul>
          {menuItems.map((item) => (
            <li key={item.id} className="mb-1">
              <button
                onClick={() => onTabChange(item.id)}
                className={`flex items-center w-full px-4 py-3 text-left ${
                  activeTab === item.id
                    ? 'bg-blue-50 text-blue-600 border-r-4 border-blue-600'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <span className="mr-3">{item.icon}</span>
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      </nav>
      
      <div className="absolute bottom-0 w-full border-t p-4">
        <div className="flex items-center mb-4">
          <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">
            A
          </div>
          <div className="ml-3">
            <p className="font-medium text-gray-800">管理员</p>
            <p className="text-xs text-gray-500">admin@example.com</p>
          </div>
        </div>
        
        <div className="flex space-x-2">
          <Link href="/dashboard" className="flex items-center justify-center px-3 py-2 bg-gray-100 rounded text-gray-700 text-sm hover:bg-gray-200 flex-1">
            <Home className="w-4 h-4 mr-1" />
            主页
          </Link>
          <button className="flex items-center justify-center px-3 py-2 bg-gray-100 rounded text-gray-700 text-sm hover:bg-gray-200 flex-1">
            <LogOut className="w-4 h-4 mr-1" />
            登出
          </button>
        </div>
      </div>
    </div>
  );
}