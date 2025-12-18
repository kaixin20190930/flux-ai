'use client';

import React, { useState } from 'react';
import { X, Download, Share, Tag, Plus, Check } from 'lucide-react';
import type { GenerationHistory } from '@/types/database';

interface BatchOperationsModalProps {
  operation: 'download' | 'share' | 'tag' | 'delete' | 'edit';
  items: GenerationHistory[];
  onClose: () => void;
  onConfirm: (params: any) => Promise<void>;
}

export function BatchOperationsModal({
  operation,
  items,
  onClose,
  onConfirm
}: BatchOperationsModalProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [platform, setPlatform] = useState('twitter');
  const [newTag, setNewTag] = useState('');
  const [tagsToAdd, setTagsToAdd] = useState<string[]>([]);
  const [downloadFormat, setDownloadFormat] = useState<'original' | 'zip'>('original');
  const [downloadQuality, setDownloadQuality] = useState<'original' | 'compressed'>('original');
  
  const handleAddTag = () => {
    if (newTag.trim() && !tagsToAdd.includes(newTag.trim())) {
      setTagsToAdd([...tagsToAdd, newTag.trim()]);
      setNewTag('');
    }
  };
  
  const handleRemoveTag = (tagToRemove: string) => {
    setTagsToAdd(tagsToAdd.filter(tag => tag !== tagToRemove));
  };
  
  const handleConfirm = async () => {
    setIsProcessing(true);
    const startTime = performance.now();
    
    try {
      let params;
      
      switch (operation) {
        case 'download':
          params = { format: downloadFormat, quality: downloadQuality };
          break;
        case 'share':
          params = { platform };
          break;
        case 'tag':
          params = { tags: tagsToAdd };
          break;
        case 'delete':
          params = {};
          break;
      }
      
      await onConfirm(params);
      
      // 记录成功的批量操作性能指标
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // 发送性能指标到API
      try {
        await fetch('/api/performance/metrics', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: `batch.${operation}_operation`,
            value: duration,
            unit: 'ms',
            context: {
              itemCount: items.length,
              operation,
              success: true,
              ...params
            }
          })
        });
      } catch (metricsError) {
        console.warn('Failed to record performance metrics:', metricsError);
      }
      
      onClose();
    } catch (error) {
      console.error('批量操作失败', error);
      
      // 记录失败的批量操作
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      try {
        await fetch('/api/performance/metrics', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: `batch.${operation}_operation`,
            value: duration,
            unit: 'ms',
            context: {
              itemCount: items.length,
              operation,
              success: false,
              error: error instanceof Error ? error.message : 'unknown_error'
            }
          })
        });
      } catch (metricsError) {
        console.warn('Failed to record performance metrics:', metricsError);
      }
    } finally {
      setIsProcessing(false);
    }
  };
  
  const getTitle = () => {
    switch (operation) {
      case 'download': return '批量下载';
      case 'share': return '批量分享';
      case 'tag': return '批量添加标签';
      case 'delete': return '批量删除';
      case 'edit': return '批量编辑';
      default: return '批量操作';
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-lg max-w-lg w-full overflow-hidden flex flex-col">
        {/* 头部 */}
        <div className="flex justify-between items-center p-4 border-b border-white/10">
          <h2 className="text-xl font-semibold">{getTitle()}</h2>
          <button 
            onClick={onClose}
            className="p-1 hover:bg-white/10 rounded-full"
            disabled={isProcessing}
          >
            <X size={24} />
          </button>
        </div>
        
        {/* 内容区域 */}
        <div className="p-6 flex-grow">
          <div className="mb-4">
            <p className="text-white/70">
              已选择 <span className="font-semibold text-white">{items.length}</span> 个项目
            </p>
          </div>
          
          {/* 下载选项 */}
          {operation === 'download' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white/90 mb-2">下载格式</label>
                <div className="flex space-x-3">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={downloadFormat === 'original'}
                      onChange={() => setDownloadFormat('original')}
                      className="w-4 h-4 text-indigo-600"
                    />
                    <span>原始文件</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={downloadFormat === 'zip'}
                      onChange={() => setDownloadFormat('zip')}
                      className="w-4 h-4 text-indigo-600"
                    />
                    <span>ZIP压缩包</span>
                  </label>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-white/90 mb-2">图像质量</label>
                <div className="flex space-x-3">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={downloadQuality === 'original'}
                      onChange={() => setDownloadQuality('original')}
                      className="w-4 h-4 text-indigo-600"
                    />
                    <span>原始质量</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={downloadQuality === 'compressed'}
                      onChange={() => setDownloadQuality('compressed')}
                      className="w-4 h-4 text-indigo-600"
                    />
                    <span>压缩质量</span>
                  </label>
                </div>
              </div>
            </div>
          )}
          
          {/* 分享选项 */}
          {operation === 'share' && (
            <div>
              <label className="block text-sm font-medium text-white/90 mb-2">选择平台</label>
              <select
                value={platform}
                onChange={(e) => setPlatform(e.target.value)}
                className="w-full p-2.5 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white/30"
              >
                <option value="twitter">Twitter</option>
                <option value="facebook">Facebook</option>
                <option value="instagram">Instagram</option>
                <option value="pinterest">Pinterest</option>
                <option value="weibo">微博</option>
                <option value="wechat">微信</option>
              </select>
            </div>
          )}
          
          {/* 标签选项 */}
          {operation === 'tag' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white/90 mb-2">添加标签</label>
                <div className="flex">
                  <input
                    type="text"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    placeholder="输入标签..."
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
              
              <div>
                <label className="block text-sm font-medium text-white/90 mb-2">已选标签</label>
                <div className="flex flex-wrap gap-2">
                  {tagsToAdd.map(tag => (
                    <div key={tag} className="bg-indigo-600/70 px-2 py-1 rounded-full text-sm flex items-center">
                      <span>{tag}</span>
                      <button 
                        onClick={() => handleRemoveTag(tag)}
                        className="ml-1 text-white/70 hover:text-white"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                  {tagsToAdd.length === 0 && (
                    <span className="text-white/50 text-sm">请添加至少一个标签</span>
                  )}
                </div>
              </div>
            </div>
          )}
          
          {/* 删除确认 */}
          {operation === 'delete' && (
            <div className="bg-red-500/20 p-4 rounded-lg">
              <p className="text-white mb-2">确定要删除选中的 {items.length} 个项目吗？</p>
              <p className="text-white/70 text-sm">此操作无法撤销，删除后数据将无法恢复。</p>
            </div>
          )}
          
          {/* 编辑选项 */}
          {operation === 'edit' && (
            <div className="space-y-4">
              <div className="bg-green-500/20 p-4 rounded-lg">
                <p className="text-white mb-2">批量编辑功能说明</p>
                <p className="text-white/70 text-sm">您将依次编辑选中的 {items.length} 个图像。每次编辑完成后，系统将自动进入下一张图像的编辑。</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-white/90 mb-2">编辑选项</label>
                <div className="space-y-2">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={true}
                      readOnly
                      className="w-4 h-4 text-indigo-600"
                    />
                    <span>保存编辑历史</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={true}
                      readOnly
                      className="w-4 h-4 text-indigo-600"
                    />
                    <span>保留原始图像</span>
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* 底部按钮 */}
        <div className="p-4 border-t border-white/10 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
            disabled={isProcessing}
          >
            取消
          </button>
          <button
            onClick={handleConfirm}
            disabled={isProcessing || (operation === 'tag' && tagsToAdd.length === 0)}
            className={`px-4 py-2 flex items-center rounded-lg transition-colors ${
              operation === 'delete'
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white'
            } ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isProcessing ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                处理中...
              </>
            ) : (
              <>
                {operation === 'download' && <Download size={18} className="mr-2" />}
                {operation === 'share' && <Share size={18} className="mr-2" />}
                {operation === 'tag' && <Tag size={18} className="mr-2" />}
                {operation === 'delete' && <Check size={18} className="mr-2" />}
                {operation === 'edit' && (
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                  </svg>
                )}
                确认{operation === 'delete' ? '删除' : operation === 'download' ? '下载' : operation === 'share' ? '分享' : operation === 'edit' ? '编辑' : '添加'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}