import {AIImageGenerator} from "@/components/AIImageGenerator";
import {getDictionary} from "@/app/i18n/utils";
import type {Locale} from "@/app/i18n/settings";

export const runtime = 'edge';

export default async function AIImageGeneratorPage({
                                                       params: {locale},
                                                   }: {
    params: { locale: string };
}) {
    const dictionary = await getDictionary(locale as Locale);

    return <AIImageGenerator dictionary={dictionary} locale={locale}/>;
}