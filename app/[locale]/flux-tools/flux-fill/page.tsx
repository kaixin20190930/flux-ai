import {getany} from '@/app/i18n/utils';
import type {Locale} from "@/app/i18n/settings";
import dynamic from 'next/dynamic';

// 动态导入客户端组件，避免在服务器端执行
const FillGenerator = dynamic(() => import("@/components/flux-tools/FluxFill"), {
    ssr: false,
    loading: () => <div className="flex justify-center items-center h-64">Loading...</div>
});

export const runtime = 'edge';

export default async function FillGeneratorPage({
                                                    params: {locale},
                                                }: {
    params: { locale: string };
}) {
    const dictionary = await getany(locale as Locale);

    const fillConfig = {
        image: "https://replicate.delivery/pbxt/M0gpKVE9wmEtOQFNDOpwz1uGs0u6nK2NcE85IihwlN0ZEnMF/kill-bill-poster.jpg",
        seed: 4,
        steps: 50,
        prompt: "movie poster says \"FLUX FILL\"",
        guidance: 60,
        outpaint: "Left outpaint",
        output_format: "jpg",
        safety_tolerance: 2,
        prompt_upsampling: false
    };

    return <FillGenerator dictionary={dictionary} locale={locale} config={fillConfig}/>;
}
