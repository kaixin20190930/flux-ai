// app/i18n/utils.ts

const dictionaries: Record<string, () => Promise<any>> = {
    en: () => import('./locales/en.json').then(module => module.default),
    zh: () => import('./locales/zh.json').then(module => module.default),
    'zh-TW': () => import('./locales/zh-TW.json').then(module => module.default),
    ja: () => import('./locales/ja.json').then(module => module.default),
    ko: () => import('./locales/ko.json').then(module => module.default),
    es: () => import('./locales/es.json').then(module => module.default),
    pt: () => import('./locales/pt.json').then(module => module.default),
    de: () => import('./locales/de.json').then(module => module.default),
    fr: () => import('./locales/fr.json').then(module => module.default),
    it: () => import('./locales/it.json').then(module => module.default),
    ru: () => import('./locales/ru.json').then(module => module.default),
    ar: () => import('./locales/ar.json').then(module => module.default),
    hi: () => import('./locales/hi.json').then(module => module.default),
    id: () => import('./locales/id.json').then(module => module.default),
    tr: () => import('./locales/tr.json').then(module => module.default),
    nl: () => import('./locales/nl.json').then(module => module.default),
    pl: () => import('./locales/pl.json').then(module => module.default),
    vi: () => import('./locales/vi.json').then(module => module.default),
    th: () => import('./locales/th.json').then(module => module.default),
    ms: () => import('./locales/ms.json').then(module => module.default),
}

export const getany = async (locale: string) => {
    try {
        return await dictionaries[locale]()
    } catch (error) {
        // 如果找不到对应的语言文件，返回英文作为后备
        if (locale !== 'en') {
            return await dictionaries['en']()
        }
        throw new Error('Failed to load dictionary.')
    }
}