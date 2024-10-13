import React from 'react';
import {FaUser, FaImage, FaCreditCard, FaCog} from 'react-icons/fa';


interface userInfo {
    id: String,
    name: String,
    email: String,
    // Add any other user information you want to send to the client
}

interface UserDashboardProps {
    user: userInfo | null;
}

const UserDashboard: React.FC<UserDashboardProps> = ({user}) => {
    const userName = user?.name || 'User';
    const userEmail = user?.email || 'User';


    return (
        <div className="bg-gradient-to-br from-purple-900 via-indigo-900 to-indigo-800 min-h-screen py-24 sm:py-32">
            <div className="mx-auto max-w-7xl px-6 lg:px-8">
                <div className="mx-auto max-w-4xl text-center mb-16">
                    <h2 className="text-base font-semibold leading-7 text-indigo-200">Dashboard</h2>
                    <p className="mt-2 text-4xl font-bold tracking-tight text-white sm:text-5xl">
                        Welcome, {userName}
                    </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {/* User Information */}
                    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                        <div className="px-6 py-8">
                            <h3 className="text-2xl font-semibold text-gray-900">User Information</h3>
                            <ul className="mt-6 space-y-4">
                                <li className="flex items-start">
                                    <FaUser className="flex-shrink-0 h-6 w-6 text-indigo-500"/>
                                    <p className="ml-3 text-base text-gray-700">Name: {userName}</p>
                                </li>
                                <li className="flex items-start">
                                    <FaUser className="flex-shrink-0 h-6 w-6 text-indigo-500"/>
                                    <p className="ml-3 text-base text-gray-700">Email: {userEmail}</p>
                                </li>
                            </ul>
                        </div>
                    </div>

                    {/* Recent Images */}
                    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                        <div className="px-6 py-8">
                            <h3 className="text-2xl font-semibold text-gray-900">Recent Images</h3>
                            <div className="mt-6 grid grid-cols-3 gap-2">
                                {[1, 2, 3, 4, 5, 6].map(i => (
                                    <div key={i} className="bg-gray-200 aspect-square rounded-md"></div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Usage Stats */}
                    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                        <div className="px-6 py-8">
                            <h3 className="text-2xl font-semibold text-gray-900">Usage Stats</h3>
                            <ul className="mt-6 space-y-4">
                                <li className="flex items-start">
                                    <FaImage className="flex-shrink-0 h-6 w-6 text-indigo-500"/>
                                    <p className="ml-3 text-base text-gray-700">Images Generated: 50</p>
                                </li>
                                <li className="flex items-start">
                                    <FaCreditCard className="flex-shrink-0 h-6 w-6 text-indigo-500"/>
                                    <p className="ml-3 text-base text-gray-700">Subscription Status: Active</p>
                                </li>
                                <li className="flex items-start">
                                    <FaCog className="flex-shrink-0 h-6 w-6 text-indigo-500"/>
                                    <p className="ml-3 text-base text-gray-700">Next Billing Date: 15/10/2023</p>
                                </li>
                            </ul>
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                        <div className="px-6 py-8">
                            <h3 className="text-2xl font-semibold text-gray-900">Quick Actions</h3>
                            <div className="mt-6 space-y-4">
                                <button
                                    className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 transition duration-300">
                                    Generate New Image
                                </button>
                                <button
                                    className="w-full bg-gray-200 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-300 transition duration-300">
                                    View Tutorial
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserDashboard;