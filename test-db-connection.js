// Simple test to check database connection
const { Database } = require('./utils/db');

async function testConnection() {
  console.log('Testing database connection...');
  
  try {
    // Try to create a database instance
    const db = new Database();
    console.log('✅ Database instance created');
    
    // Try a simple query
    const result = await db.get('SELECT 1 as test');
    console.log('✅ Database query successful:', result);
    
  } catch (error) {
    console.log('❌ Database connection failed:', error.message);
    console.log('This is expected in development without D1 database');
  }
}

testConnection();
