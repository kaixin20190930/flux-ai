-- 添加 updated_at 字段到 generation_history 表
-- Add updated_at column to generation_history table

-- 添加字段
ALTER TABLE generation_history ADD COLUMN updated_at TEXT DEFAULT CURRENT_TIMESTAMP;

-- 为现有记录设置初始值
UPDATE generation_history SET updated_at = created_at WHERE updated_at IS NULL;

-- 验证
SELECT COUNT(*) as total_records, 
       COUNT(updated_at) as records_with_updated_at 
FROM generation_history;
