import { SocialPlatform } from '@/types/social';

// 社交平台配置
export const socialPlatforms: SocialPlatform[] = [
  {
    id: 'twitter',
    name: 'Twitter',
    icon: 'twitter',
    shareUrl: 'https://twitter.com/intent/tweet',
    imageRequirements: {
      maxWidth: 1200,
      maxHeight: 675,
      aspectRatio: 16/9,
      format: 'jpg'
    }
  },
  {
    id: 'facebook',
    name: 'Facebook',
    icon: 'facebook',
    shareUrl: 'https://www.facebook.com/sharer/sharer.php',
    imageRequirements: {
      maxWidth: 1200,
      maxHeight: 630,
      aspectRatio: null,
      format: 'jpg'
    }
  },
  {
    id: 'instagram',
    name: 'Instagram',
    icon: 'instagram',
    shareUrl: '', // Instagram requires app integration
    imageRequirements: {
      maxWidth: 1080,
      maxHeight: 1080,
      aspectRatio: 1,
      format: 'jpg'
    }
  },
  {
    id: 'pinterest',
    name: 'Pinterest',
    icon: 'pinterest',
    shareUrl: 'https://pinterest.com/pin/create/button/',
    imageRequirements: {
      maxWidth: 1000,
      maxHeight: 1500,
      aspectRatio: 2/3,
      format: 'jpg'
    }
  },
  {
    id: 'linkedin',
    name: 'LinkedIn',
    icon: 'linkedin',
    shareUrl: 'https://www.linkedin.com/sharing/share-offsite/',
    imageRequirements: {
      maxWidth: 1200,
      maxHeight: 627,
      aspectRatio: null,
      format: 'jpg'
    }
  },
  {
    id: 'weibo',
    name: '微博',
    icon: 'weibo',
    shareUrl: 'http://service.weibo.com/share/share.php',
    imageRequirements: {
      maxWidth: 2048,
      maxHeight: 2048,
      aspectRatio: null,
      format: 'jpg'
    }
  },
  {
    id: 'wechat',
    name: '微信',
    icon: 'wechat',
    shareUrl: '', // WeChat requires QR code generation
    imageRequirements: {
      maxWidth: 1080,
      maxHeight: 1920,
      aspectRatio: null,
      format: 'jpg'
    }
  }
];

// 获取平台配置
export function getPlatform(platformId: string): SocialPlatform | undefined {
  return socialPlatforms.find(platform => platform.id === platformId);
}

// 获取所有支持的平台
export function getSupportedPlatforms(): SocialPlatform[] {
  return socialPlatforms;
}