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

DROP TABLE IF EXISTS generation_history;

CREATE TABLE generation_history (
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

CREATE INDEX idx_generation_user ON generation_history(user_id);
CREATE INDEX idx_generation_date ON generation_history(created_at);
CREATE INDEX idx_generation_status ON generation_history(status);

CREATE TABLE IF NOT EXISTS transactions (
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

CREATE INDEX IF NOT EXISTS idx_transactions_user ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
