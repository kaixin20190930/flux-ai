'use client'

import {useEffect, useState} from 'react';
import {useRouter} from 'next/navigation';
import Hub from "@/components/Hub";

export const runtime = 'edge';

interface UserInfo {
    id: string,
    name: string,
    email: string,
}

export default function DashboardPage({
                                          params: {locale},
                                      }: {
    params: { locale: string };
}) {
    const [user, setUser] = useState<UserInfo | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        try {
            const userData = localStorage.getItem('user');
            if (userData) {
                setUser(JSON.parse(userData));
            } else {
                router.push(`/${locale}/auth`);
            }
        } catch (error) {
            console.error('Error loading user data:', error);
            router.push(`/${locale}/auth`);
        } finally {
            setIsLoading(false);
        }
    }, [locale, router]);

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