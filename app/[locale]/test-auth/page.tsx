'use client'

import { useEffect, useState } from 'react'
import { useUnifiedAuth } from '@/hooks/useUnifiedAuth'
import { logAuthDebugInfo, checkAuthConsistency } from '@/utils/authDebug'

export default function TestAuthPage() {
  const { user, isLoggedIn, userPoints, loading } = useUnifiedAuth()
  const [debugInfo, setDebugInfo] = useState<any>(null)
  const [apiResponse, setApiResponse] = useState<Record<string, any> | null>(null)
  const [networkStatus, setNetworkStatus] = useState<string>('unknown')

  useEffect(() => {
    // 延迟执行，确保认证状态已加载
    const timer = setTimeout(() => {
      logAuthDebugInfo()
      const consistency = checkAuthConsistency()
      setDebugInfo(consistency)
      
      // 测试API调用
      testApiCall()
      
      // 检查网络状态
      checkNetworkStatus()
    }, 1000)

    return () => clearTimeout(timer)
  }, [isLoggedIn])

  const testApiCall = async () => {
    try {
      setNetworkStatus('testing')
      const startTime = Date.now()
      
      const response = await fetch('/api/getRemainingGenerations', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Cache-Control': 'no-cache'
        }
      })
      
      const endTime = Date.now()
      const responseTime = endTime - startTime
      
      if (response.ok) {
        const data = await response.json()
        // 确保data是对象类型，如果不是则包装成对象
        const responseData = typeof data === 'object' && data !== null ? data : { value: data }
        setApiResponse({ ...responseData, responseTime })
        setNetworkStatus('success')
        console.log('API Response:', data, `Response time: ${responseTime}ms`)
      } else {
        console.error('API failed:', response.status)
        setNetworkStatus('failed')
      }
    } catch (error) {
      console.error('API error:', error)
      setNetworkStatus('error')
    }
  }

  const checkNetworkStatus = async () => {
    try {
      const response = await fetch('https://flux-ai.liukai19911010.workers.dev/getuserpoints', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({userId: 1})
      })
      setNetworkStatus(response.ok ? 'worker-ok' : 'worker-failed')
    } catch (error) {
      setNetworkStatus('worker-error')
    }
  }

  const testAuthFlow = () => {
    if (typeof window !== 'undefined' && (window as any).testAuthFlow) {
      (window as any).testAuthFlow.testAuthState()
    } else {
      console.log('Test functions not loaded')
    }
  }

  const clearAuthData = () => {
    if (typeof window !== 'undefined' && (window as any).testAuthFlow) {
      (window as any).testAuthFlow.clearAuthData()
    }
    localStorage.removeItem('user')
    document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Lax'
    window.location.reload()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white/80">Loading authentication status...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Authentication Test Page</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 认证状态 */}
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
            <h2 className="text-xl font-semibold mb-4">Authentication Status</h2>
            <div className="space-y-2">
              <p><strong>Is Logged In:</strong> {isLoggedIn ? '✅ Yes' : '❌ No'}</p>
              <p><strong>Loading:</strong> {loading ? '🔄 Yes' : '✅ No'}</p>
              <p><strong>User Points:</strong> {userPoints || 0}</p>
              <p><strong>User ID:</strong> {user?.userId || 'None'}</p>
              <p><strong>User Name:</strong> {user?.name || 'None'}</p>
              <p><strong>User Email:</strong> {user?.email || 'None'}</p>
            </div>
          </div>

          {/* 调试信息 */}
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
            <h2 className="text-xl font-semibold mb-4">Debug Information</h2>
            {debugInfo && (
              <div className="space-y-2">
                <p><strong>Consistent:</strong> {debugInfo.isConsistent ? '✅ Yes' : '❌ No'}</p>
                {debugInfo.issues.length > 0 && (
                  <div>
                    <p><strong>Issues:</strong></p>
                    <ul className="list-disc list-inside ml-4">
                      {debugInfo.issues.map((issue: string, index: number) => (
                        <li key={index} className="text-red-300">{issue}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {debugInfo.recommendations.length > 0 && (
                  <div>
                    <p><strong>Recommendations:</strong></p>
                    <ul className="list-disc list-inside ml-4">
                      {debugInfo.recommendations.map((rec: string, index: number) => (
                        <li key={index} className="text-yellow-300">{rec}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* 网络状态 */}
        <div className="mt-6 bg-white/10 backdrop-blur-sm rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-4">Network Status</h2>
          <div className="space-y-2">
            <p><strong>Worker Status:</strong> 
              {networkStatus === 'worker-ok' && '✅ Connected'}
              {networkStatus === 'worker-failed' && '❌ Failed'}
              {networkStatus === 'worker-error' && '⚠️ Error'}
              {networkStatus === 'testing' && '🔄 Testing...'}
              {networkStatus === 'unknown' && '❓ Unknown'}
            </p>
            {apiResponse && (
              <p><strong>API Response Time:</strong> {apiResponse.responseTime}ms</p>
            )}
          </div>
        </div>

        {/* API响应信息 */}
        {apiResponse && (
          <div className="mt-6 bg-white/10 backdrop-blur-sm rounded-xl p-6">
            <h2 className="text-xl font-semibold mb-4">API Response</h2>
            <div className="space-y-2">
              <p><strong>API Is Logged In:</strong> {apiResponse.isLoggedIn ? '✅ Yes' : '❌ No'}</p>
              <p><strong>API User Points:</strong> {apiResponse.userPoints || 0}</p>
              <p><strong>API User ID:</strong> {apiResponse.userId || 'None'}</p>
              <p><strong>Remaining Free Generations:</strong> {apiResponse.remainingFreeGenerations}</p>
            </div>
          </div>
        )}

        {/* 操作按钮 */}
        <div className="mt-8 bg-white/10 backdrop-blur-sm rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-4">Actions</h2>
          <div className="flex flex-wrap gap-4">
            <button
              onClick={() => {
                logAuthDebugInfo()
                const consistency = checkAuthConsistency()
                setDebugInfo(consistency)
                testApiCall()
                checkNetworkStatus()
              }}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors"
            >
              Refresh Debug Info
            </button>
            <button
              onClick={testAuthFlow}
              className="px-4 py-2 bg-green-500 hover:bg-green-600 rounded-lg transition-colors"
            >
              Test Auth Flow
            </button>
            <button
              onClick={clearAuthData}
              className="px-4 py-2 bg-red-500 hover:bg-red-600 rounded-lg transition-colors"
            >
              Clear All Auth Data
            </button>
            <button
              onClick={() => window.location.href = '/en/auth'}
              className="px-4 py-2 bg-purple-500 hover:bg-purple-600 rounded-lg transition-colors"
            >
              Go to Login
            </button>
          </div>
        </div>
      </div>
    </div>
  )
} 