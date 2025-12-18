import { NextRequest, NextResponse } from 'next/server';
import { generateUUID } from '@/utils/edgeUtils';
import { saveEditHistory, getEditHistoryByGenerationId } from '../../../utils/dao';
import { handleApiError } from '../../../utils/errorHandler';
import { auth } from '@/lib/auth';

export const dynamic = 'force-dynamic'

// 强制使用 Edge Runtime (Cloudflare Pages 要求)
// 注意：不使用 edge runtime，因为 NextAuth database sessions 需要 Prisma
// Prisma 不支持 Edge Runtime
export async function POST(request: NextRequest) {
  try {
    // Check authentication using NextAuth
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    const { generationId, operations, resultUrl, originalUrl } = body as { 
      generationId: string; 
      operations: any[]; 
      resultUrl: string; 
      originalUrl: string; 
    };

    if (!generationId || !operations || !resultUrl || !originalUrl) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create edit history record
    const editHistoryId = generateUUID();
    const editHistory = {
      id: editHistoryId,
      generationId,
      operations,
      resultUrl,
      originalUrl,
      createdAt: new Date(),
      userId: session.user.id
    };

    // Save to database
    await saveEditHistory(editHistory);

    return NextResponse.json({
      success: true,
      editHistoryId
    });
  } catch (error) {
    console.error('Failed to save edit history:', error);
    return NextResponse.json(
      { error: 'Failed to save edit history' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Check authentication using NextAuth
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get generationId from URL
    const url = new URL(request.url);
    const generationId = url.searchParams.get('generationId');

    if (!generationId) {
      return NextResponse.json(
        { error: 'Missing generationId parameter' },
        { status: 400 }
      );
    }

    // Get edit history for the generation
    const editHistory = await getEditHistoryByGenerationId(generationId);

    return NextResponse.json({
      success: true,
      editHistory
    });
  } catch (error) {
    console.error('Failed to get edit history:', error);
    return NextResponse.json(
      { error: 'Failed to get edit history' },
      { status: 500 }
    );
  }
}