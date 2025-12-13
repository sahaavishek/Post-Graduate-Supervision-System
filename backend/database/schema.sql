-- UTMGradient Database Schema
-- Post Graduate Supervision System

-- Create database if not exists
CREATE DATABASE IF NOT EXISTS utmgradient CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE utmgradient;

-- Users table (for all user types: students, supervisors, administrators)
CREATE TABLE IF NOT EXISTS users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('student', 'supervisor', 'administrator') NOT NULL,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  avatar VARCHAR(500),
  email_verified BOOLEAN DEFAULT FALSE,
  status ENUM('active', 'inactive', 'suspended') DEFAULT 'inactive',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_role (role),
  INDEX idx_status (status),
  INDEX idx_email_verified (email_verified)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Supervisors table (extends users) - Created before students to allow foreign key reference
CREATE TABLE IF NOT EXISTS supervisors (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT UNIQUE NOT NULL,
  department VARCHAR(255),
  office VARCHAR(255),
  office_hours VARCHAR(255),
  research_interests TEXT,
  capacity INT DEFAULT 10,
  current_students INT DEFAULT 0,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_department (department)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Students table (extends users)
CREATE TABLE IF NOT EXISTS students (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT UNIQUE NOT NULL,
  program VARCHAR(255),
  start_date DATE,
  expected_completion DATE,
  supervisor_id INT,
  progress INT DEFAULT 0,
  enrollment_date DATE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (supervisor_id) REFERENCES supervisors(id) ON DELETE SET NULL,
  INDEX idx_supervisor (supervisor_id),
  INDEX idx_progress (progress)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Administrators table (extends users)
CREATE TABLE IF NOT EXISTS administrators (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT UNIQUE NOT NULL,
  department VARCHAR(255),
  permissions JSON,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Meetings table
CREATE TABLE IF NOT EXISTS meetings (
  id INT PRIMARY KEY AUTO_INCREMENT,
  student_id INT NOT NULL,
  supervisor_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  date DATE NOT NULL,
  time TIME NOT NULL,
  duration INT DEFAULT 60,
  type ENUM('online', 'in-person', 'hybrid') DEFAULT 'online',
  location VARCHAR(255),
  meeting_link VARCHAR(500),
  agenda TEXT,
  status ENUM('pending', 'approved', 'completed', 'cancelled') DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (supervisor_id) REFERENCES supervisors(id) ON DELETE CASCADE,
  INDEX idx_student (student_id),
  INDEX idx_supervisor (supervisor_id),
  INDEX idx_date (date),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Documents table
CREATE TABLE IF NOT EXISTS documents (
  id INT PRIMARY KEY AUTO_INCREMENT,
  student_id INT,
  supervisor_id INT,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  file_path VARCHAR(500) NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_size INT,
  file_type VARCHAR(50),
  week_number INT,
  type ENUM('submission', 'resource', 'feedback', 'other') DEFAULT 'submission',
  status ENUM('submitted', 'pending_review', 'reviewed', 'approved', 'rejected') DEFAULT 'submitted',
  uploaded_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE SET NULL,
  FOREIGN KEY (supervisor_id) REFERENCES supervisors(id) ON DELETE SET NULL,
  INDEX idx_student (student_id),
  INDEX idx_supervisor (supervisor_id),
  INDEX idx_type (type),
  INDEX idx_status (status),
  INDEX idx_week (week_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Weekly Submissions table
CREATE TABLE IF NOT EXISTS weekly_submissions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  student_id INT NOT NULL,
  week_number INT NOT NULL,
  title VARCHAR(255),
  description TEXT,
  due_date DATE,
  submission_date DATE,
  file_path VARCHAR(500),
  file_name VARCHAR(255),
  status ENUM('pending', 'submitted', 'late') DEFAULT 'pending',
  student_comments TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  UNIQUE KEY unique_week_student (student_id, week_number),
  INDEX idx_student (student_id),
  INDEX idx_week (week_number),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Milestones table
CREATE TABLE IF NOT EXISTS milestones (
  id INT PRIMARY KEY AUTO_INCREMENT,
  student_id INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  progress INT DEFAULT 0,
  status ENUM('pending', 'in-progress', 'completed') DEFAULT 'pending',
  due_date DATE,
  completed_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  INDEX idx_student (student_id),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Progress Logs table
CREATE TABLE IF NOT EXISTS progress_logs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  student_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  category VARCHAR(100),
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  INDEX idx_student (student_id),
  INDEX idx_category (category),
  INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50),
  icon VARCHAR(50),
  unread BOOLEAN DEFAULT TRUE,
  link VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user (user_id),
  INDEX idx_unread (unread),
  INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Messages table
CREATE TABLE IF NOT EXISTS messages (
  id INT PRIMARY KEY AUTO_INCREMENT,
  sender_id INT NOT NULL,
  receiver_id INT NOT NULL,
  subject VARCHAR(255),
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_sender (sender_id),
  INDEX idx_receiver (receiver_id),
  INDEX idx_read (is_read),
  INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Document Reviews table
CREATE TABLE IF NOT EXISTS document_reviews (
  id INT PRIMARY KEY AUTO_INCREMENT,
  document_id INT NOT NULL,
  reviewer_id INT NOT NULL,
  feedback TEXT,
  rating INT,
  status ENUM('pending', 'in-review', 'approved', 'needs-revision', 'rejected') DEFAULT 'pending',
  reviewed_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE,
  FOREIGN KEY (reviewer_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_document (document_id),
  INDEX idx_reviewer (reviewer_id),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Announcements table
CREATE TABLE IF NOT EXISTS announcements (
  id INT PRIMARY KEY AUTO_INCREMENT,
  supervisor_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  target_audience ENUM('all', 'specific_students') DEFAULT 'all',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (supervisor_id) REFERENCES supervisors(id) ON DELETE CASCADE,
  INDEX idx_supervisor (supervisor_id),
  INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Announcement Recipients table
CREATE TABLE IF NOT EXISTS announcement_recipients (
  id INT PRIMARY KEY AUTO_INCREMENT,
  announcement_id INT NOT NULL,
  student_id INT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP NULL,
  FOREIGN KEY (announcement_id) REFERENCES announcements(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  UNIQUE KEY unique_announcement_student (announcement_id, student_id),
  INDEX idx_student (student_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Deadlines table
CREATE TABLE IF NOT EXISTS deadlines (
  id INT PRIMARY KEY AUTO_INCREMENT,
  student_id INT,
  supervisor_id INT,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  due_date DATE NOT NULL,
  priority ENUM('low', 'medium', 'high') DEFAULT 'medium',
  status ENUM('pending', 'completed', 'overdue') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (supervisor_id) REFERENCES supervisors(id) ON DELETE CASCADE,
  INDEX idx_student (student_id),
  INDEX idx_supervisor (supervisor_id),
  INDEX idx_due_date (due_date),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- System Reports table
CREATE TABLE IF NOT EXISTS system_reports (
  id INT PRIMARY KEY AUTO_INCREMENT,
  generated_by INT NOT NULL,
  report_type VARCHAR(100) NOT NULL,
  report_data JSON,
  file_path VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (generated_by) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_generated_by (generated_by),
  INDEX idx_type (report_type),
  INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Supervisor-Student Relationship table (many-to-many)
CREATE TABLE IF NOT EXISTS supervisor_student (
  id INT PRIMARY KEY AUTO_INCREMENT,
  supervisor_id INT NOT NULL,
  student_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (supervisor_id) REFERENCES supervisors(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  UNIQUE KEY unique_supervisor_student (supervisor_id, student_id),
  INDEX idx_supervisor (supervisor_id),
  INDEX idx_student (student_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Password Reset Codes table
CREATE TABLE IF NOT EXISTS password_reset_codes (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  email VARCHAR(255) NOT NULL,
  code VARCHAR(6) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_email (email),
  INDEX idx_code (code),
  INDEX idx_expires (expires_at),
  INDEX idx_used (used)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Email Verification Tokens table
CREATE TABLE IF NOT EXISTS email_verification_tokens (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  email VARCHAR(255) NOT NULL,
  token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_email (email),
  INDEX idx_token (token),
  INDEX idx_expires (expires_at),
  INDEX idx_used (used)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

