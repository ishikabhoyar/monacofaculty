-- Migration: Remove unique constraints on students table to allow students to belong to multiple batches
-- Date: 2025-10-29

-- Drop the unique constraint on roll_number and batch_id
ALTER TABLE students DROP CONSTRAINT IF EXISTS students_roll_number_batch_id_key;

-- Drop the unique constraint on email and batch_id
ALTER TABLE students DROP CONSTRAINT IF EXISTS students_email_batch_id_key;

-- Verify constraints are removed
SELECT conname, contype
FROM pg_constraint
WHERE conrelid = 'students'::regclass
  AND contype = 'u';
