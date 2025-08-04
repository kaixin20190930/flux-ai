// 简单登录测试脚本
const testLogin = async () => {
  console.log('🔐 Testing Login API...');
  
  const testUser = {
    email: 'test@example.com',
    password: 'testpassword123'
  };
  
  try {
    // 测试登录API
    const response = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testUser),
      credentials: 'include'
    });
    
    const data = await response.json();
    
    console.log('📊 Login Response:');
    console.log('Status:', response.status);
    console.log('Data:', data);
    
    if (response.ok) {
      console.log('✅ Login successful!');
      
      // 测试获取用户信息
      const userResponse = await fetch('http://localhost:3000/api/getRemainingGenerations', {
        method: 'GET',
        credentials: 'include'
      });
      
      const userData = await userResponse.json();
      console.log('👤 User data:', userData);
      
    } else {
      console.log('❌ Login failed:', data.error);
    }
    
  } catch (error) {
    console.error('❌ Network error:', error);
  }
};

// 测试注册API
const testRegister = async () => {
  console.log('📝 Testing Register API...');
  
  const testUser = {
    email: 'test@example.com',
    password: 'testpassword123'
  };
  
  try {
    const response = await fetch('http://localhost:3000/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testUser),
      credentials: 'include'
    });
    
    const data = await response.json();
    
    console.log('📊 Register Response:');
    console.log('Status:', response.status);
    console.log('Data:', data);
    
    if (response.ok) {
      console.log('✅ Registration successful!');
    } else {
      console.log('❌ Registration failed:', data.error);
    }
    
  } catch (error) {
    console.error('❌ Network error:', error);
  }
};

// 运行测试
const runTests = async () => {
  console.log('🚀 Starting authentication tests...\n');
  
  // 先测试注册
  await testRegister();
  
  console.log('\n' + '='.repeat(50) + '\n');
  
  // 再测试登录
  await testLogin();
};

// 如果在Node.js环境中运行
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { testLogin, testRegister, runTests };
} else {
  // 在浏览器中运行
  window.authTests = { testLogin, testRegister, runTests };
  console.log('✅ Auth test functions loaded. Use: window.authTests.runTests()');
}

// 自动运行测试
runTests();