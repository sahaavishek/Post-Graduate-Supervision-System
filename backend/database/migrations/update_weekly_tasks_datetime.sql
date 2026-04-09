-- Migration: Update weekly_tasks due_date from DATE to DATETIME
-- This allows storing both date and time for deadlines
-- Run this script to update existing tables

-- Check if table exists and column is DATE type
-- If column is already DATETIME, this migration is safe to run (no-op)

ALTER TABLE weekly_tasks 
MODIFY COLUMN due_date DATETIME NULL;

-- Note: Existing DATE values will be converted to DATETIME with time 00:00:00
-- This is safe and won't lose any data

