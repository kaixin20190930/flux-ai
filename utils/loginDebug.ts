// 登录调试工具
export function debugLoginState() {
  if (typeof window === 'undefined') {
    console.log('Running on server side');
    return;
  }

  console.group('🔍 Login State Debug');
  
  // 检查localStorage
  const userString = localStorage.getItem('user');
  console.log('localStorage user:', userString);
  
  if (userString) {
    try {
      const user = JSON.parse(userString);
      console.log('Parsed user:', user);
    } catch (error) {
      console.error('Error parsing user:', error);
    }
  }
  
  // 检查cookies
  console.log('All cookies:', document.cookie);
  const hasToken = document.cookie.includes('token=');
  console.log('Has token cookie:', hasToken);
  
  if (hasToken) {
    const tokenMatch = document.cookie.match(/token=([^;]+)/);
    const token = tokenMatch ? tokenMatch[1] : null;
    console.log('Token value:', token ? `${token.substring(0, 20)}...` : 'null');
  }
  
  // 检查API响应
  fetch('/api/getRemainingGenerations', {
    method: 'GET',
    credentials: 'include',
    headers: {
      'Cache-Control': 'no-cache'
    }
  })
  .then(response => response.json())
  .then((data: unknown) => {
    console.log('API response:', data);
  })
  .catch(error => {
    console.error('API error:', error);
  });
  
  console.groupEnd();
}

// 在开发环境下添加到window对象
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).debugLogin = debugLoginState;
  console.log('🔧 Login debug available: window.debugLogin()');
}