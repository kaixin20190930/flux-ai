import { ImageSearchFilters, ImageSearchResult } from '@/types/database';

// 外部图片搜索 API 接口
export interface ExternalImageAPI {
  name: string;
  searchText(query: string, filters: ImageSearchFilters): Promise<ExternalSearchResult>;
  searchImage?(imageUrl: string, filters: ImageSearchFilters): Promise<ExternalSearchResult>;
}

export interface ExternalSearchResult {
  results: ExternalImageResult[];
  total: number;
}

export interface ExternalImageResult {
  id: string;
  urls: {
    raw: string;
    full: string;
    regular: string;
    small: string;
    thumb: string;
  };
  links: {
    html: string;
  };
  description?: string;
  alt_description?: string;
  user: {
    name: string;
  };
  source: string;
  similarity?: number;
}

// PromptHero API 实现
export class PromptHeroAPI implements ExternalImageAPI {
  name = 'PromptHero';
  
  async searchText(query: string, filters: ImageSearchFilters): Promise<ExternalSearchResult> {
    try {
      // 这里将来会替换为实际的 PromptHero API 调用
      // const response = await fetch(`https://api.prompthero.com/search?q=${encodeURIComponent(query)}`, {
      //   headers: { 
      //     'Authorization': `Bearer ${process.env.PROMPTHERO_API_KEY}`,
      //     'Content-Type': 'application/json'
      //   }
      // });
      // const data = await response.json();
      // return this.processPromptHeroResults(data);
      
      // 模拟 PromptHero 数据
      return {
        results: [
          {
            id: `ph_${Date.now()}_1`,
            urls: {
              raw: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809',
              full: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809',
              regular: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809',
              small: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=400',
              thumb: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=200',
            },
            links: { html: 'https://prompthero.com/prompt/abstract-gradient' },
            description: `AI生成图片：${query}`,
            alt_description: `${query} - AI艺术`,
            user: { name: 'PromptHero AI' },
            source: 'prompthero'
          },
          {
            id: `ph_${Date.now()}_2`,
            urls: {
              raw: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab',
              full: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab',
              regular: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab',
              small: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=400',
              thumb: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=200',
            },
            links: { html: 'https://prompthero.com/prompt/mountain-sunset' },
            description: `AI创作：${query} 风格`,
            alt_description: `${query} 艺术作品`,
            user: { name: 'PromptHero AI' },
            source: 'prompthero'
          },
          {
            id: `ph_${Date.now()}_3`,
            urls: {
              raw: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4',
              full: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4',
              regular: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4',
              small: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400',
              thumb: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=200',
            },
            links: { html: 'https://prompthero.com/prompt/nature-landscape' },
            description: `${query} 主题创作`,
            alt_description: `${query} 风景`,
            user: { name: 'PromptHero AI' },
            source: 'prompthero'
          }
        ],
        total: 3
      };
    } catch (error) {
      console.error('PromptHero API error:', error);
      throw new Error('PromptHero 搜索失败');
    }
  }
  
  private processPromptHeroResults(data: any): ExternalSearchResult {
    // 处理 PromptHero API 响应数据
    return {
      results: data.results?.map((item: any) => ({
        id: item.id,
        urls: {
          raw: item.image_url,
          full: item.image_url,
          regular: item.image_url,
          small: item.thumbnail_url || item.image_url,
          thumb: item.thumbnail_url || item.image_url,
        },
        links: {
          html: item.url || '#'
        },
        description: item.title || item.description,
        alt_description: item.alt_text,
        user: {
          name: item.author || 'PromptHero'
        },
        source: 'prompthero'
      })) || [],
      total: data.total || 0
    };
  }
}

// Google Vision API 实现
export class GoogleVisionAPI implements ExternalImageAPI {
  name = 'Google Vision';
  
  async searchText(query: string, filters: ImageSearchFilters): Promise<ExternalSearchResult> {
    // Google Vision 主要用于图片搜索，文本搜索功能有限
    throw new Error('Google Vision API 不支持文本搜索');
  }
  
  async searchImage(imageUrl: string, filters: ImageSearchFilters): Promise<ExternalSearchResult> {
    try {
      // 这里将来会替换为实际的 Google Vision API 调用
      // const response = await fetch('https://vision.googleapis.com/v1/images:annotate', {
      //   method: 'POST',
      //   headers: {
      //     'Authorization': `Bearer ${process.env.GOOGLE_VISION_API_KEY}`,
      //     'Content-Type': 'application/json'
      //   },
      //   body: JSON.stringify({
      //     requests: [{
      //       image: { content: imageUrl.split(',')[1] }, // base64 data
      //       features: [{ type: 'WEB_DETECTION', maxResults: 10 }]
      //     }]
      //   })
      // });
      // const data = await response.json();
      // return this.processGoogleVisionResults(data);
      
      // 模拟 Google Vision 相似图片搜索结果
      return {
        results: [
          {
            id: `gv_${Date.now()}_1`,
            urls: {
              raw: 'https://images.unsplash.com/photo-1518791841217-8f162f1e1131',
              full: 'https://images.unsplash.com/photo-1518791841217-8f162f1e1131',
              regular: 'https://images.unsplash.com/photo-1518791841217-8f162f1e1131',
              small: 'https://images.unsplash.com/photo-1518791841217-8f162f1e1131?w=400',
              thumb: 'https://images.unsplash.com/photo-1518791841217-8f162f1e1131?w=200',
            },
            links: { html: 'https://example.com/similar-image-1' },
            description: '相似图片 - Google Vision 搜索结果',
            alt_description: '相似图片',
            user: { name: 'Google Vision' },
            source: 'google-vision',
            similarity: 0.95
          },
          {
            id: `gv_${Date.now()}_2`,
            urls: {
              raw: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809',
              full: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809',
              regular: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809',
              small: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=400',
              thumb: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=200',
            },
            links: { html: 'https://example.com/similar-image-2' },
            description: '相似图片 - 高匹配度',
            alt_description: '相似图片',
            user: { name: 'Google Vision' },
            source: 'google-vision',
            similarity: 0.87
          },
          {
            id: `gv_${Date.now()}_3`,
            urls: {
              raw: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4',
              full: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4',
              regular: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4',
              small: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400',
              thumb: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=200',
            },
            links: { html: 'https://example.com/similar-image-3' },
            description: '相似图片 - 中等匹配度',
            alt_description: '相似图片',
            user: { name: 'Google Vision' },
            source: 'google-vision',
            similarity: 0.73
          }
        ],
        total: 3
      };
    } catch (error) {
      console.error('Google Vision API error:', error);
      throw new Error('Google Vision 搜索失败');
    }
  }
  
