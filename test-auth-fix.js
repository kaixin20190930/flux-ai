// 测试认证修复
const testEmail = 'test@example.com';
const testPassword = 'password123';

async function testLogin() {
  console.log('Testing login with:', testEmail);
  
  try {
    const response = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: testEmail,
        password: testPassword
      })
    });
    
    const data = await response.json();
    console.log('Login response status:', response.status);
    console.log('Login response:', JSON.stringify(data, null, 2));
    
    if (response.ok) {
      console.log('✅ Login successful!');
      return data.token;
    } else {
      console.log('❌ Login failed:', data.error?.message);
      return null;
    }
  } catch (error) {
    console.error('❌ Login error:', error.message);
    return null;
  }
}

async function testRegister() {
  const newEmail = `test${Date.now()}@example.com`;
  console.log('\nTesting registration with:', newEmail);
  
  try {
    const response = await fetch('http://localhost:3000/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Test User',
        email: newEmail,
        password: testPassword
      })
    });
    
    const data = await response.json();
    console.log('Register response status:', response.status);
    console.log('Register response:', JSON.stringify(data, null, 2));
    
    if (response.ok) {
      console.log('✅ Registration successful!');
      
      // Now try to login with the new account
      console.log('\nTrying to login with newly registered account...');
      const loginResponse = await fetch('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: newEmail,
          password: testPassword
        })
      });
      
      const loginData = await loginResponse.json();
      console.log('Login after registration status:', loginResponse.status);
      console.log('Login after registration:', JSON.stringify(loginData, null, 2));
      
      if (loginResponse.ok) {
        console.log('✅ Login after registration successful!');
      } else {
        console.log('❌ Login after registration failed:', loginData.error?.message);
      }
      
      return data.token;
    } else {
      console.log('❌ Registration failed:', data.error?.message);
      return null;
    }
  } catch (error) {
    console.error('❌ Registration error:', error.message);
    return null;
  }
}

async function runTests() {
  console.log('=== Starting Authentication Tests ===\n');
  
  // Test 1: Login with existing account
  await testLogin();
  
  // Test 2: Register and login
  await testRegister();
  
  console.log('\n=== Tests Complete ===');
}

runTests();
