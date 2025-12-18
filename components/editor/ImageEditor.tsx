'use client';

import React, { useRef, useEffect, useState } from 'react';
import { ImageEditor as CanvasEditor, EditOperation } from '../../utils/imageEditor';
import EditingTools from './EditingTools';
import EditingHistory from './EditingHistory';
import MobileOptimized from '../mobile/MobileOptimized';

interface ImageEditorProps {
  imageUrl: string;
  onSave: (editedImageUrl: string, originalImageUrl: string) => void;
  onCancel: () => void;
}

const ImageEditor: React.FC<ImageEditorProps> = ({ imageUrl, onSave, onCancel }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [editor, setEditor] = useState<CanvasEditor | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [history, setHistory] = useState<EditOperation[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [activeToolType, setActiveToolType] = useState<string | null>(null);
  const [originalDataUrl, setOriginalDataUrl] = useState<string>('');

  // Initialize the editor when the component mounts
  useEffect(() => {
    if (canvasRef.current) {
      const newEditor = new CanvasEditor(canvasRef.current);
      setEditor(newEditor);
      
      // Load the image
      const loadImage = async () => {
        try {
          setLoading(true);
          await newEditor.loadImage(imageUrl);
          
          // Store the original image data URL
          const originalUrl = newEditor.getDataURL();
          setOriginalDataUrl(originalUrl);
          
          setLoading(false);
        } catch (error) {
          console.error('Failed to load image:', error);
          setLoading(false);
        }
      };
      
      loadImage();
    }
    
    // Cleanup
    return () => {
      // Any cleanup if needed
    };
  }, [imageUrl]);

  // Update history state when editor's history changes
  useEffect(() => {
    if (editor) {
      // This is a simplified approach - in a real app, you'd want to sync with the editor's internal history
      const syncHistory = () => {
        // For demo purposes, we're just checking if the editor exists
        // In a real app, you'd subscribe to history changes in the editor
      };
      
      syncHistory();
    }
  }, [editor]);

  // Handle crop operation
  const handleCrop = (params: { x: number; y: number; width: number; height: number }) => {
    if (editor) {
      editor.crop(params);
      addToHistory({
        type: 'crop',
        params
      });
    }
  };

  // Handle rotate operation
  const handleRotate = (angle: number) => {
    if (editor) {
      editor.rotate({ angle });
      addToHistory({
        type: 'rotate',
        params: { angle }
      });
    }
  };

  // Handle brightness adjustment
  const handleBrightness = (value: number) => {
    if (editor) {
      editor.adjustBrightness({ value });
      addToHistory({
        type: 'brightness',
        params: { value }
      });
    }
  };

  // Handle contrast adjustment
  const handleContrast = (value: number) => {
    if (editor) {
      editor.adjustContrast({ value });
      addToHistory({
        type: 'contrast',
        params: { value }
      });
    }
  };

  // Add operation to history
  const addToHistory = (operation: EditOperation) => {
    // If we're not at the end of the history, remove everything after current index
    const newHistory = historyIndex < history.length - 1
      ? history.slice(0, historyIndex + 1)
      : [...history];
    
    // Add the new operation
    newHistory.push(operation);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  // Handle undo
  const handleUndo = () => {
    if (editor && historyIndex >= 0) {
      editor.undo();
      setHistoryIndex(historyIndex - 1);
    }
  };

  // Handle redo
  const handleRedo = () => {
    if (editor && historyIndex < history.length - 1) {
      editor.redo();
      setHistoryIndex(historyIndex + 1);
    }
  };

  // Handle reset
  const handleReset = () => {
    if (editor) {
      editor.reset();
      setHistory([]);
      setHistoryIndex(-1);
    }
  };

  // Jump to a specific point in history
  const handleJumpToHistory = (index: number) => {
    if (editor) {
      // Reset to original
      editor.reset();
      
      // If index is -1, we want the original image
      if (index === -1) {
        setHistoryIndex(-1);
        return;
      }
      
      // Apply all operations up to the selected index
      for (let i = 0; i <= index; i++) {
        editor.applyOperation(history[i]);
      }
      
      setHistoryIndex(index);
    }
  };

  // Handle save
  const handleSave = async () => {
    if (editor) {
      try {
        const editedDataUrl = editor.getDataURL();
        onSave(editedDataUrl, originalDataUrl);
      } catch (error) {
        console.error('Failed to save edited image:', error);
      }
    }
  };

  // Desktop layout
  const DesktopLayout = (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center p-4 bg-gray-100">
        <h2 className="text-xl font-semibold">Image Editor</h2>
        <div className="space-x-2">
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Save
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Tools sidebar */}
        <div className="w-64 bg-gray-50 border-r border-gray-200 p-4 overflow-y-auto">
          <EditingTools
            onCrop={handleCrop}
            onRotate={handleRotate}
            onBrightness={handleBrightness}
            onContrast={handleContrast}
            activeToolType={activeToolType}
            setActiveToolType={setActiveToolType}
          />
        </div>

        {/* Canvas area */}
        <div className="flex-1 flex flex-col">
          <div className="flex-1 flex items-center justify-center bg-gray-800 overflow-auto">
            {loading ? (
              <div className="text-white">Loading image...</div>
            ) : (
              <canvas
                ref={canvasRef}
                className="max-w-full max-h-full"
              />
            )}
          </div>

          {/* Bottom toolbar */}
          <div className="p-4 bg-gray-100 border-t border-gray-200 flex justify-between">
            <div>
              <button
                onClick={handleUndo}
                disabled={historyIndex < 0}
                className={`px-3 py-1 rounded mr-2 ${
                  historyIndex >= 0 ? 'bg-blue-500 text-white' : 'bg-gray-300 text-gray-500'
                }`}
              >
                Undo
              </button>
              <button
                onClick={handleRedo}
                disabled={historyIndex >= history.length - 1}
                className={`px-3 py-1 rounded mr-2 ${
                  historyIndex < history.length - 1 ? 'bg-blue-500 text-white' : 'bg-gray-300 text-gray-500'
                }`}
              >
                Redo
              </button>
            </div>
            <button
              onClick={handleReset}
              className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
            >
              Reset
            </button>
          </div>
        </div>

        {/* History sidebar */}
        <div className="w-64 bg-gray-50 border-l border-gray-200 overflow-y-auto">
          <EditingHistory
            history={history}
            currentIndex={historyIndex}
            onJumpTo={handleJumpToHistory}
          />
        </div>
      </div>
    </div>
  );

  // Mobile layout
  const MobileLayout = (
    <div className="flex flex-col h-full">
      {/* Mobile header */}
      <div className="flex justify-between items-center p-3 bg-gray-100">
        <h2 className="text-lg font-semibold">Image Editor</h2>
        <div className="space-x-1">
          <button
            onClick={onCancel}
            className="px-3 py-1 text-sm bg-gray-200 rounded hover:bg-gray-300"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Save
          </button>
        </div>
      </div>

      {/* Mobile canvas area - takes most of the screen */}
      <div className="flex-1 bg-gray-800 flex items-center justify-center overflow-hidden">
        {loading ? (
          <div className="text-white">Loading image...</div>
        ) : (
          <canvas
            ref={canvasRef}
            className="max-w-full max-h-full"
          />
        )}
      </div>

      {/* Mobile bottom toolbar */}
      <div className="p-2 bg-gray-100 border-t border-gray-200 flex justify-between items-center">
        <div className="flex space-x-1">
          <button
            onClick={handleUndo}
            disabled={historyIndex < 0}
            className={`px-2 py-1 rounded text-sm ${
              historyIndex >= 0 ? 'bg-blue-500 text-white' : 'bg-gray-300 text-gray-500'
            }`}
          >
            Undo
          </button>
          <button
            onClick={handleRedo}
            disabled={historyIndex >= history.length - 1}
            className={`px-2 py-1 rounded text-sm ${
              historyIndex < history.length - 1 ? 'bg-blue-500 text-white' : 'bg-gray-300 text-gray-500'
            }`}
          >
            Redo
          </button>
          <button
            onClick={handleReset}
            className="px-2 py-1 bg-red-500 text-white rounded text-sm"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Mobile tools - collapsible tabs at the bottom */}
      <div className="bg-gray-50 border-t border-gray-200 p-3 max-h-48 overflow-y-auto">
        <EditingTools
          onCrop={handleCrop}
          onRotate={handleRotate}
          onBrightness={handleBrightness}
          onContrast={handleContrast}
          activeToolType={activeToolType}
          setActiveToolType={setActiveToolType}
          isMobile={true}
        />
      </div>
    </div>
  );

  return (
    <MobileOptimized mobileContent={MobileLayout}>
      {DesktopLayout}
    </MobileOptimized>
  );
};

export default ImageEditor;