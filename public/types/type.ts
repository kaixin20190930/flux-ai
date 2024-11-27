// types.ts

import {ICON_COMPONENTS, MODEL_CONFIG} from "@/public/constants/constants";

export type ModelType = 'flux-1.1-pro-ultra' | 'flux-schnell' | 'flux-dev' | 'flux-1.1-pro' | 'flux-pro';
export type IconName = keyof typeof ICON_COMPONENTS;

export interface ModelConfig {
    name: string;
    points: number;
    description: string;
    icon: IconName;
    isPremium: boolean;
    processingTime: string;
}

export interface AspectRatio {
    value: string;
    label: string;
    description: string;
    width: number;
    height: number;
}

export interface OutputFormat {
    value: string;
    label: string;
    description: string;
    mimeType: string;
}

export interface GenerationData {
    remainingFreeGenerations: number;
    isLoggedIn: boolean;
    userPoints: number;
    userId: string;
}

export interface GenerationState {
    prompt: string;
    generatedImage: string | null;
    isLoading: boolean;
    error: string | null;
    remainingFreeGenerations: number;
    imageDimensions: { width: number; height: number } | null;
    isLoggedIn: boolean;
    userPoints: number | null;
    userId: string | null;
    selectedModel: ModelType;
    aspectRatio: string;
    outputFormat: string;
}

export interface ImagePreviewProps {
    isLoading: boolean;
    generatedImage: string | null;
    aspectRatio: string;
    selectedModel: ModelType;
    modelConfig: ModelConfig;
    outputFormat: string;
    onDownload: () => void;
    imageDimensions: { width: number; height: number } | null;
}
