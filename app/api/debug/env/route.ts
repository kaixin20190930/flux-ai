import { NextResponse } from 'next/server';

export async function GET() {
  const dbUrl = process.env.DATABASE_URL || '';
  let dbInfo = {};
  
  if (dbUrl) {
    try {
      const url = new URL(dbUrl);
      dbInfo = {
        protocol: url.protocol,
        hostname: url.hostname,
        database: url.pathname.substring(1),
        hasParams: url.search.length > 0,
      };
    } catch (e) {
      dbInfo = { error: 'Invalid URL' };
    }
  }
  
  return NextResponse.json({
    DATABASE_URL: process.env.DATABASE_URL ? 'Set' : 'Not set',
    DATABASE_URL_length: process.env.DATABASE_URL?.length || 0,
    DATABASE_INFO: dbInfo,
    NODE_ENV: process.env.NODE_ENV,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL ? 'Set' : 'Not set',
    JWT_SECRET: process.env.JWT_SECRET ? 'Set' : 'Not set',
    ALL_ENV_KEYS: Object.keys(process.env).filter(k => 
      k.includes('DATABASE') || k.includes('NEXTAUTH') || k.includes('JWT')
    ),
  });
}