  private processGoogleVisionResults(data: any): ExternalSearchResult {
    // 处理 Google Vision API 响应数据
    const webDetection = data.responses?.[0]?.webDetection;
    const results = [];
    
    if (webDetection?.visuallySimilarImages) {
      results.push(...webDetection.visuallySimilarImages.map((item: any, index: number) => ({
        id: `gv_similar_${index}`,
        urls: {
          raw: item.url,
          full: item.url,
          regular: item.url,
          small: item.url,
          thumb: item.url,
        },
        links: {
          html: item.url
        },
        description: '相似图片',
        alt_description: '相似图片',
        user: {
          name: 'Google Vision'
        },
        source: 'google-vision',
        similarity: 0.9 - (index * 0.1) // 模拟相似度递减
      })));
    }
    
    if (webDetection?.pagesWithMatchingImages) {
      results.push(...webDetection.pagesWithMatchingImages.map((item: any, index: number) => ({
        id: `gv_match_${index}`,
        urls: {
          raw: item.fullMatchingImages?.[0]?.url || item.partialMatchingImages?.[0]?.url || '',
          full: item.fullMatchingImages?.[0]?.url || item.partialMatchingImages?.[0]?.url || '',
          regular: item.fullMatchingImages?.[0]?.url || item.partialMatchingImages?.[0]?.url || '',
          small: item.fullMatchingImages?.[0]?.url || item.partialMatchingImages?.[0]?.url || '',
          thumb: item.fullMatchingImages?.[0]?.url || item.partialMatchingImages?.[0]?.url || '',
        },
        links: {
          html: item.url
        },
        description: item.pageTitle || '匹配图片',
        alt_description: '匹配图片',
        user: {
          name: 'Google Vision'
        },
        source: 'google-vision'
      })));
    }
    
    return {
      results: results.slice(0, 10), // 限制结果数量
      total: results.length
    };
  }
}

// Unsplash API 实现（作为备用）
export class UnsplashAPI implements ExternalImageAPI {
  name = 'Unsplash';
  
  async searchText(query: string, filters: ImageSearchFilters): Promise<ExternalSearchResult> {
    try {
      // 这里将来会替换为实际的 Unsplash API 调用
      // const response = await fetch(`https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=10`, {
      //   headers: {
      //     'Authorization': `Client-ID ${process.env.UNSPLASH_ACCESS_KEY}`
      //   }
      // });
      // const data = await response.json();
      // return this.processUnsplashResults(data);
      
      // 模拟 Unsplash 数据
      return {
        results: [
          {
            id: `unsplash_${Date.now()}_1`,
            urls: {
              raw: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809',
              full: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809',
              regular: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809',
              small: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=400',
              thumb: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=200',
            },
            links: { html: 'https://unsplash.com/photos/abstract' },
            description: `${query} - Unsplash`,
            alt_description: `${query}`,
            user: { name: 'Unsplash Photographer' },
            source: 'unsplash'
          }
        ],
        total: 1
      };
    } catch (error) {
      console.error('Unsplash API error:', error);
      throw new Error('Unsplash 搜索失败');
    }
  }
  
  private processUnsplashResults(data: any): ExternalSearchResult {
    return {
      results: data.results?.map((item: any) => ({
        id: item.id,
        urls: item.urls,
        links: item.links,
        description: item.description || item.alt_description,
        alt_description: item.alt_description,
        user: item.user,
        source: 'unsplash'
      })) || [],
      total: data.total || 0
    };
  }
}

// API 工厂类
export class ImageSearchAPIFactory {
  private static apis: Map<string, ExternalImageAPI> = new Map<string, ExternalImageAPI>([
    ['prompthero', new PromptHeroAPI()],
    ['google-vision', new GoogleVisionAPI()],
    ['unsplash', new UnsplashAPI()]
  ]);
  
  static getAPI(provider: string): ExternalImageAPI | null {
    return this.apis.get(provider) || null;
  }
  
  static getTextSearchAPI(): ExternalImageAPI {
    return this.apis.get('prompthero')!;
  }
  
  static getImageSearchAPI(): ExternalImageAPI {
    return this.apis.get('google-vision')!;
  }
  
  static getAllAPIs(): ExternalImageAPI[] {
    return Array.from(this.apis.values());
  }
}