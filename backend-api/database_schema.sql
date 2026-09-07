-- 1. TẠO DATABASE
CREATE DATABASE IF NOT EXISTS `english_learning_app` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `english_learning_app`;

-- =======================================================
-- PHẦN 1: TÀI KHOẢN VÀ NGƯỜI DÙNG (USERS)
-- =======================================================
CREATE TABLE IF NOT EXISTS `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `username` VARCHAR(50) NOT NULL UNIQUE,
  `email` VARCHAR(100) NOT NULL UNIQUE,
  `password_hash` VARCHAR(255) NOT NULL,
  `role` ENUM('admin', 'user') DEFAULT 'user',
  `avatar_url` TEXT DEFAULT NULL,
  `xp_points` INT DEFAULT 0 COMMENT 'Điểm kinh nghiệm khi học',
  `streak_days` INT DEFAULT 0 COMMENT 'Số ngày học liên tiếp',
  `last_login_date` DATETIME DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);


-- =======================================================
-- PHẦN 2: QUẢN LÝ TỪ VỰNG VÀ BÀI HỌC
-- =======================================================
CREATE TABLE IF NOT EXISTS `words` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `headword` VARCHAR(100) NOT NULL,
  `part_of_speech` VARCHAR(50) DEFAULT NULL COMMENT 'n, v, adj, adv...',
  `cefr_level` VARCHAR(10) DEFAULT NULL COMMENT 'A1, A2, B1, B2, C1, C2',
  `phonetic` VARCHAR(100) DEFAULT NULL COMMENT 'Phiên âm IPA',
  `audio_url` TEXT DEFAULT NULL COMMENT 'Link file nghe mp3',
  `image_url` TEXT DEFAULT NULL COMMENT 'Link ảnh minh họa',
  `meaning` TEXT DEFAULT NULL COMMENT 'Nghĩa tiếng Việt',
  `example_sentence` TEXT DEFAULT NULL COMMENT 'Câu ví dụ',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE `words` ADD INDEX `idx_headword` (`headword`);
ALTER TABLE `words` ADD INDEX `idx_cefr_level` (`cefr_level`);

CREATE TABLE IF NOT EXISTS `lessons` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `title` VARCHAR(100) NOT NULL,
  `description` TEXT,
  `cefr_level` VARCHAR(10) DEFAULT NULL,
  `thumbnail_url` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS `lesson_words` (
  `lesson_id` INT NOT NULL,
  `word_id` INT NOT NULL,
  PRIMARY KEY (`lesson_id`, `word_id`),
  FOREIGN KEY (`lesson_id`) REFERENCES `lessons`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`word_id`) REFERENCES `words`(`id`) ON DELETE CASCADE
);


-- =======================================================
-- PHẦN 3: TIẾN TRÌNH HỌC (SPACED REPETITION)
-- =======================================================
CREATE TABLE IF NOT EXISTS `user_progress` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `word_id` INT NOT NULL,
  `status` ENUM('new', 'learning', 'mastered') DEFAULT 'new' COMMENT 'Trạng thái học',
  `memory_level` INT DEFAULT 0 COMMENT 'Mức độ ghi nhớ (0-5)',
  `next_review_date` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT 'Ngày cần ôn tập lại',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  UNIQUE KEY `unique_user_word` (`user_id`, `word_id`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`word_id`) REFERENCES `words`(`id`) ON DELETE CASCADE
);


-- =======================================================
-- PHẦN 4: HỆ THỐNG TRẮC NGHIỆM VÀ KIỂM TRA (QUIZZES/TESTS)
-- =======================================================
CREATE TABLE IF NOT EXISTS `tests` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT,
  `cefr_level` VARCHAR(10) DEFAULT NULL,
  `duration_minutes` INT DEFAULT 15,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS `questions` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `test_id` INT NOT NULL,
  `question_text` TEXT NOT NULL,
  `question_type` ENUM('multiple_choice', 'fill_in_blank') DEFAULT 'multiple_choice',
  `points` INT DEFAULT 10,
  FOREIGN KEY (`test_id`) REFERENCES `tests`(`id`) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS `answers` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `question_id` INT NOT NULL,
  `answer_text` TEXT NOT NULL,
  `is_correct` BOOLEAN DEFAULT FALSE,
  FOREIGN KEY (`question_id`) REFERENCES `questions`(`id`) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS `user_test_results` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `test_id` INT NOT NULL,
  `total_score` INT NOT NULL,
  `completed_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`test_id`) REFERENCES `tests`(`id`) ON DELETE CASCADE
);


-- =======================================================
-- PHẦN 5: TRÒ CHƠI VÀ THÀNH TỰU (GAMIFICATION)
-- =======================================================
CREATE TABLE IF NOT EXISTS `achievements` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `title` VARCHAR(100) NOT NULL,
  `description` TEXT,
  `icon_url` TEXT,
  `required_xp` INT DEFAULT 0 COMMENT 'Cần bao nhiêu XP để mở',
  `required_streak` INT DEFAULT 0 COMMENT 'Cần chuỗi bao nhiêu ngày để mở'
);

CREATE TABLE IF NOT EXISTS `user_achievements` (
  `user_id` INT NOT NULL,
  `achievement_id` INT NOT NULL,
  `unlocked_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`, `achievement_id`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`achievement_id`) REFERENCES `achievements`(`id`) ON DELETE CASCADE
);

-- =======================================================
-- PHẦN 6: HỆ THỐNG GHI NHẬN NHẬT KÝ (LOGS) & AI CHAT
-- =======================================================
-- Bảng lưu lịch sử đăng nhập
CREATE TABLE IF NOT EXISTS `login_logs` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `ip_address` VARCHAR(45) DEFAULT NULL,
  `device_info` TEXT DEFAULT NULL COMMENT 'Ví dụ: Chrome on Windows, iOS App...',
  `login_time` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
);

-- Bảng lưu lịch sử thao tác của người dùng
CREATE TABLE IF NOT EXISTS `activity_logs` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `action_type` VARCHAR(50) NOT NULL COMMENT 'VD: completed_lesson, changed_password, earned_achievement',
  `description` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
);

-- Bảng quản lý các phiên trò chuyện với AI
CREATE TABLE IF NOT EXISTS `ai_chat_sessions` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `title` VARCHAR(255) DEFAULT 'New Conversation',
  `started_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `ended_at` DATETIME DEFAULT NULL,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
);

-- Bảng chi tiết từng dòng tin nhắn Chat với AI
CREATE TABLE IF NOT EXISTS `ai_chat_messages` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `session_id` INT NOT NULL,
  `sender` ENUM('user', 'ai') NOT NULL,
  `message_text` TEXT NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`session_id`) REFERENCES `ai_chat_sessions`(`id`) ON DELETE CASCADE
);
