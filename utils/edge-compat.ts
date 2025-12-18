// Edge Runtime 兼容性包装器
// 用于替换不兼容的 Node.js 模块

export const bcrypt = {
  hash: async (password: string, saltRounds: number) => {
    // 在 Edge Runtime 中使用 EdgeAuth
    const { EdgeAuth } = await import('@/utils/edgeUtils');
    return EdgeAuth.hashPassword(password);
  },
  
  compare: async (password: string, hash: string) => {
    // 在 Edge Runtime 中使用 EdgeAuth
    const { EdgeAuth } = await import('@/utils/edgeUtils');
    return EdgeAuth.verifyPassword(password, hash);
  }
};

export default bcrypt;
