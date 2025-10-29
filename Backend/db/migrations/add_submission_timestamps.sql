-- Migration: Add timestamp columns to submissions table
-- Date: 2025-10-29

-- Add submitted_at column if it doesn't exist
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Add updated_at column if it doesn't exist
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Update existing rows to have timestamps if they are NULL
UPDATE submissions SET submitted_at = CURRENT_TIMESTAMP WHERE submitted_at IS NULL;
UPDATE submissions SET updated_at = CURRENT_TIMESTAMP WHERE updated_at IS NULL;
