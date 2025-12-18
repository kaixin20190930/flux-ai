-- Points System V2 增量迁移
-- 只添加新表，不修改现有表

-- 1. 创建 daily_usage 表（如果不存在）
CREATE TABLE IF NOT EXISTS daily_usage (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL,
  ip_hash TEXT NOT NULL,
  fingerprint_hash TEXT,
  generation_count INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(date, ip_hash, fingerprint_hash)
);

CREATE INDEX IF NOT EXISTS idx_daily_usage_date ON daily_usage(date);
CREATE INDEX IF NOT EXISTS idx_daily_usage_ip ON daily_usage(ip_hash);
CREATE INDEX IF NOT EXISTS idx_daily_usage_fingerprint ON daily_usage(fingerprint_hash);

-- 2. 创建 generation_history 表（如果不存在）
CREATE TABLE IF NOT EXISTS generation_history (
  id TEXT PRIMARY KEY,
  user_id INTEGER,
  model TEXT NOT NULL,
  prompt TEXT NOT NULL,
  image_url TEXT,
  points_used INTEGER NOT NULL,
  used_free_tier BOOLEAN DEFAULT FALSE,
  ip_address TEXT,
  fingerprint_hash TEXT,
  status TEXT DEFAULT 'pending',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  completed_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_generation_user ON generation_history(user_id);
CREATE INDEX IF NOT EXISTS idx_generation_date ON generation_history(created_at);
CREATE INDEX IF NOT EXISTS idx_generation_status ON generation_history(status);

-- 3. 创建 points_transactions 表（新表名，避免与现有 transactions 冲突）
CREATE TABLE IF NOT EXISTS points_transactions (
  id TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL,
  type TEXT NOT NULL,
  amount INTEGER NOT NULL,
  balance_before INTEGER NOT NULL,
  balance_after INTEGER NOT NULL,
  reason TEXT,
  generation_id TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_points_transactions_user ON points_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_points_transactions_date ON points_transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_points_transactions_type ON points_transactions(type);
