-- Migration: Secure Authentication and Trial System
-- Version: 002
-- Description: Add tables and columns for multi-layer usage tracking, IP blocking, 
--              fingerprint tracking, security events, and points transactions

-- ============================================================================
-- 1. Usage Tracking Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS usage_tracking (
  id TEXT PRIMARY KEY,
  fingerprint_hash TEXT,
  ip_hash TEXT NOT NULL,
  user_id TEXT,
  generation_count INTEGER DEFAULT 0,
  date TEXT NOT NULL, -- YYYY-MM-DD format
  last_used_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  user_agent TEXT,
  suspicious_activity BOOLEAN DEFAULT FALSE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL
);

-- Indexes for usage_tracking
CREATE INDEX IF NOT EXISTS idx_usage_tracking_fingerprint_date ON usage_tracking(fingerprint_hash, date);
CREATE INDEX IF NOT EXISTS idx_usage_tracking_ip_date ON usage_tracking(ip_hash, date);
CREATE INDEX IF NOT EXISTS idx_usage_tracking_user_date ON usage_tracking(user_id, date);
CREATE INDEX IF NOT EXISTS idx_usage_tracking_date ON usage_tracking(date);
CREATE INDEX IF NOT EXISTS idx_usage_tracking_suspicious ON usage_tracking(suspicious_activity);

-- ============================================================================
-- 2. IP Blocking Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS ip_blocks (
  id TEXT PRIMARY KEY,
  ip_hash TEXT NOT NULL UNIQUE,
  blocked_until DATETIME NOT NULL,
  reason TEXT NOT NULL,
  severity TEXT DEFAULT 'medium', -- low, medium, high, critical
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT, -- admin user ID or 'system'
  metadata TEXT -- JSON for additional info
);

-- Indexes for ip_blocks
CREATE INDEX IF NOT EXISTS idx_ip_blocks_hash ON ip_blocks(ip_hash);
CREATE INDEX IF NOT EXISTS idx_ip_blocks_until ON ip_blocks(blocked_until);
CREATE INDEX IF NOT EXISTS idx_ip_blocks_severity ON ip_blocks(severity);

-- ============================================================================
-- 3. Fingerprint Tracking Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS fingerprint_tracking (
  id TEXT PRIMARY KEY,
  fingerprint_hash TEXT NOT NULL UNIQUE,
  first_seen_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_seen_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  user_ids TEXT, -- JSON array of associated user IDs
  ip_hashes TEXT, -- JSON array of associated IP hashes
  suspicious_score INTEGER DEFAULT 0, -- 0-100
  is_blocked BOOLEAN DEFAULT FALSE,
  block_reason TEXT,
  metadata TEXT -- JSON for additional info
);

-- Indexes for fingerprint_tracking
CREATE INDEX IF NOT EXISTS idx_fingerprint_tracking_hash ON fingerprint_tracking(fingerprint_hash);
CREATE INDEX IF NOT EXISTS idx_fingerprint_tracking_suspicious ON fingerprint_tracking(suspicious_score);
CREATE INDEX IF NOT EXISTS idx_fingerprint_tracking_blocked ON fingerprint_tracking(is_blocked);
CREATE INDEX IF NOT EXISTS idx_fingerprint_tracking_last_seen ON fingerprint_tracking(last_seen_at);

-- ============================================================================
-- 4. Security Events Log
-- ============================================================================
CREATE TABLE IF NOT EXISTS security_events (
  id TEXT PRIMARY KEY,
  event_type TEXT NOT NULL, -- login_attempt, rate_limit, abuse_detected, etc.
  severity TEXT NOT NULL, -- low, medium, high, critical
  fingerprint_hash TEXT,
  ip_hash TEXT,
  user_id TEXT,
  session_id TEXT,
  details TEXT, -- JSON with event-specific details
  user_agent TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL
);

-- Indexes for security_events
CREATE INDEX IF NOT EXISTS idx_security_events_type ON security_events(event_type);
CREATE INDEX IF NOT EXISTS idx_security_events_severity ON security_events(severity);
CREATE INDEX IF NOT EXISTS idx_security_events_created ON security_events(created_at);
CREATE INDEX IF NOT EXISTS idx_security_events_fingerprint ON security_events(fingerprint_hash);
CREATE INDEX IF NOT EXISTS idx_security_events_ip ON security_events(ip_hash);
CREATE INDEX IF NOT EXISTS idx_security_events_user ON security_events(user_id);

