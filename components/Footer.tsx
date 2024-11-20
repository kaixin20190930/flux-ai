// components/Footer.tsx
'use client'

import React from 'react'
import Link from 'next/link'
import {useParams} from 'next/navigation'
import type {Dictionary} from '@/app/i18n/settings'

interface FooterProps {
    dictionary: Dictionary
}

const Footer: React.FC<FooterProps> = ({dictionary}) => {
    const params = useParams()
    const currentLocale = params.locale || 'en'

    return (
        <footer className="bg-indigo-900 text-white py-12">
            <div className="container mx-auto px-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    {/* 第一列：品牌介绍 */}
                    <div>
                        <h3 className="text-2xl font-bold mb-4">
                            <Link href={`/${currentLocale}`}>Flux AI</Link>
                        </h3>
                        <p className="text-indigo-200">
                            {dictionary.metadata.description}
                        </p>
                    </div>

                    {/* 第二列：快速链接 */}
                    <div>
                        <h4 className="text-xl font-semibold mb-4">{dictionary.footer.quickLinks}</h4>
                        <ul className="space-y-2">
                            <li>
                                <Link
                                    href={`/${currentLocale}/pricing`}
                                    className="text-indigo-200 hover:text-pink-300 transition duration-300"
                                >
                                    {dictionary.footer.pricing}
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href={`/${currentLocale}/contact`}
                                    className="text-indigo-200 hover:text-pink-300 transition duration-300"
                                >
                                    {dictionary.footer.contact}
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="https://tap4.ai/ai/flux-ai-io"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-indigo-200 hover:text-pink-300 transition duration-300"
                                >
                                    {dictionary.footer.fluxAI.title}
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="https://www.soraainow.com/"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-indigo-200 hover:text-pink-300 transition duration-300"
                                >
                                    {dictionary.footer.soraAI.title}
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="https://www.aibesttool.com/"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-indigo-200 hover:text-pink-300 transition duration-300"
                                >
                                    {dictionary.footer.aiBestTool.title}
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* 第三列：法律信息 */}
                    <div>
                        <h4 className="text-xl font-semibold mb-4">{dictionary.footer.legal}</h4>
                        <ul className="space-y-2">
                            <li>
                                <Link
                                    href={`/${currentLocale}/terms`}
                                    className="text-indigo-200 hover:text-pink-300 transition duration-300"
                                >
                                    {dictionary.footer.terms}
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href={`/${currentLocale}/privacy`}
                                    className="text-indigo-200 hover:text-pink-300 transition duration-300"
                                >
                                    {dictionary.footer.privacy}
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* 第四列：支持信息 */}
                    <div>
                        <h4 className="text-xl font-semibold mb-4">{dictionary.footer.support}</h4>
                        <ul className="space-y-2">
                            <li>
                                <a className="text-indigo-200 hover:text-pink-300 transition duration-300">
                                    juq1991@gmail.com
                                </a>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* 版权信息 */}
                <div className="mt-8 pt-8 border-t border-indigo-800 text-center text-indigo-200">
                    <p>
                        &copy; {new Date().getFullYear()} Flux AI. {dictionary.footer.allRightsReserved}
                    </p>
                </div>
            </div>
        </footer>
    )
}

export default Footer