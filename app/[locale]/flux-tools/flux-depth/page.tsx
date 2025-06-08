import {getDictionary} from "@/app/i18n/utils";
import type {Locale} from "@/app/i18n/settings";
import DepthGenerator from "@/components/flux-tools/FluxDepth";

export const runtime = 'edge';

export default async function DepthGeneratorPage({
                                                     params: {locale},
                                                 }: {
    params: { locale: string };
}) {

    const depthConfig = {
        guidance: 3,
        megapixels: "1",
        num_outputs: 1,
        aspect_ratio: "4:3",
        output_format: "jpg",
        output_quality: 80,
        num_inference_steps: 28
    };
    const dictionary = await getDictionary(locale as Locale);

    return <DepthGenerator dictionary={dictionary} locale={locale} config={depthConfig}/>;
}
