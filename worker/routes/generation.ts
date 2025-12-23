/**
 * 图片生成路由
 * Image Generation Routes
 */

import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { Env } from '../types';
import { handleRecordGeneration } from '../handlers/recordGeneration';
import { handleGetGenerationRecord } from '../handlers/getGenerationRecord';
import { handleUpdateGenerationRecord } from '../handlers/updateGenerationRecord';
import { handleCheckRateLimit } from '../handlers/checkRateLimit';
// V2 Handlers - 新积分系统
import { handleGetUserStatusV2 } from '../handlers/getUserStatusV2';
import { handleCreateGenerationV2 } from '../handlers/createGenerationV2';

const generation = new Hono<{ Bindings: Env }>();

// 记录生成 Schema
const recordGenerationSchema = z.object({
  userId: z.union([z.string(), z.number()]),
  prompt: z.string(),
  model: z.string(),
  imageUrl: z.string().optional(),
  status: z.enum(['pending', 'processing', 'completed', 'failed']).optional(),
});

// 获取生成记录 Schema
const getGenerationSchema = z.object({
  generationId: z.union([z.string(), z.number()]),
});

// 更新生成记录 Schema
const updateGenerationSchema = z.object({
  generationId: z.union([z.string(), z.number()]),
  status: z.enum(['pending', 'processing', 'completed', 'failed']).optional(),
  imageUrl: z.string().optional(),
  error: z.string().optional(),
});

// 检查速率限制 Schema
const checkRateLimitSchema = z.object({
  userId: z.union([z.string(), z.number()]).optional(),
  ipAddress: z.string().optional(),
  fingerprint: z.string().optional(),
});

/**
 * POST /generation/record - 记录图片生成
 */
generation.post('/record', zValidator('json', recordGenerationSchema), async (c) => {
  try {
    const request = new Request(c.req.url, {
      method: 'POST',
      headers: c.req.raw.headers,
      body: JSON.stringify(c.req.valid('json')),
    });
    
    return await handleRecordGeneration(request, c.env);
  } catch (error) {
    console.error('Record generation error:', error);
    return c.json({
      success: false,
      error: {
        code: 'RECORD_ERROR',
        message: '记录生成失败',
      },
    }, 500);
  }
});

/**
 * POST /generation/get - 获取生成记录
 */
generation.post('/get', zValidator('json', getGenerationSchema), async (c) => {
  try {
    const request = new Request(c.req.url, {
      method: 'POST',
      headers: c.req.raw.headers,
      body: JSON.stringify(c.req.valid('json')),
    });
    
    return await handleGetGenerationRecord(request, c.env);
  } catch (error) {
    console.error('Get generation record error:', error);
    return c.json({
      success: false,
      error: {
        code: 'GET_RECORD_ERROR',
        message: '获取记录失败',
      },
    }, 500);
  }
});

/**
 * POST /generation/update - 更新生成记录
 */
generation.post('/update', zValidator('json', updateGenerationSchema), async (c) => {
  try {
    const request = new Request(c.req.url, {
      method: 'POST',
      headers: c.req.raw.headers,
      body: JSON.stringify(c.req.valid('json')),
    });
    
    return await handleUpdateGenerationRecord(request, c.env);
  } catch (error) {
    console.error('Update generation record error:', error);
    return c.json({
      success: false,
      error: {
        code: 'UPDATE_RECORD_ERROR',
        message: '更新记录失败',
      },
    }, 500);
  }
});

/**
 * POST /generation/check-rate-limit - 检查速率限制
 */
generation.post('/check-rate-limit', zValidator('json', checkRateLimitSchema), async (c) => {
  try {
    const request = new Request(c.req.url, {
      method: 'POST',
      headers: c.req.raw.headers,
      body: JSON.stringify(c.req.valid('json')),
    });
    
    return await handleCheckRateLimit(request, c.env);
  } catch (error) {
    console.error('Check rate limit error:', error);
    return c.json({
      success: false,
      error: {
        code: 'RATE_LIMIT_ERROR',
        message: '检查速率限制失败',
      },
    }, 500);
  }
});

/**
 * GET /generation/status - 获取用户状态（V2 新积分系统）
 */
generation.get('/status', async (c) => {
  try {
    const request = new Request(c.req.url, {
      method: 'GET',
      headers: c.req.raw.headers,
    });
    
    return await handleGetUserStatusV2(request, c.env);
  } catch (error) {
    console.error('Get user status error:', error);
    return c.json({
      success: false,
      error: {
        code: 'GET_STATUS_ERROR',
        message: '获取用户状态失败',
      },
    }, 500);
  }
});

/**
 * POST /generation/create - 创建生成任务（V2 新积分系统）
 */
const createGenerationSchema = z.object({
  model: z.string(),
  prompt: z.string(),
  userId: z.number().optional(),
  ipAddress: z.string(),
  fingerprintHash: z.string().optional(),
});

generation.post('/create', zValidator('json', createGenerationSchema), async (c) => {
  try {
    const request = new Request(c.req.url, {
      method: 'POST',
      headers: c.req.raw.headers,
      body: JSON.stringify(c.req.valid('json')),
    });
    
    return await handleCreateGenerationV2(request, c.env);
  } catch (error) {
    console.error('Create generation error:', error);
    return c.json({
      success: false,
      error: {
        code: 'CREATE_GENERATION_ERROR',
        message: '创建生成任务失败',
      },
    }, 500);
  }
});

/**
 * POST /generation/generate - 完整的图片生成 API
 */
