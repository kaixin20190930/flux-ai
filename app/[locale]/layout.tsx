// app/[locale]/layout.tsx
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import '@/styles/globals.css'
import type {Metadata} from 'next'
import {AutoLogoutWarning} from "@/components/AutoLogoutWarning"
import {getany} from '../i18n/utils'
import {Locale, defaultLocale, locales} from '../i18n/settings'
import {redirect} from 'next/navigation'
import {AuthProviderWrapper} from '@/components/providers/AuthProviderWrapper'
import {GoogleOAuthProvider} from '@/components/providers/GoogleOAuthProvider'

// 动态生成 metadata
export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
    const { locale } = await Promise.resolve(params)
    // 验证语言并获取字典
    const validLocale = locales.includes(locale as Locale) ? locale : defaultLocale
    const dictionary = await getany(validLocale)

    return {
        title: {
            template: '%s | Flux AI',
            default: dictionary.metadata.title, // 'Flux AI Image Generator for Free'
        },
        description: dictionary.metadata.description,
        keywords: dictionary.metadata.keywords,
        alternates: {
            canonical: 'https://flux-ai-img.com',
            languages: {
                'en': 'https://flux-ai-img.com/en',
                'zh': 'https://flux-ai-img.com/zh',
            },
        },
    }
}

// 生成静态路由参数
export function generateStaticParams() {
    return locales.map((locale) => ({locale}))
}

async function getValidLocale(locale: string): Promise<Locale> {
    if (!locales.includes(locale as Locale)) {
        return defaultLocale
    }
    return locale as Locale
}

export default async function RootLayout({
                                             children,
                                             params,
                                         }: {
    children: React.ReactNode
    params: { locale: string }
}) {
    const { locale } = await Promise.resolve(params)
    const validLocale = await getValidLocale(locale)

    if (validLocale !== locale) {
        redirect(`/${validLocale}`)
    }

    const dictionary = await getany(validLocale)

    return (
        <GoogleOAuthProvider>
            <AuthProviderWrapper>
                <Header dictionary={dictionary}/>
                <main className="flex-grow">
                    {children}
                    <AutoLogoutWarning dictionary={dictionary} locale={locale}/>
                </main>
                <Footer dictionary={dictionary}/>
            </AuthProviderWrapper>
        </GoogleOAuthProvider>
    )
}
