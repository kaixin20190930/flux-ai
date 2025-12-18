'use client';

import React, { useState, useEffect } from 'react';
import { X, Copy, Check, Image, Link, Tag, ChevronLeft, ChevronRight } from 'lucide-react';
import { SocialPlatform } from '@/types/social';
import { GenerationHistory } from '@/types/database';
import { socialPlatforms } from '@/utils/socialPlatforms';
import SocialPlatformButton from './SocialPlatformButton';

interface BatchShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: GenerationHistory[];
  onShareComplete: (platform: string, count: number) => void;
}

export default function BatchShareModal({ isOpen, onClose, items, onShareComplete }: BatchShareModalProps) {
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [shareSuccess, setShareSuccess] = useState<string | null>(null);
  const [sharedCount, setSharedCount] = useState<Record<string, number>>({});

  useEffect(() => {
    if (isOpen && items.length > 0) {
      // 设置默认描述
      setDescription(`Check out these AI-generated images!`);
      
      // 收集所有项目的标签
      const allTags = new Set<string>();
      items.forEach(item => {
        if (item.tags) {
          item.tags.forEach(tag => allTags.add(tag));
        }
      });
      setTags(Array.from(allTags));
    }
  }, [isOpen, items]);

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
          generationId: items[currentIndex].id,
          platform: platform.id,
          description,
          tags,
          isBatch: true
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to record share');
      }
      
      // 更新已分享计数
      setSharedCount(prev => ({
        ...prev,
        [platform.id]: (prev[platform.id] || 0) + 1
      }));
      
      // 设置分享成功
      setShareSuccess(platform.id);
      setTimeout(() => setShareSuccess(null), 2000);
      
      // 通知父组件
      onShareComplete(platform.id, sharedCount[platform.id] || 1);
      
      // 如果有更多图像，自动前进到下一个
      if (currentIndex < items.length - 1) {
        setTimeout(() => {
          setCurrentIndex(currentIndex + 1);
        }, 1000);
      }
    } catch (error) {
      console.error('Share error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < items.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  if (!isOpen || items.length === 0) return null;

  const currentItem = items[currentIndex];

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-4 border-b border-gray-800">
          <h2 className="text-xl font-semibold text-white">批量分享图像 ({currentIndex + 1}/{items.length})</h2>
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
                src={currentItem.imageUrl} 
                alt={currentItem.prompt} 
                className="w-full h-auto rounded-lg object-cover"
              />
              
              {/* 导航按钮 */}
              <div className="absolute inset-y-0 left-0 flex items-center">
                <button
                  onClick={handlePrevious}
                  disabled={currentIndex === 0}
                  className={`p-2 rounded-full bg-black/50 text-white ${
                    currentIndex === 0 ? 'opacity-30 cursor-not-allowed' : 'hover:bg-black/70'
                  }`}
                >
                  <ChevronLeft size={20} />
                </button>
              </div>
              <div className="absolute inset-y-0 right-0 flex items-center">
                <button
                  onClick={handleNext}
                  disabled={currentIndex === items.length - 1}
                  className={`p-2 rounded-full bg-black/50 text-white ${
                    currentIndex === items.length - 1 ? 'opacity-30 cursor-not-allowed' : 'hover:bg-black/70'
                  }`}
                >
                  <ChevronRight size={20} />
                </button>
              </div>
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
                  isLoading={isLoading && shareSuccess === platform.id}
                  isSuccess={shareSuccess === platform.id}
                />
              ))}
            </div>
            
            {/* 分享统计 */}
            {Object.keys(sharedCount).length > 0 && (
              <div className="mt-4 p-3 bg-gray-800 rounded-lg">
                <h3 className="text-sm font-medium text-gray-300 mb-2">分享统计</h3>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(sharedCount).map(([platformId, count]) => {
                    const platform = socialPlatforms.find(p => p.id === platformId);
                    if (!platform) return null;
                    
                    return (
                      <div key={platformId} className="flex items-center text-sm">
                        <div className="w-4 h-4 mr-2">
                          <PlatformIcon platform={platform} />
                        </div>
                        <span className="text-gray-300">{platform.name}: </span>
                        <span className="ml-1 text-white font-medium">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// 社交平台图标组件
const PlatformIcon = ({ platform }: { platform: SocialPlatform }) => {
  switch (platform.id) {
    case 'twitter':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"></path>
        </svg>
      );
    case 'facebook':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M9.198 21.5h4v-8.01h3.604l.396-3.98h-4V7.5a1 1 0 0 1 1-1h3v-4h-3a5 5 0 0 0-5 5v2.01h-2l-.396 3.98h2.396v8.01Z" />
        </svg>
      );
    case 'instagram':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2c2.717 0 3.056.01 4.122.06 1.065.05 1.79.217 2.428.465.66.254 1.216.598 1.772 1.153a4.908 4.908 0 0 1 1.153 1.772c.247.637.415 1.363.465 2.428.047 1.066.06 1.405.06 4.122 0 2.717-.01 3.056-.06 4.122-.05 1.065-.218 1.79-.465 2.428a4.883 4.883 0 0 1-1.153 1.772 4.915 4.915 0 0 1-1.772 1.153c-.637.247-1.363.415-2.428.465-1.066.047-1.405.06-4.122.06-2.717 0-3.056-.01-4.122-.06-1.065-.05-1.79-.218-2.428-.465a4.89 4.89 0 0 1-1.772-1.153 4.904 4.904 0 0 1-1.153-1.772c-.248-.637-.415-1.363-.465-2.428C2.013 15.056 2 14.717 2 12c0-2.717.01-3.056.06-4.122.05-1.066.217-1.79.465-2.428a4.88 4.88 0 0 1 1.153-1.772A4.897 4.897 0 0 1 5.45 2.525c.638-.248 1.362-.415 2.428-.465C8.944 2.013 9.283 2 12 2zm0 1.802c-2.67 0-2.986.01-4.04.059-.976.045-1.505.207-1.858.344-.466.182-.8.398-1.15.748-.35.35-.566.684-.748 1.15-.137.353-.3.882-.344 1.857-.048 1.055-.058 1.37-.058 4.041 0 2.67.01 2.986.058 4.04.045.976.207 1.505.344 1.858.182.466.399.8.748 1.15.35.35.684.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058 2.67 0 2.987-.01 4.04-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.684.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041 0-2.67-.01-2.986-.058-4.04-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 0 0-.748-1.15 3.098 3.098 0 0 0-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.055-.048-1.37-.058-4.041-.058zm0 3.063a5.135 5.135 0 1 1 0 10.27 5.135 5.135 0 0 1 0-10.27zm0 8.468a3.333 3.333 0 1 0 0-6.666 3.333 3.333 0 0 0 0 6.666zm6.538-8.469a1.2 1.2 0 1 1-2.4 0 1.2 1.2 0 0 1 2.4 0z" />
        </svg>
      );
    case 'pinterest':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M9.04 21.54c.96.29 1.93.46 2.96.46a10 10 0 0 0 10-10A10 10 0 0 0 12 2 10 10 0 0 0 2 12c0 4.25 2.67 7.9 6.44 9.34-.09-.78-.18-2.07 0-2.96l1.15-4.94s-.29-.58-.29-1.5c0-1.38.86-2.41 1.84-2.41.86 0 1.26.63 1.26 1.44 0 .86-.57 2.09-.86 3.27-.17.98.52 1.84 1.52 1.84 1.78 0 3.16-1.9 3.16-4.58 0-2.4-1.72-4.04-4.19-4.04-2.82 0-4.48 2.1-4.48 4.31 0 .86.28 1.73.74 2.3.09.06.09.14.06.29l-.29 1.09c0 .17-.11.23-.28.11-1.28-.56-2.02-2.38-2.02-3.85 0-3.16 2.24-6.03 6.56-6.03 3.44 0 6.12 2.47 6.12 5.75 0 3.44-2.13 6.2-5.18 6.2-.97 0-1.92-.52-2.26-1.13l-.67 2.37c-.23.86-.86 2.01-1.29 2.7v-.03Z" />
        </svg>
      );
    case 'linkedin':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M6.94 5a2 2 0 1 1-4-.002 2 2 0 0 1 4 .002zM7 8.48H3V21h4V8.48zm6.32 0H9.34V21h3.94v-6.57c0-3.66 4.77-4 4.77 0V21H22v-7.93c0-6.17-7.06-5.94-8.72-2.91l.04-1.68z" />
        </svg>
      );
    case 'weibo':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M10.096 18.857c-4.163 0-7.54-2.002-7.54-4.464 0-1.28.96-2.75 2.575-4.253 2.174-2.02 4.75-2.932 5.8-2.056.46.386.518 1.068.215 1.878-.156.408.047.578.339.463.292-.116 1.151-.462 1.634-.652 1.535-.603 2.62-.385 3.063.047.228.22.265.521.228.893-.123 1.058-1.859 2.693-3.734 3.89-1.874 1.195-2.398 2.648-1.447 3.577.935.917 3.206.555 5.135-.872 1.93-1.428 3.063-3.26 2.555-4.057-.15-.241-.406-.307-.698-.232-.292.075-.367-.093-.18-.4.188-.306.515-.662.84-.883.325-.22.64-.257.883-.115.242.142.424.424.515.746.09.321.09.642 0 .963-.09.32-.09.642 0 .963.09.32.09.642 0 .963-.09.32-.09.642 0 .963.09.32-.242 1.284-1.996 2.607-1.753 1.323-3.989 1.93-5.135 1.93-.458 0-.855-.064-1.151-.18-.296-.116-.532-.27-.698-.463-.167-.193-.3-.424-.4-.69-.1-.268-.15-.536-.15-.805 0-.268.05-.536.15-.805.1-.268.1-.536 0-.805-.1-.268-.1-.536 0-.805-.1-.268-.373-.402-.823-.402zm.4-9.809c-.2 0-.399.05-.599.154-.2.103-.366.257-.5.463-.133.205-.233.462-.3.77-.066.31-.1.642-.1.997 0 .356.034.688.1.997.067.31.167.566.3.771.134.206.3.36.5.463.2.103.4.155.599.155.2 0 .4-.052.6-.155.2-.103.366-.257.5-.463.133-.205.233-.462.3-.77.066-.31.1-.642.1-.997 0-.356-.034-.688-.1-.997-.067-.309-.167-.566-.3-.771-.134-.206-.3-.36-.5-.463-.2-.103-.4-.155-.6-.155zm7.54-2.79c-.134 0-.234.013-.3.039-.067.026-.117.064-.15.116-.034.051-.05.116-.05.193s.016.142.05.193c.033.052.083.09.15.116.066.026.166.039.3.039.133 0 .233-.013.3-.039.066-.026.116-.064.15-.116.033-.051.05-.116.05-.193s-.017-.142-.05-.193c-.034-.052-.084-.09-.15-.116-.067-.026-.167-.039-.3-.039zm-2.398.578c-.267 0-.534.026-.8.077-.267.052-.517.142-.75.27-.233.13-.433.31-.6.54-.167.232-.25.516-.25.85 0 .335.083.619.25.85.167.232.367.412.6.54.233.13.483.22.75.27.266.052.533.078.8.078.266 0 .533-.026.8-.077.266-.052.516-.142.75-.27.233-.13.433-.31.6-.54.166-.232.25-.516.25-.85 0-.335-.084-.619-.25-.85-.167-.232-.367-.412-.6-.54-.234-.13-.484-.22-.75-.27-.267-.052-.534-.078-.8-.078zm-.8 2.443c-.134 0-.267-.013-.4-.039-.134-.026-.25-.064-.35-.116-.1-.051-.183-.116-.25-.192-.067-.077-.1-.167-.1-.27 0-.103.033-.193.1-.27.067-.077.15-.142.25-.193.1-.051.216-.09.35-.115.133-.026.266-.04.4-.04.133 0 .266.014.4.04.133.026.25.064.35.116.1.05.183.115.25.192.066.077.1.167.1.27 0 .103-.034.193-.1.27-.067.077-.15.141-.25.193-.1.051-.217.09-.35.115-.134.026-.267.04-.4.04zm-8.04 5.598c-.267 0-.517.026-.75.077-.234.052-.434.129-.6.232-.167.103-.3.232-.4.386-.1.155-.15.335-.15.54 0 .206.05.386.15.54.1.155.233.284.4.387.166.103.366.18.6.231.233.052.483.078.75.078.266 0 .516-.026.75-.078.233-.051.433-.128.6-.231.166-.103.3-.232.4-.386.1-.155.15-.335.15-.54 0-.206-.05-.386-.15-.54-.1-.155-.234-.284-.4-.387-.167-.103-.367-.18-.6-.232-.234-.051-.484-.077-.75-.077zm4.197-10.387c-1.93 0-3.707.296-5.328.886-1.622.59-3.023 1.4-4.204 2.427-1.18 1.027-2.107 2.235-2.78 3.622-.673 1.388-1.01 2.88-1.01 4.474 0 1.595.337 3.086 1.01 4.474.673 1.387 1.6 2.595 2.78 3.622 1.18 1.028 2.582 1.837 4.204 2.427 1.62.59 3.398.886 5.328.886 1.93 0 3.707-.296 5.328-.886 1.62-.59 3.023-1.4 4.204-2.427 1.18-1.027 2.107-2.235 2.78-3.622.673-1.388 1.01-2.88 1.01-4.474 0-1.595-.337-3.086-1.01-4.474-.673-1.387-1.6-2.595-2.78-3.622-1.18-1.028-2.583-1.837-4.204-2.427-1.621-.59-3.398-.886-5.328-.886zm0 1.157c1.796 0 3.456.27 4.978.809 1.521.54 2.833 1.284 3.933 2.233 1.1.95 1.963 2.071 2.58 3.366.618 1.296.927 2.693.927 4.194 0 1.5-.31 2.898-.927 4.194-.617 1.295-1.48 2.417-2.58 3.366-1.1.95-2.412 1.694-3.933 2.233-1.522.54-3.182.809-4.978.809-1.797 0-3.456-.27-4.978-.809-1.522-.54-2.833-1.284-3.934-2.233-1.1-.95-1.963-2.071-2.58-3.366-.617-1.296-.927-2.693-.927-4.194 0-1.5.31-2.898.927-4.194.617-1.295 1.48-2.417 2.58-3.366 1.1-.95 2.412-1.694 3.934-2.233 1.522-.54 3.181-.809 4.978-.809z" />
        </svg>
      );
    case 'wechat':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 0 1 .213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 0 0 .167-.054l1.903-1.114a.864.864 0 0 1 .717-.098 10.16 10.16 0 0 0 2.837.403c.276 0 .543-.027.811-.05-.857-2.578.157-4.972 1.932-6.446 1.703-1.415 3.882-1.98 5.853-1.838-.576-3.583-4.196-6.348-8.596-6.348zM5.785 5.991c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178A1.17 1.17 0 0 1 4.623 7.17c0-.651.52-1.18 1.162-1.18zm5.813 0c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178 1.17 1.17 0 0 1-1.162-1.178c0-.651.52-1.18 1.162-1.18zm5.34 2.867c-1.797-.052-3.746.512-5.28 1.786-1.72 1.428-2.687 3.72-1.78 6.22.484 1.333 1.504 2.518 2.702 3.33.558.378 1.298.56 1.939.56.608 0 1.135-.132 1.558-.256a.753.753 0 0 1 .621.085l1.653.966c.068.04.132.054.2.054.139 0 .25-.113.25-.253 0-.063-.021-.126-.041-.189l-.339-1.284a.51.51 0 0 1 .184-.576c1.585-1.214 2.595-3.04 2.595-5.062 0-3.207-2.715-5.251-4.262-5.381zm-3.897 3.06c.556 0 1.01.46 1.01 1.026a1.02 1.02 0 0 1-1.01 1.026c-.556 0-1.008-.459-1.008-1.026 0-.566.452-1.026 1.008-1.026zm4.452 0c.556 0 1.008.46 1.008 1.026a1.02 1.02 0 0 1-1.008 1.026c-.557 0-1.01-.459-1.01-1.026 0-.566.453-1.026 1.01-1.026z" />
        </svg>
      );
    default:
      return null;
  }
};