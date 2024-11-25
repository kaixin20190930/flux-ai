// app/layout.tsx
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import '@/styles/globals.css'
import type {Metadata} from 'next'
import {AutoLogoutWarning} from "@/components/AutoLogoutWarning"
import {getDictionary} from './i18n/utils'
import {defaultLocale} from './i18n/settings'
import Providers from "@/components/Providers";

// 为根路径生成 metadata
export async function generateMetadata(): Promise<Metadata> {
    const dictionary = await getDictionary(defaultLocale)

    return {
        title: {
            template: '%s | Flux AI',
            default: dictionary.metadata.title,
        },
        description: dictionary.metadata.description,
        keywords: dictionary.metadata.keywords,
        alternates: {
            canonical: 'https://flux-ai-img.com',
            languages: {
                // 默认版本
                'x-default': 'https://flux-ai-img.com',

                // 英语变体
                'en': 'https://flux-ai-img.com/en',
                'en-US': 'https://flux-ai-img.com',
                'en-GB': 'https://flux-ai-img.com/en',
                'en-AU': 'https://flux-ai-img.com/en',
                'en-CA': 'https://flux-ai-img.com/en',

                // 中文变体
                'zh': 'https://flux-ai-img.com/zh',
                'zh-CN': 'https://flux-ai-img.com/zh',
                'zh-TW': 'https://flux-ai-img.com/zh',
                'zh-HK': 'https://flux-ai-img.com/zh',

                // 日语
                'ja': 'https://flux-ai-img.com/ja',
                'ja-JP': 'https://flux-ai-img.com/ja',

                // 韩语
                'ko': 'https://flux-ai-img.com/ko',
                'ko-KR': 'https://flux-ai-img.com/ko',

                // 法语
                'fr': 'https://flux-ai-img.com/fr',
                'fr-FR': 'https://flux-ai-img.com/fr',
                'fr-CA': 'https://flux-ai-img.com/fr',

                // 德语
                'de': 'https://flux-ai-img.com/de',
                'de-DE': 'https://flux-ai-img.com/de',
                'de-AT': 'https://flux-ai-img.com/de',
                'de-CH': 'https://flux-ai-img.com/de',

                // 西班牙语
                'es': 'https://flux-ai-img.com/es',
                'es-ES': 'https://flux-ai-img.com/es',
                'es-MX': 'https://flux-ai-img.com/es',
                'es-AR': 'https://flux-ai-img.com/es',

                // 葡萄牙语
                'pt': 'https://flux-ai-img.com/pt',
                'pt-PT': 'https://flux-ai-img.com/pt',
                'pt-BR': 'https://flux-ai-img.com/pt',

                // 意大利语
                'it': 'https://flux-ai-img.com/it',
                'it-IT': 'https://flux-ai-img.com/it',

                // 俄语
                'ru': 'https://flux-ai-img.com/ru',
                'ru-RU': 'https://flux-ai-img.com/ru',

                // 阿拉伯语
                'ar': 'https://flux-ai-img.com/ar',
                'ar-SA': 'https://flux-ai-img.com/ar',

                // 印地语
                'hi': 'https://flux-ai-img.com/hi',
                'hi-IN': 'https://flux-ai-img.com/hi',

                // 土耳其语
                'tr': 'https://flux-ai-img.com/tr',
                'tr-TR': 'https://flux-ai-img.com/tr',

                // 荷兰语
                'nl': 'https://flux-ai-img.com/nl',
                'nl-NL': 'https://flux-ai-img.com/nl',
                'nl-BE': 'https://flux-ai-img.com/nl',

                // 波兰语
                'pl': 'https://flux-ai-img.com/pl',
                'pl-PL': 'https://flux-ai-img.com/pl',

                // 越南语
                'vi': 'https://flux-ai-img.com/vi',
                'vi-VN': 'https://flux-ai-img.com/vi',

                // 泰语
                'th': 'https://flux-ai-img.com/th',
                'th-TH': 'https://flux-ai-img.com/th',

                // 印尼语
                'id': 'https://flux-ai-img.com/id',
                'id-ID': 'https://flux-ai-img.com/id',

                // 马来语
                'ms': 'https://flux-ai-img.com/ms',
                'ms-MY': 'https://flux-ai-img.com/ms',
            },
        },
    }
}

export default async function RootLayout({
                                             children,
                                         }: {
    children: React.ReactNode
}) {
    const dictionary = await getDictionary(defaultLocale)

    return (
        <html>
        <body className="flex flex-col min-h-screen">
        <Providers>{children}</Providers>
        </body>
        </html>
    )
}