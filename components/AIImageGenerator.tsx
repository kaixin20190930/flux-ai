'use client'

import React, {useState, useEffect, useCallback} from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {logWithTimestamp} from "@/utils/logUtils";


const MAX_DAILY_GENERATIONS = 3;

export const AIImageGenerator: React.FC = () => {
    const [prompt, setPrompt] = useState('')
    const [generatedImage, setGeneratedImage] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [remainingFreeGenerations, setRemainingFreeGenerations] = useState<number>(MAX_DAILY_GENERATIONS)
    const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number } | null>(null)
    const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false)
    const [userPoints, setUserPoints] = useState<number | null>(null)
    const fetchGenerationData = async () => {
        try {
            const response = await fetch('/api/getRemainingGenerations');

            const data = await response.json() as any;
            setRemainingFreeGenerations(data.remainingFreeGenerations);
            setIsLoggedIn(data.isLoggedIn);
            setUserPoints(data.userPoints);
            logWithTimestamp('Fetched data: ', data)
        } catch (error) {
            console.error('Error fetching remaining generations:', error);
        }
    };
    useEffect(() => {
        // 从 localStorage 获取用户信息
        fetchGenerationData();
    }, []);

    const handleGenerate = async () => {
        if (remainingFreeGenerations <= 0 && !isLoggedIn) {
            setError('Daily free limit reached. Please login to continue.');
            return;
        }

        if (isLoggedIn && userPoints !== null && userPoints <= 0) {
            setError('You have no points left. Please purchase more to continue.');
            return;
        }
        setIsLoading(true)
        setError(null)
        try {
            const response = await fetch('/api/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({prompt}),
            })
            const data = await response.json() as any;
            if (data.image) {
                setGeneratedImage(data.image)
                fetchGenerationData(); // 重新获取生成数据
            } else if (data.error) {
                setError(data.error)
            } else {
                throw new Error('Failed to generate image')
            }
        } catch (error) {
            console.error('Error generating image:', error)
            setError('An unexpected error occurred. Please try again later.')
        } finally {
            setIsLoading(false)
        }
    }

    const handleDownload = () => {
        if (generatedImage) {
            // 创建一个临时的 a 标签
            const link = document.createElement('a');
            link.href = generatedImage;
            link.download = 'generated-image.png'; // 您可以根据需要更改文件名
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    const handleImageLoad = useCallback((image: HTMLImageElement) => {
        setImageDimensions({
            width: image.naturalWidth,
            height: image.naturalHeight
        });
    }, []);

    const getObjectFit = () => {
        if (!imageDimensions) return 'contain';
        const containerAspectRatio = 400 / 400; // 假设容器是 400x400
        const imageAspectRatio = imageDimensions.width / imageDimensions.height;
        const aspectRatioDifference = Math.abs(containerAspectRatio - imageAspectRatio);
        return aspectRatioDifference > 0.2 ? 'contain' : 'cover';
    };

    return (
        <section
            className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 text-white flex items-center justify-center px-4 py-12 overflow-hidden relative">
            <div className="absolute inset-0 bg-black opacity-50"></div>
            <div
                className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]"></div>

            <div className="container mx-auto z-10 max-w-4xl">
                <h1 className="text-4xl md:text-6xl font-bold text-center mb-6 animate-fade-in-down">
                    Create Stunning Images with Flux AI
                </h1>
                <p className="text-xl md:text-2xl text-center mb-10 animate-fade-in-up">
                    Transform your ideas into visual masterpieces in seconds
                </p>
                <div className="bg-white/10 backdrop-blur-md rounded-xl shadow-2xl overflow-hidden animate-fade-in">
                    <div className="p-6 md:p-8">
                        <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4 mb-6">
                            <input
                                type="text"
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                placeholder="Describe the image you want to create..."
                                className="flex-grow p-3 md:p-4 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/50 text-white placeholder-white/50"
                            />
                            <button
                                onClick={handleGenerate}
                                // 修改：添加 remainingFreeGenerations 到禁用条件
                                disabled={isLoading || !prompt || remainingFreeGenerations <= 0}
                                className="px-6 py-3 md:px-8 md:py-4 bg-white text-indigo-600 rounded-lg font-semibold hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-indigo-600 disabled:bg-white/50 disabled:text-indigo-400 transition duration-300 ease-in-out transform hover:scale-105"
                            >
                                {isLoading ? 'Generating...' : 'Generate Image'}
                            </button>
                        </div>
                        {error && (
                            <p className="text-red-300 mb-4">{error}</p>
                        )}
                        <p className="text-sm text-indigo-200 mb-4">
                            Remaining free generations today: {remainingFreeGenerations} / {MAX_DAILY_GENERATIONS}
                        </p>
                        {isLoggedIn && userPoints !== null && (
                            <p className="text-sm text-indigo-200 mb-4">
                                Your points: {userPoints}
                            </p>
                        )}
                        {remainingFreeGenerations <= 0 && !isLoggedIn && (
                            <p className="text-sm text-indigo-200 mb-4">
                                <Link href="/auth" className="underline hover:text-white">Login</Link> to use your
                                points or wait until tomorrow for more free generations.
                            </p>
                        )}
                        {isLoggedIn && userPoints !== null && userPoints <= 0 && (
                            <p className="text-sm text-indigo-200 mb-4">
                                <Link href="/pricing" className="underline hover:text-white">Purchase more
                                    points</Link> to continue generating images.
                            </p>
                        )}
                        <div className="bg-white/5 p-4 rounded-lg overflow-hidden" style={{height: '400px'}}>
                            {isLoading ? (
                                <div className="flex justify-center items-center h-full">
                                    <div
                                        className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-white"></div>
                                </div>
                            ) : generatedImage ? (
                                <div className="relative h-full group">
                                    <Image
                                        onClick={handleDownload}
                                        src={generatedImage}
                                        alt="Generated image"
                                        layout="fill"
                                        objectFit={getObjectFit()}
                                        className="rounded-lg"
                                        onLoadingComplete={handleImageLoad}
                                    />
                                    <button
                                        onClick={handleDownload}
                                        className="absolute bottom-4 right-4 bg-white text-indigo-600 px-4 py-2 rounded-md opacity-0 group-hover:opacity-100 transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-indigo-600">
                                        Download
                                    </button>
                                </div>
                            ) : (
                                <div className="flex flex-col justify-center items-center h-full text-white/70">
                                    <Image src="/ai-placeholder.svg" alt="AI Placeholder" width={100} height={100}
                                           className="mb-4 opacity-50"/>
                                    <p>Your AI-generated image will appear here</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}