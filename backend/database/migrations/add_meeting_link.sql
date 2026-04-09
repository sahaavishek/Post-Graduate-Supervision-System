-- Migration: Add meeting_link column to meetings table
-- Run this if you have an existing database without the meeting_link column

ALTER TABLE meetings 
ADD COLUMN IF NOT EXISTS meeting_link VARCHAR(500) AFTER location;

