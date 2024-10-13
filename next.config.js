/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    images: {
        domains: ['replicate.delivery'],
    },
    experimental: {
        runtime: 'edge',
        edge: {
            env: ['JWT_SECRET'],
        },
    },
    env: {
        JWT_SECRET: process.env.JWT_SECRET,
    },
};

module.exports = nextConfig;