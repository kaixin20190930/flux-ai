-- 为 users 表添加 password_hash 字段（如果不存在）
-- Add password_hash column to users table if it doesn't exist

-- 检查并添加 password_hash 字段
ALTER TABLE users ADD COLUMN password_hash TEXT;

-- 为现有用户设置默认值（如果需要）
UPDATE users SET password_hash = 'placeholder-hash' WHERE password_hash IS NULL;
