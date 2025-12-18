'use client'

import React, {useState, useCallback, useRef, useEffect} from 'react';
import ImageUpload from "@/components/ImageUpload";
;
import {useUnifiedAuth} from '@/hooks/useUnifiedAuth';
import {useRouter} from 'next/navigation';
import Link from 'next/link';

interface FillConfig {
    outpaint: string;
    seed: number;
    steps: number;
    prompt_upsampling: boolean;
    prompt: string;
    guidance: number;
    output_format: string;
    safety_tolerance: number;
    image: string;
}

interface FillGeneratorProps {
    dictionary: any;
    locale: string;
    config: FillConfig;
}

interface FillState {
    sourceImage: File | null;
    sourceImagePreview: string | null;
    generatedImage: string | null;
    isLoading: boolean;
    error: string | null;
    outputFormat: string;
    prompt: string;
    guidance: number;
    steps: number;
    safetyTolerance: number;
    promptUpsampling: boolean;
    maskImage: string | null;
    isDrawing: boolean;
    lastX: number;
    lastY: number;
    brushSize: number;
    outpainting: string;
}

interface ApiResponse {
    image: string;
    error?: string;
}

const FillGenerator = ({
                           dictionary, locale, config = {
        outpaint: 'None',
        seed: 0,
        steps: 50,
        prompt_upsampling: false,
        prompt: '',
        guidance: 60,
        output_format: 'jpg',
        safety_tolerance: 2,
        image: ''
    }
                       }: FillGeneratorProps) => {
    const { isLoggedIn, loading: authLoading } = useUnifiedAuth();
    const router = useRouter();
    const canvasRef = useRef<HTMLCanvasElement>(null as any);
    const [state, setState] = useState<FillState>({
        sourceImage: null,
        sourceImagePreview: null,
        generatedImage: null,
        isLoading: false,
        error: null,
        outputFormat: config.output_format,
        prompt: config.prompt,
        guidance: config.guidance,
        steps: config.steps,
        safetyTolerance: config.safety_tolerance,
        promptUpsampling: config.prompt_upsampling,
        maskImage: null,
        isDrawing: false,
        lastX: 0,
        lastY: 0,
        brushSize: 20,
        outpainting: config.outpaint
    });

    const [imageSize, setImageSize] = useState({width: 0, height: 0});

    const updateImageSize = (preview: string) => {
        const img = new Image();
        img.onload = () => {
            setImageSize({
                width: img.width,
                height: img.height
            });
        };
        img.src = preview;
    };

    const updateState = (updates: Partial<FillState>) => {
        setState(prev => ({...prev, ...updates}));
    };

    const handleImageChange = useCallback((file: File | null, preview: string | null) => {
        if (file && (file.type === 'image/jpg' || file.type === 'image/jpeg' || file.type === 'image/png' || file.type === 'image/webp')) {
            updateState({
                sourceImage: file,
                sourceImagePreview: preview,
                error: null,
                maskImage: null
            });
            if (preview) {
                updateImageSize(preview);
            }
        } else if (file) {
            updateState({
                error: dictionary.fluxTools.common.invalidFileType
            });
        } else {
            updateState({
                sourceImage: null,
                sourceImagePreview: null,
                maskImage: null
            });
            setImageSize({width: 0, height: 0});
        }
    }, [dictionary]);

    const getCanvasCoordinates = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (!canvas) return {x: 0, y: 0};

        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;

        return {
            x: (e.clientX - rect.left) * scaleX,
            y: (e.clientY - rect.top) * scaleY
        };
    };

    const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const {x, y} = getCanvasCoordinates(e);
        updateState({
            isDrawing: true,
            lastX: x,
            lastY: y
        });
    };

    const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!state.isDrawing) return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const {x, y} = getCanvasCoordinates(e);

        ctx.beginPath();
        ctx.moveTo(state.lastX, state.lastY);
        ctx.lineTo(x, y);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.lineWidth = state.brushSize;
        ctx.lineCap = 'round';
        ctx.stroke();

        updateState({
            lastX: x,
            lastY: y
        });
    };

    const initCanvas = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas || !state.sourceImagePreview) return;

        const img = new Image();
        img.onload = () => {
            canvas.width = img.width;
            canvas.height = img.height;

            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
            }
        };
        img.src = state.sourceImagePreview;
    }, [state.sourceImagePreview]);

    useEffect(() => {
        initCanvas();
    }, [state.sourceImagePreview, initCanvas]);

    const stopDrawing = () => {
        if (!state.isDrawing) return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        updateState({
            isDrawing: false,
            maskImage: canvas.toDataURL()
        });
    };

    const clearMask = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        updateState({maskImage: null});
    };

    const handleGenerate = async () => {
        // 检查登录状态
        if (!isLoggedIn) {
            router.push(`/${locale}/auth`);
            return;
        }
        
        if (!state.sourceImage || (!state.maskImage && state.outpainting === 'None')) {
            updateState({error: dictionary.fluxTools.common.noImageError});
            return;
        }

        updateState({isLoading: true, error: null});

        try {
            const formData = new FormData();
            formData.append('image', state.sourceImage);
            if (state.maskImage) {
                formData.append('mask', state.maskImage);
            }
            formData.append('prompt', state.prompt);
            formData.append('guidance', state.guidance.toString());
            formData.append('steps', state.steps.toString());
            formData.append('output_format', state.outputFormat);
            formData.append('safety_tolerance', state.safetyTolerance.toString());
            formData.append('prompt_upsampling', state.promptUpsampling.toString());
            formData.append('outpaint', state.outpainting);

            const response = await fetch('/api/flux-tools/fill', {
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
            link.download = `flux-fill-${timestamp}.${state.outputFormat}`;

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
                        {dictionary.fluxTools.fill.pageTitle}
                    </h1>
                    <p className="text-lg md:text-xl text-white/80">
                        {dictionary.fluxTools.fill.description}
                    </p>
                </div>

                {/* Main Content */}
                <div className="flex flex-col lg:flex-row gap-6">
                    {/* Left Column - Controls */}
                    <div className="w-full lg:w-1/2 border rounded-lg border-gray-100 p-6">
                        {/* Image Upload and Mask Area */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Image Upload Area */}
                            <div className="space-y-2">
                                <ImageUpload onImageChange={handleImageChange}/>
                            </div>

                            {/* Mask Drawing Area */}
                            {state.sourceImagePreview && (
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <label className="text-sm font-medium text-white/90">
                                            {dictionary.fluxTools.fill.maskLabel}
                                        </label>
                                        <div className="flex items-center gap-2">
                                            <label className="text-sm text-white/70">笔触大小</label>
                                            <input
                                                type="range"
                                                min="5"
                                                max="100"
                                                value={state.brushSize}
                                                onChange={(e) => updateState({brushSize: Number(e.target.value)})}
                                                className="w-24 h-2 bg-white/10 rounded-lg appearance-none cursor-pointer"
                                            />
                                            <span
                                                className="text-sm text-white/70 w-12 text-right">{state.brushSize}px</span>
                                        </div>
                                    </div>
                                    <div className="relative">
                                        <canvas
                                            ref={canvasRef}
                                            className="w-full h-auto border border-white/10 rounded-lg cursor-crosshair"
                                            onMouseDown={startDrawing}
                                            onMouseMove={draw}
                                            onMouseUp={stopDrawing}
                                            onMouseLeave={stopDrawing}
                                            style={{
                                                backgroundImage: `url(${state.sourceImagePreview})`,
                                                backgroundSize: 'contain',
                                                backgroundPosition: 'center',
                                                backgroundRepeat: 'no-repeat'
                                            }}
                                        />
                                        <button
                                            onClick={clearMask}
                                            className="absolute top-2 right-2 bg-red-500/80 hover:bg-red-500 text-white px-3 py-1 rounded-lg text-sm"
                                        >
                                            {dictionary.fluxTools.fill.clearMask}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Advanced Settings */}
                        <div className="grid grid-cols-2 gap-4 mt-4">

                            <div className="space-y-2 col-span-2">
                                <label className="text-sm font-medium text-white/90">
                                    {dictionary.fluxTools.fill.promptLabel}
                                </label>
                                <textarea
                                    value={state.prompt}
                                    onChange={(e) => updateState({prompt: e.target.value})}
                                    placeholder={dictionary.fluxTools.fill.promptPlaceholder}
                                    rows={3}
                                    className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white/50 transition-colors resize-none"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-white/90">
                                    {dictionary.fluxTools.fill.outpaintingLabel}
                                </label>
                                <select
                                    value={state.outpainting}
                                    onChange={(e) => updateState({outpainting: e.target.value})}
                                    className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white/50 transition-colors"
                                >
                                    <option value="None">{dictionary.fluxTools.fill.outpaintingOptions.none}</option>
                                    <option
                                        value="Zoom out 1.5x">{dictionary.fluxTools.fill.outpaintingOptions.zoomOut15}</option>
                                    <option
                                        value="Zoom out 2x">{dictionary.fluxTools.fill.outpaintingOptions.zoomOut2}</option>
                                    <option
                                        value="Make square">{dictionary.fluxTools.fill.outpaintingOptions.makeSquare}</option>
                                    <option
                                        value="Left outpaint">{dictionary.fluxTools.fill.outpaintingOptions.leftOutpaint}</option>
                                    <option
                                        value="Right outpaint">{dictionary.fluxTools.fill.outpaintingOptions.rightOutpaint}</option>
                                    <option
                                        value="Top outpaint">{dictionary.fluxTools.fill.outpaintingOptions.topOutpaint}</option>
                                    <option
                                        value="Bottom outpaint">{dictionary.fluxTools.fill.outpaintingOptions.bottomOutpaint}</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-white/90">
                                    {dictionary.fluxTools.fill.guidanceLabel}
                                </label>
                                <input
                                    type="number"
                                    value={state.guidance}
                                    onChange={(e) => updateState({guidance: Number(e.target.value)})}
                                    min="1"
                                    max="100"
                                    className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white/50 transition-colors"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-white/90">
                                    {dictionary.fluxTools.fill.inferenceStepsLabel}
                                </label>
                                <input
                                    type="number"
                                    value={state.steps}
                                    onChange={(e) => updateState({steps: Number(e.target.value)})}
                                    min="1"
                                    max="100"
                                    className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white/50 transition-colors"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-white/90">
                                    {dictionary.fluxTools.fill.safetyToleranceLabel}
                                </label>
                                <input
                                    type="number"
                                    value={state.safetyTolerance}
                                    onChange={(e) => updateState({safetyTolerance: Number(e.target.value)})}
                                    min="0"
                                    max="5"
                                    step="0.1"
                                    className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white/50 transition-colors"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-white/90">
                                    {dictionary.fluxTools.fill.promptUpsamplingLabel}
                                </label>
                                <div className="flex items-center">
                                    <input
                                        type="checkbox"
                                        checked={state.promptUpsampling}
                                        onChange={(e) => updateState({promptUpsampling: e.target.checked})}
                                        className="w-4 h-4 bg-white/5 border border-white/10 rounded text-white focus:ring-2 focus:ring-white/50"
                                    />
                                    <span
                                        className="ml-2 text-sm text-white/70">{dictionary.fluxTools.fill.promptUpsamplingEnabled}</span>
                                </div>
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
                                    <option value="jpg">JPG</option>
                                    <option value="png">PNG</option>
                                </select>
                            </div>
                        </div>

                        {/* Generate Button */}
                        <div className="mt-6">
                            {!isLoggedIn ? (
                                <div className="text-center">
                                    <p className="text-white/70 mb-4">Please login to use this tool</p>
                                    <Link 
                                        href={`/${locale}/auth`}
                                        className="inline-block px-6 py-3 bg-white text-indigo-600 rounded-lg font-semibold hover:bg-indigo-100 transition-colors"
                                    >
                                        Login
                                    </Link>
                                </div>
                            ) : (
                                <button
                                    onClick={handleGenerate}
                                    disabled={state.isLoading || authLoading || !state.sourceImage || !state.maskImage}
                                    className="w-full py-4 bg-white text-indigo-600 rounded-lg font-semibold hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-indigo-600 disabled:bg-white/50 disabled:text-indigo-400 transition duration-300 ease-in-out transform hover:scale-105 flex items-center justify-center gap-2"
                                >
                                    {state.isLoading ? 'Generating...' : 'Generate (Cost: 2 points)'}
                                    <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" strokeWidth="2"
                                         viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/>
                                    </svg>
                                </button>
                            )}

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
                                             viewBox="0 0 24 24"
                                             fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                                             strokeLinejoin="round"
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

export default FillGenerator;
