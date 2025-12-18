import { v4 as uuidv4 } from 'uuid';
import { EditHistoryDAO } from './dao';
import { Env } from '@/worker/types';
import { EditOperation } from './imageEditor';
import { EditHistoryRecord, SaveEditHistoryRequest } from '@/types/editHistory';
import { AppErrorClass, ErrorCode } from '@/types/database';

/**
 * Save edit history to the database
 */
export async function saveEditHistory(
  request: SaveEditHistoryRequest,
  userId: string,
  env: Env
): Promise<string> {
  try {
    const editHistoryDAO = new EditHistoryDAO(env);
    
    const editHistoryId = await editHistoryDAO.create({
      generationId: request.generationId,
      operations: request.operations,
      resultUrl: request.resultUrl,
      originalUrl: request.originalUrl,
      userId
    });
    
    return editHistoryId;
  } catch (error) {
    console.error('Failed to save edit history:', error);
    throw new AppErrorClass({
      code: ErrorCode.EDIT_OPERATION_FAILED,
      message: 'Failed to save edit history',
      details: { error },
      timestamp: new Date()
    });
  }
}

/**
 * Get edit history for a generation
 */
export async function getEditHistoryByGenerationId(
  generationId: string,
  userId: string,
  env: Env
): Promise<EditHistoryRecord[]> {
  try {
    const editHistoryDAO = new EditHistoryDAO(env);
    const history = await editHistoryDAO.findByGenerationId(generationId, userId);
    
    return history.map(item => ({
      id: item.id,
      generationId: item.generationId,
      operations: item.operations,
      resultUrl: item.resultUrl,
      originalUrl: item.originalUrl,
      createdAt: item.createdAt,
      userId: item.userId
    }));
  } catch (error) {
    console.error('Failed to get edit history:', error);
    throw new AppErrorClass({
      code: ErrorCode.EDIT_OPERATION_FAILED,
      message: 'Failed to get edit history',
      details: { error },
      timestamp: new Date()
    });
  }
}