// 全局认证状态刷新工具
let refreshCallbacks: (() => void)[] = [];

export function registerAuthRefreshCallback(callback: () => void) {
  refreshCallbacks.push(callback);
  
  // 返回取消注册函数
  return () => {
    refreshCallbacks = refreshCallbacks.filter(cb => cb !== callback);
  };
}

export function triggerGlobalAuthRefresh() {
  console.log('Triggering global auth refresh for', refreshCallbacks.length, 'callbacks');
  refreshCallbacks.forEach(callback => {
    try {
      callback();
    } catch (error) {
      console.error('Error in auth refresh callback:', error);
    }
  });
}

// 在开发环境下添加到window对象
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).triggerAuthRefresh = triggerGlobalAuthRefresh;
  console.log('🔧 Global auth refresh available: window.triggerAuthRefresh()');
}