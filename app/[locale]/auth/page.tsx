// app/[locale]/auth/page.tsx
import AuthForm from '@/components/AuthForm'
import {getDictionary} from '@/app/i18n/utils'
import type {Locale} from '@/app/i18n/settings'

export default async function AuthPage({
                                           params: {locale}
                                       }: {
    params: { locale: string }
}) {
    // 获取字典
    const dictionary = await getDictionary(locale as Locale)

    return <AuthForm dictionary={dictionary}/>
}