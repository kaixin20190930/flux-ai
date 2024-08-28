import React from 'react'
import Image from 'next/image'

const advantages = [
    {
        title: "Advanced AI Algorithms",
        description: "Our proprietary deep learning models are trained on diverse, high-quality datasets, ensuring superior image generation across various styles and concepts.",
        icon: "/icons/ai-algorithm.svg"
    },
    {
        title: "Real-time Generation",
        description: "Experience the power of AI as your ideas transform into stunning visuals in mere seconds, thanks to our optimized cloud infrastructure.",
        icon: "/icons/real-time.svg"
    },
    {
        title: "Customizable Outputs",
        description: "Fine-tune generated images with intuitive controls, allowing for precise adjustments in style, composition, and color to meet your exact vision.",
        icon: "/icons/customizable.svg"
    },
    {
        title: "Multilingual Support",
        description: "Break language barriers with our AI that understands and generates images from prompts in multiple languages, making creativity truly global.",
        icon: "/icons/multilingual.svg"
    },
    {
        title: "Ethical AI",
        description: "We prioritize responsible AI development, ensuring our technology respects copyright, avoids bias, and promotes positive societal impact.",
        icon: "/icons/ethical-ai.svg"
    },
    {
        title: "Seamless Integration",
        description: "Easily incorporate our AI image generation capabilities into your workflow with our robust API and comprehensive documentation.",
        icon: "/icons/integration.svg"
    }
]

export const CoreTechAdvantages: React.FC = () => {
    return (
        <section className="relative py-20 overflow-hidden">
            {/* 柔和的背景渐变 */}
            <div className="absolute inset-0 bg-gradient-to-b from-purple-700 via-indigo-800 to-indigo-900"></div>

            {/* 顶部过渡元素 */}
            <div className="absolute top-0 inset-x-0 h-40">
                <div className="absolute inset-0 bg-gradient-to-b from-purple-600 to-transparent opacity-70"></div>
                <div className="absolute inset-0 bg-[url('/subtle-noise.png')] opacity-5"></div>
            </div>

            <div className="container relative mx-auto px-4 z-10">
                <h2 className="text-4xl font-bold text-center mb-4 text-white">Core Technology Advantages</h2>
                <p className="text-xl text-center mb-12 text-indigo-200">Discover how Flux AI cutting-edge technology
                    revolutionizes image generation</p>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {advantages.map((advantage, index) => (
                        <div key={index}
                             className="bg-white/5 backdrop-filter backdrop-blur-sm rounded-xl p-6 transition-all duration-300 hover:shadow-xl hover:bg-white/10 border border-white/10">
                            <div className="flex items-center mb-4">
                                <div className="bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full p-3 mr-4">
                                    <Image src={advantage.icon} alt={advantage.title} width={24} height={24}
                                           className="text-white"/>
                                </div>
                                <h3 className="text-2xl font-semibold text-white">{advantage.title}</h3>
                            </div>
                            <p className="text-indigo-200">{advantage.description}</p>
                        </div>
                    ))}
                </div>

                <div className="mt-16 text-center">
                    <h3 className="text-2xl font-semibold mb-4 text-white">Ready to experience the future of AI-powered
                        image generation?</h3>
                    <a href="/signup"
                       className="inline-block bg-gradient-to-r from-purple-500 to-indigo-600 text-white px-8 py-3 rounded-full font-semibold hover:from-purple-600 hover:to-indigo-700 transition duration-300 shadow-lg hover:shadow-xl">
                        Get Started Now
                    </a>
                </div>
            </div>

            {/* 底部过渡元素 */}
            <div className="absolute bottom-0 inset-x-0 h-40">
                <div className="absolute inset-0 bg-gradient-to-t from-indigo-900 to-transparent opacity-70"></div>
                <div className="absolute inset-0 bg-[url('/subtle-noise.png')] opacity-5"></div>
            </div>
        </section>
    )
}

export default CoreTechAdvantages