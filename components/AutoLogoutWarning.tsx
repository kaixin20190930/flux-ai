'use client';

import React from 'react';
import {useAutoLogout} from '@/hooks/useAutoLogout';
import {AUTH_CONFIG} from '@/config/authLogout';
import type {Dictionary} from '@/app/i18n/settings';

interface AutoLogoutWarningProps {
    dictionary: Dictionary;
    locale: string
}

export const AutoLogoutWarning: React.FC<AutoLogoutWarningProps> = ({dictionary, locale}) => {
    const {
        showWarning,
        timeRemaining,
        resetTimer
    } = useAutoLogout(locale, {
        timeoutDuration: AUTH_CONFIG.timeout.duration,
        warningDuration: AUTH_CONFIG.timeout.warning,
        onLogout: () => {
            console.log('Session expired');
        },
        onWarning: () => {
            console.log('Session expiring soon');
        }
    });

    if (typeof window === 'undefined' || !showWarning) return null;

    const minutes = Math.ceil(timeRemaining / 1000 / 60);
    const warningMessage = dictionary.autoLogout.warningMessage.replace('{minutes}', minutes.toString());

    return (
        <div
            className="fixed bottom-4 right-4 bg-yellow-100 border-l-4 border-yellow-500 p-4 shadow-lg rounded-r-lg z-50">
            <div className="flex">
                <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd"
                              d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                              clipRule="evenodd"/>
                    </svg>
                </div>
                <div className="ml-3">
                    <p className="text-sm text-yellow-700">
                        {warningMessage}
                        <button
                            onClick={resetTimer}
                            className="ml-2 font-medium underline text-yellow-700 hover:text-yellow-600"
                        >
                            {dictionary.autoLogout.stayLoggedIn}
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
};