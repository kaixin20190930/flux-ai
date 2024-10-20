'use client'

import {useEffect, useState} from 'react';
import {useSearchParams, useRouter} from 'next/navigation';

export default function SuccessPage() {
    const [points, setPoints] = useState<number | null>(null);
    const searchParams = useSearchParams();
    const router = useRouter();

    useEffect(() => {
        const session_id = searchParams.get('session_id');
        if (session_id) {
            fetchTransactionDetails(session_id);
        }
    }, [searchParams]);

    async function fetchTransactionDetails(sessionId: string) {
        try {
            const response = await fetch(`/api/getTransactionDetails?session_id=${sessionId}`);
            const data = await response.json() as any;
            setPoints(data.pointsAdded);
        } catch (error) {
            console.error('Error fetching transaction details:', error);
        }
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
