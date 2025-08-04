'use client';

import React, { useState } from 'react';
import { X, Download, Share, RefreshCw, Tag, Plus, Check, Edit, Save } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import type { GenerationHistory } from '@/types/database';
import MobileOptimized from '../mobile/MobileOptimized';
import TouchImageViewer from '../mobile/TouchImageViewer';
import ProgressiveImage from '../mobile/ProgressiveImage';

interface HistoryDetailProps {
  item: GenerationHistory;
  relatedItems?: GenerationHistory[];
  onClose: () => void;
  onRegenerate: (item: GenerationHistory) => void;
  onDownload: (item: GenerationHistory) => void;
  onShare: (item: GenerationHistory) => void;
  onUpdateTags: (item: GenerationHistory, tags: string[]) => void;
  onRelatedItemClick?: (item: GenerationHistory) => void;
  onEdit?: (item: GenerationHistory) => void;
}

export function HistoryDetail({
  item,
  relatedItems = [],
  onClose,
  onRegenerate,
  onDownload,
  onShare,
  onUpdateTags,
  onRelatedItemClick,
  onEdit
}: HistoryDetailProps) {
  const [isEditingTags, setIsEditingTags] = useState(false);
  const [newTag, setNewTag] = useState('');
  const [tags, setTags] = useState<string[]>(item.tags || []);
  const [regenerateOptions, setRegenerateOptions] = useState<{
    showOptions: boolean;
    modifiedParameters: Partial<typeof item.parameters>;
  }>({
    showOptions: false,
    modifiedParameters: {}
  });

  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleSaveTags = () => {
    onUpdateTags(item, tags);
    setIsEditingTags(false);
  };

  const handleRegenerateClick = () => {
    if (regenerateOptions.showOptions) {
      // 如果已经显示选项，则使用当前参数进行重新生成
      onRegenerate({
        ...item,
        parameters: {
          ...item.parameters,
          ...regenerateOptions.modifiedParameters
        }
      });
      setRegenerateOptions({ showOptions: false, modifiedParameters: {} });
    } else {
      // 显示重新生成选项
      setRegenerateOptions({ showOptions: true, modifiedParameters: {} });
    }
  };

  const handleParameterChange = (key: string, value: any) => {
    setRegenerateOptions(prev => ({
      ...prev,
      modifiedParameters: {
        ...prev.modifiedParameters,
        [key]: value
      }
    }));
  };

  const handleCancelRegenerate = () => {
    setRegenerateOptions({ showOptions: false, modifiedParameters: {} });
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* 头部 */}
        <div className="flex justify-between items-center p-4 border-b border-white/10">
          <h2 className="text-xl font-semibold">图像详情</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-white/10 rounded-full"
          >
            <X size={24} />
          </button>
        </div>

        {/* 内容区域 */}
        <div className="flex-grow overflow-y-auto p-4 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 左侧：图像 */}
          <div className="space-y-4">
            <div className="aspect-square rounded-lg overflow-hidden bg-black/30">
              <MobileOptimized
                mobileContent={
                  <TouchImageViewer
                    imageUrl={item.imageUrl}
                    alt={item.prompt}
                    className="w-full h-full"
                  />
                }
              >
                <ProgressiveImage
                  src={item.imageUrl}
                  alt={item.prompt}
                  className="w-full h-full object-contain"
                />
              </MobileOptimized>
            </div>

            {/* 操作按钮 */}
            <div className="flex justify-center space-x-4">
              <button
                onClick={handleRegenerateClick}
                className="flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
              >
                <RefreshCw size={18} className="mr-2" />
                {regenerateOptions.showOptions ? '确认重新生成' : '重新生成'}
              </button>
              {onEdit && (
                <button
                  onClick={() => onEdit(item)}
                  className="flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                >
                  <Edit size={18} className="mr-2" />
                  编辑
                </button>
              )}
              <button
                onClick={() => onDownload(item)}
                className="flex items-center px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
              >
                <Download size={18} className="mr-2" />
                下载
              </button>
              <button
                onClick={() => onShare(item)}
                className="flex items-center px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
              >
                <Share size={18} className="mr-2" />
                分享
              </button>
            </div>

            {/* 重新生成选项 */}
            {regenerateOptions.showOptions && (
              <div className="mt-4 p-4 bg-white/5 rounded-lg">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-sm font-medium">调整参数</h3>
                  <button
                    onClick={handleCancelRegenerate}
                    className="text-xs flex items-center text-white/70 hover:text-white"
                  >
                    <X size={14} className="mr-1" />
                    取消
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {/* 种子值 */}
                  <div>
                    <label className="text-xs text-white/70 block mb-1">种子值</label>
                    <div className="flex items-center">
                      <input
                        type="number"
                        value={regenerateOptions.modifiedParameters.seed !== undefined
                          ? regenerateOptions.modifiedParameters.seed
                          : item.parameters.seed || -1}
                        onChange={(e) => handleParameterChange('seed', parseInt(e.target.value) || -1)}
                        className="w-full p-2 bg-white/10 border border-white/20 rounded text-white text-sm"
                        placeholder="随机"
                      />
                      <button
                        onClick={() => handleParameterChange('seed', Math.floor(Math.random() * 2147483647))}
                        className="ml-2 p-1.5 bg-white/10 hover:bg-white/20 rounded text-xs"
                        title="随机种子"
                      >
                        <RefreshCw size={14} />
                      </button>
                    </div>
                    <div className="text-xs text-white/50 mt-1">
                      使用 -1 表示随机种子
                    </div>
                  </div>

                  {/* 风格选择 */}
                  {item.parameters.style !== undefined && (
                    <div>
                      <label className="text-xs text-white/70 block mb-1">风格</label>
                      <select
                        value={regenerateOptions.modifiedParameters.style !== undefined
                          ? regenerateOptions.modifiedParameters.style
                          : item.parameters.style || ''}
                        onChange={(e) => handleParameterChange('style', e.target.value)}
                        className="w-full p-2 bg-white/10 border border-white/20 rounded text-white text-sm"
                      >
                        <option value="">默认</option>
                        <option value="anime">动漫风格</option>
                        <option value="photographic">摄影风格</option>
                        <option value="digital-art">数字艺术</option>
                        <option value="fantasy">奇幻风格</option>
                        <option value="oil-painting">油画风格</option>
                      </select>
                    </div>
                  )}
                </div>

                <div className="text-xs text-white/70 mt-3">
                  点击&quot;确认重新生成&quot;按钮使用新参数生成图像
                </div>
              </div>
            )}
          </div>

          {/* 右侧：详细信息 */}
          <div className="space-y-6">
            {/* 提示词 */}
            <div>
              <h3 className="text-sm text-white/50 mb-1">提示词</h3>
              <p className="text-white bg-white/5 p-3 rounded-lg">{item.prompt}</p>
            </div>

            {/* 模型和参数 */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm text-white/50 mb-1">模型</h3>
                <p className="text-white bg-white/5 p-3 rounded-lg">{item.model}</p>
              </div>
              <div>
                <h3 className="text-sm text-white/50 mb-1">尺寸</h3>
                <p className="text-white bg-white/5 p-3 rounded-lg">
                  {item.parameters.width} × {item.parameters.height}
                </p>
              </div>
              <div>
                <h3 className="text-sm text-white/50 mb-1">宽高比</h3>
                <p className="text-white bg-white/5 p-3 rounded-lg">
                  {item.parameters.aspectRatio}
                </p>
              </div>
              <div>
                <h3 className="text-sm text-white/50 mb-1">格式</h3>
                <p className="text-white bg-white/5 p-3 rounded-lg">
                  {item.parameters.outputFormat.toUpperCase()}
                </p>
              </div>
              {item.parameters.seed !== undefined && (
                <div>
                  <h3 className="text-sm text-white/50 mb-1">种子</h3>
                  <p className="text-white bg-white/5 p-3 rounded-lg">
                    {item.parameters.seed}
                  </p>
                </div>
              )}
              {item.parameters.style && (
                <div>
                  <h3 className="text-sm text-white/50 mb-1">风格</h3>
                  <p className="text-white bg-white/5 p-3 rounded-lg">
                    {item.parameters.style}
                  </p>
                </div>
              )}
            </div>

            {/* 标签 */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-sm text-white/50">标签</h3>
                {!isEditingTags ? (
                  <button
                    onClick={() => setIsEditingTags(true)}
                    className="text-xs flex items-center text-indigo-400 hover:text-indigo-300"
                  >
                    <Edit size={14} className="mr-1" />
                    编辑标签
                  </button>
                ) : (
                  <button
                    onClick={handleSaveTags}
                    className="text-xs flex items-center text-green-400 hover:text-green-300"
                  >
                    <Save size={14} className="mr-1" />
                    保存标签
                  </button>
                )}
              </div>

              {isEditingTags ? (
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    {tags.map(tag => (
                      <div key={tag} className="bg-white/10 px-2 py-1 rounded-full text-sm flex items-center">
                        <span>{tag}</span>
                        <button
                          onClick={() => handleRemoveTag(tag)}
                          className="ml-1 text-white/50 hover:text-white"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                    {tags.length === 0 && (
                      <span className="text-white/50 text-sm">暂无标签</span>
                    )}
                  </div>
                  <div className="flex">
                    <input
                      type="text"
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      placeholder="添加新标签..."
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
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {tags.map(tag => (
                    <div key={tag} className="bg-white/10 px-2 py-1 rounded-full text-sm flex items-center">
                      <Tag size={12} className="mr-1" />
                      <span>{tag}</span>
                    </div>
                  ))}
                  {tags.length === 0 && (
                    <span className="text-white/50 text-sm">暂无标签</span>
                  )}
                </div>
              )}
            </div>

            {/* 创建时间和下载次数 */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm text-white/50 mb-1">创建时间</h3>
                <p className="text-white/70">
                  {format(new Date(item.createdAt), 'yyyy-MM-dd HH:mm:ss')}
                  <br />
                  <span className="text-sm text-white/50">
                    ({formatDistanceToNow(new Date(item.createdAt), {
                      addSuffix: true,
                      locale: zhCN
                    })})
                  </span>
                </p>
              </div>
              <div>
                <h3 className="text-sm text-white/50 mb-1">下载次数</h3>
                <p className="text-white/70">{item.downloadCount} 次</p>
              </div>
            </div>
          </div>
        </div>

        {/* 相关图像 */}
        {relatedItems.length > 0 && (
          <div className="p-4 border-t border-white/10">
            <h3 className="text-sm text-white/50 mb-3">相关图像</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {relatedItems.map(related => (
                <div
                  key={related.id}
                  className="aspect-square rounded-lg overflow-hidden bg-white/5 hover:bg-white/10 cursor-pointer"
                  onClick={() => onRelatedItemClick && onRelatedItemClick(related)}
                >
                  <ProgressiveImage
                    src={related.thumbnailUrl || related.imageUrl}
                    alt={related.prompt}
                    className="w-full h-full"
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
