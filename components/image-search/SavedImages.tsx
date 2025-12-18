'use client'

import React, { useState, useEffect } from 'react'
import { Bookmark, ExternalLink, Download, Loader2, AlertCircle } from 'lucide-react'
import type { ImageSearchResult } from '@/types/database'

interface SavedImagesProps {
  onToggleSave: (imageUrl: string, saved: boolean) => void
  isLoggedIn: boolean
  onLoginRequired: () => void
  dictionary: any
}

export function SavedImages({ 
  onToggleSave, 
  isLoggedIn,
  onLoginRequired,
  dictionary
}: SavedImagesProps) {
  const [images, setImages] = useState<ImageSearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [page, setPage] = useState(1)
  const [downloadingImages, setDownloadingImages] = useState<Set<string>>(new Set())
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set())
  const [error, setError] = useState<string | null>(null)
  
  // 调试信息
  React.useEffect(() => {
    console.log('SavedImages received isLoggedIn:', isLoggedIn);
  }, [isLoggedIn]);

  // 加载保存的图片
  const loadSavedImages = async (pageNum: number = 1, append: boolean = false) => {
    if (!isLoggedIn) {
      onLoginRequired()
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/image-search/saved?page=${pageNum}&limit=20`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Cache-Control': 'no-cache'
        }
      })
      
      if (!response.ok) {
        if (response.status === 401) {
          onLoginRequired()
          return
        }
        throw new Error(dictionary.imageSearch?.errors?.loadFailed || 'Failed to load saved images')
      }

      const data: {
        items: ImageSearchResult[]
        total: number
        page: number
        limit: number
      } = await response.json()
      
      if (append) {
        setImages(prev => [...prev, ...data.items])
      } else {
        setImages(data.items)
      }
      
      setHasMore(data.page * data.limit < data.total)
      setPage(pageNum)
      
    } catch (err) {
      setError(err instanceof Error ? err.message : (dictionary.imageSearch?.errors?.loadFailed || 'Load failed'))
    } finally {
      setIsLoading(false)
    }
  }

  // 加载更多
  const handleLoadMore = () => {
    if (!isLoading && hasMore) {
      loadSavedImages(page + 1, true)
    }
  }

  // 处理取消保存
  const handleToggleSave = async (image: ImageSearchResult) => {
    try {
      await onToggleSave(image.imageUrl, false)
      
      // 从列表中移除该图片
      setImages(prev => prev.filter(img => img.id !== image.id))
      
    } catch (error) {
      console.error('取消保存失败:', error)
    }
  }

  // 处理图片下载
  const handleDownload = async (image: ImageSearchResult) => {
    try {
      setDownloadingImages(prev => new Set(prev).add(image.id))
      
      // 获取图片
      const response = await fetch(image.imageUrl)
      const blob = await response.blob()
      
      // 创建下载链接
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.style.display = 'none'
      a.href = url
      
      // 设置文件名
      const fileName = image.title 
        ? `${image.title.replace(/[^\w\s]/gi, '')}.${blob.type.split('/')[1] || 'jpg'}`
        : `image-${image.id}.${blob.type.split('/')[1] || 'jpg'}`
      
      a.download = fileName
      document.body.appendChild(a)
      a.click()
      
      // 清理
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('下载图片失败:', error)
    } finally {
      setDownloadingImages(prev => {
        const newSet = new Set(prev)
        newSet.delete(image.id)
        return newSet
      })
    }
  }

  // 处理图片加载错误
  const handleImageError = (imageId: string) => {
    setImageErrors(prev => new Set(prev).add(imageId))
  }

  // 初始加载
  useEffect(() => {
    if (isLoggedIn) {
      loadSavedImages()
    } else {
      setImages([])
      setError(null)
    }
  }, [isLoggedIn])

  if (!isLoggedIn) {
    return (
      <div className="text-center py-8">
        <p className="mb-4 text-white/70">{dictionary.imageSearch?.savedImages?.loginRequired || 'Please login to view and manage your saved images'}</p>
        <button
          onClick={onLoginRequired}
          className="px-6 py-3 bg-white text-indigo-600 rounded-lg font-semibold hover:bg-indigo-100 transition-colors"
        >
          {dictionary.imageSearch?.savedImages?.loginButton || 'Login'}
        </button>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-400 mb-4">{error}</p>
        <button
          onClick={() => loadSavedImages()}
          className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors"
        >
          {dictionary.imageSearch?.savedImages?.retry || 'Retry'}
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {images.map(image => (
          <div key={image.id} className="bg-white/5 rounded-lg overflow-hidden">
            <div className="relative aspect-square">
              {imageErrors.has(image.id) ? (
                <div className="w-full h-full flex items-center justify-center bg-white/5">
                  <AlertCircle className="w-12 h-12 text-white/50" />
                </div>
              ) : (
                <img 
                  src={image.thumbnailUrl || image.imageUrl} 
                  alt={image.title || '保存的图片'} 
                  className="w-full h-full object-cover"
                  onError={() => handleImageError(image.id)}
                />
              )}
            </div>
            <div className="p-3">
              <h3 className="font-medium truncate">{image.title || dictionary.imageSearch?.results?.untitled || 'Untitled Image'}</h3>
              <p className="text-sm text-white/70 truncate">{image.description || dictionary.imageSearch?.results?.noDescription || 'No Description'}</p>
              <div className="mt-2 flex justify-between">
                <button 
                  onClick={() => handleToggleSave(image)}
                  className="text-white/70 hover:text-white"
                  aria-label={dictionary.imageSearch?.savedImages?.unsaveTooltip || 'Remove from favorites'}
                >
                  <Bookmark className="w-5 h-5 fill-current" />
                </button>
                {image.sourceUrl && (
                  <a 
                    href={image.sourceUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-white/70 hover:text-white"
                    aria-label={dictionary.imageSearch?.savedImages?.viewOriginalTooltip || 'View original image'}
                  >
                    <ExternalLink className="w-5 h-5" />
                  </a>
                )}
                <button 
                  onClick={() => handleDownload(image)}
                  disabled={downloadingImages.has(image.id)}
                  className="text-white/70 hover:text-white disabled:text-white/30"
                  aria-label={dictionary.imageSearch?.savedImages?.downloadTooltip || 'Download image'}
                >
                  {downloadingImages.has(image.id) ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Download className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {images.length === 0 && !isLoading && (
        <div className="text-center py-8">
          <p className="text-white/70">{dictionary.imageSearch?.savedImages?.empty || 'No saved images'}</p>
        </div>
      )}
      
      {isLoading && (
        <div className="flex justify-center py-4">
          <Loader2 className="w-8 h-8 text-white animate-spin" />
        </div>
      )}
      
      {hasMore && !isLoading && images.length > 0 && (
        <div className="flex justify-center">
          <button
            onClick={handleLoadMore}
            className="px-6 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors"
          >
            {dictionary.imageSearch?.savedImages?.loadMore || 'Load More'}
          </button>
        </div>
      )}
    </div>
  )
}