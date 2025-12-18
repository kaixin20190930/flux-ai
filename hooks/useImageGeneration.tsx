/**
 * 图片生成 Hook V2 - 新积分系统
 * 简化版本，所有积分逻辑在 Worker 中处理
 */

import {useState, useEffect, useCallback} from 'react';
import {useRouter} from "next/navigation";

const WORKER_URL = process.env.NODE_ENV === 'production'
    ? 'https://flux-ai-worker.liukai19911010.workers.dev'
    : process.env.NEXT_PUBLIC_WORKER_URL || 'http://localhost:8787';

// 生成并缓存指纹哈希
const getOrCreateFingerprint = (): string => {
    try {
        // 尝试从 localStorage 获取
        const cached = localStorage.getItem('browser_fingerprint');
        if (cached) {
            return cached;
        }
        
        // 生成新的指纹
        const nav = navigator;
        const screen = window.screen;
        const fingerprint = `${nav.userAgent}-${nav.language}-${screen.colorDepth}-${screen.width}x${screen.height}`;
        const hash = btoa(fingerprint).substring(0, 32);
        
        // 存储到 localStorage
        localStorage.setItem('browser_fingerprint', hash);
        return hash;
    } catch (error) {
        console.error('Failed to generate fingerprint:', error);
        return 'default-fingerprint';
    }
};

export const useImageGeneration = (locale: string) => {
    const router = useRouter();
    const [state, setState] = useState({
        prompt: '',
        generatedImage: null as string | null,
        isLoading: false,
        error: null as string | null,
        freeGenerationsRemaining: 1, // 每天 1 次
        isLoggedIn: false,
        userPoints: null as number | null,
        userId: null as string | null,
        selectedModel: 'flux-schnell',
        aspectRatio: '1:1',
        outputFormat: 'jpg',
        imageDimensions: null as { width: number; height: number } | null
    });

    const fetchGenerationData = useCallback(async () => {
        try {
            const token = localStorage.getItem('auth_token');
            const headers: HeadersInit = {};
            
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }
            
            // 使用缓存的指纹哈希
            const fingerprintHash = getOrCreateFingerprint();
            if (fingerprintHash) {
                headers['x-fingerprint-hash'] = fingerprintHash;
            }
            
            console.log('🔍 Fetching generation status with fingerprint:', fingerprintHash.substring(0, 10) + '...');
            
            const response = await fetch(`${WORKER_URL}/generation/status`, { headers });
            
            if (!response.ok) {
                console.error('Failed to fetch generation data');
                return;
            }
            
            const result = await response.json() as any;
            
            console.log('📊 Status response:', result);
            
            if (result.success && result.data) {
                setState(prev => ({
                    ...prev,
                    freeGenerationsRemaining: result.data.freeGenerationsRemaining,
                    isLoggedIn: result.data.isLoggedIn,
                    userPoints: result.data.userPoints,
                    userId: result.data.userId
                }));
            }
        } catch (error) {
            console.error('Error fetching generation data:', error);
        }
    }, []);

    const handleGenerate = useCallback(async () => {
        if (!state.prompt.trim()) {
            setState(prev => ({...prev, error: 'Please enter a prompt'}));
            return;
        }

        setState(prev => ({...prev, isLoading: true, error: null}));

        try {
            const token = localStorage.getItem('auth_token');
            const headers: HeadersInit = {
                'Content-Type': 'application/json',
            };
            
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            // 使用缓存的指纹哈希
            const fingerprintHash = getOrCreateFingerprint();
            if (fingerprintHash) {
                headers['x-fingerprint-hash'] = fingerprintHash;
            }

            const requestBody = {
                prompt: state.prompt,
                model: state.selectedModel,
                aspectRatio: state.aspectRatio,
                format: state.outputFormat,
            };

            console.log('🚀 Sending generation request:', {
                hasToken: !!token,
                hasFingerprintHash: !!fingerprintHash,
                model: state.selectedModel,
                promptLength: state.prompt.length
            });

            const response = await fetch('/api/generate', {
                method: 'POST',
                headers,
                body: JSON.stringify(requestBody)
            });

            const data = await response.json() as any;

            if (!response.ok) {
                const errorMessage = data.error || 'Failed to generate image';
                console.error('❌ Generation failed:', {
                    status: response.status,
                    statusText: response.statusText,
                    error: errorMessage,
                    data
                });
                throw new Error(errorMessage);
            }

            console.log('✅ Generation successful:', {
                hasImage: !!data.image,
                usedFreeTier: data.usedFreeTier,
                freeGenerationsRemaining: data.freeGenerationsRemaining,
                userPoints: data.userPoints
            });

            setState(prev => ({
                ...prev,
                generatedImage: data.image,
                freeGenerationsRemaining: data.freeGenerationsRemaining !== undefined 
                    ? data.freeGenerationsRemaining 
                    : prev.freeGenerationsRemaining,
                userPoints: data.userPoints !== null ? data.userPoints : prev.userPoints,
            }));
            
            // 刷新状态
            await fetchGenerationData();
            
        } catch (error) {
            setState(prev => ({
                ...prev,
                error: error instanceof Error ? error.message : 'Failed to generate image'
            }));
        } finally {
            setState(prev => ({...prev, isLoading: false}));
        }
    }, [state.prompt, state.selectedModel, state.aspectRatio, state.outputFormat, fetchGenerationData]);

    const handleDownload = useCallback(() => {
        if (state.generatedImage) {
            const link = document.createElement('a');
            link.href = state.generatedImage;
            link.download = `generated-image.${state.outputFormat}`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    }, [state.generatedImage, state.outputFormat]);

    const updateState = useCallback((updates: any) => {
        setState(prev => ({...prev, ...updates}));
    }, []);

    useEffect(() => {
        fetchGenerationData();
    }, [fetchGenerationData]);

    return {
        state,
        updateState,
        handleGenerate,
        handleDownload,
        fetchGenerationData
    };
};
