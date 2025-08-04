// 认证流程测试脚本
console.log('🔐 Testing Authentication Flow...');

// 模拟认证状态检查
function testAuthState() {
  console.log('\n📊 Current Auth State:');
  
  // 检查localStorage
  const userString = localStorage.getItem('user');
  const hasLocalUser = !!userString;
  let localUser = null;
  
  if (userString) {
    try {
      localUser = JSON.parse(userString);
      console.log('✅ LocalStorage user:', localUser);
    } catch (error) {
      console.error('❌ Error parsing localStorage user:', error);
    }
  } else {
    console.log('❌ No user in localStorage');
  }
  
  // 检查cookie
  const hasToken = document.cookie.includes('token=');
  console.log('🍪 Has token:', hasToken);
  
  // 检查API状态
  fetch('/api/getRemainingGenerations', {
    method: 'GET',
    credentials: 'include',
    headers: {
      'Cache-Control': 'no-cache'
    }
  })
  .then(response => response.json())
  .then(data => {
    console.log('🌐 API Response:', data);
    
    // 比较状态
    const localLoggedIn = !!(localUser && hasToken);
    const apiLoggedIn = data.isLoggedIn;
    
    console.log('\n🔄 Status Comparison:');
    console.log('Local logged in:', localLoggedIn);
    console.log('API logged in:', apiLoggedIn);
    console.log('Status match:', localLoggedIn === apiLoggedIn);
    
    if (localLoggedIn !== apiLoggedIn) {
      console.warn('⚠️ Status mismatch detected!');
    }
  })
  .catch(error => {
    console.error('❌ API request failed:', error);
  });
}

// 测试认证状态同步
function testAuthSync() {
  console.log('\n🔄 Testing Auth Sync...');
  
  // 触发认证状态更新
  const event = new CustomEvent('auth-state-changed');
  window.dispatchEvent(event);
  
  // 延迟检查状态
  setTimeout(() => {
    testAuthState();
  }, 1000);
}

// 清除认证数据
function clearAuthData() {
  console.log('\n🧹 Clearing auth data...');
  localStorage.removeItem('user');
  document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Lax';
  console.log('✅ Auth data cleared');
}

// 导出测试函数
window.testAuthFlow = {
  testAuthState,
  testAuthSync,
  clearAuthData
};

console.log('✅ Auth test functions loaded. Use:');
console.log('- window.testAuthFlow.testAuthState()');
console.log('- window.testAuthFlow.testAuthSync()');
console.log('- window.testAuthFlow.clearAuthData()'); 