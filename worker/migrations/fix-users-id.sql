-- 修复 users 表的 id 列
-- 问题：id 列全是 null，需要设置为自增主键

-- 1. 创建新表（正确的结构）
CREATE TABLE IF NOT EXISTS users_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  is_google_user INTEGER DEFAULT 0,
  google_id TEXT,
  points INTEGER DEFAULT 50,
  status TEXT DEFAULT 'active',
  avatar_url TEXT,
  is_admin INTEGER DEFAULT 0,
  subscription_type TEXT DEFAULT 'free',
  subscription_expires_at TEXT,
  total_generations INTEGER DEFAULT 0,
  remaining_generations INTEGER DEFAULT 10,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  last_login_at TEXT
);

-- 2. 复制数据（排除 id 列，让它自动生成）
INSERT INTO users_new (
  name, email, password_hash, is_google_user, google_id, points,
  status, avatar_url, is_admin, subscription_type, subscription_expires_at,
  total_generations, remaining_generations, created_at, updated_at, last_login_at
)
SELECT 
  name, email, password_hash, is_google_user, google_id, points,
  status, avatar_url, is_admin, subscription_type, subscription_expires_at,
  total_generations, remaining_generations, created_at, updated_at, last_login_at
FROM users;

-- 3. 删除旧表
DROP TABLE users;

-- 4. 重命名新表
ALTER TABLE users_new RENAME TO users;

-- 5. 创建索引
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);
