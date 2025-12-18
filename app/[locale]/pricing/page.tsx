import NewPricing from '@/components/NewPricing';
import {getany} from '@/app/i18n/utils';
import type {Locale} from "@/app/i18n/settings";

export const runtime = 'edge';

export default async function PricingPage({
                                              params: {locale},
                                          }: {
    params: { locale: string };
}) {
    const dictionary = await getany(locale as Locale);

    return <NewPricing dictionary={dictionary} locale={locale}/>;
}