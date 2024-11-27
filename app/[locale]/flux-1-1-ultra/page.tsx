import {UltraHero} from '@/components/UltraHero';
import {UltraFeatures} from '@/components/UltraFeatures';
import {UltraFAQ} from "@/components/UltraFAQ";
import {getDictionary} from '@/app/i18n/utils'
import type {Locale} from '@/app/i18n/settings'
export const runtime = 'edge'
export default async function UltraPage({
                                            params: {locale}
                                        }: {
    params: { locale: string }
}) {
    // 获取字典
    const dictionary = await getDictionary(locale as Locale)
    return (
        <main>
            <UltraHero dictionary={dictionary} locale={locale}/>
            <UltraFeatures dictionary={dictionary}/>
            <UltraFAQ dictionary={dictionary}/>
        </main>
    );
}