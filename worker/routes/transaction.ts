/**
 * 交易记录路由
 * Transaction Routes
 */

import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { Env } from '../types';
import { handleInsertTransaction } from '../handlers/insertTransaction';
import { handleGetTransaction } from '../handlers/getTransaction';

const transaction = new Hono<{ Bindings: Env }>();

// 插入交易 Schema
const insertTransactionSchema = z.object({
  userId: z.union([z.string(), z.number()]),
  type: z.enum(['purchase', 'consumption', 'refund', 'reward']),
  amount: z.number(),
  description: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

// 获取交易 Schema
const getTransactionSchema = z.object({
  transactionId: z.union([z.string(), z.number()]).optional(),
  userId: z.union([z.string(), z.number()]).optional(),
  limit: z.number().positive().optional(),
  offset: z.number().nonnegative().optional(),
});

/**
 * POST /transaction/insert - 插入交易记录
 */
transaction.post('/insert', zValidator('json', insertTransactionSchema), async (c) => {
  try {
    const request = new Request(c.req.url, {
      method: 'POST',
      headers: c.req.raw.headers,
      body: JSON.stringify(c.req.valid('json')),
    });
    
    return await handleInsertTransaction(request, c.env);
  } catch (error) {
    console.error('Insert transaction error:', error);
    return c.json({
      success: false,
      error: {
        code: 'INSERT_TRANSACTION_ERROR',
        message: '插入交易记录失败',
      },
    }, 500);
  }
});

/**
 * POST /transaction/get - 获取交易记录
 */
transaction.post('/get', zValidator('json', getTransactionSchema), async (c) => {
  try {
    const request = new Request(c.req.url, {
      method: 'POST',
      headers: c.req.raw.headers,
      body: JSON.stringify(c.req.valid('json')),
    });
    
    return await handleGetTransaction(request, c.env);
  } catch (error) {
    console.error('Get transaction error:', error);
    return c.json({
      success: false,
      error: {
        code: 'GET_TRANSACTION_ERROR',
        message: '获取交易记录失败',
      },
    }, 500);
  }
});

export default transaction;
