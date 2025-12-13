-- Create weekly_tasks table for managing weekly tasks/assignments
-- This allows supervisors to customize weeks for each student
-- Run this script to create the table

CREATE TABLE IF NOT EXISTS weekly_tasks (
  id INT PRIMARY KEY AUTO_INCREMENT,
  student_id INT NOT NULL,
  week_number INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  due_date DATE,
  upload_date DATE,
  is_active BOOLEAN DEFAULT TRUE,
  created_by INT NOT NULL, -- supervisor/admin user_id
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_week_student (student_id, week_number),
  INDEX idx_student (student_id),
  INDEX idx_week (week_number),
  INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;









