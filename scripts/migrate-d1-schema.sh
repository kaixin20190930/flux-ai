#!/bin/bash

# 从旧 D1 数据库迁移表结构到新 D1 数据库

echo "🔄 开始迁移 D1 数据库表结构..."
echo ""

# 新数据库 ID
NEW_DB_ID="2f4a6138-a558-4722-8171-22f7d2fb081f"
NEW_DB_NAME="flux-ai-db"

# 创建 users 表
echo "📊 创建 users 表..."
wrangler d1 execute $NEW_DB_NAME --remote --command "
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  points INT DEFAULT 0,
  is_google_user BOOLEAN DEFAULT 0
);
"

# 创建 transactions 表
echo "💰 创建 transactions 表..."
wrangler d1 execute $NEW_DB_NAME --remote --command "
CREATE TABLE IF NOT EXISTS transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  amount REAL NOT NULL,
  points_added INTEGER NOT NULL,
  session_id TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
"

# 创建 generations 表
echo "🎨 创建 generations 表..."
wrangler d1 execute $NEW_DB_NAME --remote --command "
CREATE TABLE IF NOT EXISTS generations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  model_type TEXT NOT NULL,
  prompt TEXT NOT NULL,
  image_url TEXT NOT NULL,
  points_consumed INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
"

# 创建 generation_records 表
echo "📝 创建 generation_records 表..."
wrangler d1 execute $NEW_DB_NAME --remote --command "
CREATE TABLE IF NOT EXISTS generation_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  generation_data TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
"

# 创建 flux_tools_usage 表
echo "🛠️  创建 flux_tools_usage 表..."
wrangler d1 execute $NEW_DB_NAME --remote --command "
CREATE TABLE IF NOT EXISTS flux_tools_usage (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  tool_type TEXT NOT NULL,
  input_image_url TEXT NOT NULL,
  output_image_url TEXT NOT NULL,
  points_consumed INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
"

# 创建索引
echo "🔍 创建索引..."
wrangler d1 execute $NEW_DB_NAME --remote --command "
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_session_id ON transactions(session_id);
CREATE INDEX IF NOT EXISTS idx_generations_user_id ON generations(user_id);
CREATE INDEX IF NOT EXISTS idx_generations_created_at ON generations(created_at);
CREATE INDEX IF NOT EXISTS idx_flux_tools_user_id ON flux_tools_usage(user_id);
"

echo ""
echo "✅ 数据库表结构迁移完成！"
echo ""
echo "📊 验证表结构..."
wrangler d1 execute $NEW_DB_NAME --remote --command "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;"

echo ""
echo "🎉 完成！现在可以迁移数据了。"
