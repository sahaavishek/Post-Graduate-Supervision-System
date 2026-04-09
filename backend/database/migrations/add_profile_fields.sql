-- Migration: Add missing profile fields
-- Date: 2024

-- Add research_area to students table
ALTER TABLE students ADD COLUMN IF NOT EXISTS research_area VARCHAR(500);

-- Add position and qualifications to supervisors table
ALTER TABLE supervisors ADD COLUMN IF NOT EXISTS position VARCHAR(255);
ALTER TABLE supervisors ADD COLUMN IF NOT EXISTS qualifications TEXT;

-- Add biography to supervisors table
ALTER TABLE supervisors ADD COLUMN IF NOT EXISTS biography TEXT;
