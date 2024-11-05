import React, {useState} from 'react';
import {Zap, Code, Wand2, Crown, Sparkles, Star, Terminal, CheckCheck, Copy} from 'lucide-react';

const FluxModelsComparison = () => {
    const prompt = "Prompt: Create a captivating portrait of a voluptuous boho woman with green eyes and long, wavy blonde hair, she is standing. She has a fair complexion adorned with delicate freckles, and her expression is contemplative, reflecting a moment of deep thought. She wears a white-colored, off-shoulder linen satin dress, with deep neck linen, complemented by a necklace and various boho jewelry that accentuates her bohemian style., photo, poster, vibrant, portrait photography, fashion\n" +
        "\n";

    const models = [
        {
            id: 'schnell',
            name: "Flux Schnell",
            description: "The fastest image generation model tailored for local development and personal use.",
            icon: Zap,
            features: ["High Performance", "Fast Generation", "Open License"],
            suitableFor: ["Personal", "Scientific", "Commercial Purposes"],
            highlight: "Speed Optimized",
            details: "Optimized for speed and efficiency, Flux Schnell delivers quick results perfect for initial concepts and rapid prototyping. Ideal for developers and designers who need quick iterations.",
            image: "/pictures/modelcompare/Schnell.jpg",
            processingTime: "0.8 seconds",
            costEffective: true,
            imageSize: "1024*1024",

        },
        {
            id: 'dev',
            name: "Flux Dev",
            description: "A 12 billion parameter rectified flow transformer capable of generating images from text descriptions.",
            icon: Star,
            features: ["Competitive Performance", "Efficient Training", "Open Research"],
            suitableFor: ["Personal", "Scientific", "Commercial Purposes"],
            highlight: "More Efficient",
            details: "A powerful 12B parameter image generation model delivering high-quality outputs with commercial usage support, optimized performance, and clear ethical guidelines for responsible AI development.",
            image: "/pictures/modelcompare/Dev.jpg",
            processingTime: "3-5 seconds",
            costEffective: true,
            imageSize: "1024*1024",
        },
        {
            id: 'pro11',
            name: "Flux 1.1 Pro",
            description: "Faster, better FLUX Pro. Text-to-image model with excellent image quality, prompt adherence, and output diversity..",
            icon: Sparkles,
            features: ["6x Faster Generation", "Enhanced Quality", "Advanced Architecture"],
            suitableFor: ["Professional Workflows", "Quality-Critical Projects", "Production Environments"],
            highlight: "Enhanced Quality",
            details: "A state-of-the-art 12B parameter image generation model featuring 6x faster speed, enhanced quality, and benchmark-leading performance, built with advanced hybrid architecture combining multimodal and parallel diffusion transformer blocks for professional and production environments.",
            image: "/pictures/modelcompare/1.1Pro.jpg",
            processingTime: "8-10 seconds",
            costEffective: false,
            imageSize: "1440*1440",
        },
        {
            id: 'pro',
            name: "Flux Pro",
            description: "State-of-the-art image generation with top of the line prompt following, visual quality, image detail and output diversity.",
            icon: Crown,
            features: ["Top Performance", "Flexible Resolution", "Advanced Architecture"],
            suitableFor: ["Professional Projects", "Versatile Applications"],
            highlight: "Premium Quality",
            details: "A premium 12B parameter image generation model offering state-of-the-art performance with superior visual quality and versatile resolution support, powered by hybrid architecture combining multimodal and parallel diffusion transformer blocks.",
            image: "/pictures/modelcompare/Pro.jpg",
            processingTime: "15-25 seconds",
            costEffective: false,
            imageSize: "1440*1440",
        }
    ];

    const [selectedModel, setSelectedModel] = useState(models[0]);
    const [showPrompt, setShowPrompt] = useState(false);
    const [isCopied, setIsCopied] = useState(false);
    const handleCopyPrompt = async () => {
        try {
            await navigator.clipboard.writeText(prompt);
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000); // 2秒后重置复制状态
        } catch (err) {
            console.error('Failed to copy text: ', err);
        }
    };
    return (
        <section
            className="relative flex flex-col bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 overflow-auto">
            <div className="absolute inset-0 bg-black/50"/>
            <div
                className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]"/>

            <div className="relative z-10 p-6">
                <div className="text-center mb-8">
                    <h2 className="text-3xl font-bold text-white mb-4">
                        Flux AI Models Comparison
                    </h2>
                    <p className="text-lg text-indigo-100">
                        Choose the perfect model for your creative needs
                    </p>
                </div>

                <div className="flex-1 max-w-7xl mx-auto flex flex-col lg:flex-row gap-8">
                    {/* Left Column - Model Selection */}
                    {/*<div className="lg:w-2/5 space-y-4 ">*/}
                    <div className="lg:w-2/5 flex flex-col">
                        <div className="bg-white/5 border border-white/10 rounded-xl p-6 backdrop-blur-sm h-full">
                            <div className="space-y-6">
                                {models.map((model) => (
                                    <div
                                        key={model.id}
                                        onClick={() => setSelectedModel(model)}
                                        className={`cursor-pointer p-4 rounded-xl transition-all duration-300 border 
                                          ${selectedModel.id === model.id
                                            ? 'bg-white/15 border-white/30 shadow-lg'
                                            : 'bg-white/5 border-white/10 hover:bg-white/10'}`}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={`rounded-full p-3 
                                            ${selectedModel.id === model.id
                                                ? 'bg-gradient-to-br from-purple-500 to-indigo-600'
                                                : 'bg-white/10'}`}>
                                                <model.icon className="w-6 h-6 text-white"/>
                                            </div>
                                            <div className="flex-1">
                                                <h3 className="text-xl font-semibold text-white">{model.name}</h3>
                                                <p className="text-indigo-200 text-sm mt-1">{model.description}</p>
                                            </div>
                                            {selectedModel.id === model.id && (
                                                <div className="w-2 h-2 rounded-full bg-purple-400 animate-pulse"/>
                                            )}
                                        </div>
                                        {selectedModel.id === model.id && (
                                            <div className="mt-4 pt-4 border-t border-white/10">
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <h4 className="text-white text-sm font-medium mb-2">Processing
                                                            Time</h4>
                                                        <p className="text-indigo-200 text-sm flex items-center gap-2">
                                                            <Sparkles className="w-4 h-4"/>
                                                            {model.processingTime}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <h4 className="text-white text-sm font-medium mb-2">Output
                                                            Size</h4>
                                                        <p className="text-indigo-200 text-sm">
                                                            {model.imageSize}
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="mt-4">
                                                    <h4 className="text-white text-sm font-medium mb-2">Best For</h4>
                                                    <div className="flex flex-wrap gap-2">
                                                        {model.suitableFor.map((use, idx) => (
                                                            <span
                                                                key={idx}
                                                                className="bg-white/10 rounded-full px-3 py-1 text-xs text-indigo-200"
                                                            >
                                                              {use}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Model Details */}
                    <div className="lg:w-3/5">
                        <div className="bg-white/5 border border-white/10 rounded-xl p-6 backdrop-blur-sm">
                            <div className="mb-6">
                                <button
                                    onClick={() => setShowPrompt(!showPrompt)}
                                    className="flex items-center gap-2 text-white hover:text-purple-300 transition-colors mb-2"
                                >
                                    <Terminal className="w-4 h-4"/>
                                    <span className="text-sm font-medium">
                                     {showPrompt ? 'Hide Prompt' : 'Show Prompt'}
                                    </span>
                                </button>
                                {showPrompt && (
                                    <div className="bg-black/20 rounded-lg p-4 mb-4">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-sm text-indigo-200">Prompt used for all models</span>
                                            <button
                                                onClick={handleCopyPrompt}
                                                className="flex items-center gap-1.5 text-white/70 hover:text-white transition-colors text-sm bg-white/5 rounded-md px-2.5 py-1"
                                            >
                                                {isCopied ? (
                                                    <>
                                                        <CheckCheck className="w-4 h-4 text-green-400"/>
                                                        <span className="text-green-400">Copied!</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Copy className="w-4 h-4"/>
                                                        <span>Copy prompt</span>
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                        <p className="text-white text-sm font-mono bg-black/20 p-3 rounded">
                                            {prompt}
                                        </p>
                                    </div>
                                )}
                            </div>
                            <div className="mb-6 flex items-center justify-center">
                                <img
                                    src={selectedModel.image}
                                    alt={`${selectedModel.name} example`}
                                    className="rounded-lg max-w-full max-h-96 w-auto h-auto"
                                />
                            </div>

                            <div className="space-y-6">
                                <div>
                                    <h3 className="text-2xl font-bold text-white mb-2">
                                        {selectedModel.name}
                                    </h3>
                                    <p className="text-indigo-200">
                                        {selectedModel.details}
                                    </p>
                                </div>

                                <div>
                                    <h4 className="text-white font-semibold mb-2">Key Features</h4>
                                    <ul className="grid grid-cols-2 gap-2">
                                        {selectedModel.features.map((feature, idx) => (
                                            <li key={idx} className="text-indigo-200 text-sm flex items-center gap-2">
                                                <div className="w-1 h-1 bg-purple-400 rounded-full"/>
                                                {feature}
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                <div className="flex items-center justify-between">
                                    <div className="bg-white/5 rounded-lg px-3 py-1.5">
                                        <span className="text-purple-300 text-sm font-medium">
                                          {selectedModel.highlight}
                                        </span>
                                    </div>
                                    <div className="bg-white/5 rounded-lg px-3 py-1.5">
                                        <p className="text-purple-300 text-sm font-medium">
                                            {selectedModel.imageSize}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default FluxModelsComparison;