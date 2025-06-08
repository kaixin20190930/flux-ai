import {getDictionary} from "@/app/i18n/utils";
import {Locale} from "@/app/i18n/settings";
import ReduxGenerator from "@/components/flux-tools/FluxRedux";

export const runtime = 'edge';

export default async function ReduxPage({params: {locale}}: { params: { locale: Locale } }) {
    const dictionary = await getDictionary(locale);

    const reduxConfig = {
        guidance: 3,
        megapixels: "1",
        num_outputs: 1,
        redux_image: "https://replicate.delivery/pbxt/M0mdz2nXiUmhpfLswjNdEHT3IhGtclUz7Q1sCw3XiHXzUugT/0_ZjYSm_q36J4KChdn.webp",
        aspect_ratio: "4:3",
        output_format: "webp",
        output_quality: 80,
        num_inference_steps: 28
    };

    return (
        <ReduxGenerator
            dictionary={dictionary}
            locale={locale}
            config={reduxConfig}
        />
    );
}