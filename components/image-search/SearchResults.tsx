'use client'

import React from 'react'
import { Bookmark, Download, ExternalLink, Eye } from 'lucide-react'
import type { ImageSearchResult } from '@/types/database'
interface SearchResultsProps {
  results: ImageSearchResult[]
  onToggleSave: (imageUrl: string, saved: boolean) => Promise<void>
  onImageClick?: (image: ImageSearchResult) => void
  dictionary?: any
  isLoading?: boolean
}

export function SearchResults({ 
  results, 
  onToggleSave, 
  onImageClick,
  dictionary,
  isLoading = false 
}: SearchResultsProps) {
  
  const handleSaveClick = async (e: React.MouseEvent, imageUrl: string, saved: boolean) => {
    e.stopPropagation()
    try {
      await onToggleSave(imageUrl, saved)
    } catch (error) {
      console.error('保存图片失败:', error)
    }
  }

  const handleDownload = (e: React.MouseEvent, imageUrl: string, title?: string) => {
    e.stopPropagation()
    
    // 创建一个临时的 a 标签来触发下载
    const link = document.createElement('a')
    link.href = imageUrl
    link.download = title || 'image'
    link.target = '_blank'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleExternalLink = (e: React.MouseEvent, sourceUrl?: string) => {
    e.stopPropagation()
    if (sourceUrl) {
      window.open(sourceUrl, '_blank', 'noopener,noreferrer')
    }
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="bg-white/5 rounded-lg overflow-hidden animate-pulse">
            <div className="aspect-square bg-white/10"></div>
            <div className="p-3 space-y-2">
              <div className="h-4 bg-white/10 rounded"></div>
              <div className="h-3 bg-white/10 rounded w-3/4"></div>
              <div className="flex justify-between pt-2">
                <div className="w-5 h-5 bg-white/10 rounded"></div>
                <div className="w-5 h-5 bg-white/10 rounded"></div>
                <div className="w-5 h-5 bg-white/10 rounded"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (results.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 mx-auto mb-4 bg-white/10 rounded-full flex items-center justify-center">
          <Eye className="w-8 h-8 text-white/50" />
        </div>
        <h3 className="text-lg font-medium text-white mb-2">
          {dictionary?.imageSearch?.results?.noResults || 'No images found'}
        </h3>
        <p className="text-white/70">
          {dictionary?.imageSearch?.results?.noResultsDescription || 'Try different keywords or adjust your filters'}
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {results.map((image) => (
        <div 
          key={image.id} 
          className="bg-white/5 rounded-lg overflow-hidden hover:bg-white/10 transition-all duration-300 cursor-pointer group"
          onClick={() => onImageClick?.(image)}
        >
          <div className="relative aspect-square overflow-hidden">
            <img 
              src={image.thumbnailUrl || image.imageUrl} 
              alt={image.title || dictionary?.imageSearch?.results?.untitled || 'Untitled Image'} 
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
            />
            
            {/* 悬停时显示的操作按钮 */}
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
              <div className="flex space-x-2">
                <button
                  onClick={(e) => handleSaveClick(e, image.imageUrl, !image.saved)}
                  className={`p-2 rounded-full transition-colors ${
                    image.saved 
                      ? 'bg-yellow-500 text-white' 
                      : 'bg-white/20 text-white hover:bg-white/30'
                  }`}
                  title={image.saved ? '取消保存' : '保存图片'}
                >
                  <Bookmark className={`w-4 h-4 ${image.saved ? 'fill-current' : ''}`} />
                </button>
                
                {image.sourceUrl && (
                  <button
                    onClick={(e) => handleExternalLink(e, image.sourceUrl)}
                    className="p-2 bg-white/20 text-white rounded-full hover:bg-white/30 transition-colors"
                    title="查看原图"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </button>
                )}
                
                <button
                  onClick={(e) => handleDownload(e, image.imageUrl, image.title)}
                  className="p-2 bg-white/20 text-white rounded-full hover:bg-white/30 transition-colors"
                  title="下载图片"
                >
                  <Download className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
          
          <div className="p-3">
            <h3 className="font-medium truncate text-white group-hover:text-white/90 transition-colors">
              {image.title || dictionary?.imageSearch?.results?.untitled || 'Untitled Image'}
            </h3>
            <p className="text-sm text-white/70 truncate mt-1">
              {image.description || dictionary?.imageSearch?.results?.noDescription || 'No Description'}
            </p>
            
            {/* 底部操作栏 */}
            <div className="mt-3 flex justify-between items-center">
              <button 
                onClick={(e) => handleSaveClick(e, image.imageUrl, !image.saved)}
                className={`text-sm flex items-center space-x-1 transition-colors ${
                  image.saved 
                    ? 'text-yellow-400 hover:text-yellow-300' 
                    : 'text-white/70 hover:text-white'
                }`}
              >
                <Bookmark className={`w-4 h-4 ${image.saved ? 'fill-current' : ''}`} />
                <span>{image.saved ? '已保存' : '保存'}</span>
              </button>
              
              <div className="flex space-x-2">
                {image.sourceUrl && (
                  <button 
                    onClick={(e) => handleExternalLink(e, image.sourceUrl)}
                    className="text-white/70 hover:text-white transition-colors"
                    title="查看原图"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </button>
                )}
                <button 
                  onClick={(e) => handleDownload(e, image.imageUrl, image.title)}
                  className="text-white/70 hover:text-white transition-colors"
                  title="下载图片"
                >
                  <Download className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}