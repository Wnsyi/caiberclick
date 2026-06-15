-- CaiberClick 数据库 Schema
-- 数据库: CaiberClick_db

CREATE DATABASE IF NOT EXISTS CaiberClick_db DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE CaiberClick_db;

-- ============================================================
-- 1. 用户表
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  username VARCHAR(100) NOT NULL,
  password VARCHAR(255) NOT NULL,
  token VARCHAR(255) DEFAULT '',
  is_admin TINYINT(1) DEFAULT 0,
  banned TINYINT(1) DEFAULT 0,
  muted_until BIGINT DEFAULT NULL,
  created_at BIGINT DEFAULT 0,
  last_login_at BIGINT DEFAULT 0,
  login_count INT DEFAULT 0,
  INDEX idx_email (email),
  INDEX idx_token (token)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 2. 评论表
-- ============================================================
CREATE TABLE IF NOT EXISTS comments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  content TEXT NOT NULL,
  author_email VARCHAR(255) NOT NULL,
  author_name VARCHAR(100) NOT NULL,
  parent_id INT DEFAULT NULL,
  created_at BIGINT DEFAULT 0,
  INDEX idx_author_email (author_email),
  INDEX idx_parent_id (parent_id),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 3. 评论点赞表
-- ============================================================
CREATE TABLE IF NOT EXISTS comment_likes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  comment_id INT NOT NULL,
  user_email VARCHAR(255) NOT NULL,
  action VARCHAR(10) NOT NULL DEFAULT 'like',
  timestamp BIGINT DEFAULT 0,
  INDEX idx_comment_user (comment_id, user_email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 4. 评论删除标记表
-- ============================================================
CREATE TABLE IF NOT EXISTS comment_deletions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  comment_id INT NOT NULL,
  timestamp BIGINT DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 5. 体验卡计数器表
-- ============================================================
CREATE TABLE IF NOT EXISTS card_counters (
  id INT AUTO_INCREMENT PRIMARY KEY,
  card_id VARCHAR(100) NOT NULL,
  timestamp BIGINT DEFAULT 0,
  INDEX idx_card_id (card_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 6. 问诊记录表
-- ============================================================
CREATE TABLE IF NOT EXISTS consultations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  card_id VARCHAR(100) NOT NULL,
  card_title VARCHAR(200) NOT NULL,
  choice_path JSON,
  personality_id INT DEFAULT NULL,
  persona VARCHAR(200) DEFAULT '',
  user_email VARCHAR(255) NOT NULL,
  username VARCHAR(100) DEFAULT '',
  timestamp BIGINT DEFAULT 0,
  INDEX idx_user_email (user_email),
  INDEX idx_timestamp (timestamp)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 7. 问诊记录删除标记表
-- ============================================================
CREATE TABLE IF NOT EXISTS consultation_deletions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  consultation_id INT NOT NULL,
  user_email VARCHAR(255) NOT NULL,
  timestamp BIGINT DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 8. 处方数据表
-- ============================================================
CREATE TABLE IF NOT EXISTS prescriptions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  card_id VARCHAR(100) NOT NULL,
  card_title VARCHAR(200) NOT NULL,
  personality_id INT DEFAULT NULL,
  persona VARCHAR(200) DEFAULT '',
  dia TEXT,
  med VARCHAR(200),
  `usage` TEXT,
  advice TEXT,
  user_email VARCHAR(255) NOT NULL,
  username VARCHAR(100) DEFAULT '',
  timestamp BIGINT DEFAULT 0,
  INDEX idx_user_email (user_email),
  INDEX idx_card_id (card_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 9. 申诉表
-- ============================================================
CREATE TABLE IF NOT EXISTS appeals (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_email VARCHAR(255) NOT NULL,
  username VARCHAR(100) DEFAULT '',
  reason TEXT,
  status VARCHAR(20) DEFAULT 'pending',
  reply TEXT DEFAULT NULL,
  created_at BIGINT DEFAULT 0,
  resolved_at BIGINT DEFAULT NULL,
  INDEX idx_user_email (user_email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 10. 管理员操作记录表 (ban/mute/unban)
-- ============================================================
CREATE TABLE IF NOT EXISTS admin_actions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  action VARCHAR(20) NOT NULL,
  target_email VARCHAR(255) NOT NULL,
  muted_until BIGINT DEFAULT NULL,
  timestamp BIGINT DEFAULT 0,
  INDEX idx_target_email (target_email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 11. 卡片编辑数据表 (管理员编辑/删除体验卡)
-- ============================================================
CREATE TABLE IF NOT EXISTS card_data (
  id INT AUTO_INCREMENT PRIMARY KEY,
  card_id VARCHAR(100) NOT NULL,
  card_data JSON,
  action VARCHAR(20) NOT NULL,
  timestamp BIGINT DEFAULT 0,
  INDEX idx_card_id (card_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 12. AI 聊天记录表
-- ============================================================
CREATE TABLE IF NOT EXISTS ai_chats (
  id INT AUTO_INCREMENT PRIMARY KEY,
  card_id VARCHAR(100) NOT NULL,
  user_email VARCHAR(255) DEFAULT '',
  messages JSON,
  result JSON,
  timestamp BIGINT DEFAULT 0,
  INDEX idx_user_email (user_email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
