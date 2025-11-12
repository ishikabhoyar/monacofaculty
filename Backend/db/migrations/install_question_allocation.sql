-- Quick setup script for question allocation feature
-- Run this after connecting to your database

\echo '======================================='
\echo 'Installing Question Allocation Feature'
\echo '======================================='

-- Check if columns already exist before adding them
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tests' 
        AND column_name = 'enable_question_randomization'
    ) THEN
        ALTER TABLE tests ADD COLUMN enable_question_randomization BOOLEAN DEFAULT false;
        RAISE NOTICE 'Added enable_question_randomization column to tests table';
    ELSE
        RAISE NOTICE 'Column enable_question_randomization already exists';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tests' 
        AND column_name = 'questions_per_student'
    ) THEN
        ALTER TABLE tests ADD COLUMN questions_per_student INTEGER DEFAULT NULL;
        RAISE NOTICE 'Added questions_per_student column to tests table';
    ELSE
        RAISE NOTICE 'Column questions_per_student already exists';
    END IF;
END $$;

-- Create student_question_allocations table if it doesn't exist
CREATE TABLE IF NOT EXISTS student_question_allocations (
    id SERIAL PRIMARY KEY,
    test_id INTEGER REFERENCES tests(id) ON DELETE CASCADE,
    student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
    question_id INTEGER REFERENCES questions(id) ON DELETE CASCADE,
    allocation_seed INTEGER NOT NULL,
    allocated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(test_id, student_id, question_id)
);

\echo 'Created student_question_allocations table'

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_student_question_alloc_test 
ON student_question_allocations(test_id);

CREATE INDEX IF NOT EXISTS idx_student_question_alloc_student 
ON student_question_allocations(student_id);

CREATE INDEX IF NOT EXISTS idx_student_question_alloc_test_student 
ON student_question_allocations(test_id, student_id);

\echo 'Created indexes on student_question_allocations table'

-- Add comments
COMMENT ON COLUMN tests.enable_question_randomization IS 'When true, questions are allocated uniquely to prevent consecutive roll numbers from getting same questions';
COMMENT ON COLUMN tests.questions_per_student IS 'Number of questions to allocate per student. NULL means all questions in the test';
COMMENT ON TABLE student_question_allocations IS 'Stores personalized question allocation for each student to ensure consecutive roll numbers get different questions';

\echo '======================================='
\echo 'Installation Complete!'
\echo '======================================='
\echo 'Question allocation feature is now ready to use.'
\echo ''
\echo 'To enable for a test:'
\echo '  - Set enable_question_randomization = true'
\echo '  - Optionally set questions_per_student to limit questions'
\echo ''
\echo 'See QUESTION_ALLOCATION.md for full documentation'
