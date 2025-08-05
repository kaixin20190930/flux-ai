import { NextRequest, NextResponse } from 'next/server';
import { generateUUID } from '@/utils/edgeUtils';
import { getUserFromRequest } from '../../../utils/auth';
import { saveEditHistory, getEditHistoryByGenerationId } from '../../../utils/dao';
import { handleApiError } from '../../../utils/errorHandler';

export const dynamic = 'force-dynamic'

// 强制使用 Edge Runtime (Cloudflare Pages 要求)
export const runtime = 'edge';

export async function POST(request: NextRequest) {
  try {
    // Get user from request
    const user = await getUserFromRequest(request);
    if (!user) {
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
      userId: user.id
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
    // Get user from request
    const user = await getUserFromRequest(request);
    if (!user) {
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