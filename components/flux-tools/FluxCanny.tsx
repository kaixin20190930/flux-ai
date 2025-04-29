'use client'

import React, {useState, useCallback} from 'react';
import {
    ASPECT_RATIOS,
    OUTPUT_FORMATS,
} from '@/public/constants/constants';
import ImageUpload from "@/components/ImageUpload";

const CannyGenerator = ({dictionary, locale}) => {
    const [state, setState] = useState({
        sourceImage: null,
        sourceImagePreview: null,
        generatedImage: null,
        isLoading: false,
        error: null,
        outputFormat: 'png',
        aspectRatio: '1:1'  // 添加这一行
    });

    const updateState = (updates) => {
        setState(prev => ({...prev, ...updates}));
    };

    const handleImageChange = useCallback((file: File | null, preview: string | null) => {
        if (file && (file.type === 'image/jpeg' || file.type === 'image/png')) {
            updateState({
                sourceImage: file,
                sourceImagePreview: preview,
                error: null
            });
        } else if (file) {
            updateState({
                error: dictionary.imageGenerator.invalidFileType
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
            updateState({error: dictionary.imageGenerator.noImageError});
            return;
        }

        updateState({isLoading: true, error: null});

        try {
            const formData = new FormData();
            formData.append('image', state.sourceImage);
            formData.append('aspectRatio', state.aspectRatio);  // 添加这行
            formData.append('outputFormat', state.outputFormat);  // 添加这行

            const response = await fetch('/api/generate-from-image', {
                method: 'POST',
                body: formData
            } as any);

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || dictionary.imageGenerator.generationError);
            }

            updateState({
                generatedImage: data.image
            });
        } catch (error) {
            updateState({
                error: error.message || dictionary.imageGenerator.generationError
            });
        } finally {
            updateState({isLoading: false});
        }
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

                {/* Main Content */}
                <div className="flex-grow flex flex-col lg:flex-row gap-6 lg:min-h-0">
                    {/* Left Column - Controls */}
                    <div className="w-full lg:w-1/2 space-y-6 border rounded-lg border-gray-100 p-6">
                        {/* Image Upload Area */}
                        <div className="space-y-2">
                            <h1 className="text-3xl font-medium text-white/90">
                                {dictionary.imageGenerator.title}
                            </h1>
                            <ImageUpload onImageChange={handleImageChange}/>
                        </div>
                        {/* Aspect Ratio and Output Format */}
                        <div className="grid grid-cols-2 gap-4">
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
                                    {OUTPUT_FORMATS.map(format => (
                                        <option key={format.value} value={format.value}>{format.label}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Generate Button */}
                        <button
                            onClick={handleGenerate}
                            disabled={state.isLoading || !state.sourceImage}
                            className="w-full py-4 bg-white text-indigo-600 rounded-lg font-semibold hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-indigo-600 disabled:bg-white/50 disabled:text-indigo-400 transition duration-300 ease-in-out transform hover:scale-105 flex items-center justify-center gap-2"
                        >
                            {state.isLoading ? dictionary.imageGenerator.generatingButton : dictionary.imageGenerator.generateButton}
                        </button>

                        {/* Error Message */}
                        {state.error && (
                            <div className="text-red-300 px-4 py-2 bg-red-500/10 rounded-lg">
                                <p>{state.error}</p>
                            </div>
                        )}
                    </div>

                    {/* Right Column - Image Preview */}
                    <div
                        className="w-full lg:w-1/2 h-full lg:overflow-auto border rounded-lg border-gray-200 p-6 flex flex-col">
                        <div className="w-full h-full flex items-center justify-center p-4">
                            <div
                                className="w-full h-full bg-black/20 rounded-xl flex items-center justify-center overflow-hidden">
                                {state.isLoading ? (
                                    <div className="flex flex-col items-center justify-center">
                                        <div
                                            className="animate-spin rounded-full h-16 w-16 border-4 border-white/10 border-t-white"/>
                                        <p className="text-white/70 text-sm mt-4 animate-pulse">
                                            {dictionary.imageGenerator.generating}
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
                                            onClick={() => {/* Add download logic */
                                            }}
                                            className="absolute bottom-4 right-4 backdrop-blur-md bg-white/90 hover:bg-white text-indigo-600 px-4 py-2 rounded-full flex items-center gap-2 transform transition-all duration-300 shadow-lg hover:shadow-xl"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor"
                                                 viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
                                            </svg>
                                            <span>{dictionary.imageGenerator.downloadButton}</span>
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"
                                             viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                                             stroke-linecap="round" stroke-linejoin="round"
                                             className="lucide lucide-images w-16 h-16 mx-auto mb-4 text-gray-400">
                                            <path d="M18 22H4a2 2 0 0 1-2-2V6"></path>
                                            <path d="m22 13-1.296-1.296a2.41 2.41 0 0 0-3.408 0L11 18"></path>
                                            <circle cx="12" cy="8" r="2"></circle>
                                            <rect width="16" height="16" x="6" y="2" rx="2"></rect>
                                        </svg>
                                        <p className="text-white/70 mt-4">{dictionary.imageGenerator.previewPlaceholder}</p>
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

export default CannyGenerator;