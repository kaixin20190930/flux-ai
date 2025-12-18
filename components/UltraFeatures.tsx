'use client'

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {BiMoney} from "react-icons/bi";
import {DollarSign, Eye, Rabbit, TentTree} from "lucide-react";

interface UltraFeaturerops {
    dictionary: any
}

interface Feature {
    title: string;
    subtitle: string;
    description: string;
    icon: React.ElementType;  // 定义 icon 类型为 React 组件
    highlight: string;
}

export const UltraFeatures: React.FC<UltraFeaturerops> = ({dictionary}) => {
    const features = [
        {
            title: dictionary.ultraFeatures.features.resolution.title,
            subtitle: dictionary.ultraFeatures.features.resolution.subtitle,
            description: dictionary.ultraFeatures.features.resolution.description,
            icon: Eye,
            highlight: dictionary.ultraFeatures.features.resolution.highlight
        },
        {
            title: dictionary.ultraFeatures.features.speed.title,
            subtitle: dictionary.ultraFeatures.features.speed.subtitle,
            description: dictionary.ultraFeatures.features.speed.description,
            icon: Rabbit,
            highlight: dictionary.ultraFeatures.features.speed.highlight
        },
        {
            title: dictionary.ultraFeatures.features.price.title,
            subtitle: dictionary.ultraFeatures.features.price.subtitle,
            description: dictionary.ultraFeatures.features.price.description,
            icon: DollarSign,
            highlight: dictionary.ultraFeatures.features.price.highlight
        },
        {
            title: dictionary.ultraFeatures.features.rawMode.title,
            subtitle: dictionary.ultraFeatures.features.rawMode.subtitle,
            description: dictionary.ultraFeatures.features.rawMode.description,
            icon: TentTree,
            highlight: dictionary.ultraFeatures.features.rawMode.highlight
        }
    ];
    return (
        <section id="features" className="relative py-20 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500"/>
            <div className="absolute inset-0 bg-black/50"/>
            <div
                className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]"/>

            <div className="container relative mx-auto px-4 z-10">
                <h2 className="text-4xl font-bold text-center mb-4 text-white">{dictionary.ultraFeatures.title}</h2>
                <p className="text-xl text-center mb-12 text-indigo-200">
                    {dictionary.ultraFeatures.subtitle}
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