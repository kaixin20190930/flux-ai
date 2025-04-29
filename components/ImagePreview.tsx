import React, {CSSProperties} from 'react';
import Image from 'next/image';
import {Zap, Star, Crown, Sparkles} from 'lucide-react';
import {ICON_COMPONENTS} from '@/public/constants/constants';
import {ImagePreviewProps} from "@/public/types/type";
import type {Dictionary} from '@/app/i18n/settings';

interface LocalizedImagePreviewProps extends Omit<ImagePreviewProps, 'downloadText'> {
    dictionary: Dictionary;
}

const ImagePreview: React.FC<LocalizedImagePreviewProps> = ({
                                                                isLoading,
                                                                generatedImage,
                                                                aspectRatio,
                                                                selectedModel,
                                                                modelConfig,
                                                                outputFormat,
                                                                onDownload,
                                                                imageDimensions,
                                                                dictionary
                                                            }) => {
    const {imagePreview} = dictionary;
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

    const handleDownload = async () => {
        if (!generatedImage) return;

        try {
            const response = await fetch(generatedImage);
            if (!response.ok) throw new Error('Failed to fetch image');

            const blob = await response.blob();

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
                    mimeType = 'image/png';
            }

            const newBlob = new Blob([blob], {type: mimeType});
            const blobUrl = URL.createObjectURL(newBlob);

            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = `generated-image.${outputFormat.toLowerCase()}`;

            document.body.appendChild(link);
            link.click();

            document.body.removeChild(link);
            URL.revokeObjectURL(blobUrl);
        } catch (error) {
            console.error('Download failed:', error);
            alert('Failed to download image. Please try again.');
        }
    };

    if (isLoading) {
        return (
            <div className="w-full h-full flex flex-col items-center justify-center">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-white/10 border-t-white"/>
                <p className="text-white/70 text-sm mt-4 animate-pulse">{imagePreview.loading}</p>
            </div>
        );
    }

    if (!generatedImage) {
        return (
            <div className="w-full h-full flex flex-col items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"
                     viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                     stroke-linecap="round" stroke-linejoin="round"
                     className="lucide lucide-images w-16 h-16 mx-auto mb-4 text-gray-400">
                    <path d="M18 22H4a2 2 0 0 1-2-2V6"></path>
                    <path d="m22 13-1.296-1.296a2.41 2.41 0 0 0-3.408 0L11 18"></path>
                    <circle cx="12" cy="8" r="2"></circle>
                    <rect width="16" height="16" x="6" y="2" rx="2"></rect>
                </svg>
                <p className="text-white/70 mt-4">{imagePreview.placeholder}</p>
            </div>
        );
    }

    return (
        <div className="w-full h-full flex items-center justify-center p-4">
            <div className="w-full h-full bg-black/20 rounded-xl flex items-center justify-center overflow-hidden">
                <div style={getImageContainerStyle()} className="p-4 relative group w-full h-full">
                    <div className="relative w-full h-full">
                        <Image
                            src={generatedImage}
                            alt="Generated image"
                            fill
                            className="rounded-lg pointer-events-none"
                            style={{objectFit: 'contain'}}
                            priority
                            unoptimized
                        />
                    </div>
                    <div className="absolute inset-0 z-20 pointer-events-none">
                        <div
                            className="absolute top-2 left-2 backdrop-blur-md bg-black/40 px-3 py-2 rounded-full flex items-center gap-2 pointer-events-auto">
                            <IconComponent className="w-4 h-4"/>
                            <span className="text-sm text-white/90">
                                {aspectRatio} • {modelConfig.name} • {outputFormat.toUpperCase()}
                            </span>
                        </div>

                        <button
                            onClick={handleDownload}
                            className="absolute bottom-4 right-4 backdrop-blur-md bg-white/90 hover:bg-white text-indigo-600 px-4 py-2 rounded-full flex items-center gap-2 transform transition-all duration-300 translate-y-2 opacity-0 group-hover:opacity-100 group-hover:translate-y-0 shadow-lg hover:shadow-xl pointer-events-auto"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
                            </svg>
                            <span>{`${imagePreview.downloadButton} ${outputFormat.toUpperCase()}`}</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ImagePreview;