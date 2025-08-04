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
            const response = await fetch('/api/getRemainingGenerations');
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
            // 使用当前状态中的认证信息，不再重新获取
            if (!state.isLoggedIn) {
                router.push(`/${locale}/auth`);
                return;
            }

            const response = await fetch('/api/generate', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
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
    }, [state.prompt, state.selectedModel, state.aspectRatio, state.outputFormat, locale, router]);

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