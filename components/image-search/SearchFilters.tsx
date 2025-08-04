'use client'

import React from 'react'
import type { ImageSearchFilters } from '@/types/database'

interface SearchFiltersProps {
  filters: ImageSearchFilters
  setFilters: React.Dispatch<React.SetStateAction<ImageSearchFilters>>
  dictionary?: any
}

export function SearchFilters({ filters, setFilters, dictionary }: SearchFiltersProps) {
  const handleFilterChange = (key: keyof ImageSearchFilters, value: string | boolean) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 图片尺寸 */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-white/90">
          {dictionary?.imageSearch?.filters?.size?.label || 'Image Size'}
        </label>
        <select
          value={filters.size}
          onChange={(e) => handleFilterChange('size', e.target.value)}
          className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white/50 transition-colors"
        >
          <option value="all">{dictionary?.imageSearch?.filters?.size?.all || 'All Sizes'}</option>
          <option value="small">{dictionary?.imageSearch?.filters?.size?.small || 'Small'}</option>
          <option value="medium">{dictionary?.imageSearch?.filters?.size?.medium || 'Medium'}</option>
          <option value="large">{dictionary?.imageSearch?.filters?.size?.large || 'Large'}</option>
          <option value="wallpaper">{dictionary?.imageSearch?.filters?.size?.wallpaper || 'Wallpaper'}</option>
        </select>
      </div>
      
      {/* 颜色 */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-white/90">
          {dictionary?.imageSearch?.filters?.color?.label || 'Color'}
        </label>
        <select
          value={filters.color}
          onChange={(e) => handleFilterChange('color', e.target.value)}
          className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white/50 transition-colors"
        >
          <option value="all">{dictionary?.imageSearch?.filters?.color?.all || 'All Colors'}</option>
          <option value="black_and_white">{dictionary?.imageSearch?.filters?.color?.blackAndWhite || 'Black & White'}</option>
          <option value="black">{dictionary?.imageSearch?.filters?.color?.black || 'Black'}</option>
          <option value="white">{dictionary?.imageSearch?.filters?.color?.white || 'White'}</option>
          <option value="yellow">{dictionary?.imageSearch?.filters?.color?.yellow || 'Yellow'}</option>
          <option value="orange">{dictionary?.imageSearch?.filters?.color?.orange || 'Orange'}</option>
          <option value="red">{dictionary?.imageSearch?.filters?.color?.red || 'Red'}</option>
          <option value="purple">{dictionary?.imageSearch?.filters?.color?.purple || 'Purple'}</option>
          <option value="magenta">{dictionary?.imageSearch?.filters?.color?.magenta || 'Magenta'}</option>
          <option value="green">{dictionary?.imageSearch?.filters?.color?.green || 'Green'}</option>
          <option value="teal">{dictionary?.imageSearch?.filters?.color?.teal || 'Teal'}</option>
          <option value="blue">{dictionary?.imageSearch?.filters?.color?.blue || 'Blue'}</option>
        </select>
      </div>
      
      {/* 图片类型 */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-white/90">
          {dictionary?.imageSearch?.filters?.type?.label || 'Image Type'}
        </label>
        <select
          value={filters.type}
          onChange={(e) => handleFilterChange('type', e.target.value)}
          className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white/50 transition-colors"
        >
          <option value="all">{dictionary?.imageSearch?.filters?.type?.all || 'All Types'}</option>
          <option value="photo">{dictionary?.imageSearch?.filters?.type?.photo || 'Photo'}</option>
          <option value="illustration">{dictionary?.imageSearch?.filters?.type?.illustration || 'Illustration'}</option>
          <option value="vector">{dictionary?.imageSearch?.filters?.type?.vector || 'Vector'}</option>
          <option value="animation">{dictionary?.imageSearch?.filters?.type?.animation || 'Animation'}</option>
        </select>
      </div>
      
      {/* 许可证 */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-white/90">
          {dictionary?.imageSearch?.filters?.license?.label || 'License'}
        </label>
        <select
          value={filters.license}
          onChange={(e) => handleFilterChange('license', e.target.value)}
          className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white/50 transition-colors"
        >
          <option value="all">{dictionary?.imageSearch?.filters?.license?.all || 'All Licenses'}</option>
          <option value="free">{dictionary?.imageSearch?.filters?.license?.free || 'Free to Use'}</option>
          <option value="commercial">{dictionary?.imageSearch?.filters?.license?.commercial || 'Commercial Use'}</option>
          <option value="modify">{dictionary?.imageSearch?.filters?.license?.modify || 'Modifiable'}</option>
        </select>
      </div>
      
      {/* 安全搜索 */}
      <div className="col-span-1 md:col-span-2 lg:col-span-4">
        <div className="flex items-center">
          <input
            type="checkbox"
            id="safeSearch"
            checked={filters.safeSearch}
            onChange={(e) => handleFilterChange('safeSearch', e.target.checked)}
            className="w-4 h-4 text-indigo-600 border-white/30 rounded focus:ring-indigo-500"
          />
          <label htmlFor="safeSearch" className="ml-2 text-sm text-white/90">
            {dictionary?.imageSearch?.filters?.safeSearch || 'Enable Safe Search (filter adult content)'}
          </label>
        </div>
      </div>
    </div>
  )
}