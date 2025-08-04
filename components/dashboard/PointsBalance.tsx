'use client';

import { useEffect, useState } from 'react';
import { getUserPoints } from '@/utils/userUtils';
import { Env } from '@/worker/types';

interface PointsBalanceProps {
    points: number;
}

export function PointsBalance({ points }: PointsBalanceProps) {
    return (
        <div className="space-y-2">
            <div className="text-4xl font-bold text-primary">
                {points.toLocaleString()}
            </div>
            <div className="text-sm text-gray-500">
                可用积分
            </div>
        </div>
    );
} 