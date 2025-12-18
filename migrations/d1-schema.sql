-- Cloudflare D1 数据库表结构
-- 用于 flux-ai 项目的 Edge Runtime 迁移

-- 用户表 (优化后的结构)
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT, -- 可选，Google用户可能没有密码
  is_google_user INTEGER DEFAULT 0,
  google_id TEXT, -- Google用户ID
  points INTEGER DEFAULT 50,
  status TEXT DEFAULT 'active', -- active, suspended, deleted
  avatar_url TEXT,
  is_admin BOOLEAN DEFAULT FALSE,
  subscription_type TEXT DEFAULT 'free',
  subscription_expires_at DATETIME,
  total_generations INTEGER DEFAULT 0,
  remaining_generations INTEGER DEFAULT 10,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_login_at DATETIME
);

-- 认证会话表
CREATE TABLE IF NOT EXISTS auth_sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  token_hash TEXT NOT NULL,
  expires_at DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_used_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  user_agent TEXT,
  ip_address TEXT,
  is_active INTEGER DEFAULT 1,
  FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

-- 生成历史表
CREATE TABLE IF NOT EXISTS generation_history (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  prompt TEXT NOT NULL,
  image_url TEXT,
  model TEXT DEFAULT 'flux-schnell',
  width INTEGER DEFAULT 1024,
  height INTEGER DEFAULT 1024,
  steps INTEGER DEFAULT 4,
  guidance REAL DEFAULT 0.0,
  seed INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  is_public BOOLEAN DEFAULT FALSE,
  tags TEXT,
  FOREIGN KEY (user_id) REFERENCES users (id)
);

-- 图片搜索历史表
CREATE TABLE IF NOT EXISTS image_search_history (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  query TEXT NOT NULL,
  results TEXT, -- JSON 格式存储搜索结果
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users (id)
);

-- 保存的图片表
CREATE TABLE IF NOT EXISTS saved_images (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  image_url TEXT NOT NULL,
  title TEXT,
  description TEXT,
  tags TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users (id)
);

-- 系统指标表
CREATE TABLE IF NOT EXISTS system_metrics (
  id TEXT PRIMARY KEY,
  metric_name TEXT NOT NULL,
  metric_value REAL NOT NULL,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  metadata TEXT -- JSON 格式存储额外信息
);

-- 用户分析表
CREATE TABLE IF NOT EXISTS user_analytics (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  event_data TEXT, -- JSON 格式
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users (id)
);

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);

CREATE INDEX IF NOT EXISTS idx_auth_sessions_token ON auth_sessions(token_hash);
CREATE INDEX IF NOT EXISTS idx_auth_sessions_user ON auth_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_auth_sessions_expires ON auth_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_auth_sessions_active ON auth_sessions(is_active);

CREATE INDEX IF NOT EXISTS idx_generation_history_user_id ON generation_history(user_id);
CREATE INDEX IF NOT EXISTS idx_generation_history_created_at ON generation_history(created_at);
CREATE INDEX IF NOT EXISTS idx_generation_history_is_public ON generation_history(is_public);

CREATE INDEX IF NOT EXISTS idx_image_search_history_user_id ON image_search_history(user_id);
CREATE INDEX IF NOT EXISTS idx_image_search_history_created_at ON image_search_history(created_at);

CREATE INDEX IF NOT EXISTS idx_saved_images_user_id ON saved_images(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_images_created_at ON saved_images(created_at);

CREATE INDEX IF NOT EXISTS idx_system_metrics_timestamp ON system_metrics(timestamp);
CREATE INDEX IF NOT EXISTS idx_system_metrics_name ON system_metrics(metric_name);

CREATE INDEX IF NOT EXISTS idx_user_analytics_user_id ON user_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_user_analytics_event_type ON user_analytics(event_type);
CREATE INDEX IF NOT EXISTS idx_user_analytics_timestamp ON user_analytics(timestamp);