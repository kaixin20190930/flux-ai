import {getDictionary} from "@/app/i18n/utils";
import {Locale} from "@/app/i18n/settings";
import CannyGenerator from "@/components/flux-tools/FluxCanny";

export const runtime = 'edge';

export default async function CannyPage({params: {locale}}: { params: { locale: Locale } }) {
    const dictionary = await getDictionary(locale);

    const cannyConfig = {
        guidance: 3,
        megapixels: "1",
        num_outputs: 1,
        canny_image: "https://replicate.delivery/pbxt/M0mdz2nXiUmhpfLswjNdEHT3IhGtclUz7Q1sCw3XiHXzUugT/0_ZjYSm_q36J4KChdn.webp",
        aspect_ratio: "4:3",
        output_format: "jpg",
        output_quality: 80,
        num_inference_steps: 28
    };

    return (
        <CannyGenerator
            dictionary={dictionary}
            locale={locale}
            config={cannyConfig}
        />
    );
}
