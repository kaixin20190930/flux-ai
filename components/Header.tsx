'use client'

import React, {useState, useEffect, useRef} from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {useParams, usePathname, useRouter} from 'next/navigation'
import {FaUserCircle, FaSignOutAlt} from 'react-icons/fa'
import Cookies from "js-cookie"
import AuthEventEmitter from '../events/authEvents'
import {Locale, locales} from '@/app/i18n/settings'
import {Dictionary} from '@/app/i18n/settings'
import {languageConfig} from "@/app/i18n/languageConfig";
import {Globe} from "lucide-react";

interface HeaderProps {
    dictionary: Dictionary
}

const Header: React.FC<HeaderProps> = ({dictionary}) => {


    interface userInfo {
        id: String,
        name: String,
        email: String,
        // Add any other user information you want to send to the client
    }

    const router = useRouter()
    const pathname = usePathname()
    const params = useParams()
    const currentLocale = params.locale as Locale || 'en'

    const [isVisible, setIsVisible] = useState(false)
    const [user, setUser] = useState<userInfo | null>(null)
    const [isDropdownOpen, setIsDropdownOpen] = useState(false)
    const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false)
    const dropdownRef = useRef<HTMLLIElement | null>(null)
    const langDropdownRef = useRef<HTMLLIElement | null>(null)
    const isHomePage = pathname === `/${currentLocale}` || pathname === '/'

    const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
        if (isHomePage) {
            e.preventDefault()
            document.getElementById('pricing')?.scrollIntoView({
                behavior: 'smooth'
            })
        }
        // If not homepage, let the Link component handle the navigation
    }
    const handleLanguageChange = (locale: Locale) => {
        let newPath = pathname;

        // 如果当前有语言代码，替换它
        if (currentLocale) {
            newPath = pathname.replace(`/${currentLocale}`, `/${locale}`)
        } else {
            // 如果当前没有语言代码，添加新的语言代码
            newPath = `/${locale}${pathname}`
        }

        // 确保路径正确
        if (newPath === '/') newPath = `/${locale}`

        router.push(newPath)
        setIsLangDropdownOpen(false)
    }

    const updateUserState = () => {
        const userData = localStorage.getItem('user');
        if (userData) {
            try {
                setUser(JSON.parse(userData));
            } catch {
                setUser(null);
            }
        } else {
            setUser(null);
        }
    };

    useEffect(() => {
        const handleScroll = () => {
            const currentScrollY = window.scrollY
            if (currentScrollY > 100 && !isVisible) {
                setIsVisible(true)
            } else if (currentScrollY <= 100 && isVisible) {
                setIsVisible(false)
            }
        }

        updateUserState();

        // 订阅自动登出事件
        const unsubscribe = AuthEventEmitter.subscribe(() => {
            setUser(null);
            setIsDropdownOpen(false);
        });

        window.addEventListener('scroll', handleScroll, {passive: true});

        // 点击外部关闭下拉菜单 - 保留原始的类型安全处理
        const handleClickOutside = (event: MouseEvent) => {
            if (!(event.target instanceof Node)) {
                return;
            }

            const langNode = langDropdownRef.current;
            const dropNode = dropdownRef.current;

            if (langNode && !langNode.contains(event.target)) {
                setIsLangDropdownOpen(false);
            }
            if (dropNode && !dropNode.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);

        return () => {
            window.removeEventListener('scroll', handleScroll);
            document.removeEventListener('mousedown', handleClickOutside);
            unsubscribe();
        };
    }, [isVisible])
    const handleLogout = () => {
        localStorage.removeItem('user')
        localStorage.removeItem('token')
        Cookies.remove('token')
        setUser(null)
        setIsDropdownOpen(false)
        // Optionally redirect to home page
        window.location.href = '/auth'
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
                    {/* 左侧 Logo */}
                    <div className="flex items-center">
                        <Link href={`/${currentLocale}`} className="flex items-center space-x-2">
                            <Image
                                src="/fluxai.svg"
                                alt="Flux AI Logo"
                                width={40}
                                height={40}
                                className="rounded-full"
                            />
                            <span className="text-xl font-bold text-white">Flux AI</span>
                        </Link>
                    </div>

                    {/* 中间导航 */}
                    <nav className="flex-1 flex justify-center">
                        <ul className="flex items-center space-x-6">
                            <li>
                                <Link href={`/${currentLocale}`}
                                      className="text-indigo-200 hover:text-white transition duration-300">
                                    {dictionary.navigation.home}
                                </Link>
                            </li>
                            <li>
                                <Link href={`/${currentLocale}/flux-1-1-ultra`}
                                      className="text-indigo-200 hover:text-white transition duration-300">
                                    Flux 1.1 Ultra
                                </Link>
                            </li>
                            <li>
                                <Link href={`/${currentLocale}/create`}
                                      className="text-indigo-200 hover:text-white transition duration-300">
                                    {dictionary.navigation.create}
                                </Link>
                            </li>
                            <li>
                                <Link href={`/${currentLocale}/hub`}
                                      className="text-indigo-200 hover:text-white transition duration-300">
                                    {dictionary.navigation.hub}
                                </Link>
                            </li>
                        </ul>
                    </nav>

                    {/* 右侧功能区 */}
                    <div className="flex items-center space-x-6">
                        {/* 价格按钮 */}
                        <Link
                            href={`/${currentLocale}/pricing`}
                            className="text-indigo-200 hover:text-white transition duration-300"
                            onClick={handleClick}

                            // onClick={(e) => {
                            //     e.preventDefault();
                            //     document.getElementById('pricing')?.scrollIntoView({
                            //         behavior: 'smooth'
                            //     });
                            // }}
                        >
                            {dictionary.navigation.pricing}
                        </Link>

                        {/* 语言切换 */}
                        <li className="relative list-none" ref={langDropdownRef}>
                            <button
                                onClick={() => setIsLangDropdownOpen(!isLangDropdownOpen)}
                                className="flex items-center space-x-2 text-indigo-200 hover:text-white transition duration-300"
                            >
                                <Globe className="text-xl"/>
                                <span className="text-xl">
                    {languageConfig[currentLocale]?.flag || languageConfig['en'].flag}
                </span>
                            </button>
                            {isLangDropdownOpen && (
                                <div
                                    className="absolute right-0 mt-2 w-56 bg-gradient-to-r from-purple-900/95 via-indigo-900/95 to-indigo-800/95 backdrop-blur-md rounded-md shadow-lg py-1 z-50">
                                    <div className="max-h-96 overflow-y-auto">
                                        {locales.map((locale) => {
                                            const langConfig = languageConfig[locale];
                                            const isSelected = locale === currentLocale;
                                            return (
                                                <button
                                                    key={locale}
                                                    onClick={() => handleLanguageChange(locale)}
                                                    className={`w-full text-left px-4 py-2 text-sm ${
                                                        isSelected
                                                            ? 'bg-indigo-700/50 text-white'
                                                            : 'text-indigo-200 hover:text-white hover:bg-indigo-700/50'
                                                    } flex items-center space-x-3 transition-colors duration-150`}
                                                >
                                                    <span className="text-xl">{langConfig.flag}</span>
                                                    <div className="flex flex-col">
                                                        <span className="font-medium">{langConfig.nativeName}</span>
                                                        <span className={`text-xs ${
                                                            isSelected ? 'text-indigo-200' : 'text-indigo-300'
                                                        }`}>
                                {langConfig.label}
                            </span>
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </li>

                        {/* 用户菜单 */}
                        {user ? (
                            <li className="relative list-none" ref={dropdownRef}>
                                <button
                                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                    className="flex items-center space-x-2 text-indigo-200 hover:text-white transition duration-300"
                                >
                                    <FaUserCircle className="text-xl"/>
                                    <span>{user.name}</span>
                                </button>
                                {isDropdownOpen && (
                                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1">
                                        <Link
                                            href={`/${currentLocale}/profile`}
                                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-indigo-500 hover:text-white"
                                        >
                                            {dictionary.navigation.profile}
                                        </Link>
                                        <button
                                            onClick={handleLogout}
                                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-indigo-500 hover:text-white"
                                        >
                                            <FaSignOutAlt className="inline mr-2"/>
                                            {dictionary.navigation.logout}
                                        </button>
                                    </div>
                                )}
                            </li>
                        ) : (
                            <Link
                                href={`/${currentLocale}/auth`}
                                className="text-indigo-200 hover:text-white transition duration-300"
                            >
                                {dictionary.navigation.login}
                            </Link>
                        )}
                    </div>
                </div>
            </div>
        </header>
    )
}

export default Header