'use client';

import { usePoints } from '@/hooks/usePoints';
import { RefreshCw } from 'lucide-react';

/**
 * PointsBalance Component
 * 
 * Displays user's current points balance with refresh capability
 * Requirements: 8.2, 8.4
 */
export function PointsBalance() {
    const { points, isRefreshing, refreshPoints } = usePoints();

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <div className="text-4xl font-bold text-primary">
                    {points.toLocaleString()}
                </div>
                <button
                    onClick={refreshPoints}
                    disabled={isRefreshing}
                    className="text-indigo-600 hover:text-indigo-800 transition-colors p-2"
                    title="刷新点数"
                >
                    <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
                </button>
            </div>
            <div className="text-sm text-gray-500">
                可用积分
            </div>
        </div>
    );
} 