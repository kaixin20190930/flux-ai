'use client'
import React from 'react';
import Link from 'next/link';
import {Crown} from 'lucide-react';
import {useImageGeneration} from '@/hooks/useImageGeneration';
import {useAuth} from '@/lib/auth-context';
import {
    MODEL_CONFIG,
    ICON_COMPONENTS,
    ASPECT_RATIOS,
    OUTPUT_FORMATS,
} from '@/public/constants/constants';
import { getModelPoints } from '@/utils/pointsSystem';
import type {ModelType} from '@/public/types/type';
import ImagePreview from "@/components/ImagePreview";
interface AIImageGeneratorProps {
    dictionary: any;
    locale: string
}

export const AIImageGenerator: React.FC<AIImageGeneratorProps> = ({dictionary, locale}) => {
    const {
        state,
        updateState,
        handleGenerate,
        handleDownload,
    } = useImageGeneration(locale);
    
    // Use new Cloudflare auth system
    const { user, isAuthenticated, isLoading: authLoading } = useAuth();
    const isLoggedIn = isAuthenticated;
    const userPoints = user?.points || 0;

    // Sync auth state to useImageGeneration
    React.useEffect(() => {
        if (!authLoading) {
            updateState({
                isLoggedIn,
                userPoints,
                userId: user?.id || null
            });
        }
    }, [isLoggedIn, userPoints, user?.id, authLoading, updateState]);

    // Show loading state while auth is loading
    if (authLoading) {
        return (
            <div className="h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 text-white flex items-center justify-center">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-white/80">Loading AI Image Generator...</p>
                </div>
            </div>
        );
    }

    const isButtonDisabled = (): boolean => {
        const model = state.selectedModel as ModelType;
        const requiredPoints = getModelPoints(model);
        
        // 新规则：未登录用户可以使用免费额度
        if (!isLoggedIn) {
            // 未登录用户只能用 flux-schnell
            if (model !== 'flux-schnell') {
                return true;
            }
            // 检查是否还有免费额度
            if (state.freeGenerationsRemaining <= 0) {
                return true;
            }
        } else {
            // 登录用户检查积分
            if (userPoints !== null && userPoints < requiredPoints) {
                return true;
            }
        }
        
        return Boolean(
            state.isLoading ||
            authLoading ||
            !state.prompt
        );
    };

    const getButtonText = (): string => {
        if (state.isLoading || authLoading) {
            return dictionary.imageGenerator.generatingButton;
        }
        
        const model = state.selectedModel as ModelType;
        const requiredPoints = getModelPoints(model);
        
        if (!isLoggedIn) {
            // 未登录用户
            if (model !== 'flux-schnell') {
                return '🔒 Premium Model - Sign Up Required';
            }
            if (state.freeGenerationsRemaining <= 0) {
                return '✨ Sign Up to Get 3 Credits';
            }
            return `🎨 Generate (${state.freeGenerationsRemaining} free left)`;
        }
        
        // 登录用户
        if (userPoints !== null && userPoints < requiredPoints) {
            return dictionary.imageGenerator.insufficientPoints;
        }
        
        return dictionary.imageGenerator.generateButton;
    };

    return (
        <div
            className="h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 text-white flex items-center justify-center px-4 pb-8 lg:overflow-hidden relative">
            <div className="absolute inset-0 bg-black opacity-50"/>
            <div
                className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]"/>

            <div className="container mx-auto z-10 max-w-7xl h-full flex flex-col lg:overflow-hidden overflow-auto"
                 style={{paddingTop: '2rem', paddingBottom: '2rem'}}>
                {/* Header */}
                <div className="pb-6 text-center">
                    <h1 className="text-4xl md:text-5xl font-bold animate-fade-in-down mb-3">
                        {dictionary.imageGenerator.pageTitle}
                    </h1>
                    <p className="text-lg md:text-xl text-white/80">
                        {dictionary.imageGenerator.description}
                    </p>
                </div>

                {/* Main Content - Left-Right Layout */}
                <div className="flex-grow flex flex-col lg:flex-row gap-6 lg:min-h-0">
                    {/* Left Column - Controls */}
                    <div className="w-full lg:w-1/2 space-y-4 border rounded-lg border-gray-100 p-4 lg:p-6">{/* 移除 overflow-y-auto */}
                        {/* Prompt Input */}
                        <div className="space-y-1.5">
                            <h1 className="text-2xl lg:text-3xl font-medium text-white/90">
                                {dictionary.imageGenerator.title}
                            </h1>
                            <label className="text-sm font-medium text-white/90">
                                {dictionary.imageGenerator.promptLabel}
                            </label>
                            <textarea
                                value={state.prompt}
                                onChange={(e) => updateState({prompt: e.target.value})}
                                placeholder={dictionary.imageGenerator.promptPlaceholder}
                                className="w-full h-64 p-4 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/50 text-white placeholder-white/50 resize-none"
                            />
                        </div>

                        {/* Model Selection */}
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-white/90">
                                {dictionary.imageGenerator.modelLabel}
                            </label>
                            <div className="relative">
                                <select
                                    value={state.selectedModel}
                                    onChange={(e) => updateState({selectedModel: e.target.value as ModelType})}
                                    className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white/50 transition-colors"
                                >
                                    {Object.entries(MODEL_CONFIG).map(([key, config]) => (
                                        <option key={key} value={key}
                                                className={config.isPremium ? 'text-yellow-300' : ''}>
                                            {config.name} • {config.points} {config.points === 1 ? dictionary.imageGenerator.modelPoints : dictionary.imageGenerator.modelPoints + 's'}
                                            {config.isPremium ? ` (${dictionary.imageGenerator.modelPremium})` : ''}
                                        </option>
                                    ))}
                                </select>
                                <div className="mt-2 text-xs text-white/60 flex items-center gap-2">
                                    {React.createElement(
                                        ICON_COMPONENTS[MODEL_CONFIG[state.selectedModel as keyof typeof MODEL_CONFIG].icon as keyof typeof ICON_COMPONENTS],
                                        {
                                            className: `w-4 h-4 ${MODEL_CONFIG[state.selectedModel as keyof typeof MODEL_CONFIG].isPremium ? 'text-yellow-300' : 'text-white/60'}`
                                        }
                                    )}
                                    <span>{MODEL_CONFIG[state.selectedModel as keyof typeof MODEL_CONFIG].description}</span>
                                </div>
                            </div>
                        </div>

                        {/* Aspect Ratio and Output Format */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-white/90">
                                    {dictionary.imageGenerator.aspectRatioLabel}
                                </label>
                                <select
                                    value={state.aspectRatio}
                                    onChange={(e) => updateState({aspectRatio: e.target.value})}
                                    className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white/50 transition-colors"
                                >
                                    {ASPECT_RATIOS.map(ratio => (
                                        <option key={ratio.value} value={ratio.value}>{ratio.label}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-white/90">
                                    {dictionary.imageGenerator.outputFormatLabel}
                                </label>
                                <select
                                    value={state.outputFormat}
                                    onChange={(e) => updateState({outputFormat: e.target.value})}
                                    className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white/50 transition-colors"
                                >
                                    {OUTPUT_FORMATS.filter(format => {
                                        if (state.selectedModel === 'flux-1.1-pro-ultra') {
                                            return ['jpg', 'png'].includes(format.value);
                                        }
                                        return true;
                                    }).map(format => (
                                        <option key={format.value} value={format.value}>{format.label}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Generate Button */}
                        <button
                            onClick={handleGenerate}
                            disabled={isButtonDisabled()}
                            className="w-full py-4 bg-white text-indigo-600 rounded-lg font-semibold hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-indigo-600 disabled:bg-white/50 disabled:text-indigo-400 transition duration-300 ease-in-out transform hover:scale-105 flex items-center justify-center gap-2"
                        >
                            {state.isLoading && (
                                <div className="w-5 h-5 border-2 border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin mr-2"></div>
                            )}
                            {getButtonText()}
                            {MODEL_CONFIG[state.selectedModel as keyof typeof MODEL_CONFIG].isPremium &&
                                (!isLoggedIn || (userPoints !== null && userPoints < MODEL_CONFIG[state.selectedModel as keyof typeof MODEL_CONFIG].points)) && (
                                    <Crown className="w-4 h-4 text-indigo-400"/>
                                )}
                        </button>

                        {/* Status Messages */}
                        {state.error && (
                            <div className="text-red-300 px-4 py-3 bg-red-500/10 rounded-lg border border-red-500/20">
                                <p className="font-medium mb-1">⚠️ Error</p>
                                <p className="text-sm">{state.error || dictionary.imageGenerator.error}</p>
                            </div>
                        )}
                        
                        {/* Credits/Points Display - 简化版 */}
                        <div className="text-indigo-200 px-3 py-2 bg-indigo-500/10 rounded-lg">
                            {authLoading ? (
                                <p className="text-sm">Loading...</p>
                            ) : isLoggedIn ? (
                                // 登录用户：显示积分
                                <div className="space-y-1">
                                    <p className="flex items-center justify-between text-sm">
                                        <span className="truncate">
                                            💎 {dictionary.imageGenerator.points}: {userPoints || 0}
                                        </span>
                                        <span className="text-xs opacity-75 ml-2 flex-shrink-0">
                                            ({getModelPoints(state.selectedModel)} pts)
                                        </span>
                                    </p>
                                    {userPoints !== null && userPoints < getModelPoints(state.selectedModel) && (
                                        <p className="mt-2 text-yellow-300 text-xs break-words">
                                            ⚠️ {dictionary.imageGenerator.insufficientPoints}
                                            <Link href={`/${locale}/pricing`} className="ml-1 underline hover:text-white font-medium">
                                                {dictionary.imageGenerator.purchasePoints}
                                            </Link>
                                        </p>
                                    )}
                                </div>
                            ) : (
                                // 未登录用户：只显示免费额度（注册激励移到右侧）
                                <div className="space-y-1">
                                    <p className="flex items-center justify-between text-sm">
                                        <span className="truncate">
                                            🎁 Free today: {state.freeGenerationsRemaining} / 1
                                        </span>
                                    </p>
                                    {state.freeGenerationsRemaining > 0 ? (
                                        <p className="text-xs text-green-300">
                                            ✨ Try it free! No signup required.
                                        </p>
                                    ) : (
                                        <p className="text-xs text-yellow-300">
                                            ⏰ Daily limit reached. Sign up for more!
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Column - Image Preview */}
                    <div className="w-full lg:w-1/2 h-full lg:overflow-auto border rounded-lg border-gray-200 p-6 flex flex-col relative">
                        <ImagePreview
                            isLoading={state.isLoading}
                            generatedImage={state.generatedImage}
                            aspectRatio={state.aspectRatio}
                            selectedModel={state.selectedModel as any}
                            modelConfig={MODEL_CONFIG[state.selectedModel as keyof typeof MODEL_CONFIG]}
                            outputFormat={state.outputFormat}
                            onDownload={handleDownload}
                            imageDimensions={state.imageDimensions}
                            dictionary={dictionary}
                        />
                        
                        {/* 浮动注册激励卡片 - 仅未登录用户显示 */}
                        {!isLoggedIn && !authLoading && (
                            <div className="absolute bottom-6 right-6 max-w-xs animate-fade-in">
                                <div className="bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl shadow-2xl p-4 border-2 border-white/20 backdrop-blur-sm">
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex items-center gap-2">
                                            <span className="text-2xl">🎁</span>
                                            <h3 className="text-white font-bold text-base">New User Bonus</h3>
                                        </div>
                                    </div>
                                    
                                    <div className="space-y-2 mb-4">
                                        <div className="flex items-center gap-2 text-white/90 text-sm">
                                            <span className="text-yellow-300">✨</span>
                                            <span>3 bonus credits instantly</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-white/90 text-sm">
                                            <span className="text-yellow-300">🚀</span>
                                            <span>Access premium models</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-white/90 text-sm">
                                            <span className="text-yellow-300">💾</span>
                                            <span>Save your history</span>
                                        </div>
                                    </div>
                                    
                                    <Link 
                                        href={`/${locale}/auth`}
                                        className="block w-full py-2.5 px-4 bg-white text-purple-600 text-center rounded-lg font-bold hover:bg-purple-50 transition-all transform hover:scale-105 shadow-lg text-sm"
                                    >
                                        Sign Up Free →
                                    </Link>
                                    
                                    <p className="text-white/70 text-xs text-center mt-2">
                                        No credit card required
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};