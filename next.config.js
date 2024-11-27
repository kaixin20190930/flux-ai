/** @types {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    images: {
        domains: ['replicate.delivery'],
    },
    experimental: {
        webpackBuildWorker: true
    },
    env: {
        JWT_SECRET: process.env.JWT_SECRET,
        STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
        STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
    },
};

module.exports = nextConfig;