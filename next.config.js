/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    images: {
        domains: ['replicate.delivery'],
    },
    experimental: {
        webpackBuildWorker: true,
        runtime: 'edge' // 添加这行
    },
    webpack: (config) => {
        config.resolve.fallback = {
            ...config.resolve.fallback,
            crypto: require.resolve('crypto-browserify'),
            stream: require.resolve('stream-browserify'),
            http: require.resolve('stream-http'),
            https: require.resolve('https-browserify'),
            os: require.resolve('os-browserify/browser'),
            url: require.resolve('url'),
            assert: require.resolve('assert'),
            buffer: require.resolve('buffer'),
            querystring: require.resolve('querystring-es3'),
        };
        return config;
    },
    env: {
        JWT_SECRET: process.env.JWT_SECRET,
        STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
        STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
    },
};

module.exports = nextConfig;