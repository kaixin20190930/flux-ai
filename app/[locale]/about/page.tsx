'use client'

import {useEffect, useState} from 'react';
import {useRouter} from 'next/navigation';
import Hub from "../../../components/Hub"; // Adjust the import path as needed
export const runtime = 'edge';

export default function DashboardPage() {
    const [user, setUser] = useState(null);
    const router = useRouter();

    useEffect(() => {
        const userData = localStorage.getItem('user');
        if (userData) {
            setUser(JSON.parse(userData));
        } else {
            router.push('/auth'); // Redirect to login if no user data found
        }
    }, []);

    if (!user) {
        return <div>Loading...</div>;
    }

    return <Hub user={user}/>;
}