'use client'

import React, {useState, useCallback} from 'react';
import {
    ASPECT_RATIOS,
    OUTPUT_FORMATS,
} from '@/public/constants/constants';
import ImageUpload from "@/components/ImageUpload";
;

interface ReduxConfig {
    guidance: number;
    megapixels: string;
    num_outputs: number;
    redux_image: string;
    aspect_ratio: string;
    output_format: string;
    output_quality: number;
    num_inference_steps: number;
}

interface ReduxGeneratorProps {
    dictionary: any;
    locale: string;
    config: ReduxConfig;
}

interface ReduxState {
    sourceImage: File | null;
    sourceImagePreview: string | null;
    generatedImage: string | null;
    isLoading: boolean;
    error: string | null;
    outputFormat: string;
    aspectRatio: string;
    guidance: number;
    megapixels: string;
    num_outputs: number;
    output_quality: number;
    num_inference_steps: number;
}

interface ApiResponse {
    image: string;
    error?: string;
}

const ReduxGenerator = ({dictionary, locale, config}: ReduxGeneratorProps) => {
    const [state, setState] = useState<ReduxState>({
        sourceImage: null,
        sourceImagePreview: null,
        generatedImage: null,
        isLoading: false,
        error: null,
        outputFormat: config.output_format || 'png',
        aspectRatio: config.aspect_ratio || '1:1',
        guidance: config.guidance || 3,
        megapixels: config.megapixels || "1",
        num_outputs: config.num_outputs || 1,
        output_quality: config.output_quality || 80,
        num_inference_steps: config.num_inference_steps || 28
    });

    const updateState = (updates: Partial<ReduxState>) => {
        setState(prev => ({...prev, ...updates}));
    };

    const handleImageChange = useCallback((file: File | null, preview: string | null) => {
        if (file && (file.type === 'image/jpg' || file.type === 'image/jpeg' || file.type === 'image/png' || file.type === 'image/webp')) {
            updateState({
                sourceImage: file,
                sourceImagePreview: preview,
                error: null
            });
        } else if (file) {
            updateState({
                error: dictionary.fluxTools.common.invalidFileType
            });
        } else {
            updateState({
                sourceImage: null,
                sourceImagePreview: null
            });
        }
    }, [dictionary]);

    const handleGenerate = async () => {
        if (!state.sourceImage) {
            updateState({error: dictionary.fluxTools.common.noImageError});
            return;
        }

        updateState({isLoading: true, error: null});

        try {
            const formData = new FormData();
            formData.append('image', state.sourceImage);
            formData.append('guidance', state.guidance.toString());
            formData.append('megapixels', state.megapixels);
            formData.append('num_outputs', state.num_outputs.toString());
            formData.append('aspect_ratio', state.aspectRatio);
            formData.append('output_format', state.outputFormat);
            formData.append('output_quality', state.output_quality.toString());
            formData.append('num_inference_steps', state.num_inference_steps.toString());

            const response = await fetch('/api/flux-tools/redux', {
                method: 'POST',
                credentials: 'include',
                body: formData,
                headers: {
                    'Accept': 'application/json'
                }
            } as RequestInit);

            if (!response.ok) {
                throw new Error(dictionary.fluxTools.common.generationError);
            }

            const data = await response.json() as ApiResponse;
            if (data.error) {
                throw new Error(data.error);
            }

            updateState({generatedImage: data.image, isLoading: false});
        } catch (error) {
            updateState({
                error: error instanceof Error ? error.message : dictionary.fluxTools.common.generationError,
                isLoading: false
            });
        }
    };

    const handleDownload = async () => {
        if (!state.generatedImage) return;

        try {
            // 获取图片数据
            const response = await fetch(state.generatedImage);
            const blob = await response.blob();

            // 创建下载链接
            const link = document.createElement('a');
            link.href = state.generatedImage;

            // 设置文件名
            const timestamp = new Date().getTime();
            link.download = `flux-redux-${timestamp}.${state.outputFormat}`;

            // 触发下载
            document.body.appendChild(link);
            link.click();

            // 清理
            document.body.removeChild(link);
        } catch (error) {
            console.error('Download failed:', error);
            updateState({
                error: dictionary.fluxTools.common.generationError
            });
        }
    };

    return (
        <div
            className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 text-white flex items-center justify-center px-4 py-8 relative">
            <div className="absolute inset-0 bg-black opacity-50"/>
            <div
                className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]"/>

            <div className="container mx-auto z-10 max-w-7xl flex flex-col">
                {/* Header */}
                <div className="pb-6 text-center">
                    <h1 className="text-4xl md:text-5xl font-bold animate-fade-in-down mb-3">
                        {dictionary.fluxTools.redux.pageTitle}
                    </h1>
                    <p className="text-lg md:text-xl text-white/80">
                        {dictionary.fluxTools.redux.description}
                    </p>
                </div>

                {/* Main Content */}
                <div className="flex flex-col lg:flex-row gap-6">
                    {/* Left Column - Controls */}
                    <div className="w-full lg:w-1/2 border rounded-lg border-gray-100 p-6">
                        {/* Image Upload Area */}
                        <div>
                            {/*<h1 className="text-3xl font-medium text-white/90">*/}
                            {/*    {dictionary.fluxTools.redux.title}*/}
                            {/*</h1>*/}
                            <ImageUpload onImageChange={handleImageChange}/>
                        </div>

                        {/* Advanced Settings */}
                        <div className="grid grid-cols-2 gap-4 mt-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-white/90">
                                    {dictionary.fluxTools.common.aspectRatioLabel}
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
                                    {dictionary.fluxTools.common.outputFormatLabel}
                                </label>
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

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-white/90">
                                    {dictionary.fluxTools.redux.guidanceLabel}
                                </label>
                                <input
                                    type="number"
                                    value={state.guidance}
                                    onChange={(e) => updateState({guidance: Number(e.target.value)})}
                                    min="1"
                                    max="20"
                                    className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white/50 transition-colors"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-white/90">
                                    {dictionary.fluxTools.redux.outputQualityLabel}
                                </label>
                                <input
                                    type="number"
                                    value={state.output_quality}
                                    onChange={(e) => updateState({output_quality: Number(e.target.value)})}
                                    min="1"
                                    max="100"
                                    className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white/50 transition-colors"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-white/90">
                                    {dictionary.fluxTools.redux.inferenceStepsLabel}
                                </label>
                                <input
                                    type="number"
                                    value={state.num_inference_steps}
                                    onChange={(e) => updateState({num_inference_steps: Number(e.target.value)})}
                                    min="1"
                                    max="50"
                                    className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white/50 transition-colors"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-white/90">
                                    {dictionary.fluxTools.redux.numOutputsLabel}
                                </label>
                                <input
                                    type="number"
                                    value={state.num_outputs}
                                    onChange={(e) => updateState({num_outputs: Number(e.target.value)})}
                                    min="1"
                                    max="4"
                                    className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white/50 transition-colors"
                                />
                            </div>
                        </div>

                        {/* Generate Button */}
                        <div className="mt-6">
                            <button
                                onClick={handleGenerate}
                                disabled={state.isLoading || !state.sourceImage}
                                className="w-full py-4 bg-white text-indigo-600 rounded-lg font-semibold hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-indigo-600 disabled:bg-white/50 disabled:text-indigo-400 transition duration-300 ease-in-out transform hover:scale-105 flex items-center justify-center gap-2"
                            >
                                {state.isLoading ? 'Generating...' : 'Generate (Cost: 1 point)'}
                                <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                            </button>

                            {/* Error Message */}
                            {state.error && (
                                <div className="text-red-300 px-4 py-2 bg-red-500/10 rounded-lg mt-4">
                                    <p>{state.error}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Column - Image Preview */}
                    <div className="w-full lg:w-1/2 border rounded-lg border-gray-200 p-6">
                        <div className="w-full h-full flex items-center justify-center">
                            <div
                                className="w-full h-full bg-black/20 rounded-xl flex items-center justify-center overflow-hidden">
                                {state.isLoading ? (
                                    <div className="flex flex-col items-center justify-center">
                                        <div
                                            className="animate-spin rounded-full h-16 w-16 border-4 border-white/10 border-t-white"/>
                                        <p className="text-white/70 text-sm mt-4 animate-pulse">
                                            {dictionary.fluxTools.common.generating}
                                        </p>
                                    </div>
                                ) : state.generatedImage ? (
                                    <div className="relative w-full h-full p-4">
                                        <img
                                            src={state.generatedImage}
                                            alt="Generated"
                                            className="w-full h-full object-contain rounded-lg"
                                        />
                                        <button
                                            onClick={handleDownload}
                                            className="absolute bottom-4 right-4 backdrop-blur-md bg-white/90 hover:bg-white text-indigo-600 px-4 py-2 rounded-full flex items-center gap-2 transform transition-all duration-300 shadow-lg hover:shadow-xl"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor"
                                                 viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
                                            </svg>
                                            <span>{dictionary.fluxTools.common.downloadButton}</span>
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center p-8">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"
                                             viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                                             strokeLinecap="round" strokeLinejoin="round"
                                             className="lucide lucide-images w-16 h-16 mx-auto mb-4 text-gray-400">
                                            <path d="M18 22H4a2 2 0 0 1-2-2V6"/>
                                            <path d="m22 13-1.296-1.296a2.41 2.41 0 0 0-3.408 0L11 18"/>
                                            <circle cx="12" cy="8" r="2"/>
                                            <rect width="16" height="16" x="6" y="2" rx="2"/>
                                        </svg>
                                        <p className="text-white/70 mt-4 text-center">{dictionary.fluxTools.common.previewPlaceholder}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReduxGenerator;
