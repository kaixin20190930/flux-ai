import {getDictionary} from "@/app/i18n/utils";
import type {Locale} from "@/app/i18n/settings";
import ReduxGenerator from "@/components/flux-tools/FluxRedux";

export const runtime = 'edge';

export default async function ReduxGeneratorPage({
                                            params: {locale},
                                        }: {
    params: { locale: string };
}) {
    const dictionary = await getDictionary(locale as Locale);

    return <ReduxGenerator dictionary={dictionary} locale={locale}/>;
}