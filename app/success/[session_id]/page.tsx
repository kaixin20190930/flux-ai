'use client'

import {useEffect, useState} from 'react';
import {useSearchParams, useRouter} from 'next/navigation';
import Link from "next/link";

export const runtime = 'edge';
export default function SuccessPage() {
    const [points, setPoints] = useState<number | null>(null);
    const searchParams = useSearchParams();
    const router = useRouter();
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);


    useEffect(() => {
        const session_id = searchParams.get('session_id');
        if (session_id) {
            fetchTransactionDetails(session_id);
        } else {
            setError('No session ID found');
            setIsLoading(false);
        }
    }, [searchParams]);


    async function fetchTransactionDetails(sessionId: string, retries = 3) {
        try {
            const response = await fetch(`/api/getTransactionDetails?session_id=${sessionId}`);
            if (!response.ok) throw new Error('API response was not ok');

            const data = await response.json() as any;
            setPoints(data.pointsAdded);
        } catch (error) {
            if (retries > 0) {
                console.log(`Retrying... (${retries} attempts left)`);
                setTimeout(() => fetchTransactionDetails(sessionId, retries - 1), 2000);
            } else {
                console.error('Error fetching transaction details:', error);
                setError('Failed to load transaction details. Please refresh the page.');
            }
        }
    }

    if (isLoading) {
        return <div>Loading...</div>;
    }

    if (error) {
        return (
            <div>
                <p>Error: {error}</p>
                <Link href="/dashboard">
                    <span>Go to Dashboard</span>
                </Link>
            </div>
        );
    }
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
            <h1 className="text-4xl font-bold mb-4">Payment Successful!</h1>
            {points !== null && (
                <p className="text-2xl mb-4">{points} points have been added to your account.</p>
            )}
            <button
                onClick={() => router.push('/dashboard')}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
                Go to Dashboard
            </button>
        </div>
    );
}
