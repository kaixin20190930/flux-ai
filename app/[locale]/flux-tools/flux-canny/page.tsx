import {getDictionary} from "@/app/i18n/utils";
import type {Locale} from "@/app/i18n/settings";
import CannyGenerator from "@/components/flux-tools/FluxCanny";

export const runtime = 'edge';

export default async function CannyGeneratorPage({
                                                     params: {locale},
                                                 }: {
    params: { locale: string };
}) {
    const dictionary = await getDictionary(locale as Locale);

    return <CannyGenerator dictionary={dictionary} locale={locale}/>;
}