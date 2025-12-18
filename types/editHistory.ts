/**
 * Types for edit history functionality
 */

import { EditOperation } from '../utils/imageEditor';

export interface EditHistoryRecord {
  id: string;
  generationId: string;
  operations: EditOperation[];
  resultUrl: string;
  originalUrl: string;
  createdAt: Date;
  userId: string;
}

export interface SaveEditHistoryRequest {
  generationId: string;
  operations: EditOperation[];
  resultUrl: string;
  originalUrl: string;
}

export interface SaveEditHistoryResponse {
  success: boolean;
  editHistoryId?: string;
  error?: string;
}