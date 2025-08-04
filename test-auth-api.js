// 简单的API测试脚本
// 在浏览器控制台中运行

async function testAuthAPI() {
  console.log('Testing getRemainingGenerations API...');
  
  try {
    const response = await fetch('/api/getRemainingGenerations');
    const data = await response.json();
    
    console.log('Response status:', response.status);
    console.log('Response data:', data);
    
    if (response.ok) {
      console.log('✅ API working correctly');
      console.log('- Remaining free generations:', data.remainingFreeGenerations);
      console.log('- Is logged in:', data.isLoggedIn);
      console.log('- User points:', data.userPoints);
      console.log('- User ID:', data.userId);
    } else {
      console.log('❌ API returned error');
    }
  } catch (error) {
    console.log('❌ Network error:', error);
  }
}

async function testImageSearchAPIs() {
  console.log('\nTesting image search APIs...');
  
  // Test history API
  try {
    const historyResponse = await fetch('/api/image-search/history');
    console.log('History API status:', historyResponse.status);
    
    if (historyResponse.status === 401) {
      console.log('✅ History API correctly requires authentication');
    } else {
      const historyData = await historyResponse.json();
      console.log('History API data:', historyData);
    }
  } catch (error) {
    console.log('❌ History API error:', error);
  }
  
  // Test saved images API
  try {
    const savedResponse = await fetch('/api/image-search/saved');
    console.log('Saved API status:', savedResponse.status);
    
    if (savedResponse.status === 401) {
      console.log('✅ Saved API correctly requires authentication');
    } else {
      const savedData = await savedResponse.json();
      console.log('Saved API data:', savedData);
    }
  } catch (error) {
    console.log('❌ Saved API error:', error);
  }
}

// 运行测试
testAuthAPI();
testImageSearchAPIs();

console.log('\n📋 Instructions:');
console.log('1. Open browser console');
console.log('2. Copy and paste this script');
console.log('3. Check the results');
console.log('4. If logged in, APIs should return data');
console.log('5. If not logged in, should see appropriate responses');