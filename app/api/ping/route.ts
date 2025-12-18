export const runtime = 'edge'
export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  return new Response(JSON.stringify({ 
    message: 'pong',
    timestamp: Date.now()
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
}