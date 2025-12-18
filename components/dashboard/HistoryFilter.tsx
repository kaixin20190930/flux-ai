'use client';

import React, { useState, useEffect } from 'react';
import { Search, Filter, X, Calendar, Tag, Plus, Save } from 'lucide-react';
import type { HistorySearchRequest } from '@/types/database';

interface HistoryFilterProps {
  onSearch: (filters: HistorySearchRequest) => void;
  availableModels: string[];
  availableTags: string[];
}

export function HistoryFilter({ onSearch, availableModels, availableTags }: HistoryFilterProps) {
  const [query, setQuery] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [model, setModel] = useState<string | undefined>(undefined);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [savedSearches, setSavedSearches] = useState<{name: string, filters: HistorySearchRequest}[]>([]);
  const [searchName, setSearchName] = useState('');
  const [isSavingSearch, setIsSavingSearch] = useState(false);

  const handleSearch = () => {
    const filters: HistorySearchRequest = {
      query: query || undefined,
      model: model || undefined,
      tags: selectedTags.length > 0 ? selectedTags : undefined
    };

    // 处理日期范围
    if (startDate && endDate) {
      filters.dateRange = [new Date(startDate), new Date(endDate)];
    }

    onSearch(filters);
  };

  // 加载保存的搜索
  useEffect(() => {
    const loadSavedSearches = () => {
      const saved = localStorage.getItem('savedHistorySearches');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setSavedSearches(parsed);
        } catch (e) {
          console.error('Failed to load saved searches', e);
        }
      }
    };
    
    loadSavedSearches();
  }, []);

  const handleReset = () => {
    setQuery('');
    setModel(undefined);
    setStartDate('');
    setEndDate('');
    setSelectedTags([]);
    onSearch({});
  };

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag) 
        : [...prev, tag]
    );
  };
  
  const handleAddTag = () => {
    if (newTag.trim() && !availableTags.includes(newTag.trim())) {
      // 添加到已选标签
      setSelectedTags(prev => [...prev, newTag.trim()]);
      setNewTag('');
      setIsAddingTag(false);
    }
  };
  
  const handleSaveSearch = () => {
    if (!searchName.trim()) return;
    
    const filters: HistorySearchRequest = {
      query: query || undefined,
      model: model || undefined,
      tags: selectedTags.length > 0 ? selectedTags : undefined
    };
    
    if (startDate && endDate) {
      filters.dateRange = [new Date(startDate), new Date(endDate)];
    }
    
    const newSavedSearches = [
      ...savedSearches,
      { name: searchName.trim(), filters }
    ];
    
    setSavedSearches(newSavedSearches);
    localStorage.setItem('savedHistorySearches', JSON.stringify(newSavedSearches));
    
    setSearchName('');
    setIsSavingSearch(false);
  };
  
  const handleLoadSearch = (filters: HistorySearchRequest) => {
    setQuery(filters.query || '');
    setModel(filters.model);
    setSelectedTags(filters.tags || []);
    
    if (filters.dateRange) {
      setStartDate(filters.dateRange[0].toISOString().split('T')[0]);
      setEndDate(filters.dateRange[1].toISOString().split('T')[0]);
    } else {
      setStartDate('');
      setEndDate('');
    }
    
    setShowAdvanced(true);
    onSearch(filters);
  };
  
  const handleDeleteSavedSearch = (index: number) => {
    const newSavedSearches = [...savedSearches];
    newSavedSearches.splice(index, 1);
    setSavedSearches(newSavedSearches);
    localStorage.setItem('savedHistorySearches', JSON.stringify(newSavedSearches));
  };

  return (
    <div className="bg-white/5 rounded-lg p-4 space-y-4">
      <div className="flex flex-col md:flex-row gap-3">
        {/* 搜索框 */}
        <div className="relative flex-grow">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="搜索提示词..."
            className="w-full p-3 pl-10 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/30 text-white placeholder-white/50"
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50 w-5 h-5" />
        </div>

        {/* 搜索按钮 */}
        <div className="flex gap-2">
          <button
            onClick={handleSearch}
            className="px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors"
          >
            搜索
          </button>
          <button
            onClick={handleReset}
            className="px-4 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg font-medium transition-colors"
          >
            重置
          </button>
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
            title="高级过滤"
          >
            <Filter size={20} />
          </button>
        </div>
      </div>

      {/* 高级过滤选项 */}
      {showAdvanced && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-3 border-t border-white/10">
          {/* 模型选择 */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-white/90 flex items-center">
              <Filter size={14} className="mr-1" />
              模型
            </label>
            <select
              value={model || ''}
              onChange={(e) => setModel(e.target.value || undefined)}
              className="w-full p-2.5 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white/30"
            >
              <option value="">所有模型</option>
              {availableModels.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          {/* 日期范围 */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-white/90 flex items-center">
              <Calendar size={14} className="mr-1" />
              开始日期
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full p-2.5 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white/30"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-white/90 flex items-center">
              <Calendar size={14} className="mr-1" />
              结束日期
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full p-2.5 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white/30"
            />
          </div>

          {/* 标签选择 */}
          <div className="col-span-1 md:col-span-2 lg:col-span-3 space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-sm font-medium text-white/90 flex items-center">
                <Tag size={14} className="mr-1" />
                标签
              </label>
              <button
                onClick={() => setIsAddingTag(!isAddingTag)}
                className="text-xs flex items-center text-indigo-400 hover:text-indigo-300"
              >
                <Plus size={14} className="mr-1" />
                添加自定义标签
              </button>
            </div>
            
            {isAddingTag && (
              <div className="flex mb-2">
                <input
                  type="text"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  placeholder="输入新标签..."
                  className="flex-grow p-2 bg-white/5 border border-white/10 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-white/30 text-white"
                  onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
                />
                <button
                  onClick={handleAddTag}
                  className="px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-r-lg"
                >
                  <Plus size={18} />
                </button>
              </div>
            )}
            
            <div className="flex flex-wrap gap-2">
              {availableTags.map(tag => (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={`px-3 py-1.5 rounded-full text-sm flex items-center ${
                    selectedTags.includes(tag)
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white/10 text-white/70 hover:bg-white/20'
                  }`}
                >
                  {tag}
                  {selectedTags.includes(tag) && (
                    <X size={14} className="ml-1" />
                  )}
                </button>
              ))}
              {selectedTags.filter(tag => !availableTags.includes(tag)).map(tag => (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className="px-3 py-1.5 rounded-full text-sm flex items-center bg-indigo-600/70 text-white"
                >
                  {tag}
                  <X size={14} className="ml-1" />
                </button>
              ))}
              {availableTags.length === 0 && selectedTags.length === 0 && (
                <span className="text-white/50 text-sm">暂无可用标签</span>
              )}
            </div>
          </div>
          
          {/* 保存搜索 */}
          <div className="col-span-1 md:col-span-2 lg:col-span-3 pt-3 border-t border-white/10">
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-medium text-white/90">保存的搜索</label>
              <button
                onClick={() => setIsSavingSearch(!isSavingSearch)}
                className="text-xs flex items-center text-indigo-400 hover:text-indigo-300"
              >
                <Save size={14} className="mr-1" />
                保存当前搜索
              </button>
            </div>
            
            {isSavingSearch && (
              <div className="flex mb-3">
                <input
                  type="text"
                  value={searchName}
                  onChange={(e) => setSearchName(e.target.value)}
                  placeholder="搜索名称..."
                  className="flex-grow p-2 bg-white/5 border border-white/10 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-white/30 text-white"
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveSearch()}
                />
                <button
                  onClick={handleSaveSearch}
                  className="px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-r-lg"
                >
                  <Save size={18} />
                </button>
              </div>
            )}
            
            <div className="flex flex-wrap gap-2">
              {savedSearches.map((saved, index) => (
                <div key={index} className="bg-white/10 rounded-lg p-2 flex items-center">
                  <button
                    onClick={() => handleLoadSearch(saved.filters)}
                    className="text-sm text-white/90 hover:text-white"
                  >
                    {saved.name}
                  </button>
                  <button
                    onClick={() => handleDeleteSavedSearch(index)}
                    className="ml-2 text-white/50 hover:text-white"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
              {savedSearches.length === 0 && (
                <span className="text-white/50 text-sm">暂无保存的搜索</span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}