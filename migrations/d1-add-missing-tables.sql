-- 添加缺失的表（如果不存在）

-- transactions 表
CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  type TEXT NOT NULL,
  amount INTEGER NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'completed',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at);

-- generations 表
CREATE TABLE IF NOT EXISTS generations (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  prompt TEXT NOT NULL,
  model TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  image_url TEXT,
  error TEXT,
  points_used INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  completed_at DATETIME,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_generations_user_id ON generations(user_id);
CREATE INDEX IF NOT EXISTS idx_generations_status ON generations(status);
CREATE INDEX IF NOT EXISTS idx_generations_created_at ON generations(created_at);

-- generation_records 表
CREATE TABLE IF NOT EXISTS generation_records (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  prompt TEXT NOT NULL,
  model TEXT NOT NULL,
  image_url TEXT,
  points_used INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_generation_records_user_id ON generation_records(user_id);
CREATE INDEX IF NOT EXISTS idx_generation_records_created_at ON generation_records(created_at);

-- flux_tools_usage 表
CREATE TABLE IF NOT EXISTS flux_tools_usage (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  tool_name TEXT NOT NULL,
  input_data TEXT,
  output_url TEXT,
  points_used INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_flux_tools_usage_user_id ON flux_tools_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_flux_tools_usage_tool_name ON flux_tools_usage(tool_name);
CREATE INDEX IF NOT EXISTS idx_flux_tools_usage_created_at ON flux_tools_usage(created_at);
