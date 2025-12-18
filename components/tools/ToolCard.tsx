'use client'

import React from 'react';
import Link from 'next/link';
import { type ToolConfig } from '@/config/tools';
import { useTool } from '@/hooks/useTools';

interface ToolCardProps {
  tool: ToolConfig;
  showUsage?: boolean;
  compact?: boolean;
}

const ToolCard: React.FC<ToolCardProps> = ({ 
  tool, 
  showUsage = false, 
  compact = false 
}) => {
  const { 
    userUsage, 
    dailyUsage, 
    canUse, 
    pointsCost, 
    isFree,
    getUsageTips 
  } = useTool(tool.id);

  const usageTips = getUsageTips();

  return (
    <div className={`bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 ${
      compact ? 'p-4' : 'p-6'
    } ${!tool.isEnabled ? 'opacity-50' : ''}`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <span className="text-2xl">{tool.icon}</span>
          <div>
            <h3 className={`font-semibold text-gray-900 ${compact ? 'text-lg' : 'text-xl'}`}>
              {tool.name}
            </h3>
            <p className="text-sm text-gray-500">{tool.category}</p>
          </div>
        </div>
        
        {/* Status badges */}
        <div className="flex flex-col items-end space-y-1">
          {isFree ? (
            <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
              Free
            </span>
          ) : (
            <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
              {pointsCost} points
            </span>
          )}
          
          {!tool.isEnabled && (
            <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded-full">
              Coming Soon
            </span>
          )}
        </div>
      </div>

      {/* Description */}
      <p className={`text-gray-600 mb-4 ${compact ? 'text-sm' : ''}`}>
        {tool.description}
      </p>

      {/* Features */}
      {!compact && tool.features && tool.features.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Features:</h4>
          <div className="flex flex-wrap gap-1">
            {tool.features.slice(0, 3).map((feature, index) => (
              <span 
                key={index}
                className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded"
              >
                {feature}
              </span>
            ))}
            {tool.features.length > 3 && (
              <span className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
                +{tool.features.length - 3} more
              </span>
            )}
          </div>
        </div>
      )}

      {/* Usage information */}
      {showUsage && userUsage && (
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Your Usage:</h4>
          <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
            <div>Today: {dailyUsage.current}/{dailyUsage.limit > 0 ? dailyUsage.limit : '∞'}</div>
            <div>Total: {userUsage.totalUsage}</div>
            <div>Points spent: {userUsage.totalPointsSpent}</div>
            <div>Last used: {userUsage.lastUsed ? new Date(userUsage.lastUsed).toLocaleDateString() : 'Never'}</div>
          </div>
        </div>
      )}

      {/* Usage tips */}
      {!compact && usageTips.length > 0 && (
        <div className="mb-4">
          <details className="group">
            <summary className="text-sm font-medium text-gray-700 cursor-pointer hover:text-gray-900">
              Usage Tips
            </summary>
            <ul className="mt-2 text-xs text-gray-600 space-y-1">
              {usageTips.map((tip, index) => (
                <li key={index} className="flex items-start">
                  <span className="text-blue-500 mr-1">•</span>
                  {tip}
                </li>
              ))}
            </ul>
          </details>
        </div>
      )}

      {/* Limitations */}
      {!compact && tool.limitations && tool.limitations.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-orange-700 mb-1">Limitations:</h4>
          <ul className="text-xs text-orange-600 space-y-1">
            {tool.limitations.map((limitation, index) => (
              <li key={index} className="flex items-start">
                <span className="text-orange-500 mr-1">⚠</span>
                {limitation}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Action button */}
      <div className="flex items-center justify-between">
        {tool.isEnabled ? (
          <Link
            href={tool.route}
            className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white transition-colors duration-200 ${
              canUse 
                ? 'bg-indigo-600 hover:bg-indigo-700 focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500' 
                : 'bg-gray-400 cursor-not-allowed'
            }`}
            onClick={(e) => {
              if (!canUse) {
                e.preventDefault();
              }
            }}
          >
            {isFree ? 'Use Free' : `Use (${pointsCost} pts)`}
          </Link>
        ) : (
          <button 
            disabled 
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-500 bg-gray-100 cursor-not-allowed"
          >
            Coming Soon
          </button>
        )}

        {/* Processing time indicator */}
        {tool.estimatedProcessingTime && (
          <span className="text-xs text-gray-500">
            ~{tool.estimatedProcessingTime}s
          </span>
        )}
      </div>

      {/* Usage limit warning */}
      {dailyUsage.limit > 0 && dailyUsage.current >= dailyUsage.limit && (
        <div className="mt-3 p-2 bg-orange-50 border border-orange-200 rounded-md">
          <p className="text-xs text-orange-700">
            Daily usage limit reached. Try again tomorrow.
          </p>
        </div>
      )}
    </div>
  );
};

export default ToolCard;