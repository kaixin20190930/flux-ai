import { GenerationHistoryDAO } from '@/utils/dao';
import { GenerationHistory } from '@/types/database';
import { runDatabaseMigrations } from '@/utils/migrations';

// 模拟环境配置
const mockEnv = {
  DB: null as any, // 这里需要实际的数据库连接
  'DB-DEV': null as any,
  JWT_SECRET: 'test-secret',
  ENVIRONMENT: 'development' as const
};

async function testHistoryAPI() {
  console.log('开始测试历史记录 API...');

  try {
    // 运行数据库迁移
    console.log('运行数据库迁移...');
    await runDatabaseMigrations(mockEnv);
    
    // 创建 DAO 实例
    const dao = new GenerationHistoryDAO(mockEnv);
    
    // 测试创建历史记录
    console.log('测试创建历史记录...');
    const testHistory: Omit<GenerationHistory, 'createdAt' | 'updatedAt'> = {
      id: '',
      userId: 'test-user-1',
      prompt: 'A beautiful sunset over mountains',
      model: 'flux-1.1-pro',
      parameters: {
        width: 1024,
        height: 1024,
        aspectRatio: '1:1',
        outputFormat: 'png',
        seed: 12345,
        style: 'realistic'
      },
      imageUrl: 'https://example.com/image.png',
      thumbnailUrl: 'https://example.com/thumb.png',
      tags: ['sunset', 'mountains', 'landscape'],
      isPublic: false,
      downloadCount: 0
    };
    
    const historyId = await dao.create(testHistory);
    console.log(`创建的历史记录 ID: ${historyId}`);
    
    // 测试查询历史记录
    console.log('测试查询历史记录...');
    const history = await dao.findById(historyId);
    console.log('查询结果:', history);
    
    // 测试更新历史记录
    console.log('测试更新历史记录...');
    await dao.update(historyId, {
      tags: [...(history?.tags || []), 'test-tag'],
      isPublic: true
    });
    
    // 测试查询更新后的历史记录
    console.log('测试查询更新后的历史记录...');
    const updatedHistory = await dao.findById(historyId);
    console.log('更新后的历史记录:', updatedHistory);
    
    // 测试查询用户历史记录
    console.log('测试查询用户历史记录...');
    const userHistories = await dao.findByUserId('test-user-1');
    console.log(`用户历史记录数量: ${userHistories.items.length}`);
    
    // 测试更新下载计数
    console.log('测试更新下载计数...');
    await dao.updateDownloadCount(historyId);
    
    // 测试查询更新后的历史记录
    console.log('测试查询更新下载计数后的历史记录...');
    const historyAfterDownload = await dao.findById(historyId);
    console.log(`下载计数: ${historyAfterDownload?.downloadCount}`);
    
    // 测试删除历史记录
    console.log('测试删除历史记录...');
    await dao.delete(historyId, 'test-user-1');
    
    // 测试查询已删除的历史记录
    console.log('测试查询已删除的历史记录...');
    const deletedHistory = await dao.findById(historyId);
    console.log('删除后查询结果:', deletedHistory);
    
    console.log('✅ 历史记录 API 测试完成！');
  } catch (error) {
    console.error('❌ 历史记录 API 测试失败:', error);
    throw error;
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  testHistoryAPI().catch(console.error);
}

export { testHistoryAPI };