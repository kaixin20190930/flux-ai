import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {BiMoney} from "react-icons/bi";
import {DollarSign, Eye, Rabbit, TentTree} from "lucide-react";

interface Feature {
    title: string;
    subtitle: string;
    description: string;
    icon: React.ElementType;  // 定义 icon 类型为 React 组件
    highlight: string;
}

const features: Feature[] = [
    {
        title: "Ultra Higher Resolution",
        subtitle: "FLUX 1.1 Ultra Resolution Engine",
        description: "Create stunning images up to 2096x2096 resolution with exceptional detail and clarity. Perfect for professional use and large-format printing.",
        icon: Eye,
        highlight: "Up to 2096x2096"
    },
    {
        title: " No Compromise in Speed",
        subtitle: "Faster",
        description: "Unlike many high-resolution models that experience significant slowdowns at higher resolutions, our performance benchmarks show sustained fast generation times—over 2.5x faster than comparable high-resolution offerings.",
        icon: Rabbit,
        highlight: "10s 2.5X"
    },
    {
        title: "Competitive Price",
        subtitle: "increase in quantity but not price",
        description: "This model is competitively priced, with the same price per image as the other versions of the Pro.",
        icon: DollarSign,
        highlight: "Material Advantages"
    },
    {
        title: "Raw Mode Realism",
        subtitle: "FLUX Ultra Generation",
        description: "FLUX1.1 [pro] – raw mode: For creators seeking authenticity, our new raw mode captures the genuine feel of candid photography. Toggle this feature to generate images with a less synthetic, more natural aesthetic. Compared to other text-to-image models, raw mode significantly increases diversity in human subjects and enhances the realism of nature photography.",
        icon: TentTree,
        highlight: "Human Subjects and Nature"
    }
];

export const UltraFeatures = () => {
    return (
        <section id="features" className="relative py-20 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500"/>
            <div className="absolute inset-0 bg-black/50"/>
            <div
                className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]"/>

            <div className="container relative mx-auto px-4 z-10">
                <h2 className="text-4xl font-bold text-center mb-4 text-white">FLUX 1.1 Ultra Features</h2>
                <p className="text-xl text-center mb-12 text-indigo-200">
                    Use raw mode for realism.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {features.map((feature, index) => {
                        const IconComponent = feature.icon;  // 获取图标组件
                        return (
                            <div
                                key={index}
                                className="bg-white/5 backdrop-filter backdrop-blur-sm rounded-xl p-8 transition-all duration-300 hover:shadow-xl hover:bg-white/10 border border-white/10"
                            >
                                <div className="flex items-start mb-6">
                                    <div
                                        className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-full p-4 mr-4">
                                        <IconComponent className="w-6 h-6 text-white"/> {/* 使用图标组件 */}
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-semibold text-white mb-1">{feature.title}</h3>
                                        <p className="text-indigo-300 text-sm">{feature.subtitle}</p>
                                    </div>
                                </div>
                                <p className="text-indigo-200 mb-4">{feature.description}</p>
                                <div className="bg-white/5 rounded-lg px-4 py-2 inline-block">
                                    <span className="text-blue-300 font-medium">{feature.highlight}</span>
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="mt-16 text-center">
                    <h3 className="text-2xl font-semibold mb-4 text-white">Experience Next-Gen AI Image Generation</h3>
                    <div className="space-x-4">
                        <Link
                            href="/create?model=ultra"
                            className="inline-block bg-gradient-to-r from-purple-600 to-blue-600 text-white px-8 py-3 rounded-full font-semibold hover:from-purple-700 hover:to-blue-700 transition duration-300 shadow-lg hover:shadow-xl"
                        >
                            Try Ultra Now
                        </Link>
                        <Link
                            href="/pricing"
                            className="inline-block bg-white/10 text-white px-8 py-3 rounded-full font-semibold hover:bg-white/20 transition duration-300"
                        >
                            View Pricing
                        </Link>
                    </div>
                </div>
            </div>
        </section>
    );
};