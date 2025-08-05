import {getany} from '@/app/i18n/utils';
import {Locale} from "@/app/i18n/settings";
import Link from 'next/link';

export const runtime = 'edge';

export default async function FluxToolsPage({params: {locale}}: { params: { locale: Locale } }) {
    const dictionary = await getany(locale);

    const tools = [
        {
            name: 'Flux Canny',
            description: 'Generate images using Canny edge detection',
            href: `/${locale}/flux-tools/flux-canny`,
            image: 'https://replicate.delivery/pbxt/M0mdz2nXiUmhpfLswjNdEHT3IhGtclUz7Q1sCw3XiHXzUugT/0_ZjYSm_q36J4KChdn.webp'
        },
        {
            name: 'Flux Depth',
            description: 'Generate images using depth maps',
            href: `/${locale}/flux-tools/flux-depth`,
            image: 'https://replicate.delivery/pbxt/M0mdz2nXiUmhpfLswjNdEHT3IhGtclUz7Q1sCw3XiHXzUugT/0_ZjYSm_q36J4KChdn.webp'
        },
        {
            name: 'Flux Fill',
            description: 'Fill and outpaint images with AI',
            href: `/${locale}/flux-tools/flux-fill`,
            image: 'https://replicate.delivery/pbxt/M0gpKVE9wmEtOQFNDOpwz1uGs0u6nK2NcE85IihwlN0ZEnMF/kill-bill-poster.jpg'
        },
        {
            name: 'Flux Redux',
            description: 'Transform images with Redux style transfer',
            href: `/${locale}/flux-tools/flux-redux`,
            image: 'https://replicate.delivery/pbxt/M0mdz2nXiUmhpfLswjNdEHT3IhGtclUz7Q1sCw3XiHXzUugT/0_ZjYSm_q36J4KChdn.webp'
        }
    ];

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="text-center mb-12">
                <h1 className="text-4xl font-bold text-gray-900 mb-4">
                    Flux Tools
                </h1>
                <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                    Explore our collection of advanced AI image generation tools powered by Flux models
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
                {tools.map((tool, index) => (
                    <Link
                        key={index}
                        href={tool.href}
                        className="group block bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300"
                    >
                        <div className="aspect-video bg-gray-200 overflow-hidden">
                            <img
                                src={tool.image}
                                alt={tool.name}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                        </div>
                        <div className="p-6">
                            <h3 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                                {tool.name}
                            </h3>
                            <p className="text-gray-600">
                                {tool.description}
                            </p>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}