-- BrainsterMath E-Learning Platform Database Schema

-- Drop tables if they exist (for clean setup)
DROP TABLE IF EXISTS sheet_videos;
DROP TABLE IF EXISTS student_activity;
DROP TABLE IF EXISTS students;
DROP TABLE IF EXISTS users;

-- Users table (for admin and student authentication)
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('admin', 'student') NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Students table (extended profile for student users)
CREATE TABLE students (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNIQUE NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  address TEXT,
  level INT NOT NULL CHECK (level BETWEEN 1 AND 8),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_level (level)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Sheet videos table (stores video URLs for each level/sheet/slide)
-- Supports single sheets and ranges
-- video_type: 'youtube' (embed), 'drive' (Google Drive), 'direct' (direct URL), 's3' (AWS S3)
CREATE TABLE sheet_videos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  level INT NOT NULL CHECK (level BETWEEN 1 AND 8),
  sheet_start INT NOT NULL CHECK (sheet_start BETWEEN 1 AND 200),
  sheet_end INT NOT NULL CHECK (sheet_end BETWEEN 1 AND 200),
  slide ENUM('A', 'B') NOT NULL,
  video_url TEXT NOT NULL,
  video_type ENUM('youtube', 'drive', 'direct', 's3') DEFAULT 'youtube',
  video_title VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_level (level),
  INDEX idx_sheet_range (level, sheet_start, sheet_end),
  CHECK (sheet_end >= sheet_start)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Student activity log (tracks what students watch)
CREATE TABLE student_activity (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,
  level INT NOT NULL,
  sheet_number INT NOT NULL,
  slide ENUM('A', 'B') NOT NULL,
  watched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  INDEX idx_student (student_id),
  INDEX idx_watched (watched_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
