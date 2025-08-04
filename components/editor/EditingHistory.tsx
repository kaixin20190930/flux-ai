'use client';

import React from 'react';
import { EditOperation } from '../../utils/imageEditor';

interface EditingHistoryProps {
  history: EditOperation[];
  currentIndex: number;
  onJumpTo: (index: number) => void;
}

const EditingHistory: React.FC<EditingHistoryProps> = ({
  history,
  currentIndex,
  onJumpTo,
}) => {
  // Helper function to get a human-readable description of an operation
  const getOperationDescription = (operation: EditOperation): string => {
    switch (operation.type) {
      case 'crop':
        return 'Crop image';
      case 'rotate':
        const angle = operation.params.angle;
        return `Rotate ${angle > 0 ? '+' : ''}${angle}°`;
      case 'brightness':
        const brightness = operation.params.value;
        return `Brightness ${brightness > 0 ? '+' : ''}${brightness}`;
      case 'contrast':
        const contrast = operation.params.value;
        return `Contrast ${contrast > 0 ? '+' : ''}${contrast}`;
      default:
        return `Unknown operation: ${operation.type}`;
    }
  };

  if (history.length === 0) {
    return (
      <div className="p-4 text-gray-500 text-center">
        No edits yet. Start editing your image!
      </div>
    );
  }

  return (
    <div className="p-2">
      <h3 className="text-lg font-medium mb-3">Edit History</h3>
      <div className="space-y-1">
        <div
          className={`p-2 rounded cursor-pointer ${
            currentIndex === -1 ? 'bg-blue-100 border border-blue-300' : 'hover:bg-gray-100'
          }`}
          onClick={() => onJumpTo(-1)}
        >
          Original Image
        </div>
        {history.map((operation, index) => (
          <div
            key={index}
            className={`p-2 rounded cursor-pointer ${
              index === currentIndex ? 'bg-blue-100 border border-blue-300' : 'hover:bg-gray-100'
            }`}
            onClick={() => onJumpTo(index)}
          >
            {index + 1}. {getOperationDescription(operation)}
          </div>
        ))}
      </div>
    </div>
  );
};

export default EditingHistory;