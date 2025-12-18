// 测试 Replicate API Token
// 运行: node scripts/test-replicate-token.js

require('dotenv').config({ path: '.env.local' });

console.log('🔍 检查 Replicate API Token');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

const token = process.env.REPLICATE_API_TOKEN;

if (token) {
    console.log('✅ Token 存在');
    console.log('Token (前20字符):', token.substring(0, 20) + '...');
    console.log('Token 长度:', token.length);
    
    // 测试 Token 是否有效
    console.log('\n🧪 测试 Token 有效性...');
    
    fetch('https://api.replicate.com/v1/models', {
        headers: {
            'Authorization': `Token ${token}`,
        },
    })
    .then(res => {
        console.log('HTTP 状态:', res.status);
        if (res.status === 200) {
            console.log('✅ Token 有效！');
        } else if (res.status === 401) {
            console.log('❌ Token 无效或已过期');
        } else {
            console.log('⚠️  未知状态:', res.status);
        }
        return res.json();
    })
    .then(data => {
        console.log('\nAPI 响应:', data);
    })
    .catch(err => {
        console.log('❌ 请求失败:', err.message);
    });
} else {
    console.log('❌ Token 不存在');
    console.log('\n请检查 .env.local 文件中的 REPLICATE_API_TOKEN');
}
