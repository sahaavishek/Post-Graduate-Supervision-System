-- Add email verification support
USE utmgradient;

-- Add email_verified column to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE AFTER avatar;

-- Update default status to 'inactive' for new users (they need to verify email first)
-- Note: This only affects new users, existing users remain 'active'
ALTER TABLE users 
MODIFY COLUMN status ENUM('active', 'inactive', 'suspended') DEFAULT 'inactive';

-- Add index for email_verified
ALTER TABLE users 
ADD INDEX IF NOT EXISTS idx_email_verified (email_verified);

-- Create email_verification_tokens table
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

-- Mark all existing users as verified (for backward compatibility)
UPDATE users SET email_verified = TRUE, status = 'active' WHERE email_verified IS NULL OR email_verified = FALSE;

