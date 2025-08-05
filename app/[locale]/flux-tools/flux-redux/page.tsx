import {getany} from '@/app/i18n/utils';
import {Locale} from "@/app/i18n/settings";
import dynamic from 'next/dynamic';

// 动态导入客户端组件，避免在服务器端执行
const ReduxGenerator = dynamic(() => import("@/components/flux-tools/FluxRedux"), {
    ssr: false,
    loading: () => <div className="flex justify-center items-center h-64">Loading...</div>
});

export const runtime = 'edge';

export default async function ReduxPage({params: {locale}}: { params: { locale: Locale } }) {
    const dictionary = await getany(locale);

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