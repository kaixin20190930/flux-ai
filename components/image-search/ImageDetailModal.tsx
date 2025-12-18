'use client'

import React from 'react'
import { X, Bookmark, Download, ExternalLink, Copy, Check } from 'lucide-react'
import type { ImageSearchResult } from '@/types/database'
interface ImageDetailModalProps {
  image: ImageSearchResult | null
  isOpen: boolean
  onClose: () => void
  onToggleSave: (imageUrl: string, saved: boolean) => Promise<void>
  dictionary?: any
}

export function ImageDetailModal({ 
  image, 
  isOpen, 
  onClose, 
  onToggleSave,
  dictionary 
}: ImageDetailModalProps) {
  const [copied, setCopied] = React.useState(false)
  const [isDownloading, setIsDownloading] = React.useState(false)

  if (!isOpen || !image) return null

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(image.imageUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('复制链接失败:', error)
    }
  }

  const handleDownload = async () => {
    try {
      setIsDownloading(true)
      
      const response = await fetch(image.imageUrl)
      const blob = await response.blob()
      
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.style.display = 'none'
      a.href = url
      
      const fileName = image.title 
        ? `${image.title.replace(/[^\w\s]/gi, '')}.${blob.type.split('/')[1] || 'jpg'}`
        : `image-${image.id}.${blob.type.split('/')[1] || 'jpg'}`
      
      a.download = fileName
      document.body.appendChild(a)
      a.click()
      
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('下载图片失败:', error)
    } finally {
      setIsDownloading(false)
    }
  }

  const handleSaveToggle = async () => {
    try {
      await onToggleSave(image.imageUrl, !image.saved)
    } catch (error) {
      console.error('保存图片失败:', error)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="relative max-w-4xl max-h-[90vh] w-full bg-white/10 backdrop-blur-md rounded-xl overflow-hidden">
        {/* 关闭按钮 */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex flex-col lg:flex-row h-full">
          {/* 图片区域 */}
          <div className="flex-1 flex items-center justify-center p-6 bg-black/20">
            <img
              src={image.imageUrl}
              alt={image.title || '图片详情'}
              className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
            />
          </div>

          {/* 信息区域 */}
          <div className="lg:w-80 p-6 space-y-4 overflow-y-auto">
            <div>
              <h2 className="text-xl font-bold text-white mb-2">
                {image.title || dictionary?.imageSearch?.results?.untitled || 'Untitled Image'}
              </h2>
              <p className="text-white/70 text-sm">
                {image.description || dictionary?.imageSearch?.results?.noDescription || 'No Description'}
              </p>
            </div>

            {/* 操作按钮 */}
            <div className="space-y-3">
              <button
                onClick={handleSaveToggle}
                className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-colors ${
                  image.saved
                    ? 'bg-yellow-500 text-white hover:bg-yellow-600'
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                <Bookmark className={`w-5 h-5 ${image.saved ? 'fill-current' : ''}`} />
                {image.saved ? '已保存' : '保存图片'}
              </button>

              <button
                onClick={handleDownload}
                disabled={isDownloading}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors disabled:opacity-50"
              >
                <Download className="w-5 h-5" />
                {isDownloading ? '下载中...' : '下载图片'}
              </button>

              <button
                onClick={handleCopyUrl}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors"
              >
                {copied ? (
                  <>
                    <Check className="w-5 h-5" />
                    已复制链接
                  </>
                ) : (
                  <>
                    <Copy className="w-5 h-5" />
                    复制链接
                  </>
                )}
              </button>

              {image.sourceUrl && (
                <a
                  href={image.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors"
                >
                  <ExternalLink className="w-5 h-5" />
                  查看原图
                </a>
              )}
            </div>

            {/* 图片信息 */}
            <div className="pt-4 border-t border-white/10">
              <h3 className="text-sm font-medium text-white/90 mb-2">图片信息</h3>
              <div className="space-y-2 text-sm text-white/70">
                <div className="flex justify-between">
                  <span>搜索ID:</span>
                  <span className="font-mono text-xs">{image.searchId}</span>
                </div>
                <div className="flex justify-between">
                  <span>创建时间:</span>
                  <span>{new Date(image.createdAt).toLocaleString()}</span>
                </div>
                {image.sourceUrl && (
                  <div className="flex justify-between">
                    <span>来源:</span>
                    <span className="truncate ml-2">{new URL(image.sourceUrl).hostname}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}