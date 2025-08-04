/** @types {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    images: {
        domains: ['replicate.delivery'],
    },
    experimental: {},
    webpack: (config, { isServer }) => {
        if (!isServer) {
            config.resolve.fallback = {
                ...config.resolve.fallback,
                crypto: false,
                fs: false,
                net: false,
                tls: false,
            };
        }
        return config;
    },
    env: {
        JWT_SECRET: process.env.JWT_SECRET,
        STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
        STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
    },
};

module.exports = nextConfig;