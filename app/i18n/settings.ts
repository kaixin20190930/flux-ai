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
        search: string
        hub: string
        pricing: string
        login: string
        profile: string
        logout: string
        flux11Ultra: string
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
        description: string
        loginRequired: string
        tiers: {
            starter: {
                name: string
                price: string
                points: number
                features: string[]
            }
            basic: {
                name: string
                price: string
                points: number
                features: string[]
            }
            premium: {
                name: string
                price: string
                points: number
                features: string[]
                recommended: string
            }
            professional: {
                name: string
                price: string
                points: number
                features: string[]
            }
            enterprise: {
                name: string
                price: string
                points: number
                features: string[]
            }
            common: {
                buyNowButton: string
                processingButton: string
                loginToBuy: string
                pointsLabel: string
                permanentValidity: string
                mostPopular: string
                subscribeButton: string
                comingSoonButton: string
            }
        }
        pointsUsage: {
            title: string
            subtitle: string
            models: {
                fluxSchnell: {
                    name: string
                    points: number
                    description: string
                }
                fluxDev: {
                    name: string
                    points: number
                    description: string
                }
                fluxPro: {
                    name: string
                    points: number
                    description: string
                }
                fluxProUltra: {
                    name: string
                    points: number
                    description: string
                }
                imageSearch: {
                    name: string
                    points: number
                    description: string
                }
                imageEdit: {
                    name: string
                    points: number
                    description: string
                }
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
        guidanceLabel: string
        outputQualityLabel: string
        inferenceStepsLabel: string
        numOutputsLabel: string
    }
    fluxTools: {
        common: {
            aspectRatioLabel: string
            outputFormatLabel: string
            generateButton: string
            generating: string
            downloadButton: string
            previewPlaceholder: string
            invalidFileType: string
            noImageError: string
            generationError: string
        }
        redux: {
            title: string
            subtitle: string
            pageTitle: string
            description: string
            guidanceLabel: string
            outputQualityLabel: string
            inferenceStepsLabel: string
            numOutputsLabel: string
        }
        depth: {
            title: string
            subtitle: string
            pageTitle: string
            description: string
            guidanceLabel: string
            outputQualityLabel: string
            inferenceStepsLabel: string
            numOutputsLabel: string
            cannyLowThresholdLabel: string
            cannyHighThresholdLabel: string
            safetyToleranceLabel: string
            promptLabel: string
            promptPlaceholder: string
            promptUpsamplingLabel: string
        }
        fill: {
            title: string
            subtitle: string
            pageTitle: string
            description: string
            maskLabel: string
            clearMask: string
            promptLabel: string
            promptPlaceholder: string
            guidanceLabel: string
            inferenceStepsLabel: string
            outputFormatLabel: string
            safetyToleranceLabel: string
            promptUpsamplingLabel: string
            promptUpsamplingEnabled: string
            outpaintingLabel: string
            outpaintingOptions: {
                none: string
                zoomOut15: string
                zoomOut2: string
                makeSquare: string
                leftOutpaint: string
                rightOutpaint: string
                topOutpaint: string
                bottomOutpaint: string
            }
        }
        canny: {
            title: string
            subtitle: string
            pageTitle: string
            description: string
            guidanceLabel: string
            outputQualityLabel: string
            inferenceStepsLabel: string
            numOutputsLabel: string
            cannyLowThresholdLabel: string
            cannyHighThresholdLabel: string
            safetyToleranceLabel: string
            promptLabel: string
            promptPlaceholder: string
            promptUpsamplingLabel: string
        }
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
