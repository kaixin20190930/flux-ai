import React from 'react'
import Link from 'next/link'

const Footer: React.FC = () => {
    return (
        <footer className="bg-indigo-900 text-white py-12">
            <div className="container mx-auto px-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    <div>
                        <h3 className="text-2xl font-bold mb-4">< Link href="/">Flux AI</Link></h3>
                        <p className="text-indigo-200">Transforming ideas into stunning visuals with the power of
                            Flux AI.</p>
                    </div>
                    <div>
                        <h4 className="text-xl font-semibold mb-4">Quick Links</h4>
                        <ul className="space-y-2">
                            <li><Link href="/about"
                                      className="text-indigo-200 hover:text-pink-300 transition duration-300">About
                                Us</Link></li>
                            <li><Link href="/pricing"
                                      className="text-indigo-200 hover:text-pink-300 transition duration-300">Pricing</Link>
                            </li>
                            <li><Link href="/contact"
                                      className="text-indigo-200 hover:text-pink-300 transition duration-300">Contact</Link>
                            </li>
                            <li><Link href="https://tap4.ai/ai/flux-ai-io"
                                      className="text-indigo-200 hover:text-pink-300 transition duration-300"
                                      title="Flux Image AI">Flux Image AI</Link>
                            </li>
                            <li><Link href="https://www.soraainow.com/"
                                      className="text-indigo-200 hover:text-pink-300 transition duration-300"
                                      title="SORA AI">SORA AI</Link>
                            </li>
                            <li><Link href="https://www.aibesttool.com/"
                                      className="text-indigo-200 hover:text-pink-300 transition duration-300"
                                      title="AI Best Tool">AI Best Tool</Link>
                            </li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="text-xl font-semibold mb-4">Legal</h4>
                        <ul className="space-y-2">
                            <li><Link href="/terms"
                                      className="text-indigo-200 hover:text-pink-300 transition duration-300">Terms of
                                Service</Link></li>
                            <li><Link href="/privacy"
                                      className="text-indigo-200 hover:text-pink-300 transition duration-300">Privacy
                                Policy</Link></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="text-xl font-semibold mb-4">Support</h4>
                        <ul className="space-y-2">
                            <li><a
                                className="text-indigo-200 hover:text-pink-300 transition duration-300">juq1991@gmail.com</a>
                            </li>
                        </ul>
                    </div>
                </div>
                <div className="mt-8 pt-8 border-t border-indigo-800 text-center text-indigo-200">
                    <p>&copy; {new Date().getFullYear()} Flux AI. All rights reserved.</p>
                </div>
            </div>
        </footer>
    )
}

export default Footer