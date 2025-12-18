'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Filter, Image, Bookmark, Download, ExternalLink } from 'lucide-react'
import { useUnifiedAuth } from '@/hooks/useUnifiedAuth'
import { SearchFilters } from './SearchFilters'
import { SearchResults } from './SearchResults'
import { SavedImages } from './SavedImages'
import { SearchHistory } from './SearchHistory'
import { ImageDetailModal } from './ImageDetailModal'
import type { ImageSearchFilters, ImageSearchResult } from '@/types/database'

interface ImageSearchProps {
  dictionary: any
  locale: string
}

export function ImageSearch({ dictionary, locale }: ImageSearchProps) {
  const { user, isLoggedIn, loading } = useUnifiedAuth()
  const userId = user?.userId
  const router = useRouter()
  
  // 调试信息
  React.useEffect(() => {
    console.log('ImageSearch auth state:', { isLoggedIn, loading, user: !!user });
  }, [isLoggedIn, loading, user]);
  
  const [activeTab, setActiveTab] = useState<'search' | 'saved' | 'history'>('search')
  const [searchType, setSearchType] = useState<'text' | 'image'>('text')
  const [query, setQuery] = useState('')
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [filters, setFilters] = useState<ImageSearchFilters>({
    size: 'all',
    color: 'all',
    type: 'all',
    license: 'free',
    safeSearch: true
  })
  const [isLoading, setIsLoading] = useState(false)
  const [results, setResults] = useState<ImageSearchResult[]>([])
  const [error, setError] = useState<string | null>(null)
  const [selectedImage, setSelectedImage] = useState<ImageSearchResult | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  
  // 文本搜索功能
  const handleSearch = async () => {
    if (!query.trim()) return
    
    // 如果还在加载中，等待加载完成
    if (loading) {
      console.log('Still loading auth state, please wait...')
      return
    }
    
    if (!isLoggedIn) {
      handleLoginRequired()
      return
    }
    
    setIsLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/image-search', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          query, 
          searchType: 'text',
          filters 
        })
      })
      
      const data = await response.json() as any
      
      if (!response.ok) {
        if (response.status === 401) {
          handleLoginRequired()
          return
        }
        if (response.status === 402) {
          setError(data.error?.message || dictionary.imageSearch?.errors?.searchFailed || 'Search failed')
          return
        }
        throw new Error(data.error?.message || 'Search failed')
      }
      
      if (data.error) {
        throw new Error(data.error.message || dictionary.imageSearch?.errors?.searchFailed || 'Search failed')
      }
      
      setResults(data.results || [])
      
      // 显示点数消费信息
      if (data.pointsConsumed) {
        console.log(`Search completed. Points consumed: ${data.pointsConsumed}, Remaining: ${data.remainingPoints}`)
      }
      
    } catch (err) {
      setError(err instanceof Error ? err.message : (dictionary.imageSearch?.errors?.searchFailed || 'Search failed'))
    } finally {
      setIsLoading(false)
    }
  }

  // 图片搜索功能
  const handleImageSearch = async () => {
    if (!uploadedImage) return
    
    // 如果还在加载中，等待加载完成
    if (loading) {
      console.log('Still loading auth state, please wait...')
      return
    }
    
    if (!isLoggedIn) {
      handleLoginRequired()
      return
    }
    
    setIsLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/image-search', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          imageUrl: uploadedImage,
          searchType: 'image',
          filters 
        })
      })
      
      const data = await response.json() as any
      
      if (!response.ok) {
        if (response.status === 401) {
          handleLoginRequired()
          return
        }
        if (response.status === 402) {
          setError(data.error?.message || dictionary.imageSearch?.errors?.searchFailed || 'Search failed')
          return
        }
        throw new Error(data.error?.message || 'Image search failed')
      }
      
      if (data.error) {
        throw new Error(data.error.message || dictionary.imageSearch?.errors?.searchFailed || 'Image search failed')
      }
      
      setResults(data.results || [])
      
      // 显示点数消费信息
      if (data.pointsConsumed) {
        console.log(`Image search completed. Points consumed: ${data.pointsConsumed}, Remaining: ${data.remainingPoints}`)
      }
      
    } catch (err) {
      setError(err instanceof Error ? err.message : (dictionary.imageSearch?.errors?.searchFailed || 'Image search failed'))
    } finally {
      setIsLoading(false)
    }
  }

  // 处理文件选择
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setUploadedImage(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  // 处理拖拽
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    
    const files = e.dataTransfer.files
    if (files.length > 0) {
      const file = files[0]
      if (file.type.startsWith('image/')) {
        const reader = new FileReader()
        reader.onload = (e) => {
          setUploadedImage(e.target?.result as string)
        }
        reader.readAsDataURL(file)
      }
    }
  }
  
  // 实际保存图片功能
  const handleToggleSave = async (imageUrl: string, saved: boolean) => {
    // 检查登录状态
    if (loading) {
      console.log('Still loading auth state, please wait...')
      return
    }
    
    if (!isLoggedIn) {
      handleLoginRequired()
      return
    }
    
    try {
      const response = await fetch('/api/image-search/save', {
        method: 'POST',
        credentials: 'include',
        headers: { 
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        },
        body: JSON.stringify({ imageUrl, saved })
      })

      if (!response.ok) {
        if (response.status === 401) {
          handleLoginRequired()
          return
        }
        throw new Error('保存失败')
      }

      // 更新搜索结果中的保存状态
      setResults(prevResults => 
        prevResults.map(result => 
          result.imageUrl === imageUrl 
            ? { ...result, saved } 
            : result
        )
      )
      
    } catch (error) {
      console.error('保存图片失败:', error)
      throw error
    }
  }

  // 处理图片点击
  const handleImageClick = (image: ImageSearchResult) => {
    setSelectedImage(image)
    setIsModalOpen(true)
  }

  // 关闭模态框
  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedImage(null)
  }

  // 处理需要登录的情况
  const handleLoginRequired = () => {
    // 保存当前页面URL到localStorage，登录后可以返回
    if (typeof window !== 'undefined') {
      localStorage.setItem('redirectAfterLogin', window.location.pathname)
    }
    router.push(`/${locale}/auth`)
  }
  
  // 处理重新搜索
  const handleReSearch = (searchQuery: string, searchFilters: ImageSearchFilters, searchType?: 'text' | 'image', imageUrl?: string) => {
    if (searchType) {
      setSearchType(searchType)
    }
    
    if (searchType === 'image' && imageUrl) {
      setUploadedImage(imageUrl)
      setQuery('')
    } else {
      setQuery(searchQuery)
      setUploadedImage(null)
    }
    
    setFilters(searchFilters)
    setActiveTab('search')
    
    // 延迟执行搜索以确保状态更新完成
    setTimeout(() => {
      if (searchType === 'image') {
        handleImageSearch()
      } else {
        handleSearch()
      }
    }, 100)
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 text-white">
      <div className="absolute inset-0 bg-black opacity-50"/>
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]"/>
      
      <div className="container mx-auto z-10 relative px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">{dictionary.imageSearch?.title || 'Image Network Search'}</h1>
          <p className="text-xl text-white/80">{dictionary.imageSearch?.subtitle || 'Search, discover and save beautiful images from the web'}</p>
        </div>
        
        {/* 标签页导航 */}
        <div className="flex justify-center mb-8">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-1 inline-flex">
            <button 
              onClick={() => setActiveTab('search')}
              className={`px-4 py-2 rounded-md flex items-center ${activeTab === 'search' ? 'bg-white/20' : 'hover:bg-white/5'}`}
            >
              <Search className="w-4 h-4 mr-2" />
              {dictionary.imageSearch?.tabs?.search || 'Search'}
            </button>
            <button 
              onClick={() => setActiveTab('saved')}
              className={`px-4 py-2 rounded-md flex items-center ${activeTab === 'saved' ? 'bg-white/20' : 'hover:bg-white/5'}`}
            >
              <Bookmark className="w-4 h-4 mr-2" />
              {dictionary.imageSearch?.tabs?.saved || 'Saved'}
            </button>
            <button 
              onClick={() => setActiveTab('history')}
              className={`px-4 py-2 rounded-md flex items-center ${activeTab === 'history' ? 'bg-white/20' : 'hover:bg-white/5'}`}
            >
              <Image className="w-4 h-4 mr-2" />
              {dictionary.imageSearch?.tabs?.history || 'History'}
            </button>
          </div>
        </div>
        
        {/* 搜索界面 */}
        {activeTab === 'search' && (
          <div className="space-y-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-8 shadow-2xl">
              {/* 搜索类型选择 */}
              <div className="flex justify-center mb-6">
                <div className="bg-white/5 backdrop-blur-sm rounded-full p-1 inline-flex">
                  <button 
                    onClick={() => setSearchType('text')}
                    className={`px-6 py-3 rounded-full flex items-center transition-all duration-300 ${
                      searchType === 'text' 
                        ? 'bg-white/20 text-white shadow-lg' 
                        : 'text-white/70 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Search className="w-4 h-4 mr-2" />
                    {dictionary.imageSearch?.searchTypes?.text || 'Text Search'}
                  </button>
                  <button 
                    onClick={() => setSearchType('image')}
                    className={`px-6 py-3 rounded-full flex items-center transition-all duration-300 ${
                      searchType === 'image' 
                        ? 'bg-white/20 text-white shadow-lg' 
                        : 'text-white/70 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Image className="w-4 h-4 mr-2" />
                    {dictionary.imageSearch?.searchTypes?.image || 'Image Search'}
                  </button>
                </div>
              </div>

              {/* 文本搜索界面 */}
              {searchType === 'text' && (
                <div className="space-y-4">
                  <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-pink-400 rounded-xl blur opacity-20 group-hover:opacity-30 transition duration-300"></div>
                    <div className="relative bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 overflow-hidden">
                      <div className="flex">
                        <div className="flex-grow relative">
                          <input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder={dictionary.imageSearch?.textSearch?.placeholder || "Enter keywords to search images..."}
                            className="w-full p-6 bg-transparent text-white placeholder-white/50 focus:outline-none text-lg"
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                          />
                          <Search className="absolute left-6 top-1/2 transform -translate-y-1/2 text-white/30 w-6 h-6 pointer-events-none" />
                        </div>
                        <button
                          onClick={handleSearch}
                          disabled={isLoading || !query.trim()}
                          className="px-8 py-6 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold hover:from-purple-600 hover:to-pink-600 focus:outline-none focus:ring-2 focus:ring-white/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center gap-2"
                        >
                          {isLoading ? (
                            <>
                              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                              {dictionary.imageSearch?.textSearch?.searching || 'Searching...'}
                            </>
                          ) : (
                            <>
                              <Search className="w-5 h-5" />
                              {dictionary.imageSearch?.textSearch?.button || 'Search Images'}
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 图片搜索界面 */}
              {searchType === 'image' && (
                <div className="space-y-4">
                  <div 
                    className={`relative group border-2 border-dashed rounded-xl p-8 transition-all duration-300 ${
                      isDragOver 
                        ? 'border-purple-400 bg-purple-400/10' 
                        : 'border-white/20 hover:border-white/40 hover:bg-white/5'
                    }`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                  >
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileSelect}
                      accept="image/*"
                      className="hidden"
                    />
                    
                    {uploadedImage ? (
                      <div className="text-center">
                        <div className="relative inline-block">
                          <img 
                            src={uploadedImage} 
                            alt="上传的图片" 
                            className="max-w-xs max-h-48 rounded-lg shadow-lg"
                          />
                          <button
                            onClick={() => setUploadedImage(null)}
                            className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                          >
                            ×
                          </button>
                        </div>
                        <div className="mt-4">
                          <button
                            onClick={handleImageSearch}
                            disabled={isLoading}
                            className="px-8 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-lg hover:from-purple-600 hover:to-pink-600 focus:outline-none focus:ring-2 focus:ring-white/50 disabled:opacity-50 transition-all duration-300 flex items-center justify-center gap-2 mx-auto"
                          >
                            {isLoading ? (
                              <>
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                {dictionary.imageSearch?.imageSearch?.searching || 'Searching...'}
                              </>
                            ) : (
                              <>
                                <Search className="w-5 h-5" />
                                {dictionary.imageSearch?.imageSearch?.button || 'Search Similar Images'}
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center">
                        <div className="w-16 h-16 mx-auto mb-4 bg-white/10 rounded-full flex items-center justify-center">
                          <Image className="w-8 h-8 text-white/50" />
                        </div>
                        <h3 className="text-xl font-semibold text-white mb-2">{dictionary.imageSearch?.imageSearch?.title || 'Upload Image to Search'}</h3>
                        <p className="text-white/70 mb-4">{dictionary.imageSearch?.imageSearch?.description || 'Drag image here, or click to select file'}</p>
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
                        >
                          {dictionary.imageSearch?.imageSearch?.selectButton || 'Select Image'}
                        </button>
                        <p className="text-sm text-white/50 mt-2">{dictionary.imageSearch?.imageSearch?.supportedFormats || 'Supports JPG, PNG, GIF formats'}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {/* 高级过滤选项 */}
              <div className="mt-6">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center text-sm text-white/70 hover:text-white transition-colors"
                >
                  <Filter className="w-4 h-4 mr-2" />
                  {dictionary.imageSearch?.filters?.title || 'Advanced Filter Options'}
                  <div className={`ml-2 transition-transform duration-200 ${showFilters ? 'rotate-180' : ''}`}>
                    ▼
                  </div>
                </button>
                
                {showFilters && (
                  <div className="mt-4 p-4 bg-white/5 rounded-lg">
                    <SearchFilters filters={filters} setFilters={setFilters} dictionary={dictionary} />
                  </div>
                )}
              </div>
            </div>
            
            {/* 搜索结果 */}
            {error && (
              <div className="bg-red-500/20 text-white p-4 rounded-lg">
                {error}
              </div>
            )}
            
            {(results.length > 0 || isLoading) && (
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4">{dictionary.imageSearch?.results?.title || 'Search Results'}</h2>
                <SearchResults 
                  results={results}
                  onToggleSave={handleToggleSave}
                  onImageClick={handleImageClick}
                  dictionary={dictionary}
                  isLoading={isLoading}
                />
              </div>
            )}
            
            {!isLoading && query && results.length === 0 && (
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 text-center">
                <p>{dictionary.imageSearch?.results?.noResults || 'No matching images found, please try other keywords'}</p>
              </div>
            )}
          </div>
        )}
        
        {/* 已保存图片 */}
        {activeTab === 'saved' && (
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">{dictionary.imageSearch?.savedImages?.title || 'Saved Images'}</h2>
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              </div>
            ) : (
              <SavedImages 
                onToggleSave={handleToggleSave}
                isLoggedIn={isLoggedIn}
                onLoginRequired={handleLoginRequired}
                dictionary={dictionary}
              />
            )}
          </div>
        )}
        
        {/* 搜索历史 */}
        {activeTab === 'history' && (
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">{dictionary.imageSearch?.searchHistory?.title || 'Search History'}</h2>
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              </div>
            ) : (
              <SearchHistory 
                onReSearch={handleReSearch}
                isLoggedIn={isLoggedIn}
                onLoginRequired={handleLoginRequired}
                dictionary={dictionary}
              />
            )}
          </div>
        )}
      </div>

      {/* 图片详情模态框 */}
      <ImageDetailModal
        image={selectedImage}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onToggleSave={handleToggleSave}
        dictionary={dictionary}
      />
    </div>
  )
}