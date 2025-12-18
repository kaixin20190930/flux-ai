import React from 'react';
export const runtime = 'edge';

const PrivacyPolicy = () => {
    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-indigo-800 text-white">
            <div className="container mx-auto px-4 py-16">
                <h1 className="text-4xl md:text-5xl font-bold text-center mb-8 text-indigo-200">Privacy Policy</h1>
                <div className="bg-indigo-900/50 backdrop-blur-md rounded-xl shadow-2xl p-8">
                    <h2 className="text-2xl font-semibold mb-4 text-pink-300">1. Information We Collect</h2>
                    <p className="mb-4 text-indigo-200">We collect user-provided prompts, generated images, and usage
                        data such as IP addresses and browser information. We use cookies to track user sessions and
                        preferences.</p>

                    <h2 className="text-2xl font-semibold mb-4 text-pink-300">2. How We Use Your Information</h2>
                    <p className="mb-4 text-indigo-200">We use collected information to provide and improve our service,
                        analyze usage patterns, and comply with legal obligations. We do not sell personal information
                        to third parties.</p>

                    <h2 className="text-2xl font-semibold mb-4 text-pink-300">3. Data Storage and Security</h2>
                    <p className="mb-4 text-indigo-200">We implement industry-standard security measures to protect your
                        data. However, no method of transmission over the Internet or electronic storage is 100%
                        secure.</p>

                    <h2 className="text-2xl font-semibold mb-4 text-pink-300">4. User Rights</h2>
                    <p className="mb-4 text-indigo-200">Users have the right to access, correct, or delete their
                        personal information. To exercise these rights, please contact us at [Your Contact Email].</p>

                    <h2 className="text-2xl font-semibold mb-4 text-pink-300">5. Third-Party Services</h2>
                    <p className="mb-4 text-indigo-200">We may use third-party services for analytics or infrastructure.
                        These services have their own privacy policies, and we encourage users to review them.</p>

                    <h2 className="text-2xl font-semibold mb-4 text-pink-300">6. Children&apos;s Privacy</h2>
                    <p className="mb-4 text-indigo-200">Our service is not intended for children under 13. We do not
                        knowingly collect personal information from children under 13.</p>

                    <h2 className="text-2xl font-semibold mb-4 text-pink-300">7. Changes to This Policy</h2>
                    <p className="mb-4 text-indigo-200">We may update this privacy policy from time to time. We will
                        notify users of any significant changes by posting a notice on our website.</p>

                    <h2 className="text-2xl font-semibold mb-4 text-pink-300">8. Contact Us</h2>
                    <p className="mb-4 text-indigo-200">If you have any questions about this privacy policy, please
                        contact us at [Your Contact Email].</p>
                </div>
            </div>
        </div>
    );
};

export default PrivacyPolicy;