'use client'

import React, { useState, useEffect } from 'react'
import { Search, Clock, Loader2, Trash2 } from 'lucide-react'
import type { ImageSearchHistory, ImageSearchFilters } from '@/types/database'

interface SearchHistoryProps {
  onReSearch: (query: string, filters: ImageSearchFilters, searchType?: 'text' | 'image', imageUrl?: string) => void
  isLoggedIn: boolean
  onLoginRequired: () => void
  dictionary: any
}

export function SearchHistory({ 
  onReSearch, 
  isLoggedIn,
  onLoginRequired,
  dictionary
}: SearchHistoryProps) {
  const [history, setHistory] = useState<ImageSearchHistory[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [page, setPage] = useState(1)
  const [error, setError] = useState<string | null>(null)
  
  // 调试信息
  React.useEffect(() => {
    console.log('SearchHistory received isLoggedIn:', isLoggedIn);
  }, [isLoggedIn]);
  // 加载搜索历史
  const loadSearchHistory = async (pageNum: number = 1, append: boolean = false) => {
    if (!isLoggedIn) {
      onLoginRequired()
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/image-search/history?page=${pageNum}&limit=20`)
      
      if (!response.ok) {
        if (response.status === 401) {
          onLoginRequired()
          return
        }
        throw new Error('获取搜索历史失败')
      }

      const data: {
        items: ImageSearchHistory[]
        total: number
        page: number
        limit: number
      } = await response.json()
      
      if (append) {
        setHistory(prev => [...prev, ...data.items])
      } else {
        setHistory(data.items)
      }
      
      setHasMore(data.page * data.limit < data.total)
      setPage(pageNum)
      
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载失败')
    } finally {
      setIsLoading(false)
    }
  }

  // 加载更多
  const handleLoadMore = () => {
    if (!isLoading && hasMore) {
      loadSearchHistory(page + 1, true)
    }
  }

  // 删除搜索历史
  const handleDeleteHistory = async (historyId: string) => {
    try {
      const response = await fetch('/api/image-search/history', {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ historyId })
      })

      if (!response.ok) {
        throw new Error('删除失败')
      }

      // 从列表中移除该项
      setHistory(prev => prev.filter(item => item.id !== historyId))
      
    } catch (error) {
      console.error('删除搜索历史失败:', error)
    }
  }

  // 格式化日期时间
  const formatDateTime = (date: Date): string => {
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    
    // 如果是今天
    if (date.toDateString() === now.toDateString()) {
      return `${dictionary.imageSearch?.searchHistory?.timeFormats?.today || 'Today'} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
    }
    
    // 如果是昨天
    const yesterday = new Date(now)
    yesterday.setDate(now.getDate() - 1)
    if (date.toDateString() === yesterday.toDateString()) {
      return `${dictionary.imageSearch?.searchHistory?.timeFormats?.yesterday || 'Yesterday'} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
    }
    
    // 如果是一周内
    if (diff < 7 * 24 * 60 * 60 * 1000) {
      const weekdays = dictionary.imageSearch?.searchHistory?.timeFormats?.weekdays || 
        ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
      return `${weekdays[date.getDay()]} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
    }
    
    // 其他情况
    return date.toLocaleDateString()
  }
  
  // 格式化过滤器显示
  const formatFilterValue = (key: string, value: any): string => {
    switch (key) {
      case 'size':
        const sizeMap: Record<string, string> = {
          'small': '小尺寸',
          'medium': '中等尺寸',
          'large': '大尺寸',
          'wallpaper': '壁纸尺寸'
        }
        return sizeMap[value] || value
        
      case 'color':
        const colorMap: Record<string, string> = {
          'black_and_white': '黑白',
          'black': '黑色',
          'white': '白色',
          'yellow': '黄色',
          'orange': '橙色',
          'red': '红色',
          'purple': '紫色',
          'magenta': '品红',
          'green': '绿色',
          'teal': '青色',
          'blue': '蓝色'
        }
        return colorMap[value] || value
        
      case 'type':
        const typeMap: Record<string, string> = {
          'photo': '照片',
          'illustration': '插图',
          'vector': '矢量图',
          'animation': '动画'
        }
        return typeMap[value] || value
        
      case 'license':
        const licenseMap: Record<string, string> = {
          'free': '免费使用',
          'commercial': '商业用途',
          'modify': '可修改'
        }
        return licenseMap[value] || value
        
      default:
        return String(value)
    }
  }

  // 初始加载
  useEffect(() => {
    if (isLoggedIn) {
      loadSearchHistory()
    } else {
      setHistory([])
      setError(null)
    }
  }, [isLoggedIn])

  if (!isLoggedIn) {
    return (
      <div className="text-center py-8">
        <p className="mb-4 text-white/70">{dictionary.imageSearch?.searchHistory?.loginRequired || 'Please login to view your search history'}</p>
        <button
          onClick={onLoginRequired}
          className="px-6 py-3 bg-white text-indigo-600 rounded-lg font-semibold hover:bg-indigo-100 transition-colors"
        >
          {dictionary.imageSearch?.searchHistory?.loginButton || 'Login'}
        </button>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-400 mb-4">{error}</p>
        <button
          onClick={() => loadSearchHistory()}
          className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors"
        >
          重试
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        {history.map(item => (
          <div key={item.id} className="bg-white/5 p-4 rounded-lg">
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-medium text-lg">{item.query}</h3>
                  <span className={`text-xs px-2 py-1 rounded ${
                    item.searchType === 'image' 
                      ? 'bg-purple-500/20 text-purple-200' 
                      : 'bg-blue-500/20 text-blue-200'
                  }`}>
                    {item.searchType === 'image' 
                      ? (dictionary.imageSearch?.searchHistory?.searchTypes?.image || 'Image Search')
                      : (dictionary.imageSearch?.searchHistory?.searchTypes?.text || 'Text Search')
                    }
                  </span>
                  <span className="text-xs bg-white/10 px-2 py-1 rounded">
                    {item.provider === 'prompthero' ? (dictionary.imageSearch?.searchHistory?.providers?.prompthero || 'PromptHero') : 
                     item.provider === 'google-vision' ? (dictionary.imageSearch?.searchHistory?.providers?.googleVision || 'Google Vision') : 
                     item.provider}
                  </span>
                </div>
                <p className="text-sm text-white/70 flex items-center gap-1 mt-1">
                  <Clock className="w-3 h-3" />
                  {formatDateTime(item.createdAt)} · {item.resultsCount} {dictionary.imageSearch?.searchHistory?.resultsCount || 'results'}
                </p>
                {item.searchType === 'image' && item.imageUrl && (
                  <div className="mt-2">
                    <img 
                      src={item.imageUrl} 
                      alt="搜索图片" 
                      className="w-16 h-16 object-cover rounded border border-white/20"
                    />
                  </div>
                )}
                <div className="mt-2 flex flex-wrap gap-2">
                  {Object.entries(item.filters).map(([key, value]) => {
                    if (key === 'safeSearch') return null;
                    if (value === 'all') return null;
                    
                    return (
                      <span key={key} className="text-xs bg-white/10 px-2 py-1 rounded">
                        {formatFilterValue(key, value)}
                      </span>
                    );
                  })}
                </div>
              </div>
              <div className="flex gap-2 self-end md:self-center">
                <button
                  onClick={() => handleDeleteHistory(item.id)}
                  className="p-2 bg-white/5 hover:bg-white/10 rounded-lg"
                  aria-label={dictionary.imageSearch?.searchHistory?.deleteTooltip || 'Delete search history'}
                >
                  <Trash2 className="w-5 h-5 text-white/70" />
                </button>
                <button
                  onClick={() => onReSearch(item.query, item.filters, item.searchType, item.imageUrl)}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg flex items-center"
                >
                  <Search className="w-4 h-4 mr-2" />
                  {dictionary.imageSearch?.searchHistory?.reSearchButton || 'Search Again'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {history.length === 0 && !isLoading && (
        <div className="text-center py-8">
          <p className="text-white/70">{dictionary.imageSearch?.searchHistory?.empty || 'No search history'}</p>
        </div>
      )}
      
      {isLoading && (
        <div className="flex justify-center py-4">
          <Loader2 className="w-8 h-8 text-white animate-spin" />
        </div>
      )}
      
      {hasMore && !isLoading && history.length > 0 && (
        <div className="flex justify-center">
          <button
            onClick={handleLoadMore}
            className="px-6 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors"
          >
            {dictionary.imageSearch?.searchHistory?.loadMore || 'Load More'}
          </button>
        </div>
      )}
    </div>
  )
}