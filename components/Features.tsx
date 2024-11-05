import React from 'react'
import Image from 'next/image'

const features = [
    {
        title: "Advanced AI Image Generation",
        subtitle: "FLUX AI Professional Image Creator",
        description: "Generate exceptional images up to 1440x1440 resolution with our transformer-based AI model. Support FLUX [pro], [dev], and [schnell] image generation models from BlackForestLabs.",
        icon: "/icons/high-quality.svg",
        highlight: "Up to 1440x1440 resolution"
    },
    {
        title: "Multiple Style Controls",
        subtitle: "FLUX AI Style Engine",
        description: "Create images in various styles from photorealistic to artistic. Supports comprehensive style controls including anime, digital art, oil painting, and more with precise prompt control.",
        icon: "/icons/style.svg",
        highlight: "Multiple artistic styles"
    },
    {
        title: "Advanced Model Architecture",
        subtitle: "FLUX AI Technology",
        description: "Powered by state-of-the-art transformer architecture with over 12B parameters, delivering exceptional image quality and precise prompt adherence through our proprietary training techniques.",
        icon: "/icons/tech.svg",
        highlight: "12B+ parameters"
    },
    {
        title: "Flexible Pricing Plans",
        subtitle: "FLUX AI Pricing",
        description: "Start with our free tier (3 Free Generations per day with No Login) or upgrade to premium plans from $9.9 200 generations . Access advanced features including higher resolution, priority generation, and increased generation limits.",
        icon: "/icons/pricing.svg",
        highlight: "Starting from Free"
    }
]

export const Features: React.FC = () => {
    return (
        <section id="features" className="relative py-20 overflow-hidden">
            {/*<div className="absolute inset-0 bg-gradient-to-b from-purple-700 via-indigo-800 to-indigo-900"></div>*/}
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500"/>

            {/* Overlay effects */}
            <div className="absolute inset-0 bg-black/50"/>
            <div
                className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]"/>
            <div className="container relative mx-auto px-4 z-10">
                <h2 className="text-4xl font-bold text-center mb-4 text-white">Why Choose Flux AI</h2>
                <p className="text-xl text-center mb-12 text-indigo-200">
                    Enterprise-Grade AI Image Generation for Professional Creators
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {features.map((feature, index) => (
                        <div key={index}
                             className="bg-white/5 backdrop-filter backdrop-blur-sm rounded-xl p-8 transition-all duration-300 hover:shadow-xl hover:bg-white/10 border border-white/10">
                            <div className="flex items-start mb-6">
                                <div className="bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full p-4 mr-4">
                                    <Image src={feature.icon} alt={feature.title} width={40} height={40}
                                           className="text-white"/>
                                </div>
                                <div>
                                    <h3 className="text-2xl font-semibold text-white mb-1">{feature.title}</h3>
                                    <p className="text-indigo-300 text-sm">{feature.subtitle}</p>
                                </div>
                            </div>
                            <p className="text-indigo-200 mb-4">{feature.description}</p>
                            <div className="bg-white/5 rounded-lg px-4 py-2 inline-block">
                                <span className="text-purple-300 font-medium">{feature.highlight}</span>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-16 text-center">
                    <h3 className="text-2xl font-semibold mb-4 text-white">Experience Professional AI Image
                        Generation</h3>
                    <div className="space-x-4">
                        <a href="/create"
                           className="inline-block bg-gradient-to-r from-purple-500 to-indigo-600 text-white px-8 py-3 rounded-full font-semibold hover:from-purple-600 hover:to-indigo-700 transition duration-300 shadow-lg hover:shadow-xl">
                            Try It Free
                        </a>
                        <a href="#pricing"
                           className="inline-block bg-white/10 text-white px-8 py-3 rounded-full font-semibold hover:bg-white/20 transition duration-300"
                           onClick={(e) => {
                               e.preventDefault();
                               document.getElementById('pricing')?.scrollIntoView({
                                   behavior: 'smooth'
                               });
                           }}>
                            View Pricing
                        </a>
                    </div>
                </div>
            </div>
        </section>
    )
}

export default Features;