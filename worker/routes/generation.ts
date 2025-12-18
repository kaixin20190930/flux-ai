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

export default generation;
