import React from 'react';
import {Camera, Wand2, Sliders, Download} from 'lucide-react';

const steps = [
    {
        title: "Describe Your Vision",
        description: "Simply type in a description of the image you want to create. Our AI understands natural language input.",
        icon: Camera,
        alt: "Image description process",
        image: "/pictures/userexperience/step1.jpg",
        subtitle: "AI-Powered Text Understanding",
        highlight: "Natural Language Processing"
    },
    {
        title: "AI Magic at Work",
        description: "Our powerful AI processes your description and generates unique image options that match your vision.",
        icon: Wand2,
        alt: "AI generation process",
        image: "/pictures/userexperience/step2.jpg",
        subtitle: "Advanced Image Generation",
        highlight: "Multiple Style Options"
    },
    {
        title: "Refine and Perfect",
        description: "Use our intuitive tools to adjust and refine the generated images until they match your expectations.",
        icon: Sliders,
        alt: "Image refinement process",
        image: "/pictures/userexperience/step3.jpg",
        subtitle: "Fine-tune Your Results",
        highlight: "Professional Editing Tools"
    },
    {
        title: "Download and Use",
        description: "Download your AI-generated masterpiece in high resolution, ready for your creative projects.",
        icon: Download,
        alt: "Download process",
        image: "/pictures/userexperience/step4.jpg",
        subtitle: "Ready for Your Projects",
        highlight: "High Resolution Output"
    }
];

export const UserExperience: React.FC = () => {
    return (
        <section id="examples"
                 className="relative flex flex-col bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 overflow-auto">
            {/* 背景层 */}
            <div className="absolute inset-0 bg-black/50"/>
            <div
                className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]"/>

            <div className="relative z-10 h-full overflow-hidden">
                <div className="min-h-screen mx-auto flex flex-col px-6 pb-8">
                    {/* 标题部分 - 减小上下边距 */}
                    <div className="text-center mb-6 pt-4">
                        <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
                            How It Works
                        </h1>
                        <p className="text-lg text-indigo-100 max-w-3xl mx-auto">
                            Create stunning AI-generated images with our Flux AI image generator
                        </p>
                    </div>

                    {/* 卡片网格 - 优化间距和大小 */}
                    <div className="flex-1 flex items-start py-4">
                        <div className="w-full max-w-7xl mx-auto">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {steps.map((step, index) => (
                                    <div
                                        key={index}
                                        className="bg-white/5 backdrop-filter backdrop-blur-sm rounded-xl p-6 transition-all duration-300 hover:shadow-xl hover:bg-white/10 border border-white/10"
                                    >
                                        {/* 标题和图标部分 */}
                                        <div className="flex items-start mb-4">
                                            <div
                                                className="bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full p-3 mr-4">
                                                <step.icon className="w-6 h-6 text-white"/>
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-semibold text-white mb-1">{step.title}</h3>
                                                <p className="text-indigo-300 text-sm">{step.subtitle}</p>
                                            </div>
                                        </div>

                                        {/* 描述文本 - 减小字体和边距 */}
                                        <p className="text-indigo-200 text-sm mb-4">{step.description}</p>

                                        {/* 图片部分 - 减小高度 */}
                                        <div className="mb-4">
                                            <div
                                                className="bg-black/20 rounded-lg p-2 flex items-center justify-center">
                                                <img
                                                    src={step.image}
                                                    alt={step.alt}
                                                    className="rounded-lg max-w-full max-h-42 w-auto h-auto"
                                                />
                                            </div>
                                        </div>

                                        {/* 高亮标签 */}
                                        <div className="bg-white/5 rounded-lg px-3 py-1.5 inline-block">
                                            <span
                                                className="text-purple-300 text-sm font-medium">{step.highlight}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};