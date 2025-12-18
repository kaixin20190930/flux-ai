// hooks/useImageGeneration.tsx
import {useState, useEffect, useCallback} from 'react';
import {
    MAX_DAILY_GENERATIONS,
    MODEL_CONFIG,
    DEFAULTS,
    ERROR_MESSAGES
} from '@/public/constants/constants';
import type {GenerationState, GenerationData} from '@/public/types/type';
import {useRouter} from "next/navigation";



export const useImageGeneration = (locale: string) => {
    const router = useRouter();
    const [state, setState] = useState<GenerationState>({
        prompt: '',
        generatedImage: null,
        isLoading: false,
        error: null,
        remainingFreeGenerations: MAX_DAILY_GENERATIONS,
        imageDimensions: null,
        isLoggedIn: false,
        userPoints: null,
        userId: null,
        selectedModel: DEFAULTS.MODEL,
        aspectRatio: DEFAULTS.ASPECT_RATIO,
        outputFormat: DEFAULTS.OUTPUT_FORMAT
    });

    const fetchGenerationData = useCallback(async () => {
        try {
            // Get JWT token from localStorage
            const token = localStorage.getItem('auth_token');
            
            const headers: HeadersInit = {};
            
            // Add Authorization header if token exists
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }
            
            const response = await fetch('/api/getRemainingGenerations', {
                headers,
            });
            const data: GenerationData = await response.json();

            setState(prev => ({
                ...prev,
                remainingFreeGenerations: data.remainingFreeGenerations,
                isLoggedIn: data.isLoggedIn,
                userPoints: data.userPoints,
                userId: data.userId
            }));
        } catch (error) {
            console.error('Error fetching generation data:', error);
            setState(prev => ({
                ...prev,
                error: ERROR_MESSAGES.NETWORK_ERROR
            }));
        }
    }, []);

    const handleGenerate = useCallback(async () => {
        if (!state.prompt.trim()) {
            setState(prev => ({...prev, error: ERROR_MESSAGES.INVALID_PROMPT}));
            return;
        }

        setState(prev => ({...prev, isLoading: true, error: null}));

        try {
            // Get JWT token from localStorage - check token directly instead of state
            const token = localStorage.getItem('auth_token');
            
            // If no token, redirect to login
            if (!token) {
                setState(prev => ({...prev, isLoading: false}));
                router.push(`/${locale}/auth`);
                return;
            }
            
            const headers: HeadersInit = {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            };

            const response = await fetch('/api/generate', {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    prompt: state.prompt,
                    model: state.selectedModel,
                    aspectRatio: state.aspectRatio,
                    format: state.outputFormat,
                    userPoints: state.userPoints,
                    userId: state.userId
                })
            });

            const data = await response.json() as any;

            if (!response.ok) {
                throw new Error(data.error || ERROR_MESSAGES.GENERATION_FAILED);
            }

            setState(prev => ({
                ...prev,
                generatedImage: data.image,
                remainingFreeGenerations: data.remainingFreeGenerations || prev.remainingFreeGenerations,
                userPoints: data.userPoints || prev.userPoints,
                imageDimensions: data.imageDimensions || null
            }));
        } catch (error) {
            setState(prev => ({
                ...prev,
                error: error instanceof Error ? error.message : ERROR_MESSAGES.GENERATION_FAILED
            }));
        } finally {
            setState(prev => ({...prev, isLoading: false}));
        }
    }, [state.prompt, state.selectedModel, state.aspectRatio, state.outputFormat, state.userPoints, state.userId, locale, router]);

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

    const updateState = useCallback((updates: Partial<GenerationState>) => {
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