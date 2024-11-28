'use client'
import React from 'react';
import Link from 'next/link';
import {Crown} from 'lucide-react';
import {useImageGeneration} from '@/hooks/useImageGeneration';
import {
    MODEL_CONFIG,
    ICON_COMPONENTS,
    ASPECT_RATIOS,
    OUTPUT_FORMATS,
    MAX_DAILY_GENERATIONS,
} from '@/public/constants/constants';
import type {ModelType} from '@/public/types/type';
import ImagePreview from "@/components/ImagePreview";
import type {Dictionary} from '@/app/i18n/settings';

interface AIImageGeneratorProps {
    dictionary: Dictionary;
    locale: string
}

export const AIImageGenerator: React.FC<AIImageGeneratorProps> = ({dictionary, locale}) => {
    const {
        state,
        updateState,
        handleGenerate,
        handleDownload,
    } = useImageGeneration(locale);

    const isButtonDisabled = (): boolean => {
        const model = state.selectedModel as ModelType;
        const isPremiumUnavailable = MODEL_CONFIG[model].isPremium &&
            (!state.isLoggedIn || (state.userPoints !== null && state.userPoints < MODEL_CONFIG[model].points));

        return Boolean(
            state.isLoading ||
            !state.prompt ||
            (state.remainingFreeGenerations <= 0 && (state.userPoints === null || state.userPoints <= 0)) ||
            isPremiumUnavailable
        );
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
                    <div className="w-full lg:w-1/2 space-y-6 border rounded-lg border-gray-100 p-6">
                        {/* Prompt Input */}
                        <div className="space-y-2 ">
                            <h1 className="text-3xl font-medium text-white/90">
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
                        <div className="space-y-2 ">
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
                                        ICON_COMPONENTS[MODEL_CONFIG[state.selectedModel].icon],
                                        {
                                            className: `w-4 h-4 ${MODEL_CONFIG[state.selectedModel].isPremium ? 'text-yellow-300' : 'text-white/60'}`
                                        }
                                    )}
                                    <span>{MODEL_CONFIG[state.selectedModel].description}</span>
                                </div>
                            </div>
                        </div>

                        {/* Aspect Ratio and Output Format */}
                        <div className="grid grid-cols-2 gap-4 ">
                            <div className="space-y-2">
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

                            <div className="space-y-2">
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
                            className="w-full py-4 bg-white text-indigo-600 rounded-lg font-semibold hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-indigo-600 disabled:bg-white/50 disabled:text-indigo-400 transition duration-300 ease-in-out transform hover:scale-105 flex items-center justify-center gap-2 "
                        >
                            {state.isLoading ? dictionary.imageGenerator.generatingButton : dictionary.imageGenerator.generateButton}
                            {MODEL_CONFIG[state.selectedModel].isPremium &&
                                (!state.isLoggedIn || (state.userPoints !== null && state.userPoints < MODEL_CONFIG[state.selectedModel].points)) && (
                                    <Crown className="w-4 h-4 text-indigo-400"/>
                                )}
                        </button>

                        {/* Status Messages */}
                        {state.error && (
                            <div className="text-red-300 px-4 py-2 bg-red-500/10 rounded-lg">
                                <p>{state.error || dictionary.imageGenerator.error}</p>
                            </div>
                        )}
                        <div className="text-indigo-200 px-4 py-2 bg-indigo-500/10 rounded-lg">
                            <p>
                                {dictionary.imageGenerator.freeGenerations} {state.remainingFreeGenerations} / {MAX_DAILY_GENERATIONS}
                                {state.isLoggedIn && state.userPoints !== null && (
                                    <span className="ml-4">
                    {dictionary.imageGenerator.points}: {state.userPoints}
                  </span>
                                )}
                            </p>
                            {state.remainingFreeGenerations <= 0 && !state.isLoggedIn && (
                                <p className="mt-1">
                                    <Link href="/auth" className="underline hover:text-white">
                                        {dictionary.imageGenerator.loginForMore}
                                    </Link>
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Right Column - Image Preview */}
                    <div
                        className="w-full lg:w-1/2 h-full lg:overflow-auto border rounded-lg border-gray-200 p-6 flex flex-col">
                        <ImagePreview
                            isLoading={state.isLoading}
                            generatedImage={state.generatedImage}
                            aspectRatio={state.aspectRatio}
                            selectedModel={state.selectedModel}
                            modelConfig={MODEL_CONFIG[state.selectedModel]}
                            outputFormat={state.outputFormat}
                            onDownload={handleDownload}
                            imageDimensions={state.imageDimensions}
                            dictionary={dictionary}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};