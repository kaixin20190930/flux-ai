// app/[locale]/auth/page.tsx
import AuthForm from '@/components/AuthForm'
import {getany} from '@/app/i18n/utils'
import type {Locale} from '@/app/i18n/settings'
export const runtime = 'edge';

export default async function AuthPage({
                                           params: {locale}
                                       }: {
    params: { locale: string }
}) {
    // 获取字典
    const dictionary = await getany(locale as Locale)

    return <AuthForm dictionary={dictionary}/>
}