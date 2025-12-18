-- 修复 users 表的密码字段问题
-- 将现有 password 数据复制到 password_hash（如果 password_hash 为空）

UPDATE users 
SET password_hash = password 
WHERE password_hash IS NULL AND password IS NOT NULL;
