'use client';

import React, { useState } from 'react';
import { X } from 'lucide-react';
import ImageEditor from './ImageEditor';
import type { GenerationHistory } from '@/types/database';
import { EditOperation } from '@/utils/imageEditor';

interface EditImageModalProps {
  item: GenerationHistory;
  onClose: () => void;
  onSave: (editedImageUrl: string, originalImageUrl: string, operations: EditOperation[]) => Promise<void>;
}

const EditImageModal: React.FC<EditImageModalProps> = ({ item, onClose, onSave }) => {
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async (editedImageUrl: string, originalImageUrl: string) => {
    try {
      setIsSaving(true);
      setError(null);
      
      // In a real implementation, we would get the operations from the editor
      // For now, we'll just use an empty array as a placeholder
      const operations: EditOperation[] = [];
      
      await onSave(editedImageUrl, originalImageUrl, operations);
      onClose();
    } catch (err) {
      console.error('Failed to save edited image:', err);
      setError('保存失败，请重试');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-lg w-full h-full max-w-7xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-white/10">
          <h2 className="text-xl font-semibold">图像编辑</h2>
          <button 
            onClick={onClose}
            className="p-1 hover:bg-white/10 rounded-full"
            disabled={isSaving}
          >
            <X size={24} />
          </button>
        </div>

        {/* Editor */}
        <div className="flex-grow overflow-hidden">
          <ImageEditor 
            imageUrl={item.imageUrl}
            onSave={handleSave}
            onCancel={onClose}
          />
        </div>

        {/* Error message */}
        {error && (
          <div className="p-3 bg-red-500/20 border border-red-500 text-red-200 text-center">
            {error}
          </div>
        )}
      </div>
    </div>
  );
};

export default EditImageModal;