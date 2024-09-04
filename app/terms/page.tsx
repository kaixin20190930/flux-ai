import React from 'react';

const TermsOfService = () => {
    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-indigo-800 text-white">
            <div className="container mx-auto px-4 py-16">
                <h1 className="text-4xl md:text-5xl font-bold text-center mb-8 text-indigo-200">Terms of Service</h1>
                <div className="bg-indigo-900/50 backdrop-blur-md rounded-xl shadow-2xl p-8">
                    <h2 className="text-2xl font-semibold mb-4 text-pink-300">1. Acceptance of Terms</h2>
                    <p className="mb-4 text-indigo-200">By accessing and using the Flux AI Image Generator service, you
                        agree to be bound by these Terms of Service. If you do not agree to these terms, please do not
                        use our service.</p>

                    <h2 className="text-2xl font-semibold mb-4 text-pink-300">2. Description of Service</h2>
                    <p className="mb-4 text-indigo-200">Our AI Image Generator creates images based on text prompts
                        provided by users. The service is provided&quot;as is&quot;and we do not guarantee the accuracy,
                        quality, or appropriateness of generated images.</p>

                    <h2 className="text-2xl font-semibold mb-4 text-pink-300">3. User Responsibilities</h2>
                    <p className="mb-4 text-indigo-200">Users are responsible for the content of their prompts and agree
                        not to use the service for any illegal or harmful purposes. We reserve the right to terminate
                        service for users who violate these terms.</p>

                    <h2 className="text-2xl font-semibold mb-4 text-pink-300">4. Intellectual Property</h2>
                    <p className="mb-4 text-indigo-200">Users retain rights to their prompts, but grant us a license to
                        use generated images for service improvement. We retain rights to the AI model and underlying
                        technology.</p>

                    <h2 className="text-2xl font-semibold mb-4 text-pink-300">5. Limitation of Liability</h2>
                    <p className="mb-4 text-indigo-200">We are not liable for any damages arising from the use of our
                        service, including but not limited to direct, indirect, incidental, punitive, and consequential
                        damages.</p>

                    <h2 className="text-2xl font-semibold mb-4 text-pink-300">6. Changes to Terms</h2>
                    <p className="mb-4 text-indigo-200">We reserve the right to modify these terms at any time.
                        Continued use of the service after changes constitutes acceptance of the new terms.</p>

                    <h2 className="text-2xl font-semibold mb-4 text-pink-300">7. Governing Law</h2>
                    <p className="mb-4 text-indigo-200">These terms are governed by the laws of [Your Jurisdiction],
                        without regard to its conflict of law provisions.</p>
                </div>
            </div>
        </div>
    );
};

export default TermsOfService;