-- ============================================================================
-- 5. Points Transaction Log
-- ============================================================================
CREATE TABLE IF NOT EXISTS points_transactions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  amount INTEGER NOT NULL, -- positive for add, negative for deduct
  balance_before INTEGER NOT NULL,
  balance_after INTEGER NOT NULL,
  reason TEXT NOT NULL, -- generation, purchase, refund, bonus, etc.
  generation_id TEXT, -- reference to generation if applicable
  reference_id TEXT, -- generic reference for other transaction types
  metadata TEXT, -- JSON for additional info
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

-- Indexes for points_transactions
CREATE INDEX IF NOT EXISTS idx_points_transactions_user ON points_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_points_transactions_created ON points_transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_points_transactions_reason ON points_transactions(reason);
CREATE INDEX IF NOT EXISTS idx_points_transactions_generation ON points_transactions(generation_id);

-- ============================================================================
-- 6. Update auth_sessions Table
-- ============================================================================
-- Add new columns to existing auth_sessions table
ALTER TABLE auth_sessions ADD COLUMN fingerprint_hash TEXT;
ALTER TABLE auth_sessions ADD COLUMN ip_hash TEXT;
ALTER TABLE auth_sessions ADD COLUMN device_info TEXT; -- JSON with browser, os, device
ALTER TABLE auth_sessions ADD COLUMN risk_score INTEGER DEFAULT 0; -- 0-100

-- Add indexes for new columns
CREATE INDEX IF NOT EXISTS idx_auth_sessions_fingerprint ON auth_sessions(fingerprint_hash);
CREATE INDEX IF NOT EXISTS idx_auth_sessions_ip ON auth_sessions(ip_hash);
CREATE INDEX IF NOT EXISTS idx_auth_sessions_risk ON auth_sessions(risk_score);

