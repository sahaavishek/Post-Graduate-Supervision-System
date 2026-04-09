-- Create notification_preferences table if it doesn't exist
CREATE TABLE IF NOT EXISTS notification_preferences (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT UNIQUE NOT NULL,
  email_notifications BOOLEAN DEFAULT TRUE,
  meeting_reminders BOOLEAN DEFAULT TRUE,
  progress_updates BOOLEAN DEFAULT TRUE,
  document_reviews BOOLEAN DEFAULT TRUE,
  deadline_reminders BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

