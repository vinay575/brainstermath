-- Level Access System Migration
-- This enables students to request and get approved for multiple levels

-- Student Level Access table (tracks which levels students have access to)
CREATE TABLE IF NOT EXISTS student_level_access (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,
  level INT NOT NULL CHECK (level BETWEEN 1 AND 8),
  granted_by INT, -- admin user_id who granted access
  granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (granted_by) REFERENCES users(id) ON DELETE SET NULL,
  UNIQUE KEY unique_student_level (student_id, level),
  INDEX idx_student_id (student_id),
  INDEX idx_level (level)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Level Access Requests table (students request access to new levels)
CREATE TABLE IF NOT EXISTS level_access_requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,
  requested_level INT NOT NULL CHECK (requested_level BETWEEN 1 AND 8),
  status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
  message TEXT, -- student's message
  admin_response TEXT, -- admin's response message
  processed_by INT, -- admin user_id who processed the request
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  processed_at TIMESTAMP NULL,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (processed_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_student_id (student_id),
  INDEX idx_status (status),
  INDEX idx_requested_level (requested_level)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Migrate existing student levels to level_access table
INSERT INTO student_level_access (student_id, level, granted_at)
SELECT id, level, created_at
FROM students
ON DUPLICATE KEY UPDATE student_id=student_id;
