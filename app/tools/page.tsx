'use client'

import React, { useState } from 'react';
import { ToolCategory } from '@/config/tools';
import ToolsList from '@/components/tools/ToolsList';
import { usePopularTools, useToolRecommendations } from '@/hooks/useTools';

const ToolsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'all' | 'popular' | 'recommended'>('all');
  const { popularTools, loading: popularLoading } = usePopularTools(6);
  const { recommendedTools, loading: recommendedLoading } = useToolRecommendations();

  const categories = [
    { id: ToolCategory.TEXT_TO_IMAGE, name: 'Text to Image', icon: '🎨', description: 'Generate images from text prompts' },
    { id: ToolCategory.IMAGE_SEARCH, name: 'Image Search', icon: '🔍', description: 'Search for images using text or images' },
    { id: ToolCategory.IMAGE_ANALYSIS, name: 'Image Analysis', icon: '📊', description: 'Analyze and extract information from images' },
    { id: ToolCategory.IMAGE_EDITING, name: 'Image Editing', icon: '✏️', description: 'Edit and enhance your images' },
    { id: ToolCategory.IMAGE_TO_VIDEO, name: 'Image to Video', icon: '🎬', description: 'Convert images to animated videos' },
    { id: ToolCategory.VIDEO_PROCESSING, name: 'Video Processing', icon: '📹', description: 'Process and enhance videos' },
    { id: ToolCategory.BATCH_OPERATIONS, name: 'Batch Operations', icon: '📦', description: 'Perform operations on multiple files' },
    { id: ToolCategory.SOCIAL_SHARING, name: 'Social Sharing', icon: '📱', description: 'Share content to social platforms' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              AI Tools Collection
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Discover powerful AI tools for image generation, editing, analysis, and more. 
              From text-to-image generation to advanced video processing.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation Tabs */}
        <div className="mb-8">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('all')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'all'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              All Tools
            </button>
            <button
              onClick={() => setActiveTab('popular')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'popular'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Popular
            </button>
            <button
              onClick={() => setActiveTab('recommended')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'recommended'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Recommended
            </button>
          </nav>
        </div>

        {/* Content based on active tab */}
        {activeTab === 'all' && (
          <div className="space-y-12">
            {/* Categories Overview */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Browse by Category</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {categories.map(category => (
                  <div
                    key={category.id}
                    className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow duration-200 cursor-pointer group"
                    onClick={() => {
                      // Navigate to category page or filter
                      const element = document.getElementById(`category-${category.id}`);
                      element?.scrollIntoView({ behavior: 'smooth' });
                    }}
                  >
                    <div className="text-3xl mb-3">{category.icon}</div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-indigo-600">
                      {category.name}
                    </h3>
                    <p className="text-sm text-gray-600">{category.description}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* All Tools by Category */}
            {categories.map(category => (
              <section key={category.id} id={`category-${category.id}`}>
                <div className="flex items-center mb-6">
                  <span className="text-2xl mr-3">{category.icon}</span>
                  <h2 className="text-2xl font-bold text-gray-900">{category.name}</h2>
                </div>
                <ToolsList category={category.id} showSearch={false} showFilters={false} />
              </section>
            ))}
          </div>
        )}

        {activeTab === 'popular' && (
          <div>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Popular Tools</h2>
              <p className="text-gray-600">Most used tools by our community</p>
            </div>
            
            {popularLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, index) => (
                  <div key={index} className="bg-white rounded-lg shadow-md p-6 animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                    <div className="h-3 bg-gray-200 rounded mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {popularTools.map(({ tool, usageCount }) => (
                  <div key={tool.id} className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">{tool.icon}</span>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{tool.name}</h3>
                          <p className="text-sm text-gray-500">{usageCount} uses</p>
                        </div>
                      </div>
                      {tool.isFree ? (
                        <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                          Free
                        </span>
                      ) : (
                        <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                          {tool.pointsCost} pts
                        </span>
                      )}
                    </div>
                    <p className="text-gray-600 mb-4">{tool.description}</p>
                    <button className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 transition-colors">
                      Use Tool
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'recommended' && (
          <div>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Recommended for You</h2>
              <p className="text-gray-600">Tools selected based on your usage patterns</p>
            </div>
            
            {recommendedLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading recommendations...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {recommendedTools.map(tool => (
                  <div key={tool.id} className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">{tool.icon}</span>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{tool.name}</h3>
                          <p className="text-sm text-gray-500">Recommended</p>
                        </div>
                      </div>
                      {tool.isFree ? (
                        <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                          Free
                        </span>
                      ) : (
                        <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                          {tool.pointsCost} pts
                        </span>
                      )}
                    </div>
                    <p className="text-gray-600 mb-4">{tool.description}</p>
                    <div className="flex flex-wrap gap-1 mb-4">
                      {tool.features.slice(0, 2).map((feature, index) => (
                        <span 
                          key={index}
                          className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded"
                        >
                          {feature}
                        </span>
                      ))}
                    </div>
                    <button className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 transition-colors">
                      Try Now
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ToolsPage;