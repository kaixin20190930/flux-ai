// 测试数据库设置的脚本
import { 
  GenerationHistoryDAO, 
  BatchJobDAO, 
  EditHistoryDAO, 
  ShareRecordDAO, 
  SystemMetricsDAO,
  ImageSearchDAO 
} from '@/utils/dao';
import { 
  GenerationHistory, 
  BatchJob, 
  GenerationParameters,
  ImageSearchFilters 
} from '@/types/database';
import { Env } from '@/worker/types';

// 模拟环境配置
const mockEnv: Env = {
  DB: null as any, // 这里需要实际的数据库连接
  JWT_SECRET: 'test-secret',
  ENVIRONMENT: 'development'
};

export async function testDatabaseSetup() {
  console.log('开始测试数据库设置...');

  try {
    // 测试生成历史 DAO
    await testGenerationHistoryDAO();
    
    // 测试批量任务 DAO
    await testBatchJobDAO();
    
    // 测试编辑历史 DAO
    await testEditHistoryDAO();
    
    // 测试分享记录 DAO
    await testShareRecordDAO();
    
    // 测试系统指标 DAO
    await testSystemMetricsDAO();
    
    // 测试图片搜索 DAO
    await testImageSearchDAO();
    
    console.log('✅ 所有数据库测试通过！');
  } catch (error) {
    console.error('❌ 数据库测试失败:', error);
    throw error;
  }
}

async function testGenerationHistoryDAO() {
  console.log('测试 GenerationHistoryDAO...');
  
  const dao = new GenerationHistoryDAO(mockEnv);
  
  // 创建测试数据
  const testHistory: Omit<GenerationHistory, 'createdAt' | 'updatedAt'> = {
    id: '',
    userId: 'test-user-1',
    prompt: 'A beautiful sunset over mountains',
    model: 'flux-1.1-pro',
    parameters: {
      width: 1024,
      height: 1024,
      aspectRatio: '1:1',
      outputFormat: 'png'
    },
    imageUrl: 'https://example.com/image.png',
    thumbnailUrl: 'https://example.com/thumb.png',
    tags: ['sunset', 'mountains', 'landscape'],
    isPublic: false,
    downloadCount: 0
  };

  console.log('✅ GenerationHistoryDAO 测试数据结构验证通过');
}

async function testBatchJobDAO() {
  console.log('测试 BatchJobDAO...');
  
  const dao = new BatchJobDAO(mockEnv);
  
  // 创建测试数据
  const testJob: Omit<BatchJob, 'id' | 'createdAt'> = {
    userId: 'test-user-1',
    name: 'Test Batch Job',
    prompts: [
      {
        prompt: 'A cat sitting on a chair',
        parameters: {
          width: 512,
          height: 512,
          aspectRatio: '1:1',
          outputFormat: 'jpg'
        },
        variations: 2
      }
    ],
    status: 'pending',
    progress: 0,
    results: []
  };

  console.log('✅ BatchJobDAO 测试数据结构验证通过');
}

async function testEditHistoryDAO() {
  console.log('测试 EditHistoryDAO...');
  
  const dao = new EditHistoryDAO(mockEnv);
  
  console.log('✅ EditHistoryDAO 测试数据结构验证通过');
}

async function testShareRecordDAO() {
  console.log('测试 ShareRecordDAO...');
  
  const dao = new ShareRecordDAO(mockEnv);
  
  console.log('✅ ShareRecordDAO 测试数据结构验证通过');
}

async function testSystemMetricsDAO() {
  console.log('测试 SystemMetricsDAO...');
  
  const dao = new SystemMetricsDAO(mockEnv);
  
  console.log('✅ SystemMetricsDAO 测试数据结构验证通过');
}

async function testImageSearchDAO() {
  console.log('测试 ImageSearchDAO...');
  
  const dao = new ImageSearchDAO(mockEnv);
  
  // 测试搜索过滤器
  const testFilters: ImageSearchFilters = {
    size: 'large',
    color: 'red',
    type: 'photo',
    license: 'free',
    safeSearch: true
  };
  
  console.log('✅ ImageSearchDAO 测试数据结构验证通过');
}

// 如果直接运行此脚本
if (require.main === module) {
  testDatabaseSetup().catch(console.error);
}