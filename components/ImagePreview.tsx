import React, {CSSProperties} from 'react';
import Image from 'next/image';
import {Zap, Star, Crown, Sparkles} from 'lucide-react';
import {ICON_COMPONENTS} from '@/public/constants/constants'
import {ImagePreviewProps} from "@/public/types/type";


const ImagePreview: React.FC<ImagePreviewProps> = ({
                                                       isLoading,
                                                       generatedImage,
                                                       aspectRatio,
                                                       selectedModel,
                                                       modelConfig,
                                                       outputFormat,
                                                       onDownload,
                                                       imageDimensions
                                                   }) => {
    const iconName = modelConfig.icon;
    const IconComponent = ICON_COMPONENTS[iconName];

    const getImageContainerStyle = (): CSSProperties => {
        const [width, height] = aspectRatio.split(':').map(Number);
        const ratio = width / height;

        return {
            position: 'relative',
            width: ratio >= 1 ? '100%' : 'auto',
            height: ratio >= 1 ? 'auto' : '100%',
            aspectRatio: `${width}/${height}`,
            maxWidth: '100%',
            maxHeight: '100%'
        };
    };

    // 处理下载事件

    // const handleDownload = () => {
    //     if (generatedImage) {
    //         // 创建一个临时的 a 标签
    //         const link = document.createElement('a');
    //         link.href = generatedImage;
    //         link.download = 'generated-image.png'; // 您可以根据需要更改文件名
    //         document.body.appendChild(link);
    //         link.click();
    //         document.body.removeChild(link);
    //     }
    // };
    const handleDownload = async () => {
        if (!generatedImage) return;

        try {
            // 获取图片数据
            const response = await fetch(generatedImage);
            if (!response.ok) throw new Error('Failed to fetch image');

            const blob = await response.blob();

            // 确保使用正确的 MIME 类型
            let mimeType;
            switch (outputFormat.toLowerCase()) {
                case 'png':
                    mimeType = 'image/png';
                    break;
                case 'jpg':
                case 'jpeg':
                    mimeType = 'image/jpeg';
                    break;
                case 'webp':
                    mimeType = 'image/webp';
                    break;
                default:
                    mimeType = 'image/png'; // 默认使用 PNG
            }

            // 创建新的 Blob，确保使用正确的 MIME 类型
            const newBlob = new Blob([blob], {type: mimeType});

            // 创建 Blob URL
            const blobUrl = URL.createObjectURL(newBlob);

            // 创建下载链接
            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = `generated-image.${outputFormat.toLowerCase()}`; // 使用正确的扩展名

            // 添加到文档中并触发点击
            document.body.appendChild(link);
            link.click();

            // 清理
            document.body.removeChild(link);
            URL.revokeObjectURL(blobUrl);
        } catch (error) {
            console.error('Download failed:', error);
            alert('Failed to download image. Please try again.');
        }
    };


    if (isLoading) {
        return (
            <div className="w-full h-full min-h-[400px] flex flex-col items-center justify-center">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-white/10 border-t-white"/>
                <p className="text-white/70 text-sm mt-4 animate-pulse">Creating your masterpiece...</p>
            </div>
        );
    }

    if (!generatedImage) {
        return (
            <div className="w-full h-full min-h-[400px] flex flex-col items-center justify-center">
                <Image
                    src="/ai-placeholder.svg"
                    alt="AI Placeholder"
                    width={100}
                    height={100}
                    className="opacity-50"
                />
                <p className="text-white/70 mt-4">Your AI-generated image will appear here</p>
            </div>
        );
    }

    return (
        <div className="w-full h-full min-h-[400px] flex items-center justify-center p-4">
            {/* 固定大小的预览容器 */}
            <div
                className="h-[400px] w-full max-w-[800px] bg-black/20 rounded-xl flex items-center justify-center overflow-hidden">
                {/* 图片容器 */}
                <div style={getImageContainerStyle()} className="p-4 relative group w-full h-full">
                    <div className="relative w-full h-full">
                        <Image
                            src={generatedImage}
                            alt="Generated image"
                            fill
                            className="rounded-lg pointer-events-none" // 禁用图片的指针事件
                            style={{objectFit: 'contain'}}
                            priority
                            unoptimized // 添加这个属性以确保图片URL保持原样
                        />
                    </div>
                    <div className="absolute inset-0 z-20 pointer-events-none">
                        {/* 信息标签 */}
                        <div
                            className="absolute top-2 left-2 backdrop-blur-md bg-black/40 px-3 py-2 rounded-full flex items-center gap-2 pointer-events-auto">
                            <IconComponent className="w-4 h-4"/>
                            <span className="text-sm text-white/90">
                                {aspectRatio} • {modelConfig.name} • {outputFormat.toUpperCase()}
                            </span>
                        </div>

                        {/* 下载按钮 */}
                        <button
                            onClick={handleDownload}
                            className="absolute bottom-4 right-4 backdrop-blur-md bg-white/90 hover:bg-white text-indigo-600 px-4 py-2 rounded-full flex items-center gap-2 transform transition-all duration-300 translate-y-2 opacity-0 group-hover:opacity-100 group-hover:translate-y-0 shadow-lg hover:shadow-xl pointer-events-auto"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
                            </svg>
                            <span>Download {outputFormat.toUpperCase()}</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
        ;
};

export default ImagePreview;