-- ============================================================================
-- 7. Rate Limiting Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS rate_limits (
  id TEXT PRIMARY KEY,
  identifier TEXT NOT NULL, -- fingerprint_hash, ip_hash, or user_id
  identifier_type TEXT NOT NULL, -- 'fingerprint', 'ip', 'user'
  endpoint TEXT NOT NULL, -- API endpoint being rate limited
  request_count INTEGER DEFAULT 0,
  window_start DATETIME NOT NULL,
  window_end DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for rate_limits
CREATE INDEX IF NOT EXISTS idx_rate_limits_identifier ON rate_limits(identifier, identifier_type, endpoint);
CREATE INDEX IF NOT EXISTS idx_rate_limits_window ON rate_limits(window_end);

-- ============================================================================
-- 8. Abuse Patterns Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS abuse_patterns (
  id TEXT PRIMARY KEY,
  pattern_type TEXT NOT NULL, -- multiple_accounts, rapid_requests, vpn_abuse, etc.
  fingerprint_hash TEXT,
  ip_hash TEXT,
  user_ids TEXT, -- JSON array of associated user IDs
  detection_count INTEGER DEFAULT 1,
  first_detected_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_detected_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  severity TEXT DEFAULT 'medium', -- low, medium, high, critical
  status TEXT DEFAULT 'active', -- active, resolved, false_positive
  notes TEXT,
  metadata TEXT -- JSON for pattern-specific details
);

-- Indexes for abuse_patterns
CREATE INDEX IF NOT EXISTS idx_abuse_patterns_type ON abuse_patterns(pattern_type);
CREATE INDEX IF NOT EXISTS idx_abuse_patterns_fingerprint ON abuse_patterns(fingerprint_hash);
CREATE INDEX IF NOT EXISTS idx_abuse_patterns_ip ON abuse_patterns(ip_hash);
CREATE INDEX IF NOT EXISTS idx_abuse_patterns_severity ON abuse_patterns(severity);
CREATE INDEX IF NOT EXISTS idx_abuse_patterns_status ON abuse_patterns(status);
CREATE INDEX IF NOT EXISTS idx_abuse_patterns_last_detected ON abuse_patterns(last_detected_at);

-- ============================================================================
-- 9. Create Views for Common Queries
-- ============================================================================

-- View: Daily usage summary
CREATE VIEW IF NOT EXISTS daily_usage_summary AS
SELECT 
  date,
  COUNT(DISTINCT user_id) as unique_users,
  COUNT(DISTINCT ip_hash) as unique_ips,
  COUNT(DISTINCT fingerprint_hash) as unique_fingerprints,
  SUM(generation_count) as total_generations,
  SUM(CASE WHEN suspicious_activity = 1 THEN generation_count ELSE 0 END) as suspicious_generations
FROM usage_tracking
GROUP BY date
ORDER BY date DESC;

-- View: Active security threats
CREATE VIEW IF NOT EXISTS active_security_threats AS
SELECT 
  'ip_block' as threat_type,
  ip_hash as identifier,
  reason as description,
  severity,
  blocked_until as expires_at,
  created_at
FROM ip_blocks
WHERE blocked_until > datetime('now')
UNION ALL
SELECT 
  'fingerprint_block' as threat_type,
  fingerprint_hash as identifier,
  block_reason as description,
  CASE 
    WHEN suspicious_score >= 80 THEN 'critical'
    WHEN suspicious_score >= 60 THEN 'high'
    WHEN suspicious_score >= 40 THEN 'medium'
    ELSE 'low'
  END as severity,
  NULL as expires_at,
  last_seen_at as created_at
FROM fingerprint_tracking
WHERE is_blocked = 1;

-- View: User points summary
CREATE VIEW IF NOT EXISTS user_points_summary AS
SELECT 
  u.id as user_id,
  u.email,
  u.name,
  u.points as current_points,
  COUNT(pt.id) as transaction_count,
  SUM(CASE WHEN pt.amount > 0 THEN pt.amount ELSE 0 END) as total_earned,
  SUM(CASE WHEN pt.amount < 0 THEN ABS(pt.amount) ELSE 0 END) as total_spent,
  MAX(pt.created_at) as last_transaction_at
FROM users u
LEFT JOIN points_transactions pt ON u.id = pt.user_id
GROUP BY u.id, u.email, u.name, u.points;

-- ============================================================================
-- 10. Triggers for Automatic Updates
-- ============================================================================

-- Trigger: Update updated_at timestamp on usage_tracking
CREATE TRIGGER IF NOT EXISTS update_usage_tracking_timestamp
AFTER UPDATE ON usage_tracking
FOR EACH ROW
BEGIN
  UPDATE usage_tracking SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- Trigger: Update last_seen_at on fingerprint_tracking
CREATE TRIGGER IF NOT EXISTS update_fingerprint_last_seen
AFTER INSERT ON usage_tracking
FOR EACH ROW
WHEN NEW.fingerprint_hash IS NOT NULL
BEGIN
  UPDATE fingerprint_tracking 
  SET last_seen_at = CURRENT_TIMESTAMP 
  WHERE fingerprint_hash = NEW.fingerprint_hash;
END;

-- Trigger: Validate points transaction
CREATE TRIGGER IF NOT EXISTS validate_points_transaction
BEFORE INSERT ON points_transactions
FOR EACH ROW
BEGIN
  SELECT CASE
    WHEN NEW.balance_after != (NEW.balance_before + NEW.amount) THEN
      RAISE(ABORT, 'Invalid points transaction: balance mismatch')
  END;
END;

-- ============================================================================
-- 11. Initial Data and Configuration
-- ============================================================================

-- Insert default security event types for reference
CREATE TABLE IF NOT EXISTS security_event_types (
  event_type TEXT PRIMARY KEY,
  description TEXT NOT NULL,
  default_severity TEXT NOT NULL,
  requires_action BOOLEAN DEFAULT FALSE
);

INSERT OR IGNORE INTO security_event_types (event_type, description, default_severity, requires_action) VALUES
('login_success', 'Successful user login', 'low', 0),
('login_failure', 'Failed login attempt', 'medium', 0),
('login_suspicious', 'Suspicious login pattern detected', 'high', 1),
('rate_limit_exceeded', 'Rate limit exceeded', 'medium', 0),
('abuse_detected', 'Abuse pattern detected', 'high', 1),
('multiple_accounts', 'Multiple accounts from same source', 'high', 1),
('vpn_detected', 'VPN or proxy usage detected', 'low', 0),
('session_hijack_attempt', 'Possible session hijacking attempt', 'critical', 1),
('points_manipulation', 'Attempted points manipulation', 'critical', 1),
('database_error', 'Database operation error', 'high', 1);

-- ============================================================================
-- Migration Complete
-- ============================================================================
-- Version: 002
-- Date: 2024-12-02
-- Description: Added comprehensive security and tracking infrastructure
