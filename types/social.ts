// 社交平台类型定义
export interface SocialPlatform {
  id: string
  name: string
  icon: string
  shareUrl: string
  imageRequirements: {
    maxWidth: number
    maxHeight: number
    aspectRatio: number | null
    format: 'jpg' | 'png'
  }
}

// 分享参数
export interface ShareParams {
  url?: string
  title?: string
  text?: string
  hashtags?: string[]
  via?: string
  imageUrl?: string
}

// 分享结果
export interface ShareResult {
  success: boolean
  platform: string
  timestamp: Date
  error?: string
}

// 分享统计
export interface ShareStats {
  platform: string
  count: number
}