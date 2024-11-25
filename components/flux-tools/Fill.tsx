'use client'
import React, {useState, useRef} from 'react';
import {Upload, Edit, Download, Wand2} from 'lucide-react';

const ImageEditor = ({dictionary}) => {
    const [state, setState] = useState({
        originalImage: null,
        editedImage: null,
        prompt: '',
        isLoading: false,
        error: null,
        brushSize: 20,
        isDrawing: false
    });

    const canvasRef = useRef(null);
    const fileInputRef = useRef(null);

    const handleImageUpload = (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setState(prev => ({
                    ...prev,
                    originalImage: reader.result,
                    editedImage: reader.result
                }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handlePromptChange = (e) => {
        setState(prev => ({
            ...prev,
            prompt: e.target.value
        }));
    };

    const handleEdit = async () => {
        setState(prev => ({...prev, isLoading: true}));
        try {
            // Here you would integrate with FLUX.1 Fill API
            // For now, we'll just simulate a delay
            await new Promise(resolve => setTimeout(resolve, 2000));
            setState(prev => ({...prev, isLoading: false}));
        } catch (error) {
            setState(prev => ({
                ...prev,
                isLoading: false,
                error: 'Failed to process image'
            }));
        }
    };

    return (
        <div
            className="h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 text-white flex items-center justify-center px-4 pb-8">
            <div className="absolute inset-0 bg-black opacity-50"/>
            <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center"/>

            <div className="container mx-auto z-10 max-w-7xl h-full flex flex-col"
                 style={{paddingTop: '2rem', paddingBottom: '2rem'}}>
                {/* Header */}
                <div className="pb-6 text-center">
                    <h1 className="text-4xl md:text-5xl font-bold mb-3">
                        FLUX.1 Fill [pro] Editor
                    </h1>
                    <p className="text-lg md:text-xl text-white/80">
                        Edit or extend images with natural, seamless results
                    </p>
                </div>

                {/* Main Content */}
                <div className="flex-grow flex flex-col lg:flex-row gap-6">
                    {/* Left Column - Controls */}
                    <div className="w-full lg:w-1/2 space-y-6 border rounded-lg border-gray-100 p-6">
                        {/* Upload Section */}
                        <div className="space-y-2">
                            <h2 className="text-2xl font-medium text-white/90">Upload Image</h2>
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="w-full p-4 border-2 border-dashed border-white/30 rounded-lg hover:border-white/50 transition-colors flex items-center justify-center gap-2"
                            >
                                <Upload className="w-6 h-6"/>
                                <span>Click to upload image</span>
                            </button>
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleImageUpload}
                                accept="image/*"
                                className="hidden"
                            />
                        </div>

                        {/* Editing Tools */}
                        <div className="space-y-4">
                            <h2 className="text-2xl font-medium text-white/90">Edit Image</h2>

                            {/* Brush Size Control */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-white/90">
                                    Brush Size
                                </label>
                                <input
                                    type="range"
                                    min="1"
                                    max="50"
                                    value={state.brushSize}
                                    onChange={(e) => setState(prev => ({...prev, brushSize: parseInt(e.target.value)}))}
                                    className="w-full"
                                />
                            </div>

                            {/* Prompt Input */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-white/90">
                                    Describe what you want to change
                                </label>
                                <textarea
                                    value={state.prompt}
                                    onChange={handlePromptChange}
                                    placeholder="Describe what you want to add or modify..."
                                    className="w-full h-32 p-4 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/50 text-white placeholder-white/50 resize-none"
                                />
                            </div>

                            {/* Generate Button */}
                            <button
                                onClick={handleEdit}
                                disabled={state.isLoading || !state.originalImage || !state.prompt}
                                className="w-full py-4 bg-white text-indigo-600 rounded-lg font-semibold hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-white disabled:bg-white/50 disabled:text-indigo-400 transition-all flex items-center justify-center gap-2"
                            >
                                {state.isLoading ? (
                                    <>Processing...</>
                                ) : (
                                    <>
                                        <Wand2 className="w-5 h-5"/>
                                        Apply Changes
                                    </>
                                )}
                            </button>
                        </div>

                        {/* Error Messages */}
                        {state.error && (
                            <div className="text-red-300 px-4 py-2 bg-red-500/10 rounded-lg">
                                <p>{state.error}</p>
                            </div>
                        )}
                    </div>

                    {/* Right Column - Image Preview */}
                    <div className="w-full lg:w-1/2 border rounded-lg border-gray-200 p-6 flex flex-col">
                        <div className="relative h-full bg-white/5 rounded-lg flex items-center justify-center">
                            {state.originalImage ? (
                                <>
                                    <img
                                        src={state.editedImage}
                                        alt="Preview"
                                        className="max-w-full max-h-full rounded"
                                    />
                                    {state.editedImage && (
                                        <button
                                            onClick={() => {/* Download logic */
                                            }}
                                            className="absolute bottom-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full"
                                        >
                                            <Download className="w-6 h-6"/>
                                        </button>
                                    )}
                                </>
                            ) : (
                                <div className="text-white/50 text-center">
                                    <Upload className="w-12 h-12 mx-auto mb-2"/>
                                    <p>Upload an image to start editing</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ImageEditor;