-- Add deliverables column to milestones table
ALTER TABLE milestones ADD COLUMN deliverables TEXT AFTER description;

