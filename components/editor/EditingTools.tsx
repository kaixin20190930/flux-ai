'use client';

import React, { useState } from 'react';

interface EditingToolsProps {
  onCrop: (params: { x: number; y: number; width: number; height: number }) => void;
  onRotate: (angle: number) => void;
  onBrightness: (value: number) => void;
  onContrast: (value: number) => void;
  activeToolType: string | null;
  setActiveToolType: (toolType: string | null) => void;
  isMobile?: boolean;
}

const EditingTools: React.FC<EditingToolsProps> = ({
  onCrop,
  onRotate,
  onBrightness,
  onContrast,
  activeToolType,
  setActiveToolType,
  isMobile = false,
}) => {
  // Tool-specific state
  const [cropParams, setCropParams] = useState({ x: 0, y: 0, width: 100, height: 100 });
  const [rotateAngle, setRotateAngle] = useState(0);
  const [brightnessValue, setBrightnessValue] = useState(0);
  const [contrastValue, setContrastValue] = useState(0);

  // Handle tool selection
  const handleToolSelect = (toolType: string) => {
    setActiveToolType(activeToolType === toolType ? null : toolType);
  };

  // Mobile layout with more compact UI
  if (isMobile) {
    return (
      <div className="space-y-3">
        <h3 className="text-base font-medium">Editing Tools</h3>
        
        {/* Mobile tool selector - horizontal tabs */}
        <div className="flex overflow-x-auto pb-2 space-x-2">
          <button
            onClick={() => handleToolSelect('crop')}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm ${
              activeToolType === 'crop' ? 'bg-blue-500 text-white' : 'bg-gray-200'
            }`}
          >
            Crop
          </button>
          <button
            onClick={() => handleToolSelect('rotate')}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm ${
              activeToolType === 'rotate' ? 'bg-blue-500 text-white' : 'bg-gray-200'
            }`}
          >
            Rotate
          </button>
          <button
            onClick={() => handleToolSelect('brightness')}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm ${
              activeToolType === 'brightness' ? 'bg-blue-500 text-white' : 'bg-gray-200'
            }`}
          >
            Brightness
          </button>
          <button
            onClick={() => handleToolSelect('contrast')}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm ${
              activeToolType === 'contrast' ? 'bg-blue-500 text-white' : 'bg-gray-200'
            }`}
          >
            Contrast
          </button>
        </div>

        {/* Mobile tool controls */}
        {activeToolType === 'crop' && (
          <div className="p-2 bg-gray-100 rounded space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs text-gray-600">X</label>
                <input
                  type="number"
                  value={cropParams.x}
                  onChange={(e) => setCropParams({ ...cropParams, x: parseInt(e.target.value) || 0 })}
                  className="w-full p-1 text-sm border rounded"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600">Y</label>
                <input
                  type="number"
                  value={cropParams.y}
                  onChange={(e) => setCropParams({ ...cropParams, y: parseInt(e.target.value) || 0 })}
                  className="w-full p-1 text-sm border rounded"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600">Width</label>
                <input
                  type="number"
                  value={cropParams.width}
                  onChange={(e) => setCropParams({ ...cropParams, width: parseInt(e.target.value) || 0 })}
                  className="w-full p-1 text-sm border rounded"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600">Height</label>
                <input
                  type="number"
                  value={cropParams.height}
                  onChange={(e) => setCropParams({ ...cropParams, height: parseInt(e.target.value) || 0 })}
                  className="w-full p-1 text-sm border rounded"
                />
              </div>
            </div>
            <button
              onClick={() => onCrop(cropParams)}
              className="w-full px-3 py-1 bg-blue-500 text-white rounded text-sm"
            >
              Apply
            </button>
          </div>
        )}

        {activeToolType === 'rotate' && (
          <div className="p-2 bg-gray-100 rounded space-y-2">
            <div className="flex space-x-2 justify-between">
              <button
                onClick={() => {
                  setRotateAngle(-90);
                  onRotate(-90);
                }}
                className="flex-1 px-2 py-1 bg-gray-200 rounded text-sm"
              >
                -90°
              </button>
              <button
                onClick={() => {
                  setRotateAngle(90);
                  onRotate(90);
                }}
                className="flex-1 px-2 py-1 bg-gray-200 rounded text-sm"
              >
                +90°
              </button>
              <button
                onClick={() => {
                  setRotateAngle(180);
                  onRotate(180);
                }}
                className="flex-1 px-2 py-1 bg-gray-200 rounded text-sm"
              >
                180°
              </button>
            </div>
            <div>
              <label className="block text-xs text-gray-600">Custom angle</label>
              <div className="flex space-x-2">
                <input
                  type="number"
                  value={rotateAngle}
                  onChange={(e) => setRotateAngle(parseInt(e.target.value) || 0)}
                  className="flex-1 p-1 text-sm border rounded"
                />
                <button
                  onClick={() => onRotate(rotateAngle)}
                  className="px-3 py-1 bg-blue-500 text-white rounded text-sm"
                >
                  Apply
                </button>
              </div>
            </div>
          </div>
        )}

        {activeToolType === 'brightness' && (
          <div className="p-2 bg-gray-100 rounded space-y-2">
            <div>
              <div className="flex justify-between">
                <label className="text-xs text-gray-600">Brightness</label>
                <span className="text-xs font-medium">{brightnessValue}</span>
              </div>
              <input
                type="range"
                min="-100"
                max="100"
                value={brightnessValue}
                onChange={(e) => setBrightnessValue(parseInt(e.target.value))}
                className="w-full"
              />
            </div>
            <button
              onClick={() => onBrightness(brightnessValue)}
              className="w-full px-3 py-1 bg-blue-500 text-white rounded text-sm"
            >
              Apply
            </button>
          </div>
        )}

        {activeToolType === 'contrast' && (
          <div className="p-2 bg-gray-100 rounded space-y-2">
            <div>
              <div className="flex justify-between">
                <label className="text-xs text-gray-600">Contrast</label>
                <span className="text-xs font-medium">{contrastValue}</span>
              </div>
              <input
                type="range"
                min="-100"
                max="100"
                value={contrastValue}
                onChange={(e) => setContrastValue(parseInt(e.target.value))}
                className="w-full"
              />
            </div>
            <button
              onClick={() => onContrast(contrastValue)}
              className="w-full px-3 py-1 bg-blue-500 text-white rounded text-sm"
            >
              Apply
            </button>
          </div>
        )}
      </div>
    );
  }

  // Desktop layout
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium">Editing Tools</h3>

      {/* Crop Tool */}
      <div className="space-y-2">
        <button
          onClick={() => handleToolSelect('crop')}
          className={`w-full px-4 py-2 text-left rounded ${
            activeToolType === 'crop' ? 'bg-blue-100 border border-blue-300' : 'bg-gray-100 hover:bg-gray-200'
          }`}
        >
          Crop
        </button>
        {activeToolType === 'crop' && (
          <div className="p-3 bg-gray-100 rounded space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-sm text-gray-600">X</label>
                <input
                  type="number"
                  value={cropParams.x}
                  onChange={(e) => setCropParams({ ...cropParams, x: parseInt(e.target.value) || 0 })}
                  className="w-full p-1 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600">Y</label>
                <input
                  type="number"
                  value={cropParams.y}
                  onChange={(e) => setCropParams({ ...cropParams, y: parseInt(e.target.value) || 0 })}
                  className="w-full p-1 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600">Width</label>
                <input
                  type="number"
                  value={cropParams.width}
                  onChange={(e) => setCropParams({ ...cropParams, width: parseInt(e.target.value) || 0 })}
                  className="w-full p-1 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600">Height</label>
                <input
                  type="number"
                  value={cropParams.height}
                  onChange={(e) => setCropParams({ ...cropParams, height: parseInt(e.target.value) || 0 })}
                  className="w-full p-1 border rounded"
                />
              </div>
            </div>
            <button
              onClick={() => onCrop(cropParams)}
              className="w-full px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Apply Crop
            </button>
          </div>
        )}
      </div>

      {/* Rotate Tool */}
      <div className="space-y-2">
        <button
          onClick={() => handleToolSelect('rotate')}
          className={`w-full px-4 py-2 text-left rounded ${
            activeToolType === 'rotate' ? 'bg-blue-100 border border-blue-300' : 'bg-gray-100 hover:bg-gray-200'
          }`}
        >
          Rotate
        </button>
        {activeToolType === 'rotate' && (
          <div className="p-3 bg-gray-100 rounded space-y-3">
            <div>
              <label className="block text-sm text-gray-600">Angle (degrees)</label>
              <input
                type="number"
                value={rotateAngle}
                onChange={(e) => setRotateAngle(parseInt(e.target.value) || 0)}
                className="w-full p-1 border rounded"
              />
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => {
                  setRotateAngle(-90);
                  onRotate(-90);
                }}
                className="flex-1 px-2 py-1 bg-gray-200 rounded hover:bg-gray-300"
              >
                -90°
              </button>
              <button
                onClick={() => {
                  setRotateAngle(90);
                  onRotate(90);
                }}
                className="flex-1 px-2 py-1 bg-gray-200 rounded hover:bg-gray-300"
              >
                +90°
              </button>
              <button
                onClick={() => {
                  setRotateAngle(180);
                  onRotate(180);
                }}
                className="flex-1 px-2 py-1 bg-gray-200 rounded hover:bg-gray-300"
              >
                180°
              </button>
            </div>
            <button
              onClick={() => onRotate(rotateAngle)}
              className="w-full px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Apply Rotation
            </button>
          </div>
        )}
      </div>

      {/* Brightness Tool */}
      <div className="space-y-2">
        <button
          onClick={() => handleToolSelect('brightness')}
          className={`w-full px-4 py-2 text-left rounded ${
            activeToolType === 'brightness' ? 'bg-blue-100 border border-blue-300' : 'bg-gray-100 hover:bg-gray-200'
          }`}
        >
          Brightness
        </button>
        {activeToolType === 'brightness' && (
          <div className="p-3 bg-gray-100 rounded space-y-3">
            <div>
              <label className="block text-sm text-gray-600">
                Brightness: {brightnessValue}
              </label>
              <input
                type="range"
                min="-100"
                max="100"
                value={brightnessValue}
                onChange={(e) => setBrightnessValue(parseInt(e.target.value))}
                className="w-full"
              />
            </div>
            <button
              onClick={() => onBrightness(brightnessValue)}
              className="w-full px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Apply Brightness
            </button>
          </div>
        )}
      </div>

      {/* Contrast Tool */}
      <div className="space-y-2">
        <button
          onClick={() => handleToolSelect('contrast')}
          className={`w-full px-4 py-2 text-left rounded ${
            activeToolType === 'contrast' ? 'bg-blue-100 border border-blue-300' : 'bg-gray-100 hover:bg-gray-200'
          }`}
        >
          Contrast
        </button>
        {activeToolType === 'contrast' && (
          <div className="p-3 bg-gray-100 rounded space-y-3">
            <div>
              <label className="block text-sm text-gray-600">
                Contrast: {contrastValue}
              </label>
              <input
                type="range"
                min="-100"
                max="100"
                value={contrastValue}
                onChange={(e) => setContrastValue(parseInt(e.target.value))}
                className="w-full"
              />
            </div>
            <button
              onClick={() => onContrast(contrastValue)}
              className="w-full px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Apply Contrast
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default EditingTools;