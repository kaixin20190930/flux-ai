/**
 * 积分管理路由
 * Points Management Routes
 */

import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { Env } from '../types';
import { handleGetUserPoints } from '../handlers/getUserPoints';
import { handleUpdateUserPoints } from '../handlers/updateUserPoints';
import { handleUpdateUserPointsForPurchase } from '../handlers/updateUserPointsForPurchase';
import { handleCheckAndConsumePoints } from '../handlers/checkAndConsumePoints';
import { handleDeductPoints } from '../handlers/deductPoints';

const points = new Hono<{ Bindings: Env }>();

// 获取用户积分 Schema
const getUserPointsSchema = z.object({
  userId: z.union([z.string(), z.number()]),
});

// 更新用户积分 Schema
const updateUserPointsSchema = z.object({
  userId: z.union([z.string(), z.number()]),
  points: z.number(),
  operation: z.enum(['add', 'subtract']).optional(),
});

// 购买积分 Schema
const purchasePointsSchema = z.object({
  userId: z.union([z.string(), z.number()]),
  points: z.number().positive(),
  transactionId: z.string().optional(),
});

// 检查并消耗积分 Schema
const checkAndConsumeSchema = z.object({
  userId: z.union([z.string(), z.number()]),
  points: z.number().positive(),
  operation: z.string(),
});

/**
 * POST /points/get - 获取用户积分
 */
points.post('/get', zValidator('json', getUserPointsSchema), async (c) => {
  try {
    const request = new Request(c.req.url, {
      method: 'POST',
      headers: c.req.raw.headers,
      body: JSON.stringify(c.req.valid('json')),
    });
    
    return await handleGetUserPoints(request, c.env);
  } catch (error) {
    console.error('Get user points error:', error);
    return c.json({
      success: false,
      error: {
        code: 'GET_POINTS_ERROR',
        message: '获取积分失败',
      },
    }, 500);
  }
});

/**
 * POST /points/update - 更新用户积分
 */
points.post('/update', zValidator('json', updateUserPointsSchema), async (c) => {
  try {
    const request = new Request(c.req.url, {
      method: 'POST',
      headers: c.req.raw.headers,
      body: JSON.stringify(c.req.valid('json')),
    });
    
    return await handleUpdateUserPoints(request, c.env);
  } catch (error) {
    console.error('Update user points error:', error);
    return c.json({
      success: false,
      error: {
        code: 'UPDATE_POINTS_ERROR',
        message: '更新积分失败',
      },
    }, 500);
  }
});

/**
 * POST /points/purchase - 购买积分
 */
points.post('/purchase', zValidator('json', purchasePointsSchema), async (c) => {
  try {
    const request = new Request(c.req.url, {
      method: 'POST',
      headers: c.req.raw.headers,
      body: JSON.stringify(c.req.valid('json')),
    });
    
    return await handleUpdateUserPointsForPurchase(request, c.env);
  } catch (error) {
    console.error('Purchase points error:', error);
    return c.json({
      success: false,
      error: {
        code: 'PURCHASE_ERROR',
        message: '购买积分失败',
      },
    }, 500);
  }
});

/**
 * POST /points/check-and-consume - 检查并消耗积分
 */
points.post('/check-and-consume', zValidator('json', checkAndConsumeSchema), async (c) => {
  try {
    const request = new Request(c.req.url, {
      method: 'POST',
      headers: c.req.raw.headers,
      body: JSON.stringify(c.req.valid('json')),
    });
    
    return await handleCheckAndConsumePoints(request, c.env);
  } catch (error) {
    console.error('Check and consume points error:', error);
    return c.json({
      success: false,
      error: {
        code: 'CONSUME_POINTS_ERROR',
        message: '消耗积分失败',
      },
    }, 500);
  }
});

/**
 * POST /points/deduct - 扣除用户积分
 */
const deductPointsSchema = z.object({
  userId: z.number(),
  points: z.number().positive(),
  reason: z.string().optional(),
});

points.post('/deduct', zValidator('json', deductPointsSchema), async (c) => {
  try {
    const request = new Request(c.req.url, {
      method: 'POST',
      headers: c.req.raw.headers,
      body: JSON.stringify(c.req.valid('json')),
    });
    
    return await handleDeductPoints(request, c.env);
  } catch (error) {
    console.error('Deduct points error:', error);
    return c.json({
      success: false,
      error: {
        code: 'DEDUCT_POINTS_ERROR',
        message: '扣除积分失败',
      },
    }, 500);
  }
});

export default points;
