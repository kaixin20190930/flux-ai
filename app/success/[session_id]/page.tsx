import React from 'react';
import {useRouter} from 'next/navigation';
import {motion} from 'framer-motion';

const SuccessPage = () => {
    const router = useRouter();
    const points = 200; // 固定的点数值

    return (
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-r from-blue-400 to-purple-500">
            <motion.div
                initial={{opacity: 0, y: -50}}
                animate={{opacity: 1, y: 0}}
                transition={{duration: 0.5}}
                className="bg-white p-8 rounded-lg shadow-2xl text-center"
            >
                <motion.div
                    initial={{scale: 0}}
                    animate={{scale: 1}}
                    transition={{delay: 0.2, type: 'spring', stiffness: 120}}
                    className="mb-6"
                >
                    <svg className="w-24 h-24 mx-auto text-green-500" fill="none" stroke="currentColor"
                         viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                </motion.div>

                <h1 className="text-4xl font-bold mb-4 text-gray-800">Payment Successful!</h1>

                <motion.p
                    initial={{opacity: 0}}
                    animate={{opacity: 1}}
                    transition={{delay: 0.4}}
                    className="text-2xl mb-6 text-gray-600"
                >
                    {points} points have been added to your account.
                </motion.p>

                <motion.button
                    whileHover={{scale: 1.05}}
                    whileTap={{scale: 0.95}}
                    onClick={() => router.push('/')}
                    className="px-6 py-3 bg-gradient-to-r from-green-400 to-blue-500 text-white rounded-full font-semibold text-lg shadow-md hover:shadow-lg transition duration-300 ease-in-out"
                >
                    Go to Dashboard
                </motion.button>
            </motion.div>
        </div>
    );
};

export default SuccessPage;