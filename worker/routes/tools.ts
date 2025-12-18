/**
 * Flux 工具使用路由
 * Flux Tools Usage Routes
 */

import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { Env } from '../types';
import { handleRecordToolUsage } from '../handlers/recordToolUsage';

const tools = new Hono<{ Bindings: Env }>();

// 记录工具使用 Schema
const recordToolUsageSchema = z.object({
  userId: z.union([z.string(), z.number()]),
  toolName: z.string(),
  inputData: z.record(z.any()).optional(),
  outputData: z.record(z.any()).optional(),
  status: z.enum(['success', 'failed']).optional(),
  error: z.string().optional(),
});

/**
 * POST /tools/record - 记录工具使用
 */
tools.post('/record', zValidator('json', recordToolUsageSchema), async (c) => {
  try {
    const request = new Request(c.req.url, {
      method: 'POST',
      headers: c.req.raw.headers,
      body: JSON.stringify(c.req.valid('json')),
    });
    
    return await handleRecordToolUsage(request, c.env);
  } catch (error) {
    console.error('Record tool usage error:', error);
    return c.json({
      success: false,
      error: {
        code: 'RECORD_TOOL_ERROR',
        message: '记录工具使用失败',
      },
    }, 500);
  }
});

export default tools;
