// app/page.tsx
import {HomePage} from '@/components/HomePage'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import {AutoLogoutWarning} from "@/components/AutoLogoutWarning"
import {getDictionary} from './i18n/utils'
import {defaultLocale} from './i18n/settings'

export default async function RootPage() {
    const dictionary = await getDictionary(defaultLocale)

    return (
        <>
            <Header dictionary={dictionary}/>
            <main className="flex-grow">
                <HomePage dictionary={dictionary} locale={defaultLocale}/>
                <AutoLogoutWarning dictionary={dictionary}/>
            </main>
            <Footer dictionary={dictionary}/>
        </>
    )
}