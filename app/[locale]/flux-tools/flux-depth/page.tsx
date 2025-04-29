import {getDictionary} from "@/app/i18n/utils";
import type {Locale} from "@/app/i18n/settings";
import DepthGenerator from "@/components/flux-tools/FluxDepth";

export const runtime = 'edge';

export default async function DepthGeneratorPage({
                                                     params: {locale},
                                                 }: {
    params: { locale: string };
}) {
    const dictionary = await getDictionary(locale as Locale);

    return <DepthGenerator dictionary={dictionary} locale={locale}/>;
}