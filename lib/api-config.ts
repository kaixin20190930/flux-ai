// API 配置文件
export const API_CONFIG = {
  // 根据环境自动切换
  baseURL: process.env.NODE_ENV === 'production'
    ? 'https://flux-ai-worker-prod.liukai19911010.workers.dev'
    : 'http://localhost:8787',
  
  endpoints: {
    auth: {
      register: '/auth/register',
      login: '/auth/login',
      logout: '/auth/logout',
      verifyToken: '/auth/verify-token',
    },
    points: {
      balance: '/points/balance',
      add: '/points/add',
      deduct: '/points/deduct',
    },
    generation: {
      record: '/generation/record',
      get: '/generation/get',
      update: '/generation/update',
      checkRateLimit: '/generation/check-rate-limit',
    },
    transaction: {
      create: '/transaction/create',
      list: '/transaction/list',
    },
    tools: {
      record: '/tools/record',
      list: '/tools/list',
    },
  },
};
