/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['bcryptjs'],
    // 禁用 API 路由的静态优化
    isrMemoryCacheSize: 0,
  },
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
    
    // 处理 bcryptjs 在客户端的问题
    config.externals = config.externals || [];
    if (!isServer) {
      config.externals.push({
        'bcryptjs': 'bcryptjs'
      });
    }
    
    return config;
  },
  images: {
    domains: ['localhost', 'your-domain.com'],
    unoptimized: true
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  // 配置输出模式
  output: 'standalone',
  // 禁用静态导出中的 API 路由预渲染
  trailingSlash: false,
  // 确保动态路由不会被静态化
  generateBuildId: async () => {
    return 'build-' + Date.now();
  }
};

module.exports = nextConfig;