const generateImageSchema = z.object({
  prompt: z.string().min(1, 'Prompt is required'),
  model: z.string().default('flux-schnell'),
  aspectRatio: z.string().optional(),
  format: z.string().optional(),
});

generation.post('/generate', zValidator('json', generateImageSchema), async (c) => {
  try {
    const { prompt, model, aspectRatio, format } = c.req.valid('json');
    
    // 获取认证信息
    const authHeader = c.req.header('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    // 获取指纹和 IP
    const fingerprintHash = c.req.header('x-fingerprint-hash') || '';
    const ipAddress = c.req.header('cf-connecting-ip') || c.req.header('x-real-ip') || '127.0.0.1';
    
    console.log('🎨 Generation request:', {
      hasToken: !!token,
      model,
      promptLength: prompt.length,
      fingerprintHash: fingerprintHash.substring(0, 10) + '...',
      ipAddress
    });
    
    // 1. 验证 token 并获取 userId
    let userId: string | undefined = undefined;
    if (token) {
      try {
        const encoder = new TextEncoder();
        const secretKey = encoder.encode(c.env.JWT_SECRET);
        const { jwtVerify } = await import('jose');
        const { payload } = await jwtVerify(token, secretKey);
        userId = payload.userId as string;
      } catch (error) {
        console.error('Token verification failed:', error);
      }
    }
    
    // 2. 调用 createGenerationV2 创建生成任务（检查积分并扣除）
    const createRequest = new Request(c.req.url, {
      method: 'POST',
      headers: c.req.raw.headers,
      body: JSON.stringify({
        model,
        prompt,
        userId,
        ipAddress,
        fingerprintHash,
      }),
    });
    
    const generationResponse = await handleCreateGenerationV2(createRequest, c.env);
    
    if (!generationResponse.ok) {
      const error = await generationResponse.json() as { error?: string };
      console.error('Generation creation failed:', error);
      return c.json({ 
        error: error.error || 'Failed to create generation' 
      }, generationResponse.status);
    }
    
    const generationData = await generationResponse.json() as {
      success: boolean;
      data: {
        generationId: string;
        pointsDeducted: number;
        usedFreeTier: boolean;
        newBalance: number;
        freeGenerationsRemaining: number;
      };
    };
    
    const { generationId, pointsDeducted, usedFreeTier, newBalance, freeGenerationsRemaining } = generationData.data;
    
    console.log('✅ Generation approved:', { 
      generationId, 
      pointsDeducted, 
      usedFreeTier,
      newBalance
    });
    
    // 3. 调用 Replicate API 生成图片
    const replicateApiToken = c.env.REPLICATE_API_TOKEN;
    if (!replicateApiToken) {
      console.error('REPLICATE_API_TOKEN not configured');
      return c.json({ error: 'Image generation service not configured' }, { status: 500 });
    }
    
    const identifier = `black-forest-labs/${model}`;
    
    // 创建 Replicate prediction
    const predictionResponse = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${replicateApiToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        version: identifier,
        input: {
          prompt,
          aspect_ratio: aspectRatio || '1:1',
          output_format: format || 'jpg',
          num_inference_steps: 4,
        }
      })
    });
    
    if (!predictionResponse.ok) {
      const error = await predictionResponse.text();
      console.error('Replicate API error:', error);
      return c.json({ error: 'Failed to start image generation' }, { status: 500 });
    }
    
    const prediction = await predictionResponse.json() as {
      id: string;
      status: string;
      output?: string[] | string;
      urls: {
        get: string;
      };
    };
    
    console.log('🎨 Replicate prediction created:', prediction.id);
    
    // 4. 轮询等待结果（最多等待 60 秒）
    let imageUrl = '';
    let attempts = 0;
    const maxAttempts = 60; // 60 秒
    
    while (attempts < maxAttempts) {
      const statusResponse = await fetch(prediction.urls.get, {
        headers: {
          'Authorization': `Token ${replicateApiToken}`,
        }
      });
      
      if (!statusResponse.ok) {
        console.error('Failed to check prediction status');
        break;
      }
      
      const status = await statusResponse.json() as {
        status: string;
        output?: string[] | string;
        error?: string;
      };
      
      if (status.status === 'succeeded' && status.output) {
        if (Array.isArray(status.output) && status.output.length > 0) {
          imageUrl = status.output[0];
        } else if (typeof status.output === 'string') {
          imageUrl = status.output;
        }
        break;
      } else if (status.status === 'failed') {
        console.error('Replicate generation failed:', status.error);
        break;
      }
      
      // 等待 1 秒后重试
      await new Promise(resolve => setTimeout(resolve, 1000));
      attempts++;
    }
    
    if (!imageUrl) {
      console.error('No image generated after', attempts, 'attempts');
      return c.json({ error: 'Failed to generate image' }, { status: 500 });
    }
    
    console.log('✅ Image generated successfully:', imageUrl.substring(0, 50) + '...');
    
    // 5. 更新数据库记录
    await c.env.DB.prepare(`
      UPDATE generation_history 
      SET status = 'completed', image_url = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(imageUrl, generationId).run();
    
    // 6. 返回结果
    return c.json({
      image: imageUrl,
      userPoints: usedFreeTier ? null : newBalance,
      freeGenerationsRemaining: usedFreeTier ? freeGenerationsRemaining : 0,
      pointsConsumed: pointsDeducted,
      usedFreeTier,
      generationId
    });
    
  } catch (error) {
    console.error('Generate image error:', error);
    return c.json({
      error: error instanceof Error ? error.message : '图片生成失败',
    }, 500);
  }
});

export default generation;
