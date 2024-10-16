import React from 'react'
import Link from 'next/link'

const Footer: React.FC = () => {
    return (
        <footer className="bg-indigo-900 text-white py-12">
            <div className="container mx-auto px-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    <div>
                        <h3 className="text-2xl font-bold mb-4">Flux AI</h3>
                        <p className="text-indigo-200">Transforming ideas into stunning visuals with the power of
                            AI.</p>
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
                            <li><a href="https://tap4.ai/ai/flux-ai-io" title="Flux Image AI">Flux Image AI</a>
                            </li>
                            <li><a href="https://www.soraainow.com/" title="SORA AI">SORA AI</a>
                            </li>
                            <li><a href="https://www.aibesttool.com/" title="AI Best Tool">AI Best Tool</a>
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
                        <h4 className="text-xl font-semibold mb-4">Connect</h4>
                        <ul className="space-y-2">
                            <li><a href="#"
                                   className="text-indigo-200 hover:text-pink-300 transition duration-300">Twitter</a>
                            </li>
                            <li><a href="#"
                                   className="text-indigo-200 hover:text-pink-300 transition duration-300">LinkedIn</a>
                            </li>
                            <li><a href="#"
                                   className="text-indigo-200 hover:text-pink-300 transition duration-300">GitHub</a>
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