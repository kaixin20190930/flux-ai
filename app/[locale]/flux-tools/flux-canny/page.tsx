import {getany} from '@/app/i18n/utils';
import {Locale} from "@/app/i18n/settings";
import dynamic from 'next/dynamic';

// 动态导入客户端组件，避免在服务器端执行
const CannyGenerator = dynamic(() => import("@/components/flux-tools/FluxCanny"), {
    ssr: false,
    loading: () => <div className="flex justify-center items-center h-64">Loading...</div>
});

export const runtime = 'edge';

export default async function CannyPage({params: {locale}}: { params: { locale: Locale } }) {
    const dictionary = await getany(locale);

    const cannyConfig = {
        seed: 4,
        guidance: 3,
        prompt: "a photo of a car on a city street",
        steps: 28,
        image: "https://replicate.delivery/pbxt/M0mdz2nXiUmhpfLswjNdEHT3IhGtclUz7Q1sCw3XiHXzUugT/0_ZjYSm_q36J4KChdn.webp",
        output_format: "jpg",
        safety_tolerance: 2,
        prompt_upsampling: false
    };

    return (
        <CannyGenerator
            dictionary={dictionary}
            locale={locale}
            config={cannyConfig}
        />
    );
}
