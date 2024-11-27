/** @type {import('next').NextConfig} */
const nextConfig = {
    experimental: {
        webpackBuildWorker: true,
    },
    webpack: (config) => {
        config.resolve.fallback = {
            ...config.resolve.fallback,
            crypto: require.resolve('crypto-browserify'),
            stream: require.resolve('readable-stream')
        }
        return config
    },
    env: {
        JWT_SECRET: process.env.JWT_SECRET,
        STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
        STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
    },
};

module.exports = nextConfig;