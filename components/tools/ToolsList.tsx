'use client'

import React, { useState } from 'react';
import { ToolCategory } from '@/config/tools';
import { useTools, useToolsByCategory } from '@/hooks/useTools';
import ToolCard from './ToolCard';

interface ToolsListProps {
  category?: ToolCategory;
  showSearch?: boolean;
  showFilters?: boolean;
  compact?: boolean;
  limit?: number;
}

const ToolsList: React.FC<ToolsListProps> = ({
  category,
  showSearch = true,
  showFilters = true,
  compact = false,
  limit
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ToolCategory | undefined>(category);
  const [showFreeOnly, setShowFreeOnly] = useState(false);

  const { tools, loading } = useTools({
    category: selectedCategory,
    searchQuery,
    freeOnly: showFreeOnly,
    enabledOnly: true
  });

  const displayTools = limit ? tools.slice(0, limit) : tools;

  const categories = Object.values(ToolCategory);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, index) => (
          <div key={index} className="bg-white rounded-lg shadow-md p-6 animate-pulse">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-8 h-8 bg-gray-200 rounded"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
            <div className="space-y-2 mb-4">
              <div className="h-3 bg-gray-200 rounded"></div>
              <div className="h-3 bg-gray-200 rounded w-5/6"></div>
            </div>
            <div className="h-8 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      {(showSearch || showFilters) && (
        <div className="bg-white rounded-lg shadow-sm p-4 space-y-4">
          {showSearch && (
            <div className="relative">
              <input
                type="text"
                placeholder="Search tools..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
          )}

          {showFilters && (
            <div className="flex flex-wrap gap-4">
              {/* Category filter */}
              <div className="flex-1 min-w-48">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <select
                  value={selectedCategory || ''}
                  onChange={(e) => setSelectedCategory(e.target.value as ToolCategory || undefined)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="">All Categories</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>
                      {cat.split('-').map(word => 
                        word.charAt(0).toUpperCase() + word.slice(1)
                      ).join(' ')}
                    </option>
                  ))}
                </select>
              </div>

              {/* Free only filter */}
              <div className="flex items-center">
                <input
                  id="free-only"
                  type="checkbox"
                  checked={showFreeOnly}
                  onChange={(e) => setShowFreeOnly(e.target.checked)}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label htmlFor="free-only" className="ml-2 text-sm text-gray-700">
                  Free tools only
                </label>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Results count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          {displayTools.length} tool{displayTools.length !== 1 ? 's' : ''} found
          {limit && tools.length > limit && (
            <span className="ml-1 text-indigo-600">
              (showing first {limit})
            </span>
          )}
        </p>

        {/* Sort options */}
        <div className="flex items-center space-x-2">
          <label className="text-sm text-gray-600">Sort by:</label>
          <select className="text-sm border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-indigo-500 focus:border-transparent">
            <option value="name">Name</option>
            <option value="points">Points</option>
            <option value="category">Category</option>
            <option value="popularity">Popularity</option>
          </select>
        </div>
      </div>

      {/* Tools grid */}
      {displayTools.length > 0 ? (
        <div className={`grid gap-6 ${
          compact 
            ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4' 
            : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
        }`}>
          {displayTools.map(tool => (
            <ToolCard 
              key={tool.id} 
              tool={tool} 
              compact={compact}
              showUsage={!compact}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">🔍</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No tools found</h3>
          <p className="text-gray-600 mb-4">
            Try adjusting your search criteria or filters.
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory(undefined);
              setShowFreeOnly(false);
            }}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-600 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Clear filters
          </button>
        </div>
      )}
    </div>
  );
};

export default ToolsList;