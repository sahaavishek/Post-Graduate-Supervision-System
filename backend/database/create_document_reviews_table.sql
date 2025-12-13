-- Create document_reviews table if it doesn't exist
-- Run this script if the table is missing from your database

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

