import Pricing from '@/components/Pricing';
import {getDictionary} from "@/app/i18n/utils";
import type {Locale} from "@/app/i18n/settings";

export const runtime = 'edge';

export default async function PricingPage({
                                              params: {locale},
                                          }: {
    params: { locale: string };
}) {
    const dictionary = await getDictionary(locale as Locale);

    return <Pricing dictionary={dictionary} locale={locale}/>;
}