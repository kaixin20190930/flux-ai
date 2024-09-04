/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    images: {
        domains: ['replicate.delivery'],
    },
    experimental: {
        runtime: 'edge',
    },
};

module.exports = nextConfig;