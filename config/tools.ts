// 工具配置文件 - 统一管理所有工具的详细信息

// 工具配置接口
interface ToolConfig {
  id: string;
  name: string;
  nameKey: string; // 用于国际化的key
  description: string;
  descriptionKey: string; // 用于国际化的key
  category: ToolCategory;
  pointsCost: number;
  isFree: boolean;
  isEnabled: boolean;
  icon: string;
  route: string;
  apiEndpoint: string;
  maxUsagePerDay?: number; // 每日最大使用次数限制
  requiresAuth: boolean;
  supportedFormats?: string[]; // 支持的文件格式
  maxFileSize?: number; // 最大文件大小 (MB)
  estimatedProcessingTime?: number; // 预估处理时间 (秒)
  features: string[]; // 功能特性列表
  limitations?: string[]; // 使用限制
  tags: string[]; // 标签，用于搜索和分类
}

// 工具分类枚举
enum ToolCategory {
  TEXT_TO_IMAGE = 'text-to-image',
  IMAGE_SEARCH = 'image-search',
  IMAGE_ANALYSIS = 'image-analysis',
  IMAGE_EDITING = 'image-editing',
  IMAGE_TO_VIDEO = 'image-to-video',
  VIDEO_PROCESSING = 'video-processing',
  BATCH_OPERATIONS = 'batch-operations',
  SOCIAL_SHARING = 'social-sharing'
}

