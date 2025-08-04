'use client';

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { Download, Share, RefreshCw, Tag, Eye, EyeOff, Trash2, Check, CheckSquare, Square, X } from 'lucide-react';
import type { GenerationHistory } from '@/types/database';
import MobileOptimized from '../mobile/MobileOptimized';
import ProgressiveImage from '../mobile/ProgressiveImage';

interface HistoryGridProps {
  items: GenerationHistory[];
  onViewDetails: (item: GenerationHistory) => void;
  onRegenerate: (item: GenerationHistory) => void;
  onToggleVisibility: (item: GenerationHistory) => void;
  onDelete: (item: GenerationHistory) => void;
  onDownload: (item: GenerationHistory) => void;
  onShare: (item: GenerationHistory) => void;
  onEdit?: (item: GenerationHistory) => void;
  onTagClick?: (tag: string) => void;
  onBatchOperation?: (operation: string, items: GenerationHistory[]) => void;
}

export function HistoryGrid({
  items,
  onViewDetails,
  onRegenerate,
  onToggleVisibility,
  onDelete,
  onDownload,
  onShare,
  onEdit,
  onTagClick,
  onBatchOperation
}: HistoryGridProps) {
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [selectionMode, setSelectionMode] = useState<boolean>(false);

  if (items.length === 0) {
    return (
      <div className="text-center py-12 bg-white/5 rounded-lg">
        <p className="text-gray-400">暂无历史记录</p>
      </div>
    );
  }

  const toggleSelection = (id: string) => {
    setSelectedItems(prev => 
      prev.includes(id) 
        ? prev.filter(itemId => itemId !== id) 
        : [...prev, id]
    );
  };

  const toggleSelectionMode = () => {
    setSelectionMode(!selectionMode);
    if (selectionMode) {
      setSelectedItems([]);
    }
  };

  const selectAll = () => {
    if (selectedItems.length === items.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(items.map(item => item.id));
    }
  };

  const handleBatchOperation = (operation: string) => {
    if (selectedItems.length === 0 || !onBatchOperation) return;
    
    const selectedHistoryItems = items.filter(item => selectedItems.includes(item.id));
    onBatchOperation(operation, selectedHistoryItems);
  };

  // Desktop layout
  const DesktopLayout = (
    <>
      {/* 批量操作工具栏 */}
      <div className="flex justify-between items-center mb-4">
        <button
          onClick={toggleSelectionMode}
          className={`flex items-center px-3 py-1.5 rounded-lg transition-colors ${
            selectionMode ? 'bg-indigo-600 text-white' : 'bg-white/10 text-white/70 hover:bg-white/20'
          }`}
        >
          {selectionMode ? (
            <>
              <X size={16} className="mr-1.5" />
              取消选择
            </>
          ) : (
            <>
              <CheckSquare size={16} className="mr-1.5" />
              批量选择
            </>
          )}
        </button>

        {selectionMode && (
          <div className="flex items-center space-x-2">
            <span className="text-sm text-white/70">
              已选择 {selectedItems.length} 项
            </span>
            <button
              onClick={selectAll}
              className="flex items-center px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white/70 rounded-lg transition-colors"
            >
              {selectedItems.length === items.length ? (
                <>
                  <Square size={16} className="mr-1.5" />
                  取消全选
                </>
              ) : (
                <>
                  <CheckSquare size={16} className="mr-1.5" />
                  全选
                </>
              )}
            </button>
            
            {selectedItems.length > 0 && (
              <div className="flex space-x-1">
                <button
                  onClick={() => handleBatchOperation('download')}
                  className="flex items-center px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white/70 rounded-lg transition-colors"
                  title="批量下载"
                >
                  <Download size={16} className="mr-1.5" />
                  下载
                </button>
                <button
                  onClick={() => handleBatchOperation('share')}
                  className="flex items-center px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white/70 rounded-lg transition-colors"
                  title="批量分享"
                >
                  <Share size={16} className="mr-1.5" />
                  分享
                </button>
                <button
                  onClick={() => handleBatchOperation('tag')}
                  className="flex items-center px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white/70 rounded-lg transition-colors"
                  title="批量添加标签"
                >
                  <Tag size={16} className="mr-1.5" />
                  标签
                </button>
                <button
                  onClick={() => handleBatchOperation('delete')}
                  className="flex items-center px-3 py-1.5 bg-red-500/70 hover:bg-red-500/90 text-white rounded-lg transition-colors"
                  title="批量删除"
                >
                  <Trash2 size={16} className="mr-1.5" />
                  删除
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 图像网格 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {items.map((item) => (
          <Card 
            key={item.id} 
            className={`overflow-hidden bg-white/5 border-white/10 hover:border-white/20 transition-all duration-300 ${
              selectedItems.includes(item.id) ? 'ring-2 ring-indigo-500' : ''
            }`}
            onMouseEnter={() => setHoveredItem(item.id)}
            onMouseLeave={() => setHoveredItem(null)}
          >
            <div 
              className="relative aspect-square cursor-pointer" 
              onClick={() => selectionMode ? toggleSelection(item.id) : onViewDetails(item)}
            >
              <img
                src={item.thumbnailUrl || item.imageUrl}
                alt={item.prompt}
                className="w-full h-full object-cover"
              />
              
              {/* 选择模式下的选择框 */}
              {selectionMode && (
                <div className={`absolute top-2 left-2 p-1 rounded-full ${
                  selectedItems.includes(item.id) 
                    ? 'bg-indigo-500 text-white' 
                    : 'bg-white/30 text-white/70'
                }`}>
                  {selectedItems.includes(item.id) ? (
                    <Check size={16} />
                  ) : (
                    <Square size={16} />
                  )}
                </div>
              )}
              
              {/* 悬停时显示的操作按钮 */}
              {hoveredItem === item.id && !selectionMode && (
                <div className="absolute inset-0 bg-black/50 flex flex-col justify-between p-3">
                  <div className="flex justify-end space-x-2">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleVisibility(item);
                      }}
                      className="p-1.5 bg-white/10 hover:bg-white/20 rounded-full"
                      title={item.isPublic ? "设为私有" : "设为公开"}
                    >
                      {item.isPublic ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(item);
                      }}
                      className="p-1.5 bg-white/10 hover:bg-red-500/70 rounded-full"
                      title="删除"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  
                  <div className="text-sm text-white/90 line-clamp-3 bg-black/50 p-2 rounded">
                    {item.prompt}
                  </div>
                </div>
              )}
            </div>
            
            <CardContent className="p-3">
              <div className="flex justify-between items-center mb-2">
                <div className="text-sm font-medium">{item.model}</div>
                <div className="text-xs text-gray-400">
                  {formatDistanceToNow(new Date(item.createdAt), {
                    addSuffix: true,
                    locale: zhCN
                  })}
                </div>
              </div>
              
              {/* 标签 */}
              {item.tags && item.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-2">
                  {item.tags.map(tag => (
                    <span 
                      key={tag} 
                      className="text-xs bg-white/10 hover:bg-white/20 px-2 py-0.5 rounded-full cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onTagClick) onTagClick(tag);
                      }}
                    >
                      <Tag size={10} className="inline mr-1" />
                      {tag}
                    </span>
                  ))}
                </div>
              )}
              
              {/* 操作按钮 */}
              {!selectionMode && (
                <div className="flex justify-between mt-2">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      onRegenerate(item);
                    }}
                    className="p-1.5 bg-white/5 hover:bg-white/10 rounded"
                    title="重新生成"
                  >
                    <RefreshCw size={16} />
                  </button>
                  {onEdit && (
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        onEdit(item);
                      }}
                      className="p-1.5 bg-white/5 hover:bg-green-500/30 rounded"
                      title="编辑"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                      </svg>
                    </button>
                  )}
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      onDownload(item);
                    }}
                    className="p-1.5 bg-white/5 hover:bg-white/10 rounded"
                    title="下载"
                  >
                    <Download size={16} />
                  </button>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      onShare(item);
                    }}
                    className="p-1.5 bg-white/5 hover:bg-white/10 rounded"
                    title="分享"
                  >
                    <Share size={16} />
                  </button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );

  // Mobile layout
  const MobileLayout = (
    <>
      {/* 移动端批量操作工具栏 - 简化版 */}
      <div className="flex justify-between items-center mb-3">
        <button
          onClick={toggleSelectionMode}
          className={`flex items-center px-2 py-1 rounded-lg text-sm transition-colors ${
            selectionMode ? 'bg-indigo-600 text-white' : 'bg-white/10 text-white/70'
          }`}
        >
          {selectionMode ? (
            <>
              <X size={14} className="mr-1" />
              取消
            </>
          ) : (
            <>
              <CheckSquare size={14} className="mr-1" />
              选择
            </>
          )}
        </button>

        {selectionMode && (
          <div className="flex items-center">
            <span className="text-xs text-white/70 mr-2">
              {selectedItems.length} 项
            </span>
            <button
              onClick={selectAll}
              className="flex items-center px-2 py-1 bg-white/10 text-white/70 rounded-lg text-sm"
            >
              {selectedItems.length === items.length ? "取消全选" : "全选"}
            </button>
          </div>
        )}
      </div>

      {/* 移动端批量操作按钮 - 选择模式下显示 */}
      {selectionMode && selectedItems.length > 0 && (
        <div className="flex justify-between mb-3 overflow-x-auto pb-1">
          <button
            onClick={() => handleBatchOperation('download')}
            className="flex items-center px-2 py-1 bg-white/10 text-white/70 rounded-lg text-sm mr-1 flex-shrink-0"
          >
            <Download size={14} className="mr-1" />
            下载
          </button>
          <button
            onClick={() => handleBatchOperation('share')}
            className="flex items-center px-2 py-1 bg-white/10 text-white/70 rounded-lg text-sm mr-1 flex-shrink-0"
          >
            <Share size={14} className="mr-1" />
            分享
          </button>
          <button
            onClick={() => handleBatchOperation('tag')}
            className="flex items-center px-2 py-1 bg-white/10 text-white/70 rounded-lg text-sm mr-1 flex-shrink-0"
          >
            <Tag size={14} className="mr-1" />
            标签
          </button>
          <button
            onClick={() => handleBatchOperation('delete')}
            className="flex items-center px-2 py-1 bg-red-500/70 text-white rounded-lg text-sm flex-shrink-0"
          >
            <Trash2 size={14} className="mr-1" />
            删除
          </button>
        </div>
      )}

      {/* 移动端图像网格 - 2列 */}
      <div className="grid grid-cols-2 gap-2">
        {items.map((item) => (
          <Card 
            key={item.id} 
            className={`overflow-hidden bg-white/5 border-white/10 transition-all ${
              selectedItems.includes(item.id) ? 'ring-2 ring-indigo-500' : ''
            }`}
          >
            <div 
              className="relative aspect-square cursor-pointer" 
              onClick={() => selectionMode ? toggleSelection(item.id) : onViewDetails(item)}
            >
              <ProgressiveImage
                src={item.thumbnailUrl || item.imageUrl}
                alt={item.prompt}
                className="w-full h-full"
              />
              
              {/* 选择模式下的选择框 */}
              {selectionMode && (
                <div className={`absolute top-1 left-1 p-1 rounded-full ${
                  selectedItems.includes(item.id) 
                    ? 'bg-indigo-500 text-white' 
                    : 'bg-white/30 text-white/70'
                }`}>
                  {selectedItems.includes(item.id) ? (
                    <Check size={12} />
                  ) : (
                    <Square size={12} />
                  )}
                </div>
              )}
              
              {/* 移动端触摸友好的操作层 - 始终显示提示文本 */}
              {!selectionMode && (
                <div className="absolute bottom-0 left-0 right-0 bg-black/60 p-1">
                  <div className="text-xs text-white/90 truncate">
                    {item.prompt.length > 20 ? `${item.prompt.substring(0, 20)}...` : item.prompt}
                  </div>
                </div>
              )}
            </div>
            
            <CardContent className="p-2">
              <div className="flex justify-between items-center mb-1">
                <div className="text-xs font-medium truncate">{item.model}</div>
                <div className="text-xs text-gray-400">
                  {formatDistanceToNow(new Date(item.createdAt), {
                    addSuffix: true,
                    locale: zhCN
                  })}
                </div>
              </div>
              
              {/* 移动端操作按钮 - 更紧凑 */}
              {!selectionMode && (
                <div className="flex justify-between mt-1">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      onRegenerate(item);
                    }}
                    className="p-1 bg-white/5 rounded"
                  >
                    <RefreshCw size={12} />
                  </button>
                  {onEdit && (
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        onEdit(item);
                      }}
                      className="p-1 bg-white/5 rounded"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                      </svg>
                    </button>
                  )}
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      onDownload(item);
                    }}
                    className="p-1 bg-white/5 rounded"
                  >
                    <Download size={12} />
                  </button>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      onShare(item);
                    }}
                    className="p-1 bg-white/5 rounded"
                  >
                    <Share size={12} />
                  </button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );

  return (
    <MobileOptimized mobileContent={MobileLayout}>
      {DesktopLayout}
    </MobileOptimized>
  );
}