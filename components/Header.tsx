'use client'

import React, {useState, useEffect, useRef} from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {useParams, usePathname, useRouter} from 'next/navigation'
import {FaUserCircle, FaSignOutAlt} from 'react-icons/fa'
import {Locale, locales} from '@/app/i18n/settings'
import {useAuth} from '@/lib/auth-context'

import {languageConfig} from "@/app/i18n/languageConfig";
import {Globe, RefreshCw} from "lucide-react";

interface HeaderProps {
    dictionary: any
}

const Header: React.FC<HeaderProps> = ({dictionary}) => {
    // Use new Cloudflare auth system
    const { user, isLoading, isAuthenticated, logout, refreshUser } = useAuth()
    const [isRefreshing, setIsRefreshing] = useState(false)

    const router = useRouter()
    const pathname = usePathname()
    const params = useParams()
    const currentLocale = params.locale as Locale || 'en'

    const [isVisible, setIsVisible] = useState(false)
    const [isDropdownOpen, setIsDropdownOpen] = useState(false)
    const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false)
    const dropdownRef = useRef<HTMLLIElement | null>(null)
    const langDropdownRef = useRef<HTMLLIElement | null>(null)
    const isHomePage = pathname === `/${currentLocale}` || pathname === '/'
    const [isFluxToolsOpen, setIsFluxToolsOpen] = useState(false);

    const fluxToolsItems = [
        {
            name: 'Flux Redux',
            path: 'flux-redux',
            description: 'Image Variation and Restyling with Flux Redux'
        },
        {
            name: 'Flux Fill',
            path: 'flux-fill',
            description: 'Inpainting and Outpainting images with Flux Fill'
        },
        {
            name: 'Flux Depth',
            path: 'flux-depth',
            description: 'Edit images while preserving spatial relationships with Flux Depth.'
        },
        {
            name: 'Flux Canny',
            path: 'flux-canny',
            description: 'Control structure and composition with Flux Canny.'
        }
    ];

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

    useEffect(() => {
        // Scroll handler for header visibility
        const handleScroll = () => {
            const currentScrollY = window.scrollY
            if (currentScrollY > 100 && !isVisible) {
                setIsVisible(true)
            } else if (currentScrollY <= 100 && isVisible) {
                setIsVisible(false)
            }
        }

        // Click outside handler for dropdown menus
        const handleClickOutside = (event: MouseEvent) => {
            if (!(event.target instanceof Node)) {
                return
            }

            const langNode = langDropdownRef.current
            const dropNode = dropdownRef.current

            if (langNode && !langNode.contains(event.target)) {
                setIsLangDropdownOpen(false)
            }
            if (dropNode && !dropNode.contains(event.target)) {
                setIsDropdownOpen(false)
            }
        }

        // Set up event listeners
        window.addEventListener('scroll', handleScroll, {passive: true})
        document.addEventListener('mousedown', handleClickOutside)

        // Cleanup event listeners on unmount
        return () => {
            window.removeEventListener('scroll', handleScroll)
            document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [isVisible])
    // Handle logout using new auth system
    const handleLogout = async () => {
        setIsDropdownOpen(false)
        logout()
        router.push(`/${currentLocale}/auth`)
    }
    
    // Handle points refresh
    const handleRefreshPoints = async () => {
        setIsRefreshing(true)
        try {
            await refreshUser()
        } finally {
            setIsRefreshing(false)
        }
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
                                <Link href={`/${currentLocale}/`}
                                      className="text-indigo-200 hover:text-white transition duration-300">
                                    {dictionary.navigation.home}
                                </Link>
                            </li>
                            <li>
                                <Link href={`/${currentLocale}/create`}
                                      className="text-indigo-200 hover:text-white transition duration-300">
                                    {dictionary.navigation.create}
                                </Link>
                            </li>
                            <li>
                                <Link href={`/${currentLocale}/image-search`}
                                      className="text-indigo-200 hover:text-white transition duration-300">
                                    {dictionary.navigation.search}
                                </Link>
                            </li>
                            <li
                                className="relative"
                                onMouseEnter={() => setIsFluxToolsOpen(true)}
                                onMouseLeave={() => setIsFluxToolsOpen(false)}
                            >
                                <div
                                    className="text-indigo-200 hover:text-white transition duration-300 flex items-center space-x-1 cursor-pointer">
                                    <span>Flux Tools</span>
                                    <svg
                                        className={`w-4 h-4 transition-transform duration-300 ease-in-out ${
                                            isFluxToolsOpen ? 'rotate-180' : ''
                                        }`}
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                              d="M19 9l-7 7-7-7"/>
                                    </svg>
                                </div>
                                {/* 下拉菜单 */}
                                <div
                                    className={`absolute left-0 top-full w-[480px] transition-all duration-300 ease-in-out ${
                                        isFluxToolsOpen
                                            ? 'opacity-100 visible translate-y-0'
                                            : 'opacity-0 invisible -translate-y-1'
                                    }`}>
                                    <div className="pt-2">
                                        <div
                                            className="bg-gradient-to-r from-purple-900/95 via-indigo-900/95 to-indigo-800/95 backdrop-blur-md rounded-md shadow-lg py-1">
                                            {fluxToolsItems.map((item) => (
                                                <Link
                                                    key={item.name}
                                                    href={`/${currentLocale}/flux-tools/${item.path}`}
                                                    onClick={() => setIsFluxToolsOpen(false)}  // 点击时关闭下拉框
                                                    className="block px-4 py-3 text-indigo-200 hover:text-white hover:bg-indigo-700/50 transition-colors duration-150 space-y-1"
                                                >
                                                    <div className="font-medium text-sm">{item.name}</div>
                                                    <div className="text-xs text-indigo-300/90">{item.description}</div>
                                                </Link>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </li>
                            {/*<li>*/}
                            {/*    <Link href={`/${currentLocale}/create`}*/}
                            {/*          className="text-indigo-200 hover:text-white transition duration-300">*/}
                            {/*        Flux Lora*/}
                            {/*    </Link>*/}
                            {/*</li>*/}
                            {/*<li>*/}
                            {/*    <Link href={`/${currentLocale}/flux-1-1-ultra`}*/}
                            {/*          className="text-indigo-200 hover:text-white transition duration-300">*/}
                            {/*        Magic Tools*/}
                            {/*    </Link>*/}
                            {/*</li>*/}
                            {/*<li>*/}
                            {/*    <Link href={`/${currentLocale}/flux-1-1-ultra`}*/}
                            {/*          className="text-indigo-200 hover:text-white transition duration-300">*/}
                            {/*        Social Media Specs*/}
                            {/*    </Link>*/}
                            {/*</li>*/}
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

                        {/* 用户菜单 - Show loading state while auth loads */}
                        {isLoading ? (
                            <div className="text-indigo-200">
                                {dictionary.navigation.loading || "Loading..."}
                            </div>
                        ) : isAuthenticated && user ? (
                            <li className="relative list-none" ref={dropdownRef}>
                                <button
                                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                    className="flex items-center space-x-2 hover:opacity-80 transition duration-300"
                                >
                                    {/* Display user name and points */}
                                    <div className="flex items-center space-x-2">
                                        <div className="flex items-center space-x-1">
                                            <span className="text-indigo-200 text-sm">
                                                {user.points} {dictionary.navigation.points || "points"}
                                            </span>
                                            {/* Points refresh button */}
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    handleRefreshPoints()
                                                }}
                                                disabled={isRefreshing}
                                                className="text-indigo-200 hover:text-white transition-colors p-1"
                                                title="Refresh points"
                                            >
                                                <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin' : ''}`} />
                                            </button>
                                        </div>
                                        {/* 用户名缩写圆形头像 */}
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-lg">
                                            {user.name ? user.name.substring(0, 2).toUpperCase() : 'U'}
                                        </div>
                                    </div>
                                </button>
                                {isDropdownOpen && (
                                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg py-2 z-50">
                                        {/* 用户信息头部 */}
                                        <div className="px-4 py-3 border-b border-gray-200">
                                            <p className="text-sm font-medium text-gray-900">{user.name}</p>
                                            <p className="text-xs text-gray-500 truncate">{user.email}</p>
                                            <div className="flex items-center justify-between mt-1">
                                                <p className="text-xs text-indigo-600">
                                                    {user.points} {dictionary.navigation.points || "points"}
                                                </p>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        handleRefreshPoints()
                                                    }}
                                                    disabled={isRefreshing}
                                                    className="text-indigo-600 hover:text-indigo-800 transition-colors"
                                                    title="Refresh points"
                                                >
                                                    <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin' : ''}`} />
                                                </button>
                                            </div>
                                        </div>
                                        
                                        {/* 菜单选项 */}
                                        <Link
                                            href={`/${currentLocale}/hub`}
                                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-indigo-500 hover:text-white transition-colors"
                                            onClick={() => setIsDropdownOpen(false)}
                                        >
                                            <FaUserCircle className="inline mr-2"/>
                                            {dictionary.navigation.profile}
                                        </Link>
                                        <button
                                            onClick={handleLogout}
                                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-indigo-500 hover:text-white transition-colors"
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