// 工具配置数据
const TOOLS_CONFIG: Record<string, ToolConfig> = {
  // 文本生成图片工具
  'flux-schnell': {
    id: 'flux-schnell',
    name: 'Flux Schnell',
    nameKey: 'tools.flux_schnell.name',
    description: 'Fast AI image generation with Flux Schnell model',
    descriptionKey: 'tools.flux_schnell.description',
    category: ToolCategory.TEXT_TO_IMAGE,
    pointsCost: 1,
    isFree: false,
    isEnabled: true,
    icon: '⚡',
    route: '/generate',
    apiEndpoint: '/api/generate',
    maxUsagePerDay: 100,
    requiresAuth: true,
    estimatedProcessingTime: 5,
    features: ['Fast generation', 'High quality', 'Multiple styles'],
    tags: ['ai', 'image', 'generation', 'fast']
  },
  'flux-dev': {
    id: 'flux-dev',
    name: 'Flux Dev',
    nameKey: 'tools.flux_dev.name',
    description: 'Advanced AI image generation with Flux Dev model',
    descriptionKey: 'tools.flux_dev.description',
    category: ToolCategory.TEXT_TO_IMAGE,
    pointsCost: 3,
    isFree: false,
    isEnabled: true,
    icon: '🎨',
    route: '/generate',
    apiEndpoint: '/api/generate',
    maxUsagePerDay: 50,
    requiresAuth: true,
    estimatedProcessingTime: 10,
    features: ['Advanced generation', 'Better quality', 'More control'],
    tags: ['ai', 'image', 'generation', 'advanced']
  },
  'flux-pro': {
    id: 'flux-pro',
    name: 'Flux Pro',
    nameKey: 'tools.flux_pro.name',
    description: 'Professional AI image generation with Flux Pro model',
    descriptionKey: 'tools.flux_pro.description',
    category: ToolCategory.TEXT_TO_IMAGE,
    pointsCost: 8,
    isFree: false,
    isEnabled: true,
    icon: '💎',
    route: '/generate',
    apiEndpoint: '/api/generate',
    maxUsagePerDay: 20,
    requiresAuth: true,
    estimatedProcessingTime: 15,
    features: ['Professional quality', 'Maximum control', 'Commercial use'],
    tags: ['ai', 'image', 'generation', 'professional']
  },
  'flux-1.1-pro': {
    id: 'flux-1.1-pro',
    name: 'Flux 1.1 Pro',
    nameKey: 'tools.flux_11_pro.name',
    description: 'Latest Flux 1.1 Pro model with enhanced capabilities',
    descriptionKey: 'tools.flux_11_pro.description',
    category: ToolCategory.TEXT_TO_IMAGE,
    pointsCost: 8,
    isFree: false,
    isEnabled: true,
    icon: '🚀',
    route: '/generate',
    apiEndpoint: '/api/generate',
    maxUsagePerDay: 20,
    requiresAuth: true,
    estimatedProcessingTime: 12,
    features: ['Latest model', 'Enhanced quality', 'Better prompt understanding'],
    tags: ['ai', 'image', 'generation', 'latest']
  },
  'flux-1.1-pro-ultra': {
    id: 'flux-1.1-pro-ultra',
    name: 'Flux 1.1 Pro Ultra',
    nameKey: 'tools.flux_11_pro_ultra.name',
    description: 'Ultimate Flux 1.1 Pro Ultra model for highest quality',
    descriptionKey: 'tools.flux_11_pro_ultra.description',
    category: ToolCategory.TEXT_TO_IMAGE,
    pointsCost: 12,
    isFree: false,
    isEnabled: true,
    icon: '👑',
    route: '/generate',
    apiEndpoint: '/api/generate',
    maxUsagePerDay: 10,
    requiresAuth: true,
    estimatedProcessingTime: 20,
    features: ['Ultra quality', 'Maximum resolution', 'Premium features'],
    tags: ['ai', 'image', 'generation', 'ultra', 'premium']
  },

  // 图片搜索工具
  'text-image-search': {
    id: 'text-image-search',
    name: 'Text Image Search',
    nameKey: 'tools.text_image_search.name',
    description: 'Search images using text keywords',
    descriptionKey: 'tools.text_image_search.description',
    category: ToolCategory.IMAGE_SEARCH,
    pointsCost: 1,
    isFree: false,
    isEnabled: true,
    icon: '🔍',
    route: '/image-search',
    apiEndpoint: '/api/image-search',
    maxUsagePerDay: 200,
    requiresAuth: true,
    estimatedProcessingTime: 2,
    features: ['Text-based search', 'Multiple sources', 'Filter options'],
    tags: ['search', 'text', 'images', 'web']
  },
  'image-similarity-search': {
    id: 'image-similarity-search',
    name: 'Image Similarity Search',
    nameKey: 'tools.image_similarity_search.name',
    description: 'Find similar images using image upload',
    descriptionKey: 'tools.image_similarity_search.description',
    category: ToolCategory.IMAGE_SEARCH,
    pointsCost: 2,
    isFree: false,
    isEnabled: true,
    icon: '🖼️',
    route: '/image-search',
    apiEndpoint: '/api/image-search',
    maxUsagePerDay: 100,
    requiresAuth: true,
    supportedFormats: ['jpg', 'jpeg', 'png', 'webp'],
    maxFileSize: 10,
    estimatedProcessingTime: 5,
    features: ['Visual similarity', 'Reverse search', 'AI-powered matching'],
    tags: ['search', 'similarity', 'reverse', 'visual']
  },

  // 图片分析工具
  'image-summary': {
    id: 'image-summary',
    name: 'Image Summary',
    nameKey: 'tools.image_summary.name',
    description: 'Generate detailed descriptions and summaries of images',
    descriptionKey: 'tools.image_summary.description',
    category: ToolCategory.IMAGE_ANALYSIS,
    pointsCost: 2,
    isFree: false,
    isEnabled: true,
    icon: '📝',
    route: '/image-analysis',
    apiEndpoint: '/api/image-analysis/summary',
    maxUsagePerDay: 50,
    requiresAuth: true,
    supportedFormats: ['jpg', 'jpeg', 'png', 'webp'],
    maxFileSize: 20,
    estimatedProcessingTime: 8,
    features: ['AI description', 'Object detection', 'Scene analysis'],
    tags: ['analysis', 'description', 'ai', 'summary']
  },
  'image-ocr': {
    id: 'image-ocr',
    name: 'Image OCR',
    nameKey: 'tools.image_ocr.name',
    description: 'Extract text from images using OCR technology',
    descriptionKey: 'tools.image_ocr.description',
    category: ToolCategory.IMAGE_ANALYSIS,
    pointsCost: 1,
    isFree: false,
    isEnabled: true,
    icon: '📄',
    route: '/image-analysis',
    apiEndpoint: '/api/image-analysis/ocr',
    maxUsagePerDay: 100,
    requiresAuth: true,
    supportedFormats: ['jpg', 'jpeg', 'png', 'pdf'],
    maxFileSize: 15,
    estimatedProcessingTime: 5,
    features: ['Text extraction', 'Multiple languages', 'High accuracy'],
    tags: ['ocr', 'text', 'extraction', 'recognition']
  },

  // 图片编辑工具
  'image-edit-canny': {
    id: 'image-edit-canny',
    name: 'Canny Edge Detection',
    nameKey: 'tools.image_edit_canny.name',
    description: 'Apply Canny edge detection to images',
    descriptionKey: 'tools.image_edit_canny.description',
    category: ToolCategory.IMAGE_EDITING,
    pointsCost: 2,
    isFree: false,
    isEnabled: true,
    icon: '✏️',
    route: '/image-editor',
    apiEndpoint: '/api/image-edit/canny',
    maxUsagePerDay: 50,
    requiresAuth: true,
    supportedFormats: ['jpg', 'jpeg', 'png'],
    maxFileSize: 25,
    estimatedProcessingTime: 10,
    features: ['Edge detection', 'Adjustable parameters', 'High quality output'],
    tags: ['editing', 'canny', 'edges', 'detection']
  },
  'image-edit-fill': {
    id: 'image-edit-fill',
    name: 'AI Image Fill',
    nameKey: 'tools.image_edit_fill.name',
    description: 'Fill missing parts of images using AI',
    descriptionKey: 'tools.image_edit_fill.description',
    category: ToolCategory.IMAGE_EDITING,
    pointsCost: 3,
    isFree: false,
    isEnabled: true,
    icon: '🎨',
    route: '/image-editor',
    apiEndpoint: '/api/image-edit/fill',
    maxUsagePerDay: 30,
    requiresAuth: true,
    supportedFormats: ['jpg', 'jpeg', 'png'],
    maxFileSize: 20,
    estimatedProcessingTime: 15,
    features: ['AI inpainting', 'Smart fill', 'Seamless results'],
    tags: ['editing', 'fill', 'inpainting', 'ai']
  },
  'image-edit-redux': {
    id: 'image-edit-redux',
    name: 'Image Redux',
    nameKey: 'tools.image_edit_redux.name',
    description: 'Advanced image processing and enhancement',
    descriptionKey: 'tools.image_edit_redux.description',
    category: ToolCategory.IMAGE_EDITING,
    pointsCost: 2,
    isFree: false,
    isEnabled: true,
    icon: '⚡',
    route: '/image-editor',
    apiEndpoint: '/api/image-edit/redux',
    maxUsagePerDay: 40,
    requiresAuth: true,
    supportedFormats: ['jpg', 'jpeg', 'png'],
    maxFileSize: 30,
    estimatedProcessingTime: 12,
    features: ['Enhancement', 'Noise reduction', 'Quality improvement'],
    tags: ['editing', 'enhancement', 'redux', 'quality']
  },
  'image-edit-depth': {
    id: 'image-edit-depth',
    name: 'Depth Map Generation',
    nameKey: 'tools.image_edit_depth.name',
    description: 'Generate depth maps from images',
    descriptionKey: 'tools.image_edit_depth.description',
    category: ToolCategory.IMAGE_EDITING,
    pointsCost: 2,
    isFree: false,
    isEnabled: true,
    icon: '🗺️',
    route: '/image-editor',
    apiEndpoint: '/api/image-edit/depth',
    maxUsagePerDay: 40,
    requiresAuth: true,
    supportedFormats: ['jpg', 'jpeg', 'png'],
    maxFileSize: 25,
    estimatedProcessingTime: 10,
    features: ['Depth estimation', '3D visualization', 'High accuracy'],
    tags: ['editing', 'depth', 'map', '3d']
  },

  // 图片生成视频工具
  'image-to-video': {
    id: 'image-to-video',
    name: 'Image to Video',
    nameKey: 'tools.image_to_video.name',
    description: 'Convert static images to animated videos',
    descriptionKey: 'tools.image_to_video.description',
    category: ToolCategory.IMAGE_TO_VIDEO,
    pointsCost: 10,
    isFree: false,
    isEnabled: true,
    icon: '🎬',
    route: '/image-to-video',
    apiEndpoint: '/api/image-to-video',
    maxUsagePerDay: 10,
    requiresAuth: true,
    supportedFormats: ['jpg', 'jpeg', 'png'],
    maxFileSize: 50,
    estimatedProcessingTime: 60,
    features: ['AI animation', 'Multiple styles', 'HD output'],
    limitations: ['Max 10 seconds duration', 'HD resolution only'],
    tags: ['video', 'animation', 'ai', 'conversion']
  },
  'video-upscale': {
    id: 'video-upscale',
    name: 'Video Upscale',
    nameKey: 'tools.video_upscale.name',
    description: 'Upscale video resolution using AI',
    descriptionKey: 'tools.video_upscale.description',
    category: ToolCategory.VIDEO_PROCESSING,
    pointsCost: 15,
    isFree: false,
    isEnabled: false, // 暂未开放
    icon: '📈',
    route: '/video-processing',
    apiEndpoint: '/api/video-processing/upscale',
    maxUsagePerDay: 5,
    requiresAuth: true,
    supportedFormats: ['mp4', 'mov', 'avi'],
    maxFileSize: 100,
    estimatedProcessingTime: 120,
    features: ['AI upscaling', '4K output', 'Quality enhancement'],
    limitations: ['Max 30 seconds duration', 'Coming soon'],
    tags: ['video', 'upscale', 'ai', 'enhancement']
  },

  // 批量操作工具
  'batch-generate': {
    id: 'batch-generate',
    name: 'Batch Generate',
    nameKey: 'tools.batch_generate.name',
    description: 'Generate multiple images in batch',
    descriptionKey: 'tools.batch_generate.description',
    category: ToolCategory.BATCH_OPERATIONS,
    pointsCost: 0, // 按实际使用的模型计算
    isFree: false,
    isEnabled: true,
    icon: '📦',
    route: '/batch',
    apiEndpoint: '/api/batch/generate',
    maxUsagePerDay: 5,
    requiresAuth: true,
    estimatedProcessingTime: 300,
    features: ['Bulk generation', 'Queue management', 'Progress tracking'],
    limitations: ['Max 10 images per batch', 'Premium users only'],
    tags: ['batch', 'bulk', 'generate', 'multiple']
  },

  // 社交分享工具
  'social-share': {
    id: 'social-share',
    name: 'Social Share',
    nameKey: 'tools.social_share.name',
    description: 'Share images to social media platforms',
    descriptionKey: 'tools.social_share.description',
    category: ToolCategory.SOCIAL_SHARING,
    pointsCost: 0,
    isFree: true,
    isEnabled: true,
    icon: '📱',
    route: '/share',
    apiEndpoint: '/api/social/share',
    requiresAuth: true,
    estimatedProcessingTime: 3,
    features: ['Multiple platforms', 'Auto-resize', 'Custom captions'],
    tags: ['social', 'share', 'platforms', 'free']
  },

  // 免费工具示例
  'image-preview': {
    id: 'image-preview',
    name: 'Image Preview',
    nameKey: 'tools.image_preview.name',
    description: 'Preview and basic image information',
    descriptionKey: 'tools.image_preview.description',
    category: ToolCategory.IMAGE_ANALYSIS,
    pointsCost: 0,
    isFree: true,
    isEnabled: true,
    icon: '👁️',
    route: '/preview',
    apiEndpoint: '/api/image/preview',
    requiresAuth: false,
    supportedFormats: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
    maxFileSize: 50,
    estimatedProcessingTime: 1,
    features: ['File info', 'Dimensions', 'Format detection'],
    tags: ['preview', 'info', 'free', 'basic']
  }
};

// 工具配置管理类
class ToolsConfigManager {
  /**
   * 获取工具配置
   */
  static getToolConfig(toolId: string): ToolConfig | null {
    return TOOLS_CONFIG[toolId] || null;
  }

  /**
   * 获取所有工具配置
   */
  static getAllTools(): ToolConfig[] {
    return Object.values(TOOLS_CONFIG);
  }

  /**
   * 根据分类获取工具
   */
  static getToolsByCategory(category: ToolCategory): ToolConfig[] {
    return Object.values(TOOLS_CONFIG).filter(tool => tool.category === category);
  }

  /**
   * 获取免费工具
   */
  static getFreeTools(): ToolConfig[] {
    return Object.values(TOOLS_CONFIG).filter(tool => tool.isFree);
  }

  /**
   * 获取付费工具
   */
  static getPaidTools(): ToolConfig[] {
    return Object.values(TOOLS_CONFIG).filter(tool => !tool.isFree);
  }

  /**
   * 获取启用的工具
   */
  static getEnabledTools(): ToolConfig[] {
    return Object.values(TOOLS_CONFIG).filter(tool => tool.isEnabled);
  }

  /**
   * 根据标签搜索工具
   */
  static searchToolsByTag(tag: string): ToolConfig[] {
    return Object.values(TOOLS_CONFIG).filter(tool => 
      tool.tags.some(t => t.toLowerCase().includes(tag.toLowerCase()))
    );
  }

