'use client'

import React, {useState, useEffect, useRef} from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {FaUserCircle, FaSignOutAlt} from 'react-icons/fa'
import Cookies from "js-cookie";
import internal from "node:stream";


const Header: React.FC = () => {

    interface userInfo {
        id: String,
        name: String,
        email: String,
        // Add any other user information you want to send to the client
    }

    const [isVisible, setIsVisible] = useState(false)
    const [user, setUser] = useState<userInfo | null>(null);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false)
    const dropdownRef = useRef<HTMLLIElement | null>(null);


    useEffect(() => {
        const handleScroll = () => {
            const currentScrollY = window.scrollY
            if (currentScrollY > 100 && !isVisible) {
                setIsVisible(true)
            } else if (currentScrollY <= 100 && isVisible) {
                setIsVisible(false)
            }
        }

        window.addEventListener('scroll', handleScroll, {passive: true})

        const userData = localStorage.getItem('user')
        if (userData) {
            setUser(JSON.parse(userData))
        }

        // Close dropdown when clicking outside
        const handleClickOutside = (event: MouseEvent) => {
            if (!(event.target instanceof Node)) {
                return;
            }

            const node = dropdownRef.current;
            if (!node) {
                return;
            }

            if (!node.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        }

        document.addEventListener('mousedown', handleClickOutside)

        return () => {
            window.removeEventListener('scroll', handleScroll)
            document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [isVisible])
    const handleLogout = () => {
        localStorage.removeItem('user')
        localStorage.removeItem('token')
        Cookies.remove('token')
        setUser(null)
        setIsDropdownOpen(false)
        // Optionally redirect to home page
        window.location.href = '/'
    }
    return (
        <header
            className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
                isVisible
                    ? 'translate-y-0 bg-gradient-to-r from-purple-900/90 via-indigo-900/90 to-indigo-800/90 backdrop-blur-md py-2'
                    : '-translate-y-full'
            }`}
        >
            <div className="container mx-auto px-4">
                <div className="flex justify-between items-center">
                    <Link href="/" className="flex items-center space-x-2">
                        <Image src="/fluxai.svg" alt="Flux AI Logo" width={40} height={40} className="rounded-full"/>
                        <span className="text-xl font-bold text-white">Flux AI</span>
                    </Link>
                    {/*<nav>*/}
                    {/*    <ul className="flex space-x-6">*/}
                    {/*        <li><Link href="/about"*/}
                    {/*                  className="text-indigo-200 hover:text-white transition duration-300">About</Link>*/}
                    {/*        </li>*/}
                    {/*        <li><Link href="/hub"*/}
                    {/*                  className="text-indigo-200 hover:text-white transition duration-300">Dashboard</Link>*/}
                    {/*        </li>*/}
                    {/*        <li><Link href="/pricing"*/}
                    {/*                  className="text-indigo-200 hover:text-white transition duration-300">Pricing</Link>*/}
                    {/*        </li>*/}
                    {/*        {user ? (*/}
                    {/*            <>*/}
                    {/*                <li>*/}
                    {/*                    <span className="text-indigo-200">*/}
                    {/*                        {user.name ? user.name.charAt(0).toUpperCase() : 'U'}*/}
                    {/*                    </span>*/}
                    {/*                </li>*/}
                    {/*                <li>*/}
                    {/*                    <button onClick={handleLogout}*/}
                    {/*                            className="text-indigo-200 hover:text-white transition duration-300">*/}
                    {/*                        Logout*/}
                    {/*                    </button>*/}
                    {/*                </li>*/}
                    {/*            </>*/}
                    {/*        ) : (*/}
                    {/*            <li>*/}
                    {/*                <Link href="/auth"*/}
                    {/*                      className="text-indigo-200 hover:text-white transition duration-300">*/}
                    {/*                    Login*/}
                    {/*                </Link>*/}
                    {/*            </li>*/}
                    {/*        )}*/}
                    {/*    </ul>*/}
                    {/*</nav>*/}
                    <nav>
                        <ul className="flex items-center space-x-6">
                            <li><Link href="/"
                                      className="text-indigo-200 hover:text-white transition duration-300">Home</Link>
                            </li>
                            <li><Link href="/create"
                                      className="text-indigo-200 hover:text-white transition duration-300">Create</Link>
                            </li>
                            <li><Link href="/hub"
                                      className="text-indigo-200 hover:text-white transition duration-300">Hub</Link>
                            </li>
                            <li><Link href="/#pricing"
                                      className="text-indigo-200 hover:text-white transition duration-300"
                                      onClick={(e) => {
                                          e.preventDefault();
                                          document.getElementById('pricing')?.scrollIntoView({
                                              behavior: 'smooth'
                                          });
                                      }}>Pricing</Link>
                            </li>
                            {user ? (
                                <li className="relative" ref={dropdownRef}>
                                    <button
                                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                        className="flex items-center space-x-2 text-indigo-200 hover:text-white transition duration-300"
                                    >
                                        <FaUserCircle className="text-xl"/>
                                        <span>{user.name}</span>
                                    </button>
                                    {isDropdownOpen && (
                                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1">
                                            <Link href="/profile"
                                                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-indigo-500 hover:text-white">
                                                Profile
                                            </Link>
                                            <button
                                                onClick={handleLogout}
                                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-indigo-500 hover:text-white"
                                            >
                                                <FaSignOutAlt className="inline mr-2"/>
                                                Logout
                                            </button>
                                        </div>
                                    )}
                                </li>
                            ) : (
                                <li>
                                    <Link href="/auth"
                                          className="text-indigo-200 hover:text-white transition duration-300">
                                        Login
                                    </Link>
                                </li>
                            )}
                        </ul>
                    </nav>
                </div>
            </div>
        </header>
    )
}

export default Header