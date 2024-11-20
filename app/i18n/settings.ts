// app/i18n/settings.ts
// app/i18n/settings.ts
export const locales = [
    'en',    // English
    'zh',    // Simplified Chinese
    'zh-TW', // Traditional Chinese
    'ja',    // Japanese
    'ko',    // Korean
    'es',    // Spanish
    'pt',    // Portuguese
    'de',    // German
    'fr',    // French
    'it',    // Italian
    'ru',    // Russian
    'ar',    // Arabic
    'hi',    // Hindi
    'id',    // Indonesian
    'tr',     // Turkish
    'nl',    // Dutch
    'pl',    // Polish
    'vi',    // Vietnamese
    'th',    // Thai
    'ms'     // Malay
] as const;
export type Locale = (typeof locales)[number]

export const defaultLocale: Locale = 'en'

// 用于验证locale是否有效
export function isValidLocale(locale: string): locale is Locale {
    return locales.includes(locale as Locale)
}

// 字典类型
// app/i18n/types.ts
// app/i18n/settings.ts
export type Dictionary = {
    metadata: {
        title: string
        description: string
        keywords: string
    }
    navigation: {
        home: string
        create: string
        hub: string
        pricing: string
        login: string
        profile: string
        logout: string
        flux11Ultra: string  // 添加了这个字段
    }
    hero: {
        mainTitle: string
        subTitle1: string
        subTitle2: string
        description: string
        startButton: string
        learnMoreButton: string
        examplesButton: string
        imageAlt: string
    }
    features: {
        title: string
        subtitle: string
        cards: {
            advancedAI: {
                title: string
                subtitle: string
                description: string
                highlight: string
            }
            multipleStyles: {
                title: string
                subtitle: string
                description: string
                highlight: string
            }
            advancedModel: {
                title: string
                subtitle: string
                description: string
                highlight: string
            }
            flexiblePricing: {
                title: string
                subtitle: string
                description: string
                highlight: string
            }
        }
        cta: {
            title: string
            tryButton: string
            pricingButton: string
        }
    }
    examples: {
        title: string
        subtitle: string
    }
    userExperience: {
        title: string
        subtitle: string
        steps: {
            describe: {
                title: string
                subtitle: string
                description: string
                highlight: string
            }
            generate: {
                title: string
                subtitle: string
                description: string
                highlight: string
            }
            refine: {
                title: string
                subtitle: string
                description: string
                highlight: string
            }
            download: {
                title: string
                subtitle: string
                description: string
                highlight: string
            }
        }
    }
    faq: {
        title: string
        subtitle: string
        questions: {
            what: {
                question: string
                answer: string
            }
            versions: {
                question: string
                answer: string
            }
            comparison: {
                question: string
                answer: string
            }
            imageTypes: {
                question: string
                answer: string
            }
            requirements: {
                question: string
                answer: string
            }
            fineTuning: {
                question: string
                answer: string
            }
            limits: {
                question: string
                answer: string
            }
            updates: {
                question: string
                answer: string
            }
            feedback: {
                question: string
                answer: string
            }
            commercial: {
                question: string
                answer: string
            }
        }
    }
    pricing: {
        title: string
        subtitle: string
        tiers: {
            basic: {
                name: string
                price: string
                features: string[]
            }
            premium: {
                name: string
                price: string
                features: string[]
                recommended: string
            }
            advanced: {
                name: string
                price: string
                features: string[]
            }
            common: {
                buyNowButton: string
                subscribeButton: string
                processingButton: string
                comingSoonButton: string
            }
        }
    }
    modelComparison: {
        title: string
        subtitle: string
        promptSection: {
            showPrompt: string
            hidePrompt: string
            promptTitle: string
            copyButton: string
            copiedButton: string
        }
        modelDetails: {
            processingTime: string
            outputSize: string
            bestFor: string
            keyFeatures: string
        }
        models: {
            ultra: {
                name: string
                description: string
                details: string
                features: string[]
                suitableFor: string[]
                highlight: string
                processingTime: string
                imageSize: string
            }
            schnell: {
                name: string
                description: string
                details: string
                features: string[]
                suitableFor: string[]
                highlight: string
                processingTime: string
                imageSize: string
            }
            dev: {
                name: string
                description: string
                details: string
                features: string[]
                suitableFor: string[]
                highlight: string
                processingTime: string
                imageSize: string
            }
            pro11: {
                name: string
                description: string
                details: string
                features: string[]
                suitableFor: string[]
                highlight: string
                processingTime: string
                imageSize: string
            }
            pro: {
                name: string
                description: string
                details: string
                features: string[]
                suitableFor: string[]
                highlight: string
                processingTime: string
                imageSize: string
            }
        }
    }
    imagePreview: {
        loading: string
        placeholder: string
        downloadButton: string
        dimensions: {
            width: string
            height: string
        }
    }
    autoLogout: {
        warningMessage: string
        stayLoggedIn: string
    }
    footer: {
        description: string
        quickLinks: string
        pricing: string
        contact: string
        legal: string
        terms: string
        privacy: string
        support: string
        allRightsReserved: string
        fluxAI: {
            title: string
            desc: string
        }
        soraAI: {
            title: string
            desc: string
        }
        aiBestTool: {
            title: string
            desc: string
        }
    }
    auth: {
        signIn: string
        createAccount: string
        fullName: string
        emailAddress: string
        password: string
        signInButton: string
        registerButton: string
        noAccount: string
        hasAccount: string
        errors: {
            unexpected: string
            invalidFormat: string
            authFailed: string
        }
    }
    imageGenerator: {
        title: string
        subtitle: string
        pageTitle: string
        description: string
        promptLabel: string
        promptPlaceholder: string
        modelLabel: string
        modelPoints: string
        modelPremium: string
        aspectRatioLabel: string
        outputFormatLabel: string
        generateButton: string
        generatingButton: string
        freeGenerations: string
        points: string
        loginForMore: string
        error: string
    }
    "ultraHero": {
        "heroTitle": string
        "heroSubtitle": string
        "heroDescription": string
        "heroCallToAction": string
        "heroExploreFeatures": string
        "sectionNewRelease": string
        "imageAlt": string
    },
    faqData: Array<{
        question: string
        answer: string
    }>
    ultraFeatures: {
        title: string
        subtitle: string
        features: {
            resolution: {
                title: string
                subtitle: string
                description: string
                highlight: string
            }
            speed: {
                title: string
                subtitle: string
                description: string
                highlight: string
            }
            price: {
                title: string
                subtitle: string
                description: string
                highlight: string
            }
            rawMode: {
                title: string
                subtitle: string
                description: string
                highlight: string
            }
        }
        tryNow: string
        viewPricing: string
    }
    ultraFAQ: {
        title: string
        subtitle: string
        questions: {
            what: {
                question: string
                answer: string
            }
            howToTry: {
                question: string
                answer: string
            }
            keyFeatures: {
                question: string
                answer: string
            }
            modeDifference: {
                question: string
                answer: string
            }
            comparison: {
                question: string
                answer: string
            }
        }
    }
}