  /**
   * 根据名称搜索工具
   */
  static searchToolsByName(name: string): ToolConfig[] {
    return Object.values(TOOLS_CONFIG).filter(tool => 
      tool.name.toLowerCase().includes(name.toLowerCase()) ||
      tool.description.toLowerCase().includes(name.toLowerCase())
    );
  }

  /**
   * 获取工具所需点数
   */
  static getToolPoints(toolId: string): number {
    const tool = this.getToolConfig(toolId);
    return tool ? tool.pointsCost : 0;
  }

  /**
   * 检查工具是否免费
   */
  static isToolFree(toolId: string): boolean {
    const tool = this.getToolConfig(toolId);
    return tool ? tool.isFree : false;
  }

  /**
   * 检查工具是否启用
   */
  static isToolEnabled(toolId: string): boolean {
    const tool = this.getToolConfig(toolId);
    return tool ? tool.isEnabled : false;
  }

  /**
   * 检查工具是否需要认证
   */
  static requiresAuth(toolId: string): boolean {
    const tool = this.getToolConfig(toolId);
    return tool ? tool.requiresAuth : true;
  }

  /**
   * 获取工具的API端点
   */
  static getToolApiEndpoint(toolId: string): string | null {
    const tool = this.getToolConfig(toolId);
    return tool ? tool.apiEndpoint : null;
  }

  /**
   * 获取工具的路由
   */
  static getToolRoute(toolId: string): string | null {
    const tool = this.getToolConfig(toolId);
    return tool ? tool.route : null;
  }

  /**
   * 验证文件格式是否支持
   */
  static isFormatSupported(toolId: string, format: string): boolean {
    const tool = this.getToolConfig(toolId);
    if (!tool || !tool.supportedFormats) return true;
    return tool.supportedFormats.includes(format.toLowerCase());
  }

  /**
   * 检查文件大小是否在限制内
   */
  static isFileSizeValid(toolId: string, sizeInMB: number): boolean {
    const tool = this.getToolConfig(toolId);
    if (!tool || !tool.maxFileSize) return true;
    return sizeInMB <= tool.maxFileSize;
  }

  /**
   * 获取分类显示名称
   */
  static getCategoryDisplayName(category: ToolCategory): string {
    const categoryNames: Record<ToolCategory, string> = {
      [ToolCategory.TEXT_TO_IMAGE]: 'Text to Image',
      [ToolCategory.IMAGE_SEARCH]: 'Image Search',
      [ToolCategory.IMAGE_ANALYSIS]: 'Image Analysis',
      [ToolCategory.IMAGE_EDITING]: 'Image Editing',
      [ToolCategory.IMAGE_TO_VIDEO]: 'Image to Video',
      [ToolCategory.VIDEO_PROCESSING]: 'Video Processing',
      [ToolCategory.BATCH_OPERATIONS]: 'Batch Operations',
      [ToolCategory.SOCIAL_SHARING]: 'Social Sharing'
    };
    return categoryNames[category] || category;
  }
}

// 导出类型、枚举、常量和类
export type { ToolConfig };
export { ToolCategory, TOOLS_CONFIG };
export default ToolsConfigManager;