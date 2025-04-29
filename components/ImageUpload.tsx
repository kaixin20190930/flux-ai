import React, {useState} from 'react';
import {Trash2, Link as LinkIcon} from 'lucide-react';

interface ImageUploadProps {
    onImageChange: (file: File | null, preview: string | null) => void;
}

const ImageUpload: React.FC<ImageUploadProps> = ({onImageChange}) => {
    const [image, setImage] = useState<string | null>(null);
    const [uploadType, setUploadType] = useState<'file' | 'url'>('file');
    const [imageUrl, setImageUrl] = useState<string>('');
    const [error, setError] = useState<string | null>(null);

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.type === 'image/jpeg' || file.type === 'image/png') {
                const reader = new FileReader();
                reader.onload = () => {
                    setImage(reader.result as string);
                    onImageChange(file, reader.result as string);
                    setError(null);
                };
                reader.readAsDataURL(file);
            } else {
                setError('Please upload a valid JPG or PNG image');
                onImageChange(null, null);
            }
        }
    };

    const handleUrlChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const url = e.target.value;
        setImageUrl(url);

        if (!url) {
            setImage(null);
            onImageChange(null, null);
            return;
        }

        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error('Failed to load image');
            }
            const blob = await response.blob();
            if (!blob.type.startsWith('image/')) {
                throw new Error('URL does not point to a valid image');
            }

            const file = new File([blob], 'image.jpg', {type: blob.type});

            const reader = new FileReader();
            reader.onload = () => {
                setImage(reader.result as string);
                onImageChange(file, reader.result as string);
                setError(null);
            };
            reader.readAsDataURL(blob);
        } catch (err) {
            setError('Failed to load image from URL');
            onImageChange(null, null);
        }
    };

    const handleDelete = (e: React.MouseEvent) => {
        e.stopPropagation();
        setImage(null);
        onImageChange(null, null);
        setImageUrl('');
        setError(null);
    };

    const handleTypeChange = (type: 'file' | 'url') => {
        if (type !== uploadType) {
            setUploadType(type);
            setImage(null);
            setImageUrl('');
            setError(null);
            onImageChange(null, null);
        }
    };

    return (
        <div className="w-full max-w-2xl mx-auto p-6">
            {/* Upload Type Toggle - 只保留 URL 按钮 */}
            <div className="flex justify-end mb-4">
                <button
                    onClick={() => handleTypeChange(uploadType === 'url' ? 'file' : 'url')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                        uploadType === 'url'
                            ? 'bg-white text-indigo-600'
                            : 'bg-white/10 text-white hover:bg-white/20'
                    }`}
                >
                    <LinkIcon size={16}/>
                    Image URL
                </button>
            </div>

            {/* URL 输入框 */}
            {uploadType === 'url' && (
                <div className="mb-4">
                    <input
                        type="text"
                        value={imageUrl}
                        onChange={handleUrlChange}
                        placeholder="Enter image URL"
                        className="w-full p-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/50"
                    />
                </div>
            )}

            <div className="relative border-2 border-dashed border-gray-300 rounded-lg p-8">
                <div className="space-y-4 text-center relative">
                    {image ? (
                        <div className="relative w-full h-64">
                            <div className="w-full h-full flex items-center justify-center">
                                <img
                                    src={image}
                                    alt="Uploaded preview"
                                    className="max-w-full max-h-full object-contain rounded-lg shadow-md"
                                />
                            </div>
                            <button
                                onClick={handleDelete}
                                className="absolute -top-4 -right-4 p-2 bg-red-500 rounded-full text-white hover:bg-red-600 transition-colors duration-200 shadow-lg z-20"
                            >
                                <Trash2 size={16}/>
                            </button>
                        </div>
                    ) : (
                        <label className="cursor-pointer">
                            {uploadType === 'file' && (
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageUpload}
                                    className="hidden"
                                />
                            )}
                            <div className="flex flex-col items-center justify-center">
                                <div className="flex justify-center">
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="24"
                                        height="24"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        className="lucide lucide-image-plus h-16 w-16 text-muted-foreground"
                                    >
                                        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7"/>
                                        <line x1="16" x2="22" y1="5" y2="5"/>
                                        <line x1="19" x2="19" y1="2" y2="8"/>
                                        <circle cx="9" cy="9" r="2"/>
                                        <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
                                    </svg>
                                </div>
                                <div className="text-gray-600">
                                    <span className="font-medium">Click to upload</span> or drag and drop
                                </div>
                                <p className="text-xs text-gray-500">PNG, JPG up to 10MB</p>
                            </div>
                        </label>
                    )}

                    {error && (
                        <div className="text-red-300 bg-red-500/10 px-4 py-2 rounded-lg mt-4">
                            {error}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ImageUpload;