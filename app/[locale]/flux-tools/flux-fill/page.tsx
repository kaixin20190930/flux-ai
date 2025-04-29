import {getDictionary} from "@/app/i18n/utils";
import type {Locale} from "@/app/i18n/settings";
import FillGenerator from "@/components/flux-tools/FluxFill";

export const runtime = 'edge';

export default async function FillGeneratorPage({
                                                    params: {locale},
                                                }: {
    params: { locale: string };
}) {
    const dictionary = await getDictionary(locale as Locale);

    return <FillGenerator dictionary={dictionary} locale={locale}/>;
}