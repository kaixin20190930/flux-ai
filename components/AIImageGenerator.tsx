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
    MAX_DAILY_GENERATIONS
} from '@/public/constants/constants';
import type {ModelType} from '@/public/types/type';
import ImagePreview from "@/components/ImagePreview";

export const AIImageGenerator: React.FC = () => {
    const {
        state,
        updateState,
        handleGenerate,
        handleDownload
    } = useImageGeneration();

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
        <section
            className="h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 text-white flex items-center justify-center px-4 pb-8 overflow-hidden relative">
            <div className="absolute inset-0 bg-black opacity-50"/>
            <div
                className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]"/>

            <div className="container mx-auto z-10 max-w-6xl h-full flex flex-col"
                 style={{paddingTop: '2rem', paddingBottom: '2rem'}}>
                {/* Header */}
                {/*<div className="mb-2">*/}
                {/*    <h1 className="text-3xl md:text-4xl font-bold text-center mb-2 animate-fade-in-down">*/}
                {/*        Create Stunning Images with Flux AI*/}
                {/*    </h1>*/}
                {/*    <p className="text-base md:text-lg text-center text-white/80">*/}
                {/*        Transform your ideas into visual masterpieces in seconds*/}
                {/*    </p>*/}
                {/*</div>*/}
                <div className="pt-8 pb-6 text-center">
                    <h1 className="text-4xl md:text-5xl font-bold animate-fade-in-down mb-3">
                        Create Stunning Images with Flux AI
                    </h1>
                    <p className="text-lg md:text-xl text-white/80">
                        Transform your ideas into visual masterpieces in seconds
                    </p>
                </div>

                {/* Main Content */}
                <div className="flex-grow flex flex-col">
                    {/*<div className="space-y-4">*/}
                    <div className="space-y-6 pb-6">
                        {/* Prompt Input and Generate Button */}
                        {/*<div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">*/}
                        <div className="flex flex-col md:flex-row gap-4">

                            <input
                                type="text"
                                value={state.prompt}
                                onChange={(e) => updateState({prompt: e.target.value})}
                                placeholder="Try: A majestic lion sitting on a mountain peak at sunset..."
                                className="flex-grow p-3 md:p-4 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/50 text-white placeholder-white/50"
                            />
                            <button
                                onClick={handleGenerate}
                                disabled={isButtonDisabled()}
                                className="px-6 py-3 md:px-8 md:py-4 bg-white text-indigo-600 rounded-lg font-semibold hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-indigo-600 disabled:bg-white/50 disabled:text-indigo-400 transition duration-300 ease-in-out transform hover:scale-105 flex items-center gap-2"
                            >
                                {state.isLoading ? 'Generating...' : 'Generate Image'}
                                {MODEL_CONFIG[state.selectedModel].isPremium &&
                                    (!state.isLoggedIn || (state.userPoints !== null && state.userPoints < MODEL_CONFIG[state.selectedModel].points)) && (
                                        <Crown className="w-4 h-4 text-indigo-400"/>
                                    )}
                            </button>
                        </div>

                        {/* Controls Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-white/90">AI Model</label>
                                <div className="relative"> {/* 添加相对定位容器 */}
                                    <select
                                        value={state.selectedModel}
                                        onChange={(e) => updateState({selectedModel: e.target.value as ModelType})}
                                        className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white/50 transition-colors"
                                    >
                                        {Object.entries(MODEL_CONFIG).map(([key, config]) => (
                                            <option
                                                key={key}
                                                value={key}
                                                className={config.isPremium ? 'text-yellow-300' : ''}
                                            >
                                                {config.name} • {config.points} {config.points === 1 ? 'Point' : 'Points'}
                                                {config.isPremium ? ' (Premium)' : ''}
                                            </option>
                                        ))}
                                    </select>
                                    <div
                                        className="mt-2 text-xs text-white/60 flex items-center gap-2">
                                        {/* 使用 ICON_COMPONENTS 来渲染图标 */}
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

                            {/* Aspect Ratio Selection */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-white/90">Aspect Ratio</label>
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

                            {/* Output Format Selection */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-white/90">Output Format</label>
                                <select
                                    value={state.outputFormat}
                                    onChange={(e) => updateState({outputFormat: e.target.value})}
                                    className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white/50 transition-colors"
                                >
                                    {OUTPUT_FORMATS.map(format => (
                                        <option key={format.value} value={format.value}>{format.label}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Status Messages */}
                        <div className="flex flex-col md:flex-row gap-4">
                            <div className="flex-grow">
                                {state.error && (
                                    <div className="text-red-300 px-4 py-2 bg-red-500/10 rounded-lg">
                                        <p>{state.error}</p>
                                    </div>
                                )}
                            </div>
                            <div className="text-indigo-200 px-4 py-2 bg-indigo-500/10 rounded-lg whitespace-nowrap">
                                <p>
                                    Free generations: {state.remainingFreeGenerations} / {MAX_DAILY_GENERATIONS}
                                    {state.isLoggedIn && state.userPoints !== null && (
                                        <span className="ml-4">Points: {state.userPoints}</span>
                                    )}
                                </p>
                                {state.remainingFreeGenerations <= 0 && !state.isLoggedIn && (
                                    <p className="mt-1">
                                        <Link href="/auth" className="underline hover:text-white">Login</Link> for more
                                        generations
                                    </p>
                                )}
                            </div>
                        </div>
                        <div className="flex-grow">
                            <ImagePreview
                                isLoading={state.isLoading}
                                generatedImage={state.generatedImage}
                                aspectRatio={state.aspectRatio}
                                selectedModel={state.selectedModel}
                                modelConfig={MODEL_CONFIG[state.selectedModel]}
                                outputFormat={state.outputFormat}
                                onDownload={handleDownload}
                                imageDimensions={state.imageDimensions}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};