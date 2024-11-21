// app/lib/hooks/useAutoLogout.ts

'use client';

import {useEffect, useCallback, useState} from 'react';
import {useRouter, usePathname} from 'next/navigation';
import {AUTH_CONFIG} from '@/config/authLogout';
import AuthEventEmitter from '../events/authEvents';

interface AutoLogoutConfig {
    timeoutDuration?: number;
    warningDuration?: number;
    isEnabled?: boolean;
    onLogout?: () => void;
    onWarning?: () => void;
    onTimerReset?: () => void;
    whitelistRoutes?: string[];
}

export const useAutoLogout = (locale: string, {
    timeoutDuration = AUTH_CONFIG.timeout.duration,
    warningDuration = AUTH_CONFIG.timeout.warning,
    isEnabled = true,
    onLogout,
    onWarning,
    onTimerReset,
    whitelistRoutes = AUTH_CONFIG.whitelistRoutes
}: AutoLogoutConfig) => {
    const router = useRouter();
    const pathname = usePathname();
    const [lastActivity, setLastActivity] = useState<number>(Date.now());
    const [showWarning, setShowWarning] = useState(false);

    const resetTimer = useCallback(() => {
        setLastActivity(Date.now());
        setShowWarning(false);
        onTimerReset?.();
    }, [onTimerReset]);

    const handleLogout = useCallback(() => {
        onLogout?.();
        setShowWarning(false);
        localStorage.removeItem('token');
        localStorage.removeItem('user'); // 确保移除用户信息
        AuthEventEmitter.emit(); // 触发登出事件
        router.push(`/${locale}/auth`);
    }, [onLogout, router]);


    const isWhitelistedRoute = useCallback(() => {
        if (!pathname) return true; // 如果pathname未定义，默认当作白名单路由
        return whitelistRoutes?.some(route => pathname.startsWith(route));
    }, [whitelistRoutes, pathname]);

    // 监听用户活动
    useEffect(() => {
        // 确保代码只在客户端运行
        if (typeof window === 'undefined') return;

        if (!isEnabled || isWhitelistedRoute()) return;

        const activities = [
            'mousedown',
            'keydown',
            'scroll',
            'mousemove',
            'click',
            'touchstart'
        ];

        const handleActivity = () => {
            resetTimer();
        };

        activities.forEach(event => {
            window.addEventListener(event, handleActivity);
        });

        return () => {
            activities.forEach(event => {
                window.removeEventListener(event, handleActivity);
            });
        };
    }, [isEnabled, isWhitelistedRoute, resetTimer]);

    // 检查超时
    useEffect(() => {
        // 确保代码只在客户端运行
        if (typeof window === 'undefined') return;

        if (!isEnabled || isWhitelistedRoute()) return;

        const checkInterval = setInterval(() => {
            const currentTime = Date.now();
            const timeSinceLastActivity = currentTime - lastActivity;

            if (timeSinceLastActivity >= timeoutDuration) {
                handleLogout();
            } else if (timeSinceLastActivity >= (timeoutDuration - warningDuration) && !showWarning) {
                setShowWarning(true);
                onWarning?.();
            }
        }, 1000);

        return () => clearInterval(checkInterval);
    }, [
        isEnabled,
        lastActivity,
        timeoutDuration,
        warningDuration,
        showWarning,
        handleLogout,
        isWhitelistedRoute,
        onWarning
    ]);

    return {
        showWarning,
        resetTimer,
        lastActivity,
        timeRemaining: Math.max(0, timeoutDuration - (Date.now() - lastActivity)),
        handleLogout
    };
};