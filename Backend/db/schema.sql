-- Allowed emails table for login whitelist
CREATE TABLE IF NOT EXISTS allowed_emails (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    added_by VARCHAR(255), -- Optional: track who added this email
    is_active BOOLEAN DEFAULT true, -- Optional: ability to disable without deleting
    notes TEXT -- Optional: notes about this user
);

CREATE TABLE faculties (
    id SERIAL PRIMARY KEY,  -- Changed from faculty_id to id for consistency
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    google_id VARCHAR(255) NOT NULL UNIQUE,
    department VARCHAR(255)
);

-- Batches table
CREATE TABLE IF NOT EXISTS batches (
  id SERIAL PRIMARY KEY,
  batch_name VARCHAR(100) NOT NULL,
  academic_year VARCHAR(50) NOT NULL,
  semester VARCHAR(50) NOT NULL,
  description TEXT,
  faculty_id INTEGER REFERENCES faculties(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(batch_name, academic_year, semester, faculty_id)
);

-- Tests table
CREATE TABLE IF NOT EXISTS tests (
  id SERIAL PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  course_id VARCHAR(50),
  description TEXT,
  instructions TEXT,
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP NOT NULL,
  duration_minutes INTEGER NOT NULL,
  max_attempts INTEGER DEFAULT 1,
  password VARCHAR(100),
  late_penalty_percent INTEGER DEFAULT 0,
  faculty_id INTEGER REFERENCES faculties(id),
  batch_id INTEGER REFERENCES batches(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Questions table - fix naming and references
CREATE TABLE questions (
    id SERIAL PRIMARY KEY,  -- Changed from question_id to id
    test_id INTEGER REFERENCES tests(id), -- Now references tests.id instead of tests.test_id
    question_text TEXT NOT NULL,
    options JSON,
    correct_answer VARCHAR(255),
    marks INTEGER,
    -- New fields for advanced question types
    question_type VARCHAR(50) DEFAULT 'multiple_choice', -- 'multiple_choice', 'coding', 'short_answer', 'essay'
    difficulty VARCHAR(20) DEFAULT 'easy', -- 'easy', 'medium', 'hard'
    programming_language VARCHAR(50), -- For coding questions
    code_template TEXT, -- Starter code for coding questions
    time_limit_seconds INTEGER, -- For coding questions
    memory_limit_mb INTEGER, -- For coding questions
    hints TEXT, -- JSON array of hints
    explanation TEXT, -- Solution explanation
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Test cases table for coding questions
CREATE TABLE test_cases (
    id SERIAL PRIMARY KEY,
    question_id INTEGER REFERENCES questions(id) ON DELETE CASCADE,
    input TEXT NOT NULL,
    expected_output TEXT NOT NULL,
    is_sample BOOLEAN DEFAULT true,
    is_hidden BOOLEAN DEFAULT false, -- Hidden test cases for judging
    time_limit_seconds INTEGER DEFAULT 1,
    memory_limit_mb INTEGER DEFAULT 256,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tags table for categorizing questions
CREATE TABLE tags (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    color VARCHAR(7), -- Hex color code
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Question tags junction table
CREATE TABLE question_tags (
    question_id INTEGER REFERENCES questions(id) ON DELETE CASCADE,
    tag_id INTEGER REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (question_id, tag_id)
);

-- Insert default DSA tags
INSERT INTO tags (name, description, color) VALUES
('Array', 'Array manipulation and algorithms', '#FF6B6B'),
('String', 'String processing and algorithms', '#4ECDC4'),
('Linked List', 'Linked list operations and problems', '#45B7D1'),
('Stack', 'Stack-based problems and applications', '#96CEB4'),
('Queue', 'Queue and deque problems', '#FFEAA7'),
('Tree', 'Binary trees, BST, and tree traversals', '#DDA0DD'),
('Graph', 'Graph algorithms and traversals', '#98D8C8'),
('Dynamic Programming', 'DP problems and optimization', '#F7DC6F'),
('Greedy', 'Greedy algorithms and problems', '#BB8FCE'),
('Backtracking', 'Backtracking and recursion problems', '#85C1E9'),
('Sorting', 'Sorting algorithms and problems', '#F8C471'),
('Searching', 'Search algorithms and problems', '#82E0AA'),
('Hash Table', 'Hash table and map problems', '#F1948A'),
('Math', 'Mathematical problems and algorithms', '#AED6F1'),
('Bit Manipulation', 'Bit operations and problems', '#ABEBC6'),
('Two Pointers', 'Two pointer technique problems', '#F9E79F'),
('Sliding Window', 'Sliding window problems', '#D7BDE2'),
('Recursion', 'Recursive solutions and problems', '#A3E4D7');

-- Students table
-- Note: Students can belong to multiple batches, so no unique constraints on roll_number or email
CREATE TABLE IF NOT EXISTS students (
  id SERIAL PRIMARY KEY,
  roll_number VARCHAR(50) NOT NULL,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  batch_id INTEGER REFERENCES batches(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Test assignments table - fix references
CREATE TABLE test_assignments (
    id SERIAL PRIMARY KEY,  -- Changed from assignment_id to id
    test_id INTEGER REFERENCES tests(id),  -- Now references tests.id
    batch_id INTEGER REFERENCES batches(id)  -- Now references batches.id
);

-- Submissions table - fix references
CREATE TABLE submissions (
    id SERIAL PRIMARY KEY,  -- Changed from submission_id to id
    student_id INTEGER REFERENCES students(id),  -- Now references students.id instead of students.student_id
    test_id INTEGER REFERENCES tests(id),  -- Now references tests.id
    question_id INTEGER REFERENCES questions(id),  -- Now references questions.id
    submitted_answer TEXT,
    marks_obtained INTEGER,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);