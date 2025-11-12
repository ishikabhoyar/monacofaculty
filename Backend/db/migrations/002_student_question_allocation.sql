-- Migration: Student Question Allocation System
-- This enables personalized question allocation where consecutive roll numbers
-- won't receive the same questions

-- Create table to store student-specific question assignments
CREATE TABLE IF NOT EXISTS student_question_allocations (
    id SERIAL PRIMARY KEY,
    test_id INTEGER REFERENCES tests(id) ON DELETE CASCADE,
    student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
    question_id INTEGER REFERENCES questions(id) ON DELETE CASCADE,
    allocation_seed INTEGER NOT NULL, -- Used for consistent shuffling
    allocated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(test_id, student_id, question_id)
);

-- Index for faster queries
CREATE INDEX idx_student_question_alloc_test ON student_question_allocations(test_id);
CREATE INDEX idx_student_question_alloc_student ON student_question_allocations(student_id);
CREATE INDEX idx_student_question_alloc_test_student ON student_question_allocations(test_id, student_id);

-- Add allocation settings to tests table
ALTER TABLE tests 
ADD COLUMN IF NOT EXISTS enable_question_randomization BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS questions_per_student INTEGER DEFAULT NULL; -- NULL means all questions

COMMENT ON COLUMN tests.enable_question_randomization IS 'When true, questions are allocated uniquely to prevent consecutive roll numbers from getting same questions';
COMMENT ON COLUMN tests.questions_per_student IS 'Number of questions to allocate per student. NULL means all questions in the test';
COMMENT ON TABLE student_question_allocations IS 'Stores personalized question allocation for each student to ensure consecutive roll numbers get different questions';
