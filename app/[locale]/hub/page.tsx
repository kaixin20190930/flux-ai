'use client'

export const runtime = 'edge'

import {useEffect} from 'react';
import {useRouter} from 'next/navigation';
import {useAuth} from '@/lib/auth-context';
import Hub from "@/components/Hub";

export default function DashboardPage({
                                          params: {locale},
                                      }: {
    params: { locale: string };
}) {
    const { user, isAuthenticated, isLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.push(`/${locale}/auth`);
        }
    }, [isLoading, isAuthenticated, locale, router]);

    if (isLoading) {
        return (
            <div
                className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-indigo-800">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
            </div>
        );
    }

    if (!user) {
        return null;
    }

    return <Hub user={user}/>;
}