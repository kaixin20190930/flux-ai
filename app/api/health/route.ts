export const runtime = 'edge'
export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { createSuccessResponse } from '@/utils/edgeUtils'

export async function GET(request: NextRequest) {
  return createSuccessResponse({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    runtime: 'edge'
  });
}