import Header from '../components/Header'
import Footer from '../components/Footer'
import '../styles/globals.css'
import type {Metadata} from 'next'


export const metadata: Metadata = {
    title: 'Flux AI Image Generator for Free',
    description: 'Transform your ideas into stunning images with Flux AI generator. Create unique, high-quality AI-generated images for art, and business use cases instantly.',
    keywords: 'AI image generator, Free, Flux AI, AI image creation, AI art generator, text to image, image generation',
    alternates: {
        canonical: 'https://flux-ai-img.com',
    },
    icons:'/icons/flux-ai.svg'
}
export default function RootLayout({
                                       children,
                                   }: {
    children: React.ReactNode
}) {
    return (
        <html lang="en">
        <body className="flex flex-col min-h-screen">
        <Header/>
        <main className="flex-grow">
            {children}
        </main>
        <Footer/>
        </body>
        </html>
    )
}