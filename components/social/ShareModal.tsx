'use client';

import React, { useState, useEffect } from 'react';
import { X, Copy, Check, Image, Link, Tag } from 'lucide-react';
import { SocialPlatform } from '@/types/social';
import { GenerationHistory } from '@/types/database';
import { socialPlatforms } from '@/utils/socialPlatforms';
import SocialPlatformButton from './SocialPlatformButton';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: GenerationHistory;
  onShareComplete: (platform: string) => void;
}

export default function ShareModal({ isOpen, onClose, item, onShareComplete }: ShareModalProps) {
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState<string[]>(item.tags || []);
  const [newTag, setNewTag] = useState('');
  const [copied, setCopied] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [shareSuccess, setShareSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && item) {
      // 生成分享链接
      const baseUrl = window.location.origin;
      const url = `${baseUrl}/share/${item.id}`;
      setShareUrl(url);
      
      // 设置默认描述
      setDescription(`Check out this AI-generated image: "${item.prompt}"`);
      
      // 设置标签
      setTags(item.tags || []);
    }
  }, [isOpen, item]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAddTag = () => {
    if (newTag && !tags.includes(newTag)) {
      setTags([...tags, newTag]);
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddTag();
    }
  };

  const handleShare = async (platform: SocialPlatform) => {
    try {
      setIsLoading(true);
      
      // 记录分享事件
      const response = await fetch('/api/share', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          generationId: item.id,
          platform: platform.id,
          description,
          tags
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to record share');
      }
      
      // 构建分享参数
      const shareParams = new URLSearchParams();
      
      if (platform.id === 'twitter') {
        shareParams.append('text', description);
        shareParams.append('url', shareUrl);
        if (tags.length > 0) {
          shareParams.append('hashtags', tags.join(','));
        }
      } else if (platform.id === 'facebook') {
        shareParams.append('u', shareUrl);
        shareParams.append('quote', description);
      } else if (platform.id === 'pinterest') {
        shareParams.append('url', shareUrl);
        shareParams.append('description', description);
        shareParams.append('media', item.imageUrl);
      } else if (platform.id === 'linkedin') {
        shareParams.append('url', shareUrl);
        shareParams.append('title', 'AI Generated Image');
        shareParams.append('summary', description);
      } else if (platform.id === 'weibo') {
        shareParams.append('url', shareUrl);
        shareParams.append('title', description);
        shareParams.append('pic', item.imageUrl);
      }
      
      // 打开分享窗口
      if (platform.shareUrl) {
        const shareWindow = window.open(
          `${platform.shareUrl}?${shareParams.toString()}`,
          `share-${platform.id}`,
          'width=600,height=400,location=0,menubar=0,toolbar=0,status=0,scrollbars=1,resizable=1'
        );
        
        if (shareWindow) {
          // 设置分享成功
          setShareSuccess(platform.id);
          setTimeout(() => setShareSuccess(null), 2000);
          
          // 通知父组件
          onShareComplete(platform.id);
        }
      } else if (platform.id === 'wechat') {
        // 显示微信二维码
        // 这里需要实现二维码生成逻辑
        alert('请使用微信扫描二维码分享');
      }
    } catch (error) {
      console.error('Share error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-4 border-b border-gray-800">
          <h2 className="text-xl font-semibold text-white">分享图像</h2>
          <button 
            onClick={onClose}
            className="p-1 hover:bg-gray-800 rounded-full"
          >
            <X size={20} className="text-gray-400" />
          </button>
        </div>
        
        <div className="p-4">
          {/* 图像预览 */}
          <div className="mb-6 flex justify-center">
            <div className="relative w-full max-w-md">
              <img 
                src={item.imageUrl} 
                alt={item.prompt} 
                className="w-full h-auto rounded-lg object-cover"
              />
            </div>
          </div>
          
          {/* 描述输入 */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-300 mb-1">
              描述
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white resize-none"
              rows={3}
              placeholder="添加描述..."
            />
          </div>
          
          {/* 标签输入 */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-1">
              标签
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {tags.map((tag) => (
                <div 
                  key={tag}
                  className="bg-gray-800 text-gray-200 px-2 py-1 rounded-md flex items-center text-sm"
                >
                  <span>{tag}</span>
                  <button 
                    onClick={() => handleRemoveTag(tag)}
                    className="ml-1 text-gray-400 hover:text-gray-200"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex">
              <input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={handleKeyDown}
                className="flex-1 bg-gray-800 border border-gray-700 rounded-l-lg p-2 text-white"
                placeholder="添加标签..."
              />
              <button
                onClick={handleAddTag}
                className="bg-gray-700 hover:bg-gray-600 text-white px-3 rounded-r-lg flex items-center"
              >
                <Tag size={16} />
              </button>
            </div>
          </div>
          
          {/* 复制链接 */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-1">
              分享链接
            </label>
            <div className="flex">
              <input
                type="text"
                value={shareUrl}
                readOnly
                className="flex-1 bg-gray-800 border border-gray-700 rounded-l-lg p-2 text-white"
              />
              <button
                onClick={handleCopyLink}
                className="bg-gray-700 hover:bg-gray-600 text-white px-3 rounded-r-lg flex items-center"
              >
                {copied ? <Check size={16} /> : <Copy size={16} />}
              </button>
            </div>
          </div>
          
          {/* 社交平台按钮 */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">
              选择平台
            </label>
            <div className="grid grid-cols-4 gap-3">
              {socialPlatforms.map((platform) => (
                <SocialPlatformButton
                  key={platform.id}
                  platform={platform}
                  onClick={() => handleShare(platform)}
                  isLoading={isLoading}
                  isSuccess={shareSuccess === platform.id